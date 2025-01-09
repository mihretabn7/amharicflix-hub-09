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

    // Separate search queries for movies and series
    const searchQueries = [
      {
        query: 'ethiopian full movie 2024',
        genre: 'Ethiopian Movie'
      },
      {
        query: 'new ethiopian full movie',
        genre: 'Ethiopian Movie'
      },
      {
        query: 'ድራማ 2024',
        genre: 'Ethiopian Series'
      },
      {
        query: 'አዲስ ድራማ',
        genre: 'Ethiopian Series'
      }
    ];

    let allVideos = [];
    
    for (const { query, genre } of searchQueries) {
      console.log(`Searching for: ${query} (${genre})`);
      
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?` + 
          new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: '25',
            videoDuration: 'long',
            key: YOUTUBE_API_KEY,
            order: 'date',
            regionCode: 'ET',
            relevanceLanguage: 'am',
            videoDefinition: 'high',
          });

        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
          const errorData = await searchResponse.json();
          console.error(`YouTube API Error for query "${query}":`, errorData);
          continue;
        }

        const searchData = await searchResponse.json();
        if (!searchData.items || !Array.isArray(searchData.items)) {
          console.error(`Invalid response format for query: ${query}`, searchData);
          continue;
        }

        const videoIds = searchData.items.map(item => item.id.videoId).join(',');
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
          new URLSearchParams({
            part: 'contentDetails,snippet,statistics',
            id: videoIds,
            key: YOUTUBE_API_KEY,
          });

        const detailsResponse = await fetch(videoDetailsUrl);
        if (!detailsResponse.ok) {
          console.error(`Failed to fetch video details for query "${query}"`);
          continue;
        }

        const detailsData = await detailsResponse.json();
        
        // Filter videos that are actually long enough (> 20 minutes)
        const validVideos = detailsData.items.filter(video => {
          const duration = video.contentDetails.duration;
          const match = duration.match(/PT(\d+)M/);
          return match && parseInt(match[1]) >= 20;
        }).map(video => ({
          ...video,
          customGenre: genre // Add the genre based on the search query
        }));

        console.log(`Found ${validVideos.length} valid videos for query: ${query}`);
        allVideos = [...allVideos, ...validVideos];
      } catch (error) {
        console.error(`Error processing query "${query}":`, error);
        continue;
      }
    }

    const uniqueVideos = Array.from(
      new Map(allVideos.map(item => [item.id, item])).values()
    ).sort((a, b) => {
      return new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
    });

    console.log(`Total unique valid videos found: ${uniqueVideos.length}`);

    if (uniqueVideos.length === 0) {
      throw new Error('No valid videos found with any search query');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let successCount = 0;
    for (const item of uniqueVideos) {
      try {
        const videoId = item.id;
        const { title, description, thumbnails } = item.snippet;
        const thumbnail = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default;

        console.log(`Processing video: ${title} (${videoId})`);

        const { error: upsertError } = await supabaseClient
          .from('movies')
          .upsert({
            youtube_id: videoId,
            title: title,
            description: description,
            thumbnail_url: thumbnail.url,
            genre: item.customGenre,
            language: 'Amharic'
          }, {
            onConflict: 'youtube_id'
          });

        if (upsertError) {
          console.error('Error upserting video:', videoId, upsertError);
          continue;
        }

        successCount++;
        console.log(`Successfully processed video ${successCount}: ${title}`);
      } catch (error) {
        console.error('Error processing video:', error);
        continue;
      }
    }

    console.log(`Successfully processed ${successCount} videos out of ${uniqueVideos.length}`);

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
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});