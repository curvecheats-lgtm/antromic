'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Direct MP3 URL - replace with your actual file
  const audioUrl = '/music/hey-there-sally.mp3';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error('Audio play failed:', e);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setVolume(isMuted ? 0.5 : 0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="glass rounded-lg p-2 flex items-center gap-2 border border-primary/30 shadow-lg">
        {/* Spinning Music Icon */}
        <div
          className={`w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary ${
            isPlaying ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '3s' }}
        >
          <Music className="w-4 h-4" />
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground transition-all hover:scale-105"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Volume Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="w-6 h-6 rounded-full hover:bg-primary/20 flex items-center justify-center text-primary transition-all"
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-12 h-1 bg-primary/30 rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          loop
          onEnded={handleAudioEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
}
