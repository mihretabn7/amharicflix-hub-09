import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { searchQueries } from './search-queries.ts';
import { isValidVideo } from './video-validator.ts';
import { YouTubeVideo } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      console.error('Missing YouTube API key');
      throw new Error('Missing YouTube API key');
    }

    console.log('Starting YouTube API request with key length:', YOUTUBE_API_KEY.length);
    let allVideos: YouTubeVideo[] = [];
    
    for (const { query, genre } of searchQueries) {
      console.log(`Searching for: ${query} (${genre})`);
      
      try {
        const maxResults = 50;
        const pages = 4;
        let pageToken = '';

        for (let i = 0; i < pages; i++) {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?` + 
            new URLSearchParams({
              part: 'snippet',
              q: query,
              type: 'video',
              maxResults: maxResults.toString(),
              videoDuration: 'long',
              key: YOUTUBE_API_KEY,
              order: 'date',
              relevanceLanguage: 'am',
              ...(pageToken && { pageToken }),
            });

          console.log(`Making request to YouTube API for query "${query}" (page ${i + 1})`);
          const searchResponse = await fetch(searchUrl);
          
          if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error(`YouTube API Error for query "${query}":`, {
              status: searchResponse.status,
              statusText: searchResponse.statusText,
              error: errorText
            });
            break;
          }

          const searchData = await searchResponse.json();
          console.log(`Found ${searchData.items?.length || 0} results for query: ${query} (page ${i + 1})`);

          if (!searchData.items?.length) {
            console.log(`No items found for query: ${query} (page ${i + 1})`);
            break;
          }

          pageToken = searchData.nextPageToken;

          const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
            new URLSearchParams({
              part: 'contentDetails,snippet,statistics',
              id: videoIds,
              key: YOUTUBE_API_KEY,
            });

          console.log(`Fetching video details for ${videoIds.split(',').length} videos`);
          const detailsResponse = await fetch(videoDetailsUrl);
          
          if (!detailsResponse.ok) {
            const errorText = await detailsResponse.text();
            console.error(`Failed to fetch video details for query "${query}"`, {
              status: detailsResponse.status,
              statusText: detailsResponse.statusText,
              error: errorText
            });
            break;
          }

          const detailsData = await detailsResponse.json();
          const validVideos = detailsData.items
            .filter((video: YouTubeVideo) => isValidVideo(video, genre))
            .map((video: YouTubeVideo) => {
              const duration = video.contentDetails.duration;
              const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              const hours = parseInt(match?.[1] || '0');
              const minutes = parseInt(match?.[2] || '0');
              const totalMinutes = hours * 60 + minutes;

              return {
                ...video,
                customGenre: genre,
                durationMinutes: totalMinutes
              };
            });

          console.log(`Found ${validVideos.length} valid videos for query: ${query} (page ${i + 1})`);
          allVideos = [...allVideos, ...validVideos];

          if (!pageToken) {
            console.log(`No more pages available for query: ${query}`);
            break;
          }
        }
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
      return new Response(
        JSON.stringify({ 
          error: 'No valid videos found',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let successCount = 0;
    for (const item of uniqueVideos) {
      try {
        const { title, description, thumbnails } = item.snippet;
        const thumbnail = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default;

        console.log(`Processing video: ${title} (${item.id})`);

        const { error: upsertError } = await supabaseClient
          .from('movies')
          .upsert({
            youtube_id: item.id,
            title: title,
            description: description,
            thumbnail_url: thumbnail.url,
            genre: item.customGenre,
            language: 'Amharic',
            duration_minutes: item.durationMinutes || 0
          }, {
            onConflict: 'youtube_id'
          });

        if (upsertError) {
          console.error('Error upserting video:', item.id, upsertError);
          continue;
        }

        successCount++;
        console.log(`Successfully processed video ${successCount}: ${title}`);
      } catch (error) {
        console.error('Error processing video:', error);
        continue;
      }
    }

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
        status: 200
      }
    );
  }
});