import React from "react";
import Link from "next/link";
import Header from "./components/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#222226] bg-grid-architectural">
          {/* Left Hero Content */}
          <div className="p-8 sm:p-14 lg:p-20 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#222226]">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.02] uppercase text-white">
                ARCHITECTURAL<br />
                GEOMETRY<br />
                AT SCALE
              </h1>

              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md">
                High-fidelity spatial reconstruction from 2D imagery for engineering and design. Strictly objective rendering pipelines.
              </p>
            </div>

            <div className="pt-10">
              <Link
                href="/create"
                className="bg-white text-black text-xs font-semibold px-6 py-3 tracking-widest uppercase hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
              >
                <span>ENTER SYSTEM</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Graphic: Geometric Polyhedron Wireframe */}
          <div className="relative min-h-[380px] lg:min-h-[540px] flex items-center justify-center p-8 bg-black/40">
            <div className="w-64 h-64 sm:w-80 sm:h-80 relative flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full stroke-white fill-none stroke-[1.2]"
              >
                {/* Outer Isometric Hexagon boundary */}
                <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" />

                {/* Inner Cube Edges */}
                <line x1="100" y1="20" x2="100" y2="100" />
                <line x1="100" y1="100" x2="170" y2="140" />
                <line x1="100" y1="100" x2="30" y2="140" />

                {/* Internal Octahedral Inverted Facets */}
                <polygon points="100,50 145,85 100,120 55,85" />
                <line x1="100" y1="50" x2="100" y2="150" />
                <line x1="55" y1="85" x2="100" y2="150" />
                <line x1="145" y1="85" x2="100" y2="150" />

                {/* Hidden Dashed Edges */}
                <line x1="30" y1="60" x2="100" y2="100" strokeDasharray="3 3" opacity="0.6" />
                <line x1="170" y1="60" x2="100" y2="100" strokeDasharray="3 3" opacity="0.6" />
                <line x1="100" y1="180" x2="100" y2="120" strokeDasharray="3 3" opacity="0.6" />
                <line x1="30" y1="140" x2="100" y2="50" strokeDasharray="3 3" opacity="0.4" />
                <line x1="170" y1="140" x2="100" y2="50" strokeDasharray="3 3" opacity="0.4" />
              </svg>
            </div>

            {/* Subtle technical corner marks */}
            <div className="absolute bottom-6 left-6 text-[10px] text-zinc-500 tracking-wider font-mono space-y-0.5">
              <div>TARGET: 3D_GLB</div>
              <div>SPACE: ISOMETRIC</div>
              <div>NORMALS: REPAIRED</div>
            </div>
          </div>
        </section>

        {/* How It Works Workflow Section */}
        <section className="border-b border-[#222226] bg-black">
          <div className="p-8 sm:p-12 border-b border-[#222226]">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 font-mono">
              HOW THE SYSTEM WORKS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#222226]">
            {/* Step 01 */}
            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="text-zinc-500 text-xs font-mono">01 / INGESTION</div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Subject Isolation
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload a single 2D image. The pipeline removes the background, centers the subject, and normalizes aspect ratio.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="text-zinc-500 text-xs font-mono">02 / RECONSTRUCTION</div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Spatial Synthesis
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Infers depth, 360-degree volume, and unseen rear geometry, generating a continuous watertight 3D structure.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="text-zinc-500 text-xs font-mono">03 / OPTIMIZATION</div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Mesh Repair & Decimation
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatically corrects inverted normals, seals geometry gaps, and simplifies polygon count for high performance.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="text-zinc-500 text-xs font-mono">04 / DELIVERY</div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Inspection & Export
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Inspect the asset on an interactive 360° turntable, verify topology, and export a standard .GLB binary file.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Callout */}
        <section className="p-8 sm:p-14 max-w-4xl w-full mx-auto flex flex-col items-center text-center space-y-6 flex-1 justify-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white">
            Ready to Reconstruct
          </h2>
          <p className="text-zinc-400 text-sm max-w-md">
            Import a photograph and generate an optimized 3D mesh ready for games, visualization, and CAD pipelines.
          </p>
          <Link
            href="/create"
            className="bg-white text-black font-semibold text-xs px-8 py-3.5 tracking-wider uppercase hover:bg-zinc-200 transition-colors"
          >
            Start Creating →
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#222226] px-6 sm:px-10 py-5 flex items-center justify-between text-xs text-zinc-400 bg-black">
          <div className="tracking-wider uppercase font-semibold text-white">
            CORE_3D / 2026
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            STRICTLY OBJECTIVE RECONSTRUCTION
          </div>
        </footer>
      </main>
    </div>
  );
}
