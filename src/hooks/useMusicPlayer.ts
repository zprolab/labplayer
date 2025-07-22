import { useState, useRef, useCallback, useEffect } from 'react';
import { Song, PlayMode, MusicPlayerState, ListeningRecord } from '@/types/music';

export const useMusicPlayer = () => {
  const [state, setState] = useState<MusicPlayerState>({
    currentSong: null,
    playlist: [],
    isPlaying: false,
    volume: 0.7,
    currentTime: 0,
    playMode: 'loop',
    isLoading: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const listenTimeRef = useRef<number>(0);

  // Save listening time to .listen.jsonl
  const saveListeningTime = useCallback(async (song: Song, listenTime: number) => {
    if (listenTime < 1) return; // Don't record very short listening times

    const record: ListeningRecord = {
      songPath: song.name, // Use song name instead of full path for web version
      listenTime: Math.round(listenTime),
      timestamp: new Date().toISOString(),
    };

    try {
      // Store each song's listening records separately
      const songKey = `listen_${song.id}`;
      const existingRecords = JSON.parse(localStorage.getItem(songKey) || '[]');
      existingRecords.push(record);
      localStorage.setItem(songKey, JSON.stringify(existingRecords));
      
      // Also maintain a master list for easy access
      const masterKey = 'allListeningRecords';
      const allRecords = JSON.parse(localStorage.getItem(masterKey) || '[]');
      allRecords.push(record);
      localStorage.setItem(masterKey, JSON.stringify(allRecords));
      
      console.log('Listening time recorded:', record);
    } catch (error) {
      console.error('Failed to save listening time:', error);
    }
  }, []);

  // Load music files from folder
  const loadMusicFolder = useCallback(async (files: FileList) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const musicFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)
    );

    const songs: Song[] = await Promise.all(
      musicFiles.map(async (file, index) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        return new Promise<Song>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve({
              id: `${index}-${file.name}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              path: url,
              duration: audio.duration,
              folder: 'local',
            });
          });
          
          audio.addEventListener('error', () => {
            resolve({
              id: `${index}-${file.name}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              path: url,
              duration: 0,
              folder: 'local',
            });
          });
        });
      })
    );

    setState(prev => ({
      ...prev,
      playlist: songs,
      currentSong: songs.length > 0 ? songs[0] : null,
      isPlaying: songs.length > 0, // 自动开始播放
      isLoading: false,
    }));
  }, []);

  // Play/Pause functionality
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !state.currentSong) return;

    if (state.isPlaying) {
      audioRef.current.pause();
      // Record listening time when pausing
      const currentListenTime = Date.now() - startTimeRef.current;
      listenTimeRef.current += currentListenTime / 1000;
    } else {
      audioRef.current.play();
      startTimeRef.current = Date.now();
    }

    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying, state.currentSong]);

  // Change volume
  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setState(prev => ({ ...prev, volume }));
  }, []);

  // Change play mode
  const setPlayMode = useCallback((mode: PlayMode) => {
    setState(prev => ({ ...prev, playMode: mode }));
  }, []);

  // Next song
  const nextSong = useCallback(() => {
    if (state.playlist.length === 0) return;

    let nextIndex = 0;
    const currentIndex = state.playlist.findIndex(song => song.id === state.currentSong?.id);

    if (state.playMode === 'random') {
      nextIndex = Math.floor(Math.random() * state.playlist.length);
    } else if (state.playMode === 'loop') {
      nextIndex = (currentIndex + 1) % state.playlist.length;
    } else if (state.playMode === 'single') {
      nextIndex = currentIndex;
    }

    setState(prev => ({ ...prev, currentSong: prev.playlist[nextIndex] }));
  }, [state.playlist, state.currentSong, state.playMode]);

  // Previous song
  const previousSong = useCallback(() => {
    if (state.playlist.length === 0) return;

    let prevIndex = 0;
    const currentIndex = state.playlist.findIndex(song => song.id === state.currentSong?.id);

    if (state.playMode === 'random') {
      prevIndex = Math.floor(Math.random() * state.playlist.length);
    } else {
      prevIndex = currentIndex > 0 ? currentIndex - 1 : state.playlist.length - 1;
    }

    setState(prev => ({ ...prev, currentSong: prev.playlist[prevIndex] }));
  }, [state.playlist, state.currentSong, state.playMode]);

  // Seek to position
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      // Save listening time when song ends
      if (state.currentSong) {
        const totalListenTime = listenTimeRef.current + (Date.now() - startTimeRef.current) / 1000;
        saveListeningTime(state.currentSong, totalListenTime);
        listenTimeRef.current = 0;
      }

      // 根据播放模式切换歌曲
      if (state.playMode === 'single') {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        setState(prev => ({ ...prev, isPlaying: true }));
      } else {
        nextSong();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    };

    const handleCanPlay = () => {
      if (state.isPlaying) {
        audio.play();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [state.currentSong, state.isPlaying, state.playMode, nextSong, saveListeningTime]);

  // Update audio source when current song changes
  useEffect(() => {
    if (audioRef.current && state.currentSong) {
      const previousSong = audioRef.current.src !== state.currentSong.path;
      
      // Save listening time for previous song only when switching songs
      if (previousSong && listenTimeRef.current > 0) {
        // Find the previous song to save its listening time
        const prevSong = state.playlist.find(song => song.path === audioRef.current?.src);
        if (prevSong) {
          saveListeningTime(prevSong, listenTimeRef.current);
        }
        listenTimeRef.current = 0;
      }

      // Only update src if it's a different song
      if (previousSong) {
        audioRef.current.src = state.currentSong.path;
      }
      
      audioRef.current.volume = state.volume;
      
      if (state.isPlaying && previousSong) {
        audioRef.current.play();
        startTimeRef.current = Date.now();
      }
    }
  }, [state.currentSong, state.playlist, saveListeningTime]);

  // Separate effect for volume changes to avoid position reset
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // Select a specific song from playlist
  const selectSong = useCallback((song: Song) => {
    // Save listening time for current song before switching
    if (state.currentSong && listenTimeRef.current > 0) {
      const currentListenTime = state.isPlaying ? (Date.now() - startTimeRef.current) / 1000 : 0;
      const totalListenTime = listenTimeRef.current + currentListenTime;
      saveListeningTime(state.currentSong, totalListenTime);
      listenTimeRef.current = 0;
    }

    setState(prev => ({ ...prev, currentSong: song, isPlaying: true }));
  }, [state.currentSong, state.isPlaying, saveListeningTime]);

  // Get listening statistics for current song
  const getListeningStats = useCallback((song: Song) => {
    try {
      const songKey = `listen_${song.id}`;
      const records = JSON.parse(localStorage.getItem(songKey) || '[]');
      const totalTime = records.reduce((sum: number, record: ListeningRecord) => sum + record.listenTime, 0);
      return {
        totalTime,
        playCount: records.length,
        records
      };
    } catch {
      return { totalTime: 0, playCount: 0, records: [] };
    }
  }, []);

  return {
    ...state,
    audioRef,
    loadMusicFolder,
    togglePlay,
    setVolume,
    setPlayMode,
    nextSong,
    previousSong,
    seekTo,
    selectSong,
    getListeningStats,
  };
};