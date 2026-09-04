"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { getModelBlob } from "../lib/modelStorage";

// Google model-viewer element in React 19
const ModelViewer = "model-viewer" as unknown as React.ElementType;

interface ColorPreset {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: "Slate", hex: "#71717a", rgb: [0.44, 0.44, 0.48] },
  { name: "Titanium", hex: "#3f3f46", rgb: [0.25, 0.25, 0.28] },
  { name: "Silver", hex: "#a1a1aa", rgb: [0.63, 0.63, 0.67] },
  { name: "Cyber Ice", hex: "#38bdf8", rgb: [0.22, 0.74, 0.97] },
  { name: "Soft Clay", hex: "#d4d4d8", rgb: [0.83, 0.83, 0.85] },
];

function cleanPromptText(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // If it's a stringified python list or dict like [{'type': 'text', 'text': '...'}]
  if (text.includes("'text':") || text.includes('"text":')) {
    const match = text.match(/['"]text['"]\s*:\s*['"]([\s\S]*?)(?:['"],\s*['"]extras|['"]\s*\}|['"]\s*\]|['"]$)/);
    if (match && match[1]) {
      return match[1].replace(/\\n/g, " ").trim();
    }
  }

  return text.replace(/^["'\[\{]+|["'\]\}]+$/g, "").trim();
}

export default function InspectPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelSize, setModelSize] = useState<number>(0);
  const [modelId, setModelId] = useState<string>("");
  const [modelPrompt, setModelPrompt] = useState<string>("");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Material & Shading Settings (Toned down by default to avoid harsh overblown white)
  const [opacity, setOpacity] = useState<number>(0.75); // 75% opacity default
  const [selectedColor, setSelectedColor] = useState<ColorPreset>(COLOR_PRESETS[0]);
  const [exposure, setExposure] = useState<number>(0.75); // 0.75 exposure avoids white blowout
  const [roughness, setRoughness] = useState<number>(0.65); // Matte clay finish
  const [metallic, setMetallic] = useState<number>(0.1);

  const activeBlobUrlRef = useRef<string | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  // Apply material colors, opacity, roughness and alpha mode to model-viewer
  const applyMaterialProperties = useCallback(() => {
    const viewer = viewerRef.current as (HTMLElement & {
      model?: {
        materials?: Array<{
          setAlphaMode: (mode: string) => void;
          pbrMetallicRoughness: {
            setBaseColorFactor: (rgba: [number, number, number, number]) => void;
            setRoughnessFactor: (r: number) => void;
            setMetallicFactor: (m: number) => void;
          };
        }>;
      };
    }) | null;

    if (!viewer || !viewer.model) return;

    const materials = viewer.model.materials;
    if (!materials || materials.length === 0) return;

    for (const mat of materials) {
      if (mat.pbrMetallicRoughness) {
        if (opacity < 1.0) {
          mat.setAlphaMode("BLEND");
        } else {
          mat.setAlphaMode("OPAQUE");
        }
        mat.pbrMetallicRoughness.setBaseColorFactor([
          selectedColor.rgb[0],
          selectedColor.rgb[1],
          selectedColor.rgb[2],
          opacity,
        ]);
        mat.pbrMetallicRoughness.setRoughnessFactor(roughness);
        mat.pbrMetallicRoughness.setMetallicFactor(metallic);
      }
    }
  }, [opacity, selectedColor, roughness, metallic]);

  useEffect(() => {
    setIsMounted(true);

    async function loadModel() {
      const storedId = sessionStorage.getItem("active_model_id");
      const storedSize = sessionStorage.getItem("active_model_size");
      const storedPrompt = sessionStorage.getItem("active_model_prompt");
      if (storedPrompt) {
        setModelPrompt(cleanPromptText(storedPrompt));
      }

      // Check IndexedDB first for reload resilience
      const idbBlob = await getModelBlob("latest_model");
      if (idbBlob) {
        const freshBlobUrl = URL.createObjectURL(idbBlob);
        activeBlobUrlRef.current = freshBlobUrl;
        setModelUrl(freshBlobUrl);
        setModelSize(idbBlob.size);
        setModelId(storedId || "GENERATED");
        return;
      }

      // Check session storage blob URL (if freshly navigated SPA)
      const storedUrl = sessionStorage.getItem("active_model_url");
      if (storedUrl) {
        setModelUrl(storedUrl);
        setModelSize(storedSize ? parseInt(storedSize, 10) : 0);
        setModelId(storedId || "ASSET");
        return;
      }

      // Default to hero-model.glb
      setModelUrl("/hero-model.glb");
      setModelSize(3773916);
      setModelId("HERO_SPEC");
      setModelPrompt("Titanium futuristic combat mecha with high-density surface geometry and watertight topology.");
    }

    loadModel();

    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Listen to model-viewer load event and apply material settings
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      applyMaterialProperties();
    };

    viewer.addEventListener("load", handleLoad);
    applyMaterialProperties();

    return () => {
      viewer.removeEventListener("load", handleLoad);
    };
  }, [modelUrl, applyMaterialProperties]);

  const handleExport = () => {
    if (!modelUrl) return;
    const a = document.createElement("a");
    a.href = modelUrl;
    a.download = `model_${modelId || "asset"}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFallbackHero = () => {
    setLoadError(null);
    setModelUrl("/hero-model.glb");
    setModelSize(3773916);
    setModelId("HERO_SPEC");
  };

  const handleResetShading = () => {
    setOpacity(0.75);
    setSelectedColor(COLOR_PRESETS[0]);
    setExposure(0.75);
    setRoughness(0.65);
    setMetallic(0.1);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col p-6 sm:p-10 pt-20 sm:pt-24 max-w-6xl w-full mx-auto">
        {/* Top Bar: Title & Export Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-zinc-200">
              {modelUrl ? `Model Inspection [${modelId}]` : "Model Inspection"}
            </h2>
            <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5">
              360° Studio View
            </span>
          </div>

          {modelUrl && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRotate((prev) => !prev)}
                className={`border px-3 py-1 text-xs transition-colors cursor-pointer font-mono ${
                  autoRotate
                    ? "border-zinc-500 text-white bg-zinc-900"
                    : "border-[#27272a] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {autoRotate ? "Auto-Rotate [ON]" : "Auto-Rotate [OFF]"}
              </button>

              <button
                onClick={handleExport}
                className="bg-white text-black font-medium text-xs px-4 py-1.5 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Export .GLB ({modelSize > 0 ? (modelSize / (1024 * 1024)).toFixed(2) : "—"} MB)
              </button>
            </div>
          )}
        </div>

        {/* Workstation Grid: 3D Viewport + Shading & Opacity Control Sidebar */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main 3D Turntable Viewport (3 Cols on Large Screen) */}
          <div className="lg:col-span-3 border border-[#27272a] bg-[#050507] min-h-[540px] flex items-center justify-center relative overflow-hidden">
            {!isMounted ? (
              <div className="text-xs text-zinc-500 font-mono animate-pulse">
                INITIALIZING 3D ENGINE...
              </div>
            ) : loadError ? (
              <div className="text-center space-y-4 p-8">
                <div className="text-sm text-red-400 font-mono">{loadError}</div>
                <button
                  onClick={handleFallbackHero}
                  className="border border-[#27272a] hover:border-white px-4 py-2 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Load Sample Model →
                </button>
              </div>
            ) : modelUrl ? (
              <div className="w-full h-full min-h-[540px]">
                <ModelViewer
                  ref={viewerRef}
                  src={modelUrl}
                  alt="3D Model"
                  auto-rotate={autoRotate ? "true" : undefined}
                  camera-controls="true"
                  shadow-intensity="0.8"
                  shadow-softness="0.8"
                  environment-image="neutral"
                  exposure={exposure.toString()}
                  style={{ width: "100%", height: "100%", minHeight: "540px" }}
                />
              </div>
            ) : (
              <div className="text-center space-y-4 p-8">
                <div className="text-sm text-zinc-400">
                  No 3D model currently loaded.
                </div>
                <Link
                  href="/create"
                  className="inline-block border border-[#27272a] hover:border-white px-4 py-2 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  Create Model →
                </Link>
              </div>
            )}

            {/* Subtle Overlay Overlay Tags */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-zinc-600 bg-black/60 border border-zinc-800/80 px-2 py-0.5 pointer-events-none">
              OPACITY: {Math.round(opacity * 100)}% // SHADING: {selectedColor.name.toUpperCase()}
            </div>
          </div>

          {/* Shading & Material Control Panel (1 Col) */}
          <div className="border border-[#27272a] bg-[#09090b] p-5 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <span className="text-xs font-semibold text-zinc-200 tracking-wider uppercase font-mono">
                  Material & Shading
                </span>
                <button
                  onClick={handleResetShading}
                  className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* 1. Opacity Slider & Quick Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Opacity / Transparency</span>
                  <span className="text-zinc-400 font-mono text-[11px] font-semibold">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0.10"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer accent-white"
                />

                {/* Quick Opacity Presets */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 font-mono text-[10px]">
                  <button
                    onClick={() => setOpacity(0.35)}
                    className={`border py-1 px-1 text-center transition-colors cursor-pointer ${
                      opacity <= 0.4
                        ? "border-white text-white bg-zinc-800"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    X-Ray 35%
                  </button>
                  <button
                    onClick={() => setOpacity(0.75)}
                    className={`border py-1 px-1 text-center transition-colors cursor-pointer ${
                      opacity > 0.4 && opacity < 0.95
                        ? "border-white text-white bg-zinc-800"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Studio 75%
                  </button>
                  <button
                    onClick={() => setOpacity(1.0)}
                    className={`border py-1 px-1 text-center transition-colors cursor-pointer ${
                      opacity >= 0.95
                        ? "border-white text-white bg-zinc-800"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Solid 100%
                  </button>
                </div>
              </div>

              {/* 2. Color Tint Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Color Tone</span>
                  <span className="text-zinc-400 font-mono text-[11px]">{selectedColor.name}</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((color) => {
                    const isSelected = selectedColor.name === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        title={color.name}
                        className={`group flex flex-col items-center gap-1.5 p-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? "border-white bg-zinc-800/80"
                            : "border-zinc-800 hover:border-zinc-600 bg-black/40"
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[9px] font-mono text-zinc-400 group-hover:text-zinc-200">
                          {color.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Lighting Exposure */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Lighting Exposure</span>
                  <span className="text-zinc-400 font-mono text-[11px]">{exposure.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.3"
                  step="0.05"
                  value={exposure}
                  onChange={(e) => setExposure(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* 4. Surface Roughness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Surface Roughness</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {Math.round(roughness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={roughness}
                  onChange={(e) => setRoughness(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-none appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* 5. Google Generated / Enhanced Prompt */}
              {modelPrompt && (
                <div className="space-y-2 pt-3 border-t border-[#27272a]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Reconstruction Prompt</span>
                    <span className="text-[10px] font-mono text-zinc-500">Google Gemini</span>
                  </div>
                  <div className="text-xs text-zinc-300 bg-black/60 border border-zinc-800 p-3 leading-relaxed font-mono select-text italic">
                    &ldquo;{modelPrompt}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Details */}
            <div className="pt-4 border-t border-[#27272a] space-y-1.5 text-[10px] font-mono text-zinc-500">
              <div className="flex justify-between">
                <span>FORMAT</span>
                <span className="text-zinc-400">glTF 2.0 Binary (.GLB)</span>
              </div>
              <div className="flex justify-between">
                <span>SHADING</span>
                <span className="text-zinc-400">PBR Metallic/Roughness</span>
              </div>
              <div className="flex justify-between">
                <span>ALPHA MODE</span>
                <span className="text-zinc-400">{opacity < 1.0 ? "BLEND (Translucent)" : "OPAQUE"}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
