"use client";

import React from "react";
import Link from "next/link";
import Header from "./components/Header";

// Google model-viewer element in React 19
const ModelViewer = "model-viewer" as unknown as React.ElementType;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Full-Screen Video Hero Section — Clean Down-Left Minimalist */}
        <section className="relative w-full h-screen h-[100dvh] flex flex-col justify-end overflow-hidden border-b border-[#222226] bg-black px-8 sm:px-16 lg:px-24 pb-16 sm:pb-24">
          {/* Full-Screen Background Video */}
          <video
            src="/video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-75"
          />

          {/* Dark Contrast Overlays for Crisp Down-Left Readability */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/85 via-black/20 to-transparent" />

          {/* Hero Content — Down Left with Pure Typography */}
          <div className="relative z-10 max-w-3xl flex flex-col items-start text-left space-y-6">
            <h1 className="font-sharp text-5xl sm:text-7xl lg:text-[88px] font-semibold tracking-tighter leading-[0.96] text-white">
              Image to<br />
              Model<br />
              in Seconds
            </h1>

            {/* Subtext under hero headline */}
            <div className="max-w-lg text-zinc-300 text-sm sm:text-base leading-relaxed">
              Convert 2D reference images into production-ready 3D assets. Automatic background isolation, 360° depth inference, and watertight topology ready for games, AR, and 3D scenes.
            </div>

            <div className="pt-2">
              <Link
                href="/create"
                className="bg-white text-black text-sm font-medium px-8 py-3.5 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 active:scale-[0.98]"
              >
                <span>Generate 3D Model</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Vertical Section 1: Subject Isolation with Redesigned High-Tech Split Scanner */}
        <section className="border-b border-[#222226] bg-black py-20 sm:py-28 px-8 sm:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Automatic Subject Isolation
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                Upload any photograph or concept sketch regardless of background complexity. Our pipeline segments the subject with sub-pixel alpha masking, eliminates background noise, and centers the asset on a normalized 1024x1024 canvas.
              </p>
            </div>

            {/* Redesigned Graphic 1: High-Tech Alpha Segmentation Viewport */}
            <div className="border border-[#222226] bg-[#09090b] p-6 sm:p-8 flex items-center justify-center min-h-[360px] relative overflow-hidden">
              <div className="relative w-full max-w-sm h-72 border border-[#27272a] bg-black overflow-hidden flex items-center justify-center">
                {/* Left Side: Background Clutter Noise */}
                <div className="absolute inset-y-0 left-0 w-1/2 bg-[#0d0d10] border-r border-white/20 overflow-hidden flex items-center justify-center">
                  {/* Clutter grid lines */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#71717a_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="w-24 h-24 border border-dashed border-zinc-700 opacity-40 rotate-12 absolute -top-4 -left-4" />
                  <div className="w-16 h-16 border border-zinc-800 opacity-50 absolute bottom-2 left-4" />
                  <div className="absolute top-2 left-2 font-mono text-[9px] text-zinc-600">INPUT RAW</div>
                </div>

                {/* Right Side: Clean Transparency Grid */}
                <div className="absolute inset-y-0 right-0 w-1/2 bg-[#050507] overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <div className="absolute top-2 right-2 font-mono text-[9px] text-zinc-400">ALPHA 100%</div>
                </div>

                {/* Center Isolated Subject Silhouette & Precision Bounding Calipers */}
                <div className="relative z-10 flex items-center justify-center">
                  {/* Bounding Box Frame */}
                  <div className="w-44 h-44 border border-white/40 relative flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    {/* Corner Calipers */}
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

                    {/* High-Precision 3D Geometric Subject Icon */}
                    <svg viewBox="0 0 100 100" className="w-28 h-28 stroke-white fill-none stroke-[1.2]">
                      <circle cx="50" cy="50" r="34" strokeDasharray="3 3" stroke="#71717a" />
                      <polygon points="50,20 80,45 68,80 32,80 20,45" className="stroke-white stroke-[1.5]" />
                      <line x1="50" y1="20" x2="50" y2="80" stroke="#a1a1aa" strokeWidth="0.8" />
                      <line x1="20" y1="45" x2="80" y2="45" stroke="#a1a1aa" strokeWidth="0.8" />
                      <circle cx="50" cy="50" r="3" className="fill-white" />
                    </svg>

                    {/* Laser Scanning Beam */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-full h-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] absolute animate-scan-beam" />
                    </div>

                    {/* Coordinate Indicators */}
                    <div className="absolute -bottom-5 left-0 right-0 flex justify-between font-mono text-[8px] text-zinc-500 px-1">
                      <span>W: 1024 PX</span>
                      <span>H: 1024 PX</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vertical Section 2: Watertight 3D Reconstruction with Redesigned Volumetric Depth Grid */}
        <section className="border-b border-[#222226] bg-black py-20 sm:py-28 px-8 sm:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Redesigned Graphic 2: 360° Volumetric Wireframe & Depth Projection */}
            <div className="border border-[#222226] bg-[#09090b] p-6 sm:p-8 flex items-center justify-center min-h-[360px] order-2 lg:order-1 relative overflow-hidden">
              <div className="relative w-full max-w-sm h-72 border border-[#27272a] bg-black flex items-center justify-center overflow-hidden">
                {/* Background Isometric Grid */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#3f3f46_1px,transparent_1px),linear-gradient(to_bottom,#3f3f46_1px,transparent_1px)] bg-[size:20px_20px]" />

                {/* 360° Volumetric Wireframe Geometry */}
                <div className="relative z-10 w-48 h-48 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full stroke-white fill-none">
                    {/* Front Face Hexagon */}
                    <polygon points="100,25 165,60 165,135 100,175 35,135 35,60" strokeWidth="1.6" className="stroke-white" />

                    {/* Isometric Internal Spatial Lattice */}
                    <line x1="100" y1="25" x2="100" y2="100" strokeWidth="1.2" className="stroke-zinc-300" />
                    <line x1="165" y1="60" x2="100" y2="100" strokeWidth="1.2" className="stroke-zinc-300" />
                    <line x1="35" y1="60" x2="100" y2="100" strokeWidth="1.2" className="stroke-zinc-300" />
                    <line x1="100" y1="100" x2="100" y2="175" strokeWidth="1.4" className="stroke-white" />
                    <line x1="100" y1="100" x2="165" y2="135" strokeWidth="1.4" className="stroke-white" />
                    <line x1="100" y1="100" x2="35" y2="135" strokeWidth="1.4" className="stroke-white" />

                    {/* Synthesized Back-Face Ray Projections (Dashed) */}
                    <line x1="100" y1="25" x2="140" y2="45" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="100" y1="175" x2="140" y2="155" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="35" y1="135" x2="75" y2="155" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
                    <polygon points="100,50 145,75 145,125 100,150 55,125 55,75" stroke="#52525b" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Key Vertices Dots */}
                    <circle cx="100" cy="25" r="3" className="fill-white" />
                    <circle cx="165" cy="60" r="3" className="fill-white" />
                    <circle cx="165" cy="135" r="3" className="fill-white" />
                    <circle cx="100" cy="175" r="3" className="fill-white" />
                    <circle cx="35" cy="135" r="3" className="fill-white" />
                    <circle cx="35" cy="60" r="3" className="fill-white" />
                    <circle cx="100" cy="100" r="3.5" className="fill-white" />
                  </svg>
                </div>

                {/* Corner Telemetry Labels */}
                <div className="absolute top-2 left-2 font-mono text-[9px] text-zinc-500">
                  AXIS: [X, Y, Z]
                </div>
                <div className="absolute bottom-2 right-2 font-mono text-[9px] text-zinc-400">
                  360° DEPTH FIELD
                </div>
              </div>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Complete 360° Reconstruction
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                Rather than generating a shallow 2.5D relief, the model calculates full spatial depth and predicts unseen back-face geometry, producing a continuous watertight mesh with clean manifold topology and validated normals.
              </p>
            </div>
          </div>
        </section>

        {/* Vertical Section 3: Our Story & Our Vision with Interactive 3D Model */}
        <section className="border-b border-[#222226] bg-black py-20 sm:py-28 px-8 sm:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Left: Stacked Story & Vision Cards */}
            <div className="flex flex-col justify-between gap-6">
              {/* Our Story Card */}
              <div className="border border-[#222226] bg-[#09090b] p-8 sm:p-10 space-y-4 flex-1 flex flex-col justify-center">
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Our Story
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  3D asset creation has always been bottlenecked by manual poly modeling, retopology, and endless tweaking. We built Core3D to make 3D creation as direct and accessible as generating an image—enabling creators, game developers, and artists to turn concept art into production-ready 3D meshes in seconds.
                </p>
              </div>

              {/* Our Vision Card */}
              <div className="border border-[#222226] bg-[#09090b] p-8 sm:p-10 space-y-4 flex-1 flex flex-col justify-center">
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  Our Vision
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  To make spatial 3D generation instant, watertight, and universally compatible. Whether you are prototyping indie games, designing spatial experiences, or rendering digital products, Core3D removes the friction between imagination and interactive 3D assets.
                </p>
              </div>
            </div>

            {/* Right: Clean Interactive 3D Model Display Card */}
            <div className="border border-[#222226] bg-[#09090b] relative flex flex-col justify-between overflow-hidden min-h-[460px] p-6 sm:p-8">
              {/* 3D Model Viewer Canvas */}
              <div className="relative flex-1 w-full h-full min-h-[360px] flex items-center justify-center my-auto">
                <ModelViewer
                  src="/model_e2f74830.glb"
                  alt="3D Asset Preview"
                  auto-rotate="true"
                  camera-controls="true"
                  shadow-intensity="0.8"
                  shadow-softness="0.8"
                  environment-image="neutral"
                  exposure="0.9"
                  style={{ width: "100%", height: "100%", minHeight: "360px" }}
                />
              </div>

              {/* Subtle Indicator Dots */}
              <div className="flex items-center justify-center gap-2 pt-2 z-10">
                <span className="w-5 h-1 bg-white rounded-full" />
                <span className="w-1.5 h-1 bg-zinc-700 rounded-full" />
                <span className="w-1.5 h-1 bg-zinc-700 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Ready to Construct Callout */}
        <section className="p-16 sm:p-24 max-w-4xl w-full mx-auto flex flex-col items-center text-center space-y-6 flex-1 justify-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white">
            Ready to Construct
          </h2>
          <div className="max-w-xl text-zinc-400 text-sm sm:text-base leading-relaxed">
            Upload any reference image and generate an optimized 3D mesh ready for interactive applications, spatial computing, and CAD workflows.
          </div>
          <Link
            href="/create"
            className="bg-white text-black font-medium text-sm px-8 py-3.5 hover:bg-zinc-200 transition-colors inline-flex items-center gap-2 active:scale-[0.98]"
          >
            <span>Try Now</span>
            <span>→</span>
          </Link>
        </section>

        {/* Minimal Footer */}
        <footer className="border-t border-[#222226] px-6 sm:px-10 py-5 flex items-center justify-between text-xs text-zinc-500 bg-black font-mono">
          <div className="tracking-wider uppercase font-semibold text-zinc-300">
            CORE_3D / 2026
          </div>
        </footer>
      </main>
    </div>
  );
}
