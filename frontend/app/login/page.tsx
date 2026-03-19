"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Will point to your Express backend
        const res = await axios.post("http://localhost:5000/api/auth/google", {
          token: tokenResponse.access_token,
        });
        console.log("Auth Success:", res.data);
        alert("Google Auth Success! See console.");
      } catch (err) {
        console.error("Google Auth Error", err);
        alert("Authentication failed.");
      }
    },
    onError: () => console.log("Google Auth Failed"),
  });

  const FRAME_COUNT = 80;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  useEffect(() => {
    setMounted(true);
    const loadImages = async () => {
      setIsLoading(true);
      const loadedImages: HTMLImageElement[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        const indexStr = (i + 1).toString().padStart(3, "0");
        img.src = `/video-split/ffout${indexStr}.gif`;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        loadedImages.push(img);
      }
      setImages(loadedImages);
      setIsLoading(false);
    };
    loadImages();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;
    let frame = 0;
    let lastTime = 0;
    const fps = 20 // Increased speed for faster playback
    const interval = 1000 / fps;

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      if (deltaTime >= interval) {
        lastTime = time - (deltaTime % interval);
        const currentImage = images[frame];
        if (currentImage && currentImage.complete) {
          const rect = canvas.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
          const hRatio = rect.width / currentImage.width;
          const vRatio = rect.height / currentImage.height;
          const ratio = Math.max(hRatio, vRatio);
          const centerShiftX = (rect.width - currentImage.width * ratio) / 2;
          const centerShiftY = (rect.height - currentImage.height * ratio) / 2;
          ctx.drawImage(currentImage, 0, 0, currentImage.width, currentImage.height, centerShiftX, centerShiftY, currentImage.width * ratio, currentImage.height * ratio);
        }
        frame = (frame + 1) % FRAME_COUNT;
      }
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [images, dpr]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-slate-100 p-4">

      {/* Animated Canvas Background */}
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
            <p className="mt-4 text-[10px] tracking-[0.3em] text-white/30 uppercase font-mono">
              Initializing...
            </p>
          </div>
        )}

        {/* Dark overlay — heavier than before for terminal contrast */}
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />

        {/* Subtle scanline texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)",
          }}
        />
      </div>

      {/* Command Panel */}
      <div
        className={`relative z-10 w-full max-w-[420px] transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        {/* Outer border frame */}
        <div className="relative border border-white/[0.12] bg-black/[0.92]">

          {/* Corner accents — top left */}
          <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-violet-500/70" />
          <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-violet-500/70" />
          <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-violet-500/30" />
          <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-violet-500/30" />

          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <span className="block w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
              <span className="font-mono text-[10px] tracking-[0.22em] text-white/25 uppercase">
                CineMate // Auth Terminal
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[0.2, 0.35, 0.6].map((opacity, i) => (
                <span
                  key={i}
                  className="block w-1 h-1 rounded-full bg-white"
                  style={{ opacity }}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="px-8 pt-8 pb-7">
            {/* Scan line divider */}
            <div className="flex items-center gap-3 mb-7">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <div className="h-px w-10 bg-violet-500/40" />
              <div className="h-px w-3 bg-violet-500/20" />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
                Welcome back
              </h1>
              <p className="font-mono text-[11px] tracking-widest text-white/20">
                _identify yourself to proceed
              </p>
            </div>

            {/* Fields */}
            <form className="space-y-5">
              {/* Email */}
              <div className="group">
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] uppercase text-white/25 mb-2"
                >
                  <span className="text-violet-500/50">//</span>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="user@domain.com"
                  className="w-full bg-white/[0.03] border border-white/[0.09] text-white text-sm px-4 py-3 outline-none placeholder:text-white/[0.12] placeholder:font-mono placeholder:text-xs transition-all duration-150 focus:border-violet-500/60 focus:bg-violet-500/[0.05] hover:border-white/20"
                />
              </div>

              {/* Password */}
              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] uppercase text-white/25"
                  >
                    <span className="text-violet-500/50">//</span>
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-[10px] font-mono tracking-wider text-violet-400/40 hover:text-violet-400/80 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/[0.09] text-white text-sm px-4 py-3 outline-none placeholder:text-white/20 transition-all duration-150 focus:border-violet-500/60 focus:bg-violet-500/[0.05] hover:border-white/20"
                />
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer group/check pt-1 pb-2">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" name="remember" className="peer sr-only" />
                  <div className="w-3.5 h-3.5 border border-white/[0.15] bg-transparent transition-all peer-checked:bg-violet-500 peer-checked:border-violet-500 group-hover/check:border-white/30" />
                  <svg
                    className="absolute inset-0 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono tracking-wider text-white/25 group-hover/check:text-white/50 transition-colors">
                  Remember session
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                className="group/btn relative w-full overflow-hidden bg-violet-500 hover:bg-violet-400 active:scale-[0.99] transition-all duration-150 px-4 py-4"
              >
                {/* Shimmer sweep on hover */}
                <span className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span className="relative flex items-center justify-center gap-3 text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-black">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Launch Experience
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-white/20">
                or continue with
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => handleGoogleAuth()}
              className="w-full flex items-center justify-center gap-3 border border-white/[0.09] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 px-4 py-3 text-[11px] font-mono tracking-wider text-white/35 hover:text-white/60 transition-all duration-150"
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google
            </button>
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-center gap-2 px-6 py-3.5 border-t border-white/[0.06]">
            <span className="font-mono text-[10px] tracking-wider text-white/20">
              No account?
            </span>
            <Link
              href="/signup"
              className="font-mono text-[10px] tracking-wider text-violet-400/50 hover:text-violet-400 transition-colors"
            >
              Sign up →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}