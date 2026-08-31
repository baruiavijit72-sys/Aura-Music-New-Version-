import { Track } from '../types';

const DB_NAME = 'aura_audio_db_v1';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks_metadata';
const STORE_BLOBS = 'audio_blobs';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event);
      reject(request.error);
    };
  });
};

// Save a track and its audio Blob to IndexedDB
export const saveTrackToIndexedDB = async (track: Track, audioBlob?: Blob | File): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const trackStore = tx.objectStore(STORE_TRACKS);
    const blobStore = tx.objectStore(STORE_BLOBS);

    // Save track metadata without temporary blob URLs
    trackStore.put(track);

    if (audioBlob) {
      blobStore.put({ id: track.id, blob: audioBlob });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving track to IndexedDB:', err);
  }
};

// Save multiple tracks and blobs in batch
export const saveTracksBatchToIndexedDB = async (
  tracksWithBlobs: { track: Track; blob?: Blob | File }[]
): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    const trackStore = tx.objectStore(STORE_TRACKS);
    const blobStore = tx.objectStore(STORE_BLOBS);

    for (const item of tracksWithBlobs) {
      trackStore.put(item.track);
      if (item.blob) {
        blobStore.put({ id: item.track.id, blob: item.blob });
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving batch to IndexedDB:', err);
  }
};

// Restore all persisted tracks and restore Blob URLs for playback
export const loadAllStoredTracksFromIndexedDB = async (): Promise<Track[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readonly');
    const trackStore = tx.objectStore(STORE_TRACKS);
    const blobStore = tx.objectStore(STORE_BLOBS);

    const tracksReq = trackStore.getAll();
    const blobsReq = blobStore.getAll();

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        const tracks: Track[] = tracksReq.result || [];
        const blobs: { id: string; blob: Blob }[] = blobsReq.result || [];
        const blobMap = new Map<string, Blob>();
        blobs.forEach((b) => blobMap.set(b.id, b.blob));

        const hydrated = tracks.map((t) => {
          if (blobMap.has(t.id)) {
            const blob = blobMap.get(t.id)!;
            return {
              ...t,
              audioUrl: URL.createObjectURL(blob),
            };
          }
          return t;
        });

        resolve(hydrated);
      };

      tx.onerror = () => {
        console.error('Error loading tracks from IndexedDB:', tx.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.error('Failed to open IndexedDB:', err);
    return [];
  }
};

// Delete a track from IndexedDB
export const deleteTrackFromIndexedDB = async (trackId: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_TRACKS, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_TRACKS).delete(trackId);
    tx.objectStore(STORE_BLOBS).delete(trackId);
  } catch (err) {
    console.error('Failed to delete track from IndexedDB:', err);
  }
};
