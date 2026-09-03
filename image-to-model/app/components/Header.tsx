"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 w-full h-16 px-6 sm:px-12 flex items-center justify-between z-50 bg-transparent border-b border-white/10">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-4 h-4 border border-white flex items-center justify-center transition-transform group-hover:scale-105">
          <div className="w-1.5 h-1.5 bg-white" />
        </div>
        <span className="font-semibold text-xs tracking-widest uppercase text-white">
          CORE_3D
        </span>
      </Link>

      {/* Right Action */}
      <div className="flex items-center">
        <Link
          href="/create"
          className="border border-white/20 text-white text-xs px-3.5 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          Try Now
        </Link>
      </div>
    </header>
  );
}
