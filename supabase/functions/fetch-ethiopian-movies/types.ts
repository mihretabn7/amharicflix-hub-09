export interface VideoSearchQuery {
  query: string;
  genre: string;
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
    };
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
  customGenre?: string;
}