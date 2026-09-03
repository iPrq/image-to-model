"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";

// Google model-viewer element in React 19
const ModelViewer = "model-viewer" as unknown as React.ElementType;

export default function InspectPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelSize, setModelSize] = useState<number>(0);
  const [modelId, setModelId] = useState<string>("");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  useEffect(() => {
    // Load model from session storage
    const storedUrl = sessionStorage.getItem("active_model_url");
    const storedSize = sessionStorage.getItem("active_model_size");
    const storedId = sessionStorage.getItem("active_model_id");

    if (storedUrl) {
      setModelUrl(storedUrl);
    }
    if (storedSize) {
      setModelSize(parseInt(storedSize, 10));
    }
    if (storedId) {
      setModelId(storedId);
    }
  }, []);

  const handleExport = () => {
    if (!modelUrl) return;
    const a = document.createElement("a");
    a.href = modelUrl;
    a.download = `model_${modelId || "asset"}.glb`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col p-6 sm:p-10 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272a]">
          <h2 className="text-sm font-medium text-zinc-300">
            {modelUrl ? `Model Inspection [${modelId}]` : "Model Inspection"}
          </h2>

          {modelUrl && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRotate((prev) => !prev)}
                className="border border-[#27272a] hover:border-zinc-400 px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {autoRotate ? "Auto-Rotate: On" : "Auto-Rotate: Off"}
              </button>

              <button
                onClick={handleExport}
                className="bg-white text-black font-medium text-xs px-4 py-1.5 hover:bg-zinc-200 transition-colors"
              >
                Export .GLB ({(modelSize / (1024 * 1024)).toFixed(2)} MB)
              </button>
            </div>
          )}
        </div>

        {/* 3D Turntable Viewport */}
        <div className="flex-1 border border-[#27272a] bg-[#050507] min-h-[520px] flex items-center justify-center relative">
          {modelUrl ? (
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
                href="/"
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
