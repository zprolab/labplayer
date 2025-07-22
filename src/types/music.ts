export interface Song {
  id: string;
  name: string;
  path: string;
  duration: number;
  folder: string;
}

export interface ListeningRecord {
  songPath: string;
  listenTime: number;
  timestamp: string;
}

export type PlayMode = 'loop' | 'random' | 'single';

export interface MusicPlayerState {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  playMode: PlayMode;
  isLoading: boolean;
}