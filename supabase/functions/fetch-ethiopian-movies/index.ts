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
      throw new Error('Missing YouTube API key')
    }

    console.log('Starting YouTube API request...')

    // Fetch videos from YouTube with more specific parameters
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` + 
      new URLSearchParams({
        part: 'snippet',
        q: 'Ethiopian Movie full length',
        type: 'video',
        maxResults: '50',
        videoDuration: 'long', // Only get full movies
        key: YOUTUBE_API_KEY,
        relevanceLanguage: 'am', // Prefer Amharic content
        videoDefinition: 'high' // Prefer HD content
      })
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error('YouTube API Error:', errorData)
      throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || !Array.isArray(searchData.items)) {
      console.error('Invalid response format:', searchData)
      throw new Error('Invalid response from YouTube API')
    }

    console.log(`Fetched ${searchData.items.length} videos from YouTube`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process each video and store in database
    let successCount = 0
    for (const item of searchData.items) {
      try {
        const videoId = item.id.videoId
        const { title, description, thumbnails } = item.snippet

        // Get the highest quality thumbnail available
        const thumbnail = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default

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
      } catch (error) {
        console.error('Error processing video:', error)
        continue
      }
    }

    console.log(`Successfully processed ${successCount} videos`)

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: successCount,
        total: searchData.items.length
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