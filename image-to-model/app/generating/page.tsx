"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import { getPendingJob, clearPendingJob } from "../lib/jobStore";

const PIPELINE_STEPS = [
  { id: 1, label: "Subject Isolation & Alpha Normalization", threshold: 0 },
  { id: 2, label: "Volumetric 360° Inference (Hunyuan3D)", threshold: 4 },
  { id: 3, label: "Manifold Topology & Normal Validation", threshold: 22 },
  { id: 4, label: "Packaging Native GLB Binary", threshold: 28 },
];

export default function GeneratingPage() {
  const router = useRouter();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [elapsed, setElapsed] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>("Initializing pipeline...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    const job = getPendingJob();

    if (!job.file) {
      // If user directly opened /generating without uploading
      router.replace("/create");
      return;
    }

    setPreviewUrl(job.previewUrl);
    setPrompt(job.prompt);

    // Elapsed timer
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Execute the backend generation
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      executeGeneration(job.file, job.prompt);
    }

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeGeneration = async (file: File, userPrompt: string) => {
    setStatusText("Synthesizing geometry...");

    const formData = new FormData();
    formData.append("image", file);
    if (userPrompt.trim()) {
      formData.append("prompt", userPrompt.trim());
    }

    try {
      let res: Response;
      try {
        res = await fetch("/api/backend/generate", {
          method: "POST",
          body: formData,
        });
        if (!res.ok && res.status === 404) {
          res = await fetch("http://127.0.0.1:8000/generate", {
            method: "POST",
            body: formData,
          });
        }
      } catch {
        res = await fetch("http://127.0.0.1:8000/generate", {
          method: "POST",
          body: formData,
        });
      }

      if (!res.ok) {
        let detailMsg = `Generation failed (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.detail) detailMsg = errData.detail;
        } catch {
          const text = await res.text();
          if (text) detailMsg = text.slice(0, 150);
        }
        throw new Error(detailMsg);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Store model in session storage for Inspect page
      sessionStorage.setItem("active_model_url", blobUrl);
      sessionStorage.setItem("active_model_size", blob.size.toString());
      sessionStorage.setItem("active_model_id", generatedId);

      clearPendingJob();
      setIsDone(true);
      setStatusText("Reconstruction complete. Opening viewer...");

      // Short pause so user sees final completed state before redirecting
      setTimeout(() => {
        router.push("/inspect");
      }, 700);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Pipeline error occurred.");
    }
  };

  // Determine current active step based on elapsed time or completion
  const getCurrentStepIndex = () => {
    if (isDone) return 4;
    if (elapsed < 4) return 0;
    if (elapsed < 22) return 1;
    if (elapsed < 28) return 2;
    return 3;
  };

  const currentStepIdx = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 pt-24 sm:pt-28 flex flex-col justify-center">
        {/* Status Bar */}
        <div className="flex items-center justify-between pb-4 mb-8 border-b border-[#27272a] font-mono text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <span
              className={`w-2 h-2 ${
                errorMessage
                  ? "bg-red-500"
                  : isDone
                  ? "bg-emerald-400"
                  : "bg-white animate-pulse"
              }`}
            />
            <span className="tracking-wider uppercase">
              {errorMessage ? "PIPELINE HALTED" : isDone ? "COMPLETE" : "PROCESSING ACTIVE"}
            </span>
          </div>
          <div className="text-zinc-500 tracking-wider">
            ELAPSED: {elapsed}s
          </div>
        </div>

        {/* Workstation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-[#27272a] bg-[#050507] p-6 sm:p-10">
          {/* Left: Input Image Viewport with Precision Scanning Beam */}
          <div className="relative border border-[#27272a] bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Source preview"
                className="max-h-72 w-full object-contain p-4 opacity-90"
              />
            ) : (
              <div className="text-xs text-zinc-600 font-mono">NO IMAGE BUFFER</div>
            )}

            {/* Precision Laser Scanning Beam Effect */}
            {!isDone && !errorMessage && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="w-full h-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] absolute animate-scan-beam"
                  style={{
                    animation: "scanBeam 3s ease-in-out infinite alternate",
                  }}
                />
              </div>
            )}

            {/* Corner Metadata */}
            <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-600">
              SRC // BUFFER
            </div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-600">
              {isDone ? "STATUS // READY" : "SCAN // ACTIVE"}
            </div>
          </div>

          {/* Right: Live Pipeline Progression */}
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                {isDone ? "3D Mesh Ready" : "Reconstructing 3D Mesh"}
              </h1>
              {prompt && (
                <div className="text-xs text-zinc-400 mt-1 italic line-clamp-2">
                  &ldquo;{prompt}&rdquo;
                </div>
              )}
            </div>

            {/* Pipeline Stage Steps */}
            <div className="space-y-3.5 pt-2">
              {PIPELINE_STEPS.map((step, idx) => {
                const isStepFinished = isDone || currentStepIdx > idx;
                const isStepCurrent = !isDone && currentStepIdx === idx && !errorMessage;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 text-xs transition-opacity duration-300 ${
                      isStepFinished
                        ? "text-zinc-200"
                        : isStepCurrent
                        ? "text-white font-medium"
                        : "text-zinc-600"
                    }`}
                  >
                    {/* Step Status Icon */}
                    <div className="mt-0.5 font-mono text-[11px]">
                      {isStepFinished ? (
                        <span className="text-emerald-400 font-bold">[✓]</span>
                      ) : isStepCurrent ? (
                        <span className="text-white font-bold animate-pulse">[●]</span>
                      ) : (
                        <span>[ ]</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="flex-1">
                      <div>{step.label}</div>
                      {isStepCurrent && (
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          In progress...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message if any */}
            {errorMessage ? (
              <div className="border border-red-900/60 bg-red-950/30 p-4 text-xs text-red-300 space-y-3">
                <div>{errorMessage}</div>
                <Link
                  href="/create"
                  className="inline-block border border-red-800 text-red-200 hover:bg-red-900/40 px-3 py-1.5 transition-colors font-medium"
                >
                  ← Return to Editor
                </Link>
              </div>
            ) : (
              <div className="pt-2">
                <div className="h-1 w-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-700 ease-out"
                    style={{
                      width: isDone
                        ? "100%"
                        : `${Math.min(15 + elapsed * 2.8, 94)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2">
                  <span>{statusText}</span>
                  <span>{isDone ? "100%" : `${Math.floor(Math.min(15 + elapsed * 2.8, 94))}%`}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Keyframes for scanner beam */}
        <style jsx global>{`
          @keyframes scanBeam {
            0% {
              top: 4%;
            }
            100% {
              top: 96%;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
