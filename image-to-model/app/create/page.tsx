"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

const PRESETS = [
  {
    id: "chair",
    title: "Minimal Chair",
    prompt: "Solid oak lounge chair with clean geometry",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f0f12"/><rect x="65" y="70" width="70" height="40" fill="none" stroke="%23fafafa" stroke-width="2"/><rect x="65" y="110" width="70" height="10" fill="%23fafafa"/><line x1="75" y1="120" x2="75" y2="160" stroke="%23fafafa" stroke-width="2"/><line x1="125" y1="120" x2="125" y2="160" stroke="%23fafafa" stroke-width="2"/></svg>`,
  },
  {
    id: "vessel",
    title: "Ceramic Vessel",
    prompt: "Fluted porcelain cylindrical vessel with smooth interior",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f0f12"/><ellipse cx="100" cy="70" rx="35" ry="12" fill="none" stroke="%23fafafa" stroke-width="2"/><path d="M65 70 v60 a35 12 0 0 0 70 0 v-60" fill="none" stroke="%23fafafa" stroke-width="2"/></svg>`,
  },
  {
    id: "enclosure",
    title: "Hardware Case",
    prompt: "Matte titanium hardware enclosure with beveled edges",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f0f12"/><polygon points="70,60 130,60 150,80 150,140 130,160 70,160 50,140 50,80" fill="none" stroke="%23fafafa" stroke-width="2"/><circle cx="100" cy="110" r="20" fill="none" stroke="%23fafafa" stroke-width="2"/></svg>`,
  },
];

export default function CreatePage() {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing) {
      setElapsed(0);
      timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = async (preset: (typeof PRESETS)[0]) => {
    setErrorMessage(null);
    setPrompt(preset.prompt);
    try {
      const res = await fetch(preset.svg);
      const blob = await res.blob();
      const file = new File([blob], `${preset.id}.svg`, { type: "image/svg+xml" });
      setSelectedFile(file);
      setPreviewUrl(preset.svg);
    } catch {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setErrorMessage("Please upload or select an image.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    if (prompt.trim()) {
      formData.append("prompt", prompt.trim());
    }

    try {
      let res: Response;
      try {
        res = await fetch("/api/backend/generate", {
          method: "POST",
          body: formData,
        });
      } catch {
        res = await fetch("http://localhost:8000/generate", {
          method: "POST",
          body: formData,
        });
      }

      if (!res.ok) {
        throw new Error("Generation request failed. Check server status.");
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Store model in session storage for Inspect page
      sessionStorage.setItem("active_model_url", blobUrl);
      sessionStorage.setItem("active_model_size", blob.size.toString());
      sessionStorage.setItem("active_model_id", Math.random().toString(36).substring(2, 8).toUpperCase());

      // Navigate to /inspect page
      router.push("/inspect");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 pt-24 sm:pt-28 flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Create 3D Asset
          </h1>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-[#27272a] min-h-[260px] flex flex-col items-center justify-center p-8 cursor-pointer transition-colors ${
            previewUrl ? "border-zinc-500 bg-zinc-950/60" : "hover:border-zinc-500 bg-zinc-950/30"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative max-h-56 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected input"
                className="max-h-52 object-contain"
              />
            </div>
          ) : (
            <div className="text-center space-y-2">
              <svg
                className="w-8 h-8 text-zinc-500 mx-auto stroke-[1.5]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <div className="text-sm text-zinc-400 font-medium">
                Drop image here or click to browse
              </div>
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className="border border-[#27272a] hover:border-zinc-500 p-3 text-left text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <div className="font-medium text-white">{preset.title}</div>
            </button>
          ))}
        </div>

        {/* Prompt Input */}
        <div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe geometry or surface details (optional)..."
            className="w-full bg-black border border-[#27272a] focus:border-zinc-400 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
          />
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="border border-red-900 bg-red-950/20 px-4 py-3 text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleGenerate}
          disabled={isProcessing || !selectedFile}
          className={`w-full py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            isProcessing || !selectedFile
              ? "bg-zinc-900 text-zinc-600 border border-[#27272a] cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {isProcessing ? (
            <span>Generating model ({elapsed}s)...</span>
          ) : (
            <span>Generate 3D Model →</span>
          )}
        </button>
      </main>
    </div>
  );
}
