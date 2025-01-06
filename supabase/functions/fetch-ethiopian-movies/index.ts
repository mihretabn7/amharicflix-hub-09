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

    // Fetch videos from YouTube
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Ethiopian+Movie&type=video&maxResults=50&key=${YOUTUBE_API_KEY}`
    )
    const data = await response.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process each video and store in database
    for (const item of data.items) {
      const { videoId } = item.id
      const { title, thumbnails } = item.snippet

      await supabaseClient.from('movies').upsert({
        youtube_id: videoId,
        title: title,
        thumbnail_url: thumbnails.high.url,
        genre: 'Ethiopian Movie',
        language: 'Amharic'
      }, {
        onConflict: 'youtube_id'
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})