import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { isValidVideo } from './video-validator.ts'
import { VideoSearchQuery } from './types.ts'

console.log('Hello from fetch-ethiopian-movies!')

// Expanded search queries for broader coverage
const searchQueries: VideoSearchQuery[] = [
  { query: 'new ethiopian movie 2024', genre: 'Ethiopian Movie' },
  { query: 'አዲስ ፊልም 2024', genre: 'Ethiopian Movie' },
  { query: 'new amharic movie 2024', genre: 'Ethiopian Movie' },
  { query: 'ethiopian drama 2024', genre: 'Ethiopian Drama' },
  { query: 'አዲስ ድራማ 2024', genre: 'Ethiopian Drama' },
  { query: 'new ethiopian movie 2023', genre: 'Ethiopian Movie' },
  { query: 'አዲስ ፊልም 2023', genre: 'Ethiopian Movie' },
  { query: 'ethiopian comedy 2024', genre: 'Ethiopian Comedy' },
  { query: 'አዲስ ኮሜዲ 2024', genre: 'Ethiopian Comedy' },
  { query: 'ethiopian film full movie', genre: 'Ethiopian Movie' },
  { query: 'amharic movie full length', genre: 'Ethiopian Movie' },
  { query: 'ethiopian romantic movie 2024', genre: 'Ethiopian Romance' },
  { query: 'ethiopian thriller 2024', genre: 'Ethiopian Thriller' },
  { query: 'ፊልም ኢትዮጵያ', genre: 'Ethiopian Movie' },
  { query: 'ethiopian action movie', genre: 'Ethiopian Action' },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('Youtube')
    if (!apiKey) {
      throw new Error('Missing YouTube API key')
    }

    console.log('Starting movie fetch process...')
    const processedVideos = new Set<string>()
    let totalProcessed = 0
    let totalSearched = 0

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    for (const searchQuery of searchQueries) {
      totalSearched++
      console.log(`[${totalSearched}/${searchQueries.length}] Searching: ${searchQuery.query}`)

      let nextPageToken = ''
      let pageCount = 0
      const maxPages = 3 // up to 150 results per query

      do {
        pageCount++
        const params = new URLSearchParams({
          part: 'snippet',
          q: searchQuery.query,
          type: 'video',
          maxResults: '50',
          key: apiKey,
        })
        if (nextPageToken) {
          params.set('pageToken', nextPageToken)
        }

        const searchUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
        const response = await fetch(searchUrl)
        const data = await response.json()

        if (data.error) {
          console.error('YouTube API Error:', data.error)
          break
        }

        if (!data.items || data.items.length === 0) {
          break
        }

        const videoIds = data.items.map((item: any) => item.id.videoId).join(',')
        const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
        const videoResponse = await fetch(videoUrl)
        const videoData = await videoResponse.json()

        if (videoData.error) {
          console.error('YouTube Video API Error:', videoData.error)
          break
        }

        for (const video of videoData.items || []) {
          if (processedVideos.has(video.id)) continue
          if (!isValidVideo(video)) continue

          processedVideos.add(video.id)

          const { error: insertError } = await supabaseClient
            .from('movies')
            .upsert({
              youtube_id: video.id,
              title: video.snippet.title,
              description: video.snippet.description,
              thumbnail_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || '',
              genre: searchQuery.genre,
            }, { onConflict: 'youtube_id' })

          if (insertError) {
            console.error('DB insert error:', insertError.message)
            continue
          }

          totalProcessed++
        }

        nextPageToken = data.nextPageToken || ''
      } while (nextPageToken && pageCount < maxPages)
    }

    console.log(`Done. Total new videos: ${totalProcessed}`)
    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        queriesSearched: totalSearched,
        totalUnique: processedVideos.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
