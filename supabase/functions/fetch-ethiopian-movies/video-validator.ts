import { YouTubeVideo } from './types.ts';

export function isValidVideo(video: YouTubeVideo, genre: string): boolean {
  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();
  
  // Check if title contains Ethiopian/Amharic indicators
  const hasEthiopianIndicator = 
    title.includes('ethiopian') || 
    title.includes('amharic') ||
    title.includes('ኢትዮጵያ') ||
    title.includes('አማርኛ') ||
    title.includes('ፊልም') ||
    title.includes('ድራማ');
  
  if (!hasEthiopianIndicator) {
    return false;
  }

  // Get duration in minutes
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const totalMinutes = hours * 60 + minutes;

  // Videos should be at least 15 minutes long
  if (totalMinutes < 15) {
    return false;
  }

  // Check for recent year indicators
  const hasRecentYear = 
    title.includes('2024') || 
    title.includes('2023') || 
    description.includes('2024') || 
    description.includes('2023');

  return hasRecentYear;
}