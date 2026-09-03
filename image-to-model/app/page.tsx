import React from "react";
import Link from "next/link";
import Header from "./components/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Full-Screen Video Hero Section — Down-Left */}
        <section className="relative w-full h-screen h-[100dvh] flex flex-col justify-end overflow-hidden border-b border-[#222226] bg-black px-8 sm:px-16 lg:px-24 pb-16 sm:pb-24">
          {/* Full-Screen Background Video */}
          <video
            src="/video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />

          {/* Dark Contrast Overlays for Crisp Down-Left Readability */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/75 via-transparent to-transparent" />

          {/* Hero Content — Down Left with Sharpened Font & Subtext */}
          <div className="relative z-10 max-w-3xl flex flex-col items-start text-left space-y-6">
            <h1 className="font-sharp text-5xl sm:text-7xl lg:text-[88px] font-semibold tracking-tighter leading-[0.98] text-white">
              Image to<br />
              Model<br />
              in Seconds
            </h1>

            {/* Subtext under hero headline */}
            <div className="max-w-lg text-zinc-300 text-sm sm:text-base leading-relaxed">
              Transform single 2D images into production-ready 3D models with watertight topology, automated subject isolation, and direct GLB export.
            </div>

            <div className="pt-2">
              <Link
                href="/create"
                className="bg-white text-black text-sm font-medium px-8 py-3.5 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 active:scale-[0.98]"
              >
                <span>Try Now</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Vertical Section 1: Subject Isolation */}
        <section className="border-b border-[#222226] bg-black py-20 sm:py-28 px-8 sm:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Automatic Subject Isolation
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                Upload any photograph or rendering against complex backgrounds. The pipeline automatically segments the subject, removes background clutter, and normalizes the geometry onto an aligned square canvas.
              </p>
            </div>
            <div className="border border-[#222226] bg-[#09090b] p-8 sm:p-12 flex items-center justify-center min-h-[300px]">
              <div className="relative w-48 h-48 border border-dashed border-zinc-700 flex items-center justify-center">
                <div className="w-28 h-28 border border-white flex items-center justify-center">
                  <div className="w-12 h-12 bg-white" />
                </div>
                <div className="absolute top-2 left-2 font-mono text-[10px] text-zinc-500">ISOLATE</div>
                <div className="absolute bottom-2 right-2 font-mono text-[10px] text-zinc-500">BOUNDS // 1:1</div>
              </div>
            </div>
          </div>
        </section>

        {/* Vertical Section 2: Watertight 3D Reconstruction */}
        <section className="border-b border-[#222226] bg-black py-20 sm:py-28 px-8 sm:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="border border-[#222226] bg-[#09090b] p-8 sm:p-12 flex items-center justify-center min-h-[300px] order-2 lg:order-1">
              <div className="w-48 h-48 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-36 h-36 stroke-white fill-none stroke-[1.2]">
                  <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
                  <line x1="50" y1="10" x2="50" y2="50" />
                  <line x1="50" y1="50" x2="90" y2="70" />
                  <line x1="50" y1="50" x2="10" y2="70" />
                  <line x1="50" y1="50" x2="50" y2="90" strokeDasharray="2 2" stroke="#71717a" />
                </svg>
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Complete 360° Reconstruction
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                Rather than producing a flat relief, the system calculates true spatial depth and infers unobserved rear faces, synthesizing a continuous watertight polygonal mesh with clean topology and validated surface normals.
              </p>
            </div>
          </div>
        </section>

        {/* Vertical Section 3: Native GLB Export */}
        <section className="border-b border-[#222226] bg-black py-20 sm:py-28 px-8 sm:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
                Direct Pipeline Export
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
                Output standard glTF 2.0 binary (.GLB) files ready for immediate drag-and-drop into Blender, Unreal Engine, Unity, Three.js, or CAD visualization tools without manual mesh repair or cleanup.
              </p>
            </div>
            <div className="border border-[#222226] bg-[#09090b] p-8 sm:p-12 flex flex-col justify-center space-y-4 min-h-[300px]">
              <div className="font-mono text-xs text-zinc-400 pb-2 border-b border-[#27272a]">
                PIPELINE COMPATIBILITY
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                <div className="border border-[#27272a] p-3">Blender 3D</div>
                <div className="border border-[#27272a] p-3">Unreal Engine</div>
                <div className="border border-[#27272a] p-3">Unity</div>
                <div className="border border-[#27272a] p-3">Three.js / WebGL</div>
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
