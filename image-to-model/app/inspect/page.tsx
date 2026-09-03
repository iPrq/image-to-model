"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { getModelBlob } from "../lib/modelStorage";

// Google model-viewer element in React 19
const ModelViewer = "model-viewer" as unknown as React.ElementType;

export default function InspectPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelSize, setModelSize] = useState<number>(0);
  const [modelId, setModelId] = useState<string>("");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);

    async function loadModel() {
      const storedId = sessionStorage.getItem("active_model_id");
      const storedSize = sessionStorage.getItem("active_model_size");

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

      // Default to the provided hero-model.glb
      setModelUrl("/hero-model.glb");
      setModelSize(3773916);
      setModelId("HERO_SPEC");
    }

    loadModel();

    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col p-6 sm:p-10 pt-20 sm:pt-24 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272a]">
          <h2 className="text-sm font-medium text-zinc-300">
            {modelUrl ? `Model Inspection [${modelId}]` : "Model Inspection"}
          </h2>

          {modelUrl && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRotate((prev) => !prev)}
                className="border border-[#27272a] hover:border-zinc-400 px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {autoRotate ? "Auto-Rotate: On" : "Auto-Rotate: Off"}
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

        {/* 3D Turntable Viewport */}
        <div className="flex-1 border border-[#27272a] bg-[#050507] min-h-[520px] flex items-center justify-center relative">
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
            <div className="w-full h-full min-h-[520px]">
              <ModelViewer
                src={modelUrl}
                alt="3D Model"
                auto-rotate={autoRotate ? "true" : undefined}
                camera-controls="true"
                shadow-intensity="1.0"
                exposure="1.0"
                style={{ width: "100%", height: "100%", minHeight: "520px" }}
              ></ModelViewer>
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
        </div>
      </main>
    </div>
  );
}

