"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#27272a] h-14 px-6 sm:px-10 flex items-center justify-between bg-black z-50">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-5 h-5 border border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white" />
          </div>
          <span className="font-semibold text-sm tracking-wider uppercase text-white">
            CORE_3D
          </span>
        </Link>
      </div>

      {/* Nav Switcher matching Stitch layout */}
      <nav className="flex items-center border border-[#27272a] divide-x divide-[#27272a] text-xs">
        <Link
          href="/"
          className={`px-4 py-1.5 transition-colors font-medium tracking-wider uppercase ${
            pathname === "/"
              ? "bg-white text-black font-semibold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          HOME
        </Link>
        <Link
          href="/create"
          className={`px-4 py-1.5 transition-colors font-medium tracking-wider uppercase ${
            pathname === "/create"
              ? "bg-white text-black font-semibold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          CREATE
        </Link>
        <Link
          href="/inspect"
          className={`px-4 py-1.5 transition-colors font-medium tracking-wider uppercase ${
            pathname === "/inspect"
              ? "bg-white text-black font-semibold"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          INSPECT
        </Link>
      </nav>

      {/* Right User Avatar */}
      <div className="w-7 h-7 rounded-full border border-[#27272a] flex items-center justify-center text-zinc-400">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    </header>
  );
}
