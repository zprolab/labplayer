import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Repeat, 
  Shuffle, 
  RotateCcw,
  FolderOpen,
  Music
} from 'lucide-react';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { PlayMode } from '@/types/music';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const MusicPlayer: React.FC = () => {
  const {
    currentSong,
    playlist,
    isPlaying,
    volume,
    currentTime,
    playMode,
    isLoading,
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
  } = useMusicPlayer();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      loadMusicFolder(files);
    }
  };

  const handlePlayModeChange = () => {
    const modes: PlayMode[] = ['loop', 'random', 'single'];
    const currentIndex = modes.indexOf(playMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setPlayMode(nextMode);
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'loop':
        return <Repeat className="w-4 h-4" />;
      case 'random':
        return <Shuffle className="w-4 h-4" />;
      case 'single':
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <Repeat className="w-4 h-4" />;
    }
  };

  const getPlayModeLabel = () => {
    switch (playMode) {
      case 'loop':
        return 'Loop All';
      case 'random':
        return 'Random';
      case 'single':
        return 'Single Loop';
      default:
        return 'Loop All';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Music className="w-8 h-8" />
            Music Player
          </h1>
          <p className="text-gray-300">Open Source Desktop Music Player</p>
        </div>

        {/* File Loader */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                disabled={isLoading}
              >
                <FolderOpen className="w-5 h-5 mr-2" />
                {isLoading ? 'Loading...' : 'Load Music Folder'}
              </Button>
              <input
                ref={el => {
                  fileInputRef.current = el;
                  if (el) el.setAttribute('webkitdirectory', '');
                }}
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                onChange={handleFileSelect}
                className="hidden"
                title="Select a folder containing music files"
              />
              {playlist.length > 0 && (
                <p className="text-gray-300 text-sm">
                  {playlist.length} songs loaded
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Player */}
        {currentSong && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-8">
              {/* Current Song Info */}
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-white truncate">
                  {currentSong.name}
                </h2>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {getPlayModeLabel()}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-8">
                <Slider
                  value={[currentSong.duration > 0 ? (currentTime / currentSong.duration) * 100 : 0]}
                  onValueChange={([value]) => {
                    if (currentSong.duration > 0) {
                      seekTo((value / 100) * currentSong.duration);
                    }
                  }}
                  className="w-full"
                  step={0.1}
                />
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(currentSong.duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <Button
                  onClick={handlePlayModeChange}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  {getPlayModeIcon()}
                </Button>

                <Button
                  onClick={previousSong}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  disabled={playlist.length <= 1}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  onClick={togglePlay}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200 w-16 h-16 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>

                <Button
                  onClick={nextSong}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  disabled={playlist.length <= 1}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                <div className="flex items-center space-x-2 ml-8">
                  <Volume2 className="w-4 h-4 text-white" />
                  <Slider
                    value={[volume * 100]}
                    onValueChange={([value]) => setVolume(value / 100)}
                    className="w-20"
                    step={1}
                  />
                </div>
              </div>

              <Separator className="bg-white/20 mb-6" />

              {/* Playlist */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Playlist ({playlist.length} songs)
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {playlist.map((song, index) => {
                    const stats = getListeningStats(song);
                    return (
                      <div
                        key={song.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          song.id === currentSong.id
                            ? 'bg-white/20'
                            : 'hover:bg-white/10'
                        }`}
                        onClick={() => selectSong(song)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-gray-400 text-sm w-6">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white truncate">
                              {song.name}
                            </div>
                            {stats.totalTime > 0 && (
                              <div className="text-xs text-gray-400">
                                Listened: {formatTime(stats.totalTime)} ({stats.playCount} times)
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm ml-2">
                          {formatTime(song.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {playlist.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6 text-center space-y-4">
              <Music className="w-16 h-16 text-white/60 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Get Started</h3>
                <p className="text-gray-300">
                  Click "Load Music Folder" to select your music files and start listening.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• Supports: MP3, WAV, OGG, M4A, AAC, FLAC</p>
                  <p>• Listening time is automatically tracked</p>
                  <p>• Multiple playback modes available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} preload="metadata" />
      </div>
    </div>
  );
};

export default MusicPlayer;