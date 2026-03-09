/**
 * YouTube Data API v3 — search for relevant training videos.
 */

export interface VideoRec {
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  publishedAt: string;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

/**
 * Search YouTube for videos matching a query.
 * Returns up to `maxResults` items. Filters to educational/training content.
 */
export async function searchYouTube(
  query: string,
  maxResults = 3,
): Promise<VideoRec[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    relevanceLanguage: "en",
    safeSearch: "strict",
    videoDuration: "medium",
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    { next: { revalidate: 86400 } }, // cache 24h
  );

  if (!res.ok) {
    console.error("YouTube API error:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as YouTubeSearchResponse;

  return (data.items ?? []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    thumbnail:
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      "",
    publishedAt: item.snippet.publishedAt,
  }));
}
