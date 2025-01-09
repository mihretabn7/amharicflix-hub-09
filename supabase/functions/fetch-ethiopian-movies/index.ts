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

    // More specific search queries for better results
    const searchQueries = [
      {
        query: 'ethiopian full movie amharic film',
        genre: 'Ethiopian Movie'
      },
      {
        query: 'new ethiopian movie amharic film',
        genre: 'Ethiopian Movie'
      },
      {
        query: 'ethiopian drama ድራማ',
        genre: 'Ethiopian Series'
      },
      {
        query: 'new ethiopian drama አዲስ ድራማ',
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
            maxResults: '10', // Reduced to avoid quota issues
            videoDuration: 'long',
            key: YOUTUBE_API_KEY,
            order: 'date',
            relevanceLanguage: 'am'
          });

        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
          const errorData = await searchResponse.json();
          console.error(`YouTube API Error for query "${query}":`, errorData);
          continue;
        }

        const searchData = await searchResponse.json();
        console.log(`Found ${searchData.items?.length || 0} initial results for query: ${query}`);

        if (!searchData.items?.length) {
          console.log(`No results found for query: ${query}`);
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
        if (!detailsData.items?.length) {
          console.log(`No video details found for query: ${query}`);
          continue;
        }

        const validVideos = detailsData.items
          .filter(video => {
            // Check duration (minimum 10 minutes)
            const duration = video.contentDetails.duration;
            const match = duration.match(/PT(\d+)M/);
            if (!match || parseInt(match[1]) < 10) return false;

            // For movies, ensure title contains "ethiopian" and "movie"
            if (genre === 'Ethiopian Movie') {
              const title = video.snippet.title.toLowerCase();
              return title.includes('ethiopian') && title.includes('movie');
            }
            
            // For series, ensure title contains "ድራማ" or "drama"
            if (genre === 'Ethiopian Series') {
              const title = video.snippet.title;
              return title.includes('ድራማ') || title.toLowerCase().includes('drama');
            }

            return false;
          })
          .map(video => ({
            ...video,
            customGenre: genre
          }));

        console.log(`Found ${validVideos.length} valid videos for query: ${query}`);
        allVideos = [...allVideos, ...validVideos];
      } catch (error) {
        console.error(`Error processing query "${query}":`, error);
        continue;
      }
    }

    // Remove duplicates and sort by date
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