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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Request received:', req.method);
    
    const formData = await req.formData();
    const file = formData.get('file');
    const uploadId = formData.get('upload_id');

    console.log('File received:', file?.name);
    console.log('Upload ID:', uploadId);

    if (!file || !uploadId) {
      throw new Error('Missing file or upload ID');
    }

    // Update upload status to processing
    const { error: statusError } = await supabase
      .from('csv_movie_uploads')
      .update({ status: 'processing' })
      .eq('id', uploadId);

    if (statusError) {
      console.error('Error updating upload status:', statusError);
      throw statusError;
    }

    const text = await file.text();
    console.log('CSV content length:', text.length);

    const rows = parse(text, { skipFirstRow: true }) as string[][];
    console.log('Number of rows parsed:', rows.length);

    // Validate and transform the data
    const movies = rows.map((row, index) => {
      // Log each row for debugging
      console.log(`Processing row ${index + 2}:`, row);

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

    console.log('Processed movies:', movies.length);

    // Insert the movies in batches of 100
    for (let i = 0; i < movies.length; i += 100) {
      const batch = movies.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from('movies')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting movies batch:', insertError);
        throw insertError;
      }
    }

    // Update upload status to completed
    const { error: finalStatusError } = await supabase
      .from('csv_movie_uploads')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    if (finalStatusError) {
      console.error('Error updating final status:', finalStatusError);
      throw finalStatusError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'CSV processed successfully',
        moviesProcessed: movies.length 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing CSV:', error);

    // Try to update upload status to failed if we have an upload ID
    try {
      const uploadId = await req.formData().then(form => form.get('upload_id'));
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
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    );
  }
});