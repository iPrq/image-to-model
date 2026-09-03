"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { setPendingJob } from "../lib/jobStore";

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

  const handleGenerate = () => {
    if (!selectedFile) {
      setErrorMessage("Please upload or select an image.");
      return;
    }
    setErrorMessage(null);
    setPendingJob(selectedFile, prompt.trim(), previewUrl || "");
    router.push("/generating");
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
          disabled={!selectedFile}
          className={`w-full py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            !selectedFile
              ? "bg-zinc-900 text-zinc-600 border border-[#27272a] cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200 cursor-pointer active:scale-[0.99]"
          }`}
        >
          <span>Generate 3D Model →</span>
        </button>
      </main>
    </div>
  );
}
