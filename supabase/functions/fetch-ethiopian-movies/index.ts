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

    // Fetch videos from YouTube with more specific parameters
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` + 
      new URLSearchParams({
        part: 'snippet',
        q: 'Ethiopian Movie full length',
        type: 'video',
        maxResults: '50',
        videoDuration: 'long',
        key: YOUTUBE_API_KEY,
        relevanceLanguage: 'am',
        videoDefinition: 'high'
      })

    console.log('Fetching from YouTube API...')
    const searchResponse = await fetch(searchUrl)

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error('YouTube API Error Response:', errorData)
      throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || !Array.isArray(searchData.items)) {
      console.error('Invalid response format:', searchData)
      throw new Error('Invalid response from YouTube API')
    }

    console.log(`Successfully fetched ${searchData.items.length} videos from YouTube`)

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

    console.log(`Successfully processed ${successCount} videos out of ${searchData.items.length}`)

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