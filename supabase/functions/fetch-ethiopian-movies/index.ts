
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { searchQueries } from './search-queries.ts'
import { isValidVideo } from './video-validator.ts'
import { VideoSearchQuery } from './types.ts'

console.log('Hello from fetch-ethiopian-movies!')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('Youtube')
    if (!apiKey) {
      throw new Error('Missing YouTube API key')
    }

    console.log('Starting movie fetch process...')
    const processedVideos = new Set<string>() // Track processed video IDs
    let totalProcessed = 0

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process each search query
    for (const searchQuery of searchQueries) {
      console.log(`Searching for: ${searchQuery.query}`)
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery.query
      )}&type=video&maxResults=50&key=${apiKey}`

      const response = await fetch(searchUrl)
      const data = await response.json()

      if (data.error) {
        console.error('YouTube API Error:', data.error)
        continue
      }

      // Get detailed video information
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
      const videoResponse = await fetch(videoUrl)
      const videoData = await videoResponse.json()

      if (videoData.error) {
        console.error('YouTube Video API Error:', videoData.error)
        continue
      }

      // Process each video
      for (const video of videoData.items) {
        if (processedVideos.has(video.id)) {
          continue // Skip already processed videos
        }

        if (!isValidVideo(video)) {
          continue
        }

        processedVideos.add(video.id)

        // Insert into database
        const { error: insertError } = await supabaseClient
          .from('movies')
          .upsert({
            youtube_id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail_url: video.snippet.thumbnails.high.url,
            genre: searchQuery.genre,
          })

        if (insertError) {
          console.error('Database insertion error:', insertError)
          continue
        }

        totalProcessed++
      }
    }

    console.log(`Finished processing. Total new videos: ${totalProcessed}`)
    return new Response(
      JSON.stringify({ success: true, processed: totalProcessed }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
