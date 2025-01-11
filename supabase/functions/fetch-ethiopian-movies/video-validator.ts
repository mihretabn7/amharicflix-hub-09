import { YouTubeVideo } from './types.ts';

export function isValidVideo(video: YouTubeVideo, genre: string): boolean {
  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();
  
  // Check if title contains required keywords
  const hasFullKeyword = title.includes('full') || title.includes('ሙሉ');
  const hasMovieKeyword = title.includes('movie') || title.includes('ፊልም');
  const hasDramaKeyword = title.includes('drama') || title.includes('ድራማ');
  
  // Video must have either (full AND movie) OR (full AND drama)
  const isValidTitle = (hasFullKeyword && (hasMovieKeyword || hasDramaKeyword));
  
  if (!isValidTitle) {
    return false;
  }

  // Get duration in minutes
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const totalMinutes = hours * 60 + minutes;

  // Minimum duration check (20 minutes)
  if (totalMinutes < 20) {
    return false;
  }

  // Check for Ethiopian indicators in both title and description
  const isEthiopian = 
    title.includes('ethiopian') || 
    title.includes('ኢትዮጵያ') ||
    title.includes('amharic') ||
    title.includes('አማርኛ') ||
    description.includes('ethiopian') ||
    description.includes('ኢትዮጵያ') ||
    description.includes('amharic') ||
    description.includes('አማርኛ');

  // Check for year indicators (2023 or 2024)
  const hasRecentYear = 
    title.includes('2024') || 
    title.includes('2023') || 
    description.includes('2024') || 
    description.includes('2023');

  return isEthiopian && hasRecentYear;
}