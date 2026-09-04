"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import { getPendingJob, clearPendingJob } from "../lib/jobStore";
import { storeModelBlob } from "../lib/modelStorage";

const PIPELINE_STEPS = [
  { id: 1, label: "Subject Isolation" },
  { id: 2, label: "3D Depth Inference" },
  { id: 3, label: "Mesh Repair" },
  { id: 4, label: "GLB Packaging" },
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
      router.replace("/create");
      return;
    }

    setPreviewUrl(job.previewUrl);
    setPrompt(job.prompt);

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

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

    const endpoints = [
      "http://127.0.0.1:8000/generate",
      "http://localhost:8000/generate",
      "/api/backend/generate",
    ];

    let res: Response | null = null;
    let failureReason = "";

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          res = response;
          break;
        } else {
          try {
            const errData = await response.json();
            if (errData.detail) failureReason = errData.detail;
          } catch {
            const text = await response.text();
            if (text) failureReason = text.slice(0, 150);
          }
          if (!failureReason) failureReason = `HTTP ${response.status}`;
        }
      } catch (err) {
        failureReason = err instanceof Error ? err.message : "Connection failed";
      }
    }

    try {
      if (!res || !res.ok) {
        throw new Error(
          failureReason
            ? `Generation failed: ${failureReason}`
            : "Could not connect to backend. Ensure FastAPI server is running on port 8000."
        );
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const serverJobId = res.headers.get("X-Job-ID");
      const generatedId = serverJobId || Math.random().toString(36).substring(2, 8).toUpperCase();

      await storeModelBlob("latest_model", blob);

      sessionStorage.setItem("active_model_url", blobUrl);
      sessionStorage.setItem("active_model_size", blob.size.toString());
      sessionStorage.setItem("active_model_id", generatedId);

      clearPendingJob();
      setIsDone(true);
      setStatusText("Complete. Loading viewer...");

      setTimeout(() => {
        router.push("/inspect");
      }, 500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Pipeline error occurred.");
    }
  };

  const getCurrentStepIndex = () => {
    if (isDone) return 4;
    if (elapsed < 4) return 0;
    if (elapsed < 22) return 1;
    if (elapsed < 28) return 2;
    return 3;
  };

  const currentStepIdx = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <Header />

      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 pt-28 flex flex-col items-center justify-center text-center space-y-8">
        {/* Clean Source Image Viewport */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-[#27272a] bg-[#09090b] flex items-center justify-center p-6">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Source preview"
              className="max-h-full max-w-full object-contain select-none"
            />
          ) : (
            <div className="text-xs text-zinc-600">No Image</div>
          )}
        </div>

        {/* Title & Process Notice */}
        <div className="space-y-1.5 w-full max-w-sm">
          <h1 className="text-lg sm:text-xl font-medium text-white tracking-tight">
            {isDone ? "3D Model Ready" : "Generating 3D Model"}
          </h1>
          <p className="text-xs text-zinc-500">
            This process can take up to 30 seconds.
          </p>
        </div>

        {/* Minimal 4-Segment Progress Bar */}
        <div className="w-full max-w-sm space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {PIPELINE_STEPS.map((step, idx) => {
              const isFinished = isDone || currentStepIdx > idx;
              const isCurrent = !isDone && currentStepIdx === idx && !errorMessage;

              return (
                <div key={step.id} className="space-y-1.5 text-left">
                  <div className="h-0.5 w-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isFinished
                          ? "bg-white w-full"
                          : isCurrent
                          ? "bg-zinc-400 w-2/3"
                          : "bg-transparent w-0"
                      }`}
                    />
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isFinished
                        ? "text-zinc-300"
                        : isCurrent
                        ? "text-white font-medium"
                        : "text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quiet Status Line */}
          <div className="pt-2 text-xs text-zinc-400">
            {statusText}
          </div>
        </div>

        {/* Error Handling */}
        {errorMessage && (
          <div className="border border-red-900/40 bg-red-950/10 p-4 text-xs text-red-300 max-w-sm w-full space-y-3 text-left">
            <div>{errorMessage}</div>
            <Link
              href="/create"
              className="inline-block border border-red-800/40 text-red-200 hover:bg-red-900/20 px-3 py-1.5 text-xs transition-colors"
            >
              ← Return
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
