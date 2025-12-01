"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Subtitles,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({
  src,
  poster,
  title,
  subtitle,
  onTimeUpdate,
  onEnded,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [showCaptions, setShowCaptions] = useState(false);
  const [quality, setQuality] = useState<"HD" | "SD">("HD");
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Format time to MM:SS
  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  // Handle play state
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Handle time update
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime, video.duration);

    // Update buffered
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered((bufferedEnd / video.duration) * 100);
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  // Handle video end
  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  // Seek video
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  // Handle progress drag
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);

    if (isDraggingProgress) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = pos * video.duration;
      }
    }
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  // Volume control
  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const volumeBar = volumeRef.current;
    const video = videoRef.current;
    if (!volumeBar || !video) return;

    const rect = volumeBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pos);
    video.volume = pos;
    setIsMuted(pos === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      video.muted = false;
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  // Playback speed
  const changeSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    setShowSettingsMenu(false);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle mouse up for progress drag
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingProgress(false);
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Auto-hide controls
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    setShowControls(true);

    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowSettingsMenu(false);
        setShowVolumeSlider(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Handle mouse movement
  const handleMouseMove = () => {
    resetHideControlsTimer();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowSettingsMenu(false);
        setShowVolumeSlider(false);
      }, 1000);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          setVolume((v) => {
            const newVol = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume((v) => {
            const newVol = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, toggleFullscreen]);

  // Buffering states
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black group overflow-hidden",
        isFullscreen ? "w-screen h-screen" : "w-full aspect-video max-h-[600px]",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        playsInline
      />

      {/* Title Overlay (Top) */}
      {(title || subtitle) && showControls && (
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          {title && (
            <h2 className="text-white text-lg sm:text-lg lg:text-lg font-bold uppercase tracking-wide">
              {title}
            </h2>
          )}
          {subtitle && (    
            <p className="text-white/80 text-sm sm:text-base mt-1">by {subtitle}</p>
          )}
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-white/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Center Play Button (when paused) */}
      {!isPlaying && !isBuffering && showControls && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay (Bottom) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 mx-3 sm:mx-4 mb-2 cursor-pointer group/progress"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-white/30 rounded-full" />

          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
            style={{ width: `${buffered}%` }}
          />

          {/* Progress */}
          <div
            className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Thumb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-orange-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between px-2 sm:px-4 pb-3">
          {/* Left Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
              title={isPlaying ? "Pause (K)" : "Play (K)"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
              )}
            </button>

            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Forward 10s"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>

              {/* Volume Slider - inline, pushes time display */}
              <div
                className={cn(
                  "flex items-center transition-all duration-300 ease-out overflow-hidden",
                  showVolumeSlider ? "w-20 opacity-100 ml-1" : "w-0 opacity-0"
                )}
              >
                <div
                  ref={volumeRef}
                  className="h-1 w-20 bg-white/30 rounded-full cursor-pointer flex-shrink-0"
                  onClick={handleVolumeChange}
                >
                  <div
                    className="h-full bg-white rounded-full relative"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Display */}
            <span className="text-white text-xs sm:text-sm font-medium ml-1 sm:ml-2 tabular-nums whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* HD Quality Badge */}
            <button
              onClick={() => setQuality(quality === "HD" ? "SD" : "HD")}
              className={cn(
                "px-1.5 py-0.5 text-[10px] sm:text-xs font-bold rounded border transition-colors",
                quality === "HD"
                  ? "text-white border-white bg-white/10"
                  : "text-white/50 border-white/50"
              )}
              title="Quality"
            >
              HD
            </button>

            {/* Captions */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={cn(
                "p-1.5 sm:p-2 rounded-full transition-colors",
                showCaptions ? "bg-white/20" : "hover:bg-white/10"
              )}
              title="Captions (C)"
            >
              <Subtitles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowSpeedMenu(false);
                }}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className={cn("w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform", showSettingsMenu && "rotate-45")} />
              </button>

              {/* Settings Menu */}
              {showSettingsMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg overflow-hidden min-w-[180px] shadow-xl border border-white/10">
                  {/* Speed Option */}
                  <button
                    onClick={() => {
                      setShowSpeedMenu(true);
                      setShowSettingsMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>Playback Speed</span>
                    <span className="text-white/60">{playbackSpeed}x</span>
                  </button>

                  {/* Quality Option */}
                  <button
                    onClick={() => setQuality(quality === "HD" ? "SD" : "HD")}
                    className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>Quality</span>
                    <span className="text-white/60">{quality}</span>
                  </button>

                  {/* Captions Option */}
                  <button
                    onClick={() => setShowCaptions(!showCaptions)}
                    className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 flex items-center justify-between"
                  >
                    <span>Captions</span>
                    <span className="text-white/60">{showCaptions ? "On" : "Off"}</span>
                  </button>
                </div>
              )}

              {/* Speed Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg overflow-hidden min-w-[140px] shadow-xl border border-white/10">
                  <div className="px-4 py-2 text-white/60 text-xs uppercase tracking-wider border-b border-white/10">
                    Speed
                  </div>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center justify-between",
                        playbackSpeed === speed ? "text-orange-500" : "text-white"
                      )}
                    >
                      <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                      {playbackSpeed === speed && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Captions Display Area */}
      {showCaptions && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-center max-w-[80%]">
          {/* Captions would be displayed here when available */}
        </div>
      )}
    </div>
  );
}
