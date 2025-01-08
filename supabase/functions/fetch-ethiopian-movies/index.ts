import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not set')
      throw new Error('Missing YouTube API key')
    }

    console.log('Starting YouTube API request with configured API key...')

    // Using multiple search queries to increase chances of finding relevant content
    const searchQueries = [
      'Ethiopian Movie',
      'Amharic Movie',
      'የአማርኛ ፊልም',
      'Ethiopian Drama Full Movie'
    ];

    let allVideos = [];
    
    for (const query of searchQueries) {
      console.log(`Searching for: ${query}`);
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?` + 
        new URLSearchParams({
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: '25', // Reduced to 25 per query to stay within quota
          videoDuration: 'long',
          key: YOUTUBE_API_KEY,
          order: 'date', // Get recent videos first
          regionCode: 'ET', // Prioritize content from Ethiopia
          videoDefinition: 'high'
        });

      console.log('Fetching from YouTube API...')
      const searchResponse = await fetch(searchUrl)

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json()
        console.error('YouTube API Error Response:', errorData)
        continue; // Continue with next query if this one fails
      }

      const searchData = await searchResponse.json()
      
      if (!searchData.items || !Array.isArray(searchData.items)) {
        console.error('Invalid response format for query:', query, searchData)
        continue;
      }

      console.log(`Successfully fetched ${searchData.items.length} videos for query: ${query}`)
      allVideos = [...allVideos, ...searchData.items];
    }

    // Remove duplicates based on video ID
    const uniqueVideos = Array.from(new Map(allVideos.map(item => [item.id.videoId, item])).values());
    console.log(`Total unique videos found: ${uniqueVideos.length}`);

    if (uniqueVideos.length === 0) {
      throw new Error('No videos found with any search query');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process each video and store in database
    let successCount = 0;
    for (const item of uniqueVideos) {
      try {
        const videoId = item.id.videoId
        const { title, description, thumbnails } = item.snippet

        // Get the highest quality thumbnail available
        const thumbnail = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default

        console.log(`Processing video: ${title} (${videoId})`)

        const { error: upsertError } = await supabaseClient
          .from('movies')
          .upsert({
            youtube_id: videoId,
            title: title,
            description: description,
            thumbnail_url: thumbnail.url,
            genre: 'Ethiopian Movie',
            language: 'Amharic'
          }, {
            onConflict: 'youtube_id'
          })

        if (upsertError) {
          console.error('Error upserting video:', videoId, upsertError)
          continue
        }

        successCount++
        console.log(`Successfully processed video ${successCount}: ${title}`)
      } catch (error) {
        console.error('Error processing video:', error)
        continue
      }
    }

    console.log(`Successfully processed ${successCount} videos out of ${uniqueVideos.length}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: successCount,
        total: uniqueVideos.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})