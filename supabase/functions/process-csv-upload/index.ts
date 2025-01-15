import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse } from 'https://deno.land/std@0.181.0/encoding/csv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploadId = formData.get('upload_id') as string

    if (!file || !uploadId) {
      throw new Error('Missing file or upload ID')
    }

    const text = await file.text()
    const rows = parse(text, { skipFirstRow: true }) as string[][]

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const movies = rows.map(row => ({
      title: row[0],
      youtube_id: row[1],
      thumbnail_url: row[2],
      description: row[3] || '',
      genre: row[4] || null,
      language: row[5] || 'Amharic',
      duration_minutes: parseInt(row[6]) || 0
    }))

    const { error: insertError } = await supabase
      .from('movies')
      .insert(movies)

    if (insertError) {
      throw insertError
    }

    await supabase
      .from('csv_movie_uploads')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId)

    return new Response(
      JSON.stringify({ message: 'CSV processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing CSV:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})