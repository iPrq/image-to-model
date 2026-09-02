"use client";

import React, { useState, useEffect, useRef } from "react";

// Preset sample objects to let users test instantly
const PRESET_SAMPLES = [
  {
    id: "mug",
    title: "Ceramic Coffee Mug",
    prompt: "A glossy red ceramic coffee mug with a smooth handle and cylindrical interior",
    tag: "Household",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%2318181b"/><ellipse cx="95" cy="145" rx="55" ry="18" fill="%2327272a"/><path d="M55 75 h80 v55 a40 40 0 0 1 -80 0 z" fill="%23ef4444" stroke="%23b91c1c" stroke-width="4"/><ellipse cx="95" cy="75" rx="40" ry="12" fill="%23f87171"/><path d="M135 85 q25 0 25 22 q0 22 -25 22" fill="none" stroke="%23b91c1c" stroke-width="8" stroke-linecap="round"/><path d="M85 55 q-5 -12 0 -20 m18 20 q-5 -12 0 -20" stroke="%23a1a1aa" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "helmet",
    title: "Cyberpunk Helmet",
    prompt: "A futuristic dark titanium helmet with glowing cyan visor and geometric intake vents",
    tag: "Sci-Fi",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%2318181b"/><ellipse cx="100" cy="155" rx="60" ry="14" fill="%2327272a"/><path d="M55 95 c0 -35 20 -55 45 -55 s45 20 45 55 v35 c0 15 -15 25 -45 25 s-45 -10 -45 -25 z" fill="%233f3f46" stroke="%2352525b" stroke-width="3"/><path d="M65 95 q35 15 70 0 q-10 25 -35 25 q-25 0 -35 -25 z" fill="%2306b6d4" opacity="0.9"/><path d="M75 135 h50 v10 h-50 z" fill="%2318181b"/><circle cx="100" cy="103" r="3" fill="%23ecfeff"/></svg>`,
  },
  {
    id: "chair",
    title: "Minimalist Lounge Chair",
    prompt: "Modern Scandinavian oak lounge chair with olive green linen cushion and curved backrest",
    tag: "Furniture",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%2318181b"/><ellipse cx="100" cy="165" rx="60" ry="12" fill="%2327272a"/><path d="M65 80 q35 -20 70 0 v35 q-35 10 -70 0 z" fill="%2365a30d"/><rect x="60" y="115" width="80" height="15" rx="6" fill="%234d7c0f"/><path d="M68 130 l-10 32 m74 -32 l10 32 m-60 -32 l-5 30 m50 -30 l5 30" stroke="%23d97706" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: "camera",
    title: "Vintage Camera",
    prompt: "Classic retro 35mm rangefinder camera with chrome top plate, black leatherette body, and glass lens",
    tag: "Gadget",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%2318181b"/><rect x="45" y="70" width="110" height="70" rx="8" fill="%2327272a" stroke="%2371717a" stroke-width="3"/><rect x="45" y="62" width="110" height="14" rx="4" fill="%2394a3b8"/><circle cx="100" cy="105" r="26" fill="%230f172a" stroke="%23cbd5e1" stroke-width="4"/><circle cx="100" cy="105" r="16" fill="%231e293b"/><circle cx="95" cy="100" r="4" fill="%2338bdf8" opacity="0.8"/><rect x="60" y="54" width="14" height="8" rx="2" fill="%2394a3b8"/></svg>`,
  },
];

const SUGGESTIONS = [
  "Smooth ceramic finish",
  "Titanium metallic body",
  "Curved backrest geometry",
  "Matte leather texture",
  "Golden brass details",
  "High poly clean normals",
];

interface GeneratedModel {
  id: string;
  name: string;
  blobUrl: string;
  prompt: string;
  timestamp: string;
  sizeBytes: number;
}

// Custom element wrapper for Google model-viewer in React 19
const ModelViewer = "model-viewer" as unknown as React.ElementType;

export default function Home() {
  // Input state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Output 3D model
  const [activeModel, setActiveModel] = useState<GeneratedModel | null>(null);
  const [history, setHistory] = useState<GeneratedModel[]>([]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState<"connected" | "offline" | "checking">("checking");
  const [apiUrl, setApiUrl] = useState<string>("http://localhost:8000");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const checkBackendHealth = async () => {
    try {
      // First try proxy /api/backend/ then direct fallback
      const res = await fetch(`${apiUrl}/`, { method: "GET" }).catch(() =>
        fetch("/api/backend/", { method: "GET" })
      );
      if (res && res.ok) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  // Timer while generating
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Handle file selection
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Quick preset loader
  const loadPreset = async (preset: (typeof PRESET_SAMPLES)[0]) => {
    setErrorMsg(null);
    setPrompt(preset.prompt);
    // Convert SVG data URL to file
    try {
      const res = await fetch(preset.svg);
      const blob = await res.blob();
      const file = new File([blob], `${preset.id}.svg`, { type: "image/svg+xml" });
      setSelectedFile(file);
      setPreviewUrl(preset.svg);
    } catch (err) {
      console.error("Failed to load preset:", err);
    }
  };

  // Submit Generation
  const handleGenerate = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select or upload an image first.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setCurrentStep(1);

    const formData = new FormData();
    formData.append("image", selectedFile);
    if (prompt.trim()) {
      formData.append("prompt", prompt.trim());
    }

    // Step progression animation ticker
    const stepTicker = setInterval(() => {
      setCurrentStep((step) => (step < 4 ? step + 1 : step));
    }, 9000);

    try {
      // Try direct API url first, then fallback to Next rewrite
      let response: Response;
      try {
        response = await fetch(`${apiUrl}/generate`, {
          method: "POST",
          body: formData,
        });
      } catch {
        response = await fetch(`/api/backend/generate`, {
          method: "POST",
          body: formData,
        });
      }

      clearInterval(stepTicker);

      if (!response.ok) {
        let errText = "Failed to generate 3D model";
        try {
          const errData = await response.json();
          errText = errData.detail || errText;
        } catch {
          errText = await response.text();
        }
        throw new Error(errText);
      }

      setCurrentStep(4);
      const glbBlob = await response.blob();
      const blobUrl = URL.createObjectURL(glbBlob);

      const newModel: GeneratedModel = {
        id: Math.random().toString(36).substring(2, 9),
        name: prompt ? prompt.slice(0, 24) + "..." : selectedFile.name.replace(/\.[^/.]+$/, ""),
        blobUrl,
        prompt: prompt || "Generated from image",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sizeBytes: glbBlob.size,
      };

      setActiveModel(newModel);
      setHistory((prev) => [newModel, ...prev]);
      setBackendStatus("connected");
    } catch (err: unknown) {
      clearInterval(stepTicker);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      console.error(err);
      setErrorMsg(
        message.includes("fetch") || message.includes("Failed to fetch")
          ? `Could not connect to FastAPI server at ${apiUrl}. Make sure to run 'uvicorn main:app --reload' in the app directory!`
          : message
      );
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  // Download active GLB
  const handleDownload = () => {
    if (!activeModel) return;
    const a = document.createElement("a");
    a.href = activeModel.blobUrl;
    a.download = `${activeModel.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07080d] bg-grid-pattern text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07080d]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0d0f18] rounded-[11px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight gradient-text">DimensionAI</span>
              <span className="text-xs px-2 py-0.5 ml-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 font-mono">
                3D Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend connection badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "connected"
                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                    : backendStatus === "checking"
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                }`}
              />
              <span className="text-zinc-400">FastAPI:</span>
              <span
                className={
                  backendStatus === "connected"
                    ? "text-emerald-400"
                    : backendStatus === "checking"
                    ? "text-amber-400"
                    : "text-rose-400"
                }
              >
                {backendStatus === "connected" ? "Online" : backendStatus === "checking" ? "Checking..." : "Offline"}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">Hunyuan3D-2</span>
              <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">Gemini 1.5 VLM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Backend offline warning banner */}
      {backendStatus === "offline" && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs text-amber-200">
          Backend server not detected at <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-amber-300">{apiUrl}</code>.
          Make sure to run <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-amber-300">uvicorn main:app --reload --port 8000</code> in the <code className="font-mono text-white">app/</code> directory!
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input & Generation Settings */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1: Upload Card */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold font-mono">
                    1
                  </span>
                  <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">Input Image</h2>
                </div>
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[220px] ${
                  isDragging
                    ? "border-purple-400 bg-purple-500/10 scale-[0.99]"
                    : previewUrl
                    ? "border-purple-500/40 bg-black/40"
                    : "border-white/10 hover:border-purple-500/40 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="image/png,image/jpeg,image/webp,image/bmp"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-full h-56 flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Selected upload"
                      className="max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-xs">
                      <span className="text-xs font-medium text-white px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                        Click or drop to replace
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Drag & drop your image, or <span className="text-purple-400 underline decoration-purple-400/40">browse</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">PNG, JPG, or WEBP up to 25MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick sample presets */}
              <div className="mt-4">
                <div className="text-xs text-zinc-400 font-medium mb-2 flex items-center justify-between">
                  <span>Or test with a preset sample:</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_SAMPLES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPreset(preset);
                      }}
                      className="group relative flex flex-col items-center p-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.svg}
                        alt={preset.title}
                        className="w-10 h-10 object-contain rounded-lg mb-1 group-hover:scale-105 transition-transform"
                      />
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 line-clamp-1">
                        {preset.title.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Prompt Configuration */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">
                    2
                  </span>
                  <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
                    Description / Prompt <span className="text-zinc-500 lowercase font-normal">(optional)</span>
                  </h2>
                </div>
                <span className="text-[11px] text-cyan-400/90 flex items-center gap-1 font-mono">
                  ✨ Gemini Enhanced
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A glossy red ceramic mug with a smooth handle and cylindrical depth..."
                  className="w-full rounded-xl bg-black/40 border border-white/[0.08] focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 p-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all resize-none"
                />
              </div>

              {/* Suggestions chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-zinc-500">Quick style modifiers:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setPrompt((prev) => (prev ? `${prev}, ${sug}` : sug))}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedFile}
              className={`w-full py-4 px-6 rounded-xl font-medium text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2.5 ${
                isGenerating
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                  : !selectedFile
                  ? "bg-zinc-800/60 text-zinc-600 cursor-not-allowed border border-white/5"
                  : "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white hover:brightness-110 hover:shadow-purple-500/25 active:scale-[0.99]"
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Reconstructing 3D Mesh ({elapsedSeconds}s)...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate 3D Model</span>
                </>
              )}
            </button>

            {/* Active Pipeline Stepper */}
            {isGenerating && (
              <div className="glass-panel rounded-2xl p-5 border border-purple-500/30 animate-pulse">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
                  <span>PIPELINE PROGRESS</span>
                  <span className="text-purple-400 font-bold">{elapsedSeconds}s elapsed</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className={`flex items-center gap-2.5 ${currentStep >= 1 ? "text-emerald-400" : "text-zinc-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 1 ? "bg-emerald-400" : "bg-zinc-700"}`} />
                    <span>1. Background Removal & Centering (rembg)</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${currentStep >= 2 ? "text-cyan-400" : "text-zinc-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 2 ? "bg-cyan-400" : "bg-zinc-700"}`} />
                    <span>2. Gemini 1.5 Flash 3D Prompt Enhancement</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${currentStep >= 3 ? "text-purple-400" : "text-zinc-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 3 ? "bg-purple-400 animate-ping" : "bg-zinc-700"}`} />
                    <span>3. Hunyuan3D-2 Remote Diffusion & Synthesis</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${currentStep >= 4 ? "text-indigo-400" : "text-zinc-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 4 ? "bg-indigo-400" : "bg-zinc-700"}`} />
                    <span>4. Trimesh Mesh Repair & Decimation</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: 3D Model Viewport */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col min-h-[640px]">
              
              {/* Header inside viewport */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {activeModel ? activeModel.name : "3D Interactive Viewport"}
                  </h3>
                </div>

                {activeModel && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAutoRotate((prev) => !prev)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        autoRotate
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                          : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {autoRotate ? "Auto-Rotate ON" : "Auto-Rotate OFF"}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium hover:brightness-110 shadow-lg shadow-purple-500/20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download .GLB</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport Content */}
              <div className="relative flex-1 w-full rounded-xl bg-[#090b12] border border-white/[0.05] overflow-hidden flex items-center justify-center">
                {activeModel ? (
                  <div className="w-full h-full min-h-[480px] relative">
                    {/* Google <model-viewer> web component */}
                    <ModelViewer
                      src={activeModel.blobUrl}
                      alt={activeModel.name}
                      auto-rotate={autoRotate ? "true" : undefined}
                      camera-controls="true"
                      shadow-intensity="1.2"
                      exposure="1.0"
                      style={{ width: "100%", height: "100%", minHeight: "500px" }}
                    ></ModelViewer>

                    {/* Orbit instruction badge */}
                    <div className="absolute bottom-4 left-4 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-zinc-400 font-mono">
                      Left Click + Drag: Orbit | Scroll: Zoom | Right Click: Pan
                    </div>

                    {/* File info badge */}
                    <div className="absolute top-4 right-4 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-zinc-400 font-mono">
                      Format: GLB (Binary) • {(activeModel.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 animate-ping" />
                      <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-spin" />
                      <div className="w-full h-full rounded-2xl bg-purple-500/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">Reconstructing Geometry</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                        Diffusion inference running on Tencent Hunyuan3D-2 space. Generating 360° volume and surface normals...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-white/[0.08] flex items-center justify-center text-zinc-500">
                      <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-zinc-300">Ready for 3D Generation</h4>
                      <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                        Upload an object image or select a sample preset on the left, then click Generate to produce a 3D model.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Session History bar if any models exist */}
              {history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="text-xs text-zinc-400 font-medium mb-2 flex items-center justify-between">
                    <span>Generated in this session ({history.length}):</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveModel(item)}
                        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                          activeModel?.id === item.id
                            ? "bg-purple-500/20 border-purple-500/50 text-white"
                            : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="truncate max-w-[120px]">{item.name}</span>
                        <span className="text-[10px] text-zinc-500">{item.timestamp}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
