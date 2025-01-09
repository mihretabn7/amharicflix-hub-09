import { YouTubeVideo } from './types.ts';

export function isValidVideo(video: YouTubeVideo, genre: string): boolean {
  // Check duration (minimum 30 minutes for full movies)
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(\d+)M/);
  if (!match || parseInt(match[1]) < 30) return false;

  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();

  // Ensure it's specifically a full movie
  const hasFullMovieIndicator = 
    title.includes('full movie') || 
    title.includes('ሙሉ ፊልም') ||
    description.includes('full movie') ||
    description.includes('ሙሉ ፊልም');

  // Must be Ethiopian
  const isEthiopian = 
    title.includes('ethiopian') || 
    title.includes('ኢትዮጵያ') ||
    description.includes('ethiopian') ||
    description.includes('ኢትዮጵያ');

  return hasFullMovieIndicator && isEthiopian;
}