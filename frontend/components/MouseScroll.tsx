"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

export default function MouseScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User specifies "000 to 191" which means exactly 192 frames.
  const FRAME_COUNT = 192; 

  // Track the scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map scroll progress (000 to 001) to frame index (0 to 191)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

  // Opacities map based on scroll to trigger fade ins and outs
  const opacity0 = useTransform(scrollYProgress, [0, 0.1, 0.2], [1, 1, 0]);
  const opacity30 = useTransform(scrollYProgress, [0.2, 0.3, 0.4], [0, 1, 0]);
  const opacity60 = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [0, 1, 0]);
  const opacity90 = useTransform(scrollYProgress, [0.8, 0.9, 1], [0, 1, 1]);

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const loadedImages: HTMLImageElement[] = [];

      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        const indexStr = i.toString().padStart(3, "0");
        // Naming convention requirement: frame_[i]_delay-0.04s.webp
        img.src = `/video-split/frame_${indexStr}_delay-0.04s.webp`;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Ignore missing frames to prevent locking
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

    // Handle high DPI displays to prevent blurry canvas on retina screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;

    const render = () => {
      const index = Math.round(frameIndex.get());
      const currentImage = images[index];

      if (currentImage && currentImage.complete) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Ensure the canvas scales correctly on mobile (contain fit)
        const hRatio = rect.width / currentImage.width;
        const vRatio = rect.height / currentImage.height;
        const ratio = Math.min(hRatio, vRatio);
        
        const centerShiftX = (rect.width - currentImage.width * ratio) / 2;
        const centerShiftY = (rect.height - currentImage.height * ratio) / 2;

        ctx.drawImage(
          currentImage,
          0,
          0,
          currentImage.width,
          currentImage.height,
          centerShiftX,
          centerShiftY,
          currentImage.width * ratio,
          currentImage.height * ratio
        );
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Re-render on frameIndex change for smooth interpolation
    const unsubscribe = frameIndex.on("change", render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      unsubscribe();
    };
  }, [images, frameIndex]);

  return (
    // Container with h-[400vh] to allow for a long scroll duration
    <div ref={containerRef} className="relative h-[400vh] w-full bg-black">
      {/* Sticky top-0 h-screen w-full centered perfectly */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Loading state (spinner) while images pre-load */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            <p className="mt-4 text-sm tracking-[0.2em] text-white/70 uppercase">Loading Assets...</p>
          </div>
        )}

        {/* Canvas Element perfectly centered */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />

        {/* 0% Scroll: Centered Title */}
        <motion.div
          style={{ opacity: opacity0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
            WSP - Wireless Mouse
          </h1>
        </motion.div>

        {/* 30% Scroll: Left aligned text */}
        <motion.div
          style={{ opacity: opacity30 }}
          className="absolute inset-y-0 left-0 flex items-center justify-start px-10 md:px-24 pointer-events-none"
        >
          <h2 className="text-4xl md:text-6xl font-light text-white max-w-md drop-shadow-xl text-left leading-tight">
            Precision Engineering.
          </h2>
        </motion.div>

        {/* 60% Scroll: Right aligned text */}
        <motion.div
          style={{ opacity: opacity60 }}
          className="absolute inset-y-0 right-0 flex items-center justify-end px-10 md:px-24 pointer-events-none text-right"
        >
          <h2 className="text-4xl md:text-6xl font-light text-white max-w-md drop-shadow-xl text-right leading-tight">
            Titanium Drivers.
          </h2>
        </motion.div>

        {/* 90% Scroll: Centered CTA */}
        <motion.div
          style={{ opacity: opacity90 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <h2 className="text-5xl md:text-8xl font-bold text-white drop-shadow-2xl mb-8">
              Hear Everything.
            </h2>
            <button className="rounded-full bg-white px-8 py-4 text-sm font-semibold tracking-wider text-black transition-transform hover:scale-105 active:scale-95 pointer-events-auto shadow-xl">
              Pre-order Now
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
