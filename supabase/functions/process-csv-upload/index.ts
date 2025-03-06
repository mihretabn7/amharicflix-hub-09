
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { parse } from 'https://deno.land/std@0.181.0/encoding/csv.ts'
import { corsHeaders } from "../_shared/cors.ts"

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

    // Parse CSV with header row
    const [headers, ...rows] = parse(text) as string[][];
    console.log('Headers:', headers);
    console.log('Number of rows:', rows.length);

    // Convert headers to lowercase for case-insensitive matching
    const headerMap = headers.reduce((acc, header, index) => {
      acc[header.toLowerCase().trim()] = index;
      return acc;
    }, {} as Record<string, number>);

    // Validate required columns exist
    const requiredFields = ['title', 'youtube_id', 'thumbnail_url'];
    const missingFields = requiredFields.filter(
      field => headerMap[field] === undefined
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
    }

    // Transform and validate the data
    const movies = rows.map((row, index) => {
      // Get values using header map
      const title = row[headerMap['title']]?.trim();
      const youtubeId = row[headerMap['youtube_id']]?.trim();
      const thumbnailUrl = row[headerMap['thumbnail_url']]?.trim();
      const description = row[headerMap['description']]?.trim();
      const genre = row[headerMap['genre']]?.trim();
      const language = row[headerMap['language']]?.trim();
      const durationMinutes = row[headerMap['duration_minutes']]?.trim();

      // Validate required fields
      if (!title) throw new Error(`Missing title in row ${index + 2}`);
      if (!youtubeId) throw new Error(`Missing YouTube ID in row ${index + 2}`);
      if (!thumbnailUrl) throw new Error(`Missing thumbnail URL in row ${index + 2}`);

      return {
        title,
        youtube_id: youtubeId,
        thumbnail_url: thumbnailUrl,
        description: description || '',
        genre: genre || null,
        language: language || 'Amharic',
        duration_minutes: parseInt(durationMinutes) || 0
      };
    });

    console.log('Processed movies:', movies.length);

    // Insert or update the movies in batches of 100
    const results = [];
    for (let i = 0; i < movies.length; i += 100) {
      const batch = movies.slice(i, i + 100);
      const { data, error: upsertError } = await supabase
        .from('movies')
        .upsert(batch, {
          onConflict: 'youtube_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error upserting movies batch:', upsertError);
        throw upsertError;
      }
      
      results.push(data);
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
        moviesProcessed: movies.length,
        results
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
