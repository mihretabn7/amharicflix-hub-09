import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse } from 'https://deno.land/std@0.181.0/encoding/csv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log request details for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const formData = await req.formData();
    const file = formData.get('file');
    const uploadId = formData.get('upload_id');

    if (!file || !uploadId) {
      throw new Error('Missing file or upload ID');
    }

    console.log('File received:', file.name);
    console.log('Upload ID:', uploadId);

    const text = await file.text();
    const rows = parse(text, { skipFirstRow: true }) as string[][];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate and transform the data
    const movies = rows.map((row, index) => {
      // Validate required fields
      if (!row[0]?.trim()) throw new Error(`Missing title in row ${index + 2}`);
      if (!row[1]?.trim()) throw new Error(`Missing YouTube ID in row ${index + 2}`);
      if (!row[2]?.trim()) throw new Error(`Missing thumbnail URL in row ${index + 2}`);

      return {
        title: row[0].trim(),
        youtube_id: row[1].trim(),
        thumbnail_url: row[2].trim(),
        description: row[3]?.trim() || '',
        genre: row[4]?.trim() || null,
        language: row[5]?.trim() || 'Amharic',
        duration_minutes: parseInt(row[6]) || 0
      };
    });

    // Update upload status to processing
    await supabase
      .from('csv_movie_uploads')
      .update({
        status: 'processing',
      })
      .eq('id', uploadId);

    // Insert the movies
    const { error: insertError } = await supabase
      .from('movies')
      .insert(movies);

    if (insertError) {
      console.error('Error inserting movies:', insertError);
      
      await supabase
        .from('csv_movie_uploads')
        .update({
          status: 'failed',
          error_message: insertError.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', uploadId);

      throw insertError;
    }

    // Update upload status to completed
    await supabase
      .from('csv_movie_uploads')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    return new Response(
      JSON.stringify({ message: 'CSV processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing CSV:', error);

    // If we have an upload ID, update its status
    const uploadId = req.formData?.().then(form => form.get('upload_id'));
    if (uploadId) {
      await supabase
        .from('csv_movie_uploads')
        .update({
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', uploadId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});