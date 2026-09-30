import React, { useState, useRef, useEffect } from "react";
import { PlayIcon, PauseIcon } from "@/icons/Icons";

interface VideoPreviewProps {
  videoSrc?: string;
}

/** Arrow-key steps for the two sliders. */
const SEEK_STEP_SECONDS = 5;
const VOLUME_STEP = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const VideoPreview: React.FC<VideoPreviewProps> = ({ videoSrc }) => {
  const [volume, setVolume] = useState(100);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Keep state in step with the element itself, so the controls show what the
  // video is really doing (e.g. a play() the browser refused stays "paused").
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncDuration = () =>
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    const handleLoadedMetadata = () => {
      syncDuration();
      setVolume(Math.round(video.volume * 100));
    };
    const handleTimeUpdate = () => {
      if (!isDraggingProgress) setCurrentTime(video.currentTime);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", syncDuration);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", syncDuration);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [isDraggingProgress, videoSrc]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;
    const next = clamp(time, 0, duration);
    video.currentTime = next;
    setCurrentTime(next);
  };

  const applyVolume = (value: number) => {
    const next = Math.round(clamp(value, 0, 100));
    setVolume(next);
    if (videoRef.current) videoRef.current.volume = next / 100;
  };

  /** 0–1 position of a pointer along a slider track. */
  const fractionAlong = (el: HTMLElement | null, clientX: number) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0;
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    seekTo(fractionAlong(progressRef.current, e.clientX) * duration);
    setIsDraggingProgress(true);
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    applyVolume(fractionAlong(volumeRef.current, e.clientX) * 100);
    setIsDraggingVolume(true);
  };

  useEffect(() => {
    if (!isDraggingProgress && !isDraggingVolume) return;
    const onMove = (e: PointerEvent) => {
      if (isDraggingProgress) {
        seekTo(fractionAlong(progressRef.current, e.clientX) * duration);
      } else {
        applyVolume(fractionAlong(volumeRef.current, e.clientX) * 100);
      }
    };
    const onUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingProgress, isDraggingVolume, duration]);

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? SEEK_STEP_SECONDS
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -SEEK_STEP_SECONDS
          : null;
    if (step !== null) seekTo(currentTime + step);
    else if (e.key === "Home") seekTo(0);
    else if (e.key === "End") seekTo(duration);
    else return;
    e.preventDefault();
  };

  const handleVolumeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? VOLUME_STEP
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -VOLUME_STEP
          : null;
    if (step !== null) applyVolume(volume + step);
    else if (e.key === "Home") applyVolume(0);
    else if (e.key === "End") applyVolume(100);
    else return;
    e.preventDefault();
  };

  // Only the product's own video — never a stand-in clip.
  if (!videoSrc) return null;

  return (
    <div className="flex flex-col items-center w-[100%] mx-auto">
      <div className="relative w-full">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-auto rounded-none aspect-[16/9] object-cover"
          autoPlay={false}
          loop
          controls={false}
          playsInline
          muted={volume === 0}
        />
        <div className="absolute top-1/2 left-1/2 cursor-pointer flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 bg-[#fefefe] rounded-full w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px]">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="bg-transparent border-none cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#538e53]"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            ) : (
              <PlayIcon className="w-6 h-6 sm:w-8 sm:h-8" />
            )}
          </button>
        </div>
      </div>
      <div className="w-full rounded-b-[5px] bg-[#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 py-2 px-3 sm:px-4">
        <div className="w-[100%] flex items-center justify-between">
          <span className="text-[0.65rem] sm:text-xs text-[#fefefe] font-medium">
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            onPointerDown={handleProgressPointerDown}
            onKeyDown={handleProgressKeyDown}
            className="w-[100%] h-[3px] sm:h-[4px] bg-[#f1f1f1] rounded-full mx-2 sm:mx-3 cursor-pointer relative touch-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#538e53]"
          >
            <div
              className="h-[3px] sm:h-[4px] bg-[#538e53] rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute -right-5 sm:-right-6 top-1/2 transform -translate-y-1/2 w-8 sm:w-10 h-4 sm:h-5 bg-[#538e53] rounded-full flex items-center justify-center cursor-pointer shadow-md">
                <span className="text-white text-[0.5rem] sm:text-[0.78rem] font-medium">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          </div>
          <span className="text-[0.65rem] sm:text-xs text-[#fefefe] font-medium">
            {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-[0.7rem] sm:text-sm text-[#fefefe] font-medium">
            Volume
          </span>
          <div
            ref={volumeRef}
            role="slider"
            tabIndex={0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume}
            aria-valuetext={`${volume}%`}
            onPointerDown={handleVolumePointerDown}
            onKeyDown={handleVolumeKeyDown}
            className="cursor-pointer touch-none rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#538e53]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="6"
              viewBox="0 0 80 6"
              fill="none"
              aria-hidden="true"
              className="block w-[76px] sm:w-[95px] h-[5px] sm:h-[6px]"
            >
              <rect y="1" width="80" height="4" rx="2" fill="#E2E2E2" />
              <rect
                y="1"
                width={`${(volume / 100) * 80}`}
                height="4"
                rx="2"
                fill="#538E53"
              />
              <circle
                cx={`${(volume / 100) * 80}`}
                cy="3"
                r="3"
                fill="#538E53"
                className="shadow-sm"
              />
            </svg>
          </div>
          <span className="text-[0.7rem] sm:text-sm text-[#fefefe] font-medium">
            {volume}%
          </span>
        </div>
      </div>
    </div>
  );
};
