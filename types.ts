
export type EpisodeType = 'General' | 'Invest' | 'Celebrity';
export type TalkType = 'Solo' | 'Guest';

export interface PodcastEpisode {
  id: string;
  title: string;
  episodeType: EpisodeType;
  talkType: TalkType;
  playCount: number; // in 10k (wan)
  commentCount: number;
}

export type MetricKey = 'playCount' | 'commentCount';
export type CategoryKey = 'episodeType' | 'talkType' | 'none';

export interface HistogramDataPoint {
  binLabel: string;
  min: number;
  max: number;
  [categoryValue: string]: string | number; // Categorical counts
  totalCount: number; // Explicitly renamed for neutral view
}