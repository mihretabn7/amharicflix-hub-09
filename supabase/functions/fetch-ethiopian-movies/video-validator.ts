import { YouTubeVideo } from './types.ts';

export function isValidVideo(video: YouTubeVideo, genre: string): boolean {
  // Check duration (minimum 10 minutes)
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(\d+)M/);
  if (!match || parseInt(match[1]) < 10) return false;

  const title = video.snippet.title.toLowerCase();

  // For movies, ensure title contains "ethiopian" and "movie"
  if (genre === 'Ethiopian Movie') {
    return title.includes('ethiopian') && 
           (title.includes('movie') || title.includes('film'));
  }
  
  // For series, ensure title contains "ድራማ" or "drama"
  if (genre === 'Ethiopian Series') {
    return title.includes('ድራማ') || 
           title.toLowerCase().includes('drama');
  }

  return false;
}