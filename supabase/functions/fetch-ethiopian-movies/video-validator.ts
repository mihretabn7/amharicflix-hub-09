import { YouTubeVideo } from './types.ts';

export function isValidVideo(video: YouTubeVideo, genre: string): boolean {
  // Check duration (minimum 60 minutes to catch more movies)
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(\d+)M/);
  if (!match || parseInt(match[1]) < 60) return false;

  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();

  // Check for Ethiopian movie indicators in either title or description
  const isEthiopian = 
    title.includes('ethiopian') || 
    title.includes('ኢትዮጵያ') ||
    description.includes('ethiopian') ||
    description.includes('ኢትዮጵያ');

  // Check for movie indicators
  const isMovie = 
    title.includes('movie') ||
    title.includes('film') ||
    title.includes('ፊልም') ||
    description.includes('movie') ||
    description.includes('film') ||
    description.includes('ፊልም');

    const isFull = 
    title.includes('full') ||
    title.includes('ሙሉ') ||
    description.includes('full') ||
    description.includes('ሙሉ');

  return isEthiopian && isMovie&& isFull;
}