"use client";
import { Maximize, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fmt = (n: number) =>
    `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting)
          v.play()
            .then(() => setPlaying(true))
            .catch(() => {});
        else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.6 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const interact = () => {
    setControls(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => playing && setControls(false), 2500);
  };
  const toggle = () => {
    if (!ref.current) return;
    playing ? ref.current.pause() : ref.current.play();
    setPlaying(!playing);
    interact();
  };
  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.code === "Space") {
          e.preventDefault();
          toggle();
        }
        if (e.key === "ArrowLeft" && ref.current) ref.current.currentTime -= 5;
        if (e.key === "ArrowRight" && ref.current) ref.current.currentTime += 5;
      }}
      onMouseMove={interact}
      onTouchStart={interact}
      onClick={(e) => e.target === ref.current && toggle()}
      className="group relative aspect-video overflow-hidden rounded-xl border border-[#6337a5] bg-black shadow-eva focus:outline-none focus:ring-2 focus:ring-neon"
    >
      <video
        ref={ref}
        src={src}
        muted={muted}
        playsInline
        preload="metadata"
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onLoadedMetadata={(e) => setDuration(fmt(e.currentTarget.duration))}
        onTimeUpdate={(e) => {
          setProgress(
            e.currentTarget.duration
              ? (e.currentTarget.currentTime / e.currentTarget.duration) * 100
              : 0,
          );
          setTime(fmt(e.currentTarget.currentTime));
        }}
        onEnded={() => setPlaying(false)}
        className="h-full w-full object-contain"
      />
      {loading && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
      {!playing && (
        <button
          aria-label="Reproduzir vídeo"
          onClick={toggle}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 p-4 text-white"
        >
          <Play size={25} fill="currentColor" />
        </button>
      )}
      <div
        className={`${controls ? "opacity-100" : "opacity-0"} absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent px-3 pb-3 pt-10 text-white transition-opacity`}
      >
        <input
          aria-label="Progresso do vídeo"
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
            if (ref.current)
              ref.current.currentTime =
                (Number(e.target.value) / 100) * ref.current.duration;
            interact();
          }}
          className="h-2 w-full touch-none accent-[#b68cff]"
        />
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button aria-label="Play/Pause" onClick={toggle}>
            {playing ? (
              <Pause size={16} />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>
          <span>
            {time} / {duration}
          </span>
          <button
            aria-label="Som"
            onClick={() => {
              setMuted(!muted);
              if (ref.current) ref.current.muted = !muted;
            }}
          >
            <Volume2 size={16} className={muted ? "text-muted" : ""} />
          </button>
          <button
            aria-label="Tela cheia"
            className="ml-auto"
            onClick={() => ref.current?.requestFullscreen()}
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
