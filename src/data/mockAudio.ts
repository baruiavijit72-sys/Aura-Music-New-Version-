import { Track, Playlist, P2PPeer, P2PTransferLog } from '../types';
import { COMPREHENSIVE_MUSIC_LIBRARY } from './extendedTracks';
import { POPULAR_ENGLISH_SONGS } from './songs';

export { POPULAR_ENGLISH_SONGS, COMPREHENSIVE_MUSIC_LIBRARY };
export const INITIAL_TRACKS: Track[] = [];

export const INITIAL_PLAYLISTS: Playlist[] = [];

export const INITIAL_PEERS: P2PPeer[] = [];

export const INITIAL_TRANSFER_LOGS: P2PTransferLog[] = [];

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Heavy': [8, 7, 5, 2, 0, -1, 0, 1, 2, 3],
  'Rock': [5, 4, 3, 1, -1, -1, 2, 3, 4, 5],
  'Pop': [-1, 1, 3, 4, 4, 3, 1, -1, 2, 3],
  'Jazz': [3, 2, 1, 2, -1, -1, 0, 2, 3, 4],
  'Classical': [4, 3, 2, 1, -1, -1, 0, 2, 4, 4],
  'Acoustic': [3, 3, 2, 1, 2, 2, 3, 3, 4, 3],
  'Electronic': [6, 5, 2, 0, -2, 2, 1, 3, 5, 6],
  'Vocal Boost': [-2, -2, 0, 3, 5, 4, 3, 1, 0, -1]
};
