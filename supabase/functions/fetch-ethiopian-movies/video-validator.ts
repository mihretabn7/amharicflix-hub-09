import { YouTubeVideo } from './types.ts';

export function isValidVideo(video: YouTubeVideo, genre: string): boolean {
  const title = video.snippet.title.toLowerCase();
  
  // Check if title contains required keywords
  const hasFullKeyword = title.includes('full') || title.includes('ሙሉ');
  const hasMovieKeyword = title.includes('movie') || title.includes('ፊልም');
  const hasDramaKeyword = title.includes('drama') || title.includes('ድራማ');
  
  // Video must have either (full AND movie) OR (full AND drama)
  const isValidTitle = (hasFullKeyword && (hasMovieKeyword || hasDramaKeyword));
  
  if (!isValidTitle) {
    return false;
  }

  // Check duration (minimum 20 minutes for movies/dramas)
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(\d+)M/);
  if (!match || parseInt(match[1]) < 20) {
    return false;
  }

  // Check for Ethiopian indicators
  const isEthiopian = 
    title.includes('ethiopian') || 
    title.includes('ኢትዮጵያ') ||
    title.includes('amharic') ||
    title.includes('አማርኛ');

  return isEthiopian;
}