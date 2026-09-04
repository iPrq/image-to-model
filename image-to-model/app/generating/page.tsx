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
      const rawPromptHeader = res.headers.get("X-Enhanced-Prompt");
      let enhancedPrompt = "";
      if (rawPromptHeader) {
        try {
          enhancedPrompt = decodeURIComponent(rawPromptHeader);
        } catch {
          enhancedPrompt = rawPromptHeader;
        }
        if (enhancedPrompt.includes("'text':") || enhancedPrompt.includes('"text":')) {
          const match = enhancedPrompt.match(/['"]text['"]\s*:\s*['"]([\s\S]*?)(?:['"],\s*['"]extras|['"]\s*\}|['"]\s*\]|['"]$)/);
          if (match && match[1]) {
            enhancedPrompt = match[1].replace(/\\n/g, " ").trim();
          }
        }
        enhancedPrompt = enhancedPrompt.replace(/^["'\[\{]+|["'\]\}]+$/g, "").trim();
      }
      const generatedId = serverJobId || Math.random().toString(36).substring(2, 8).toUpperCase();

      await storeModelBlob("latest_model", blob);

      sessionStorage.setItem("active_model_url", blobUrl);
      sessionStorage.setItem("active_model_size", blob.size.toString());
      sessionStorage.setItem("active_model_id", generatedId);
      if (enhancedPrompt) {
        sessionStorage.setItem("active_model_prompt", enhancedPrompt);
      }

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

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 pt-24 sm:pt-28 flex flex-col items-center justify-center text-center space-y-8">
        {/* Enlarged & Slightly Rounded Image Viewport Box */}
        <div className="relative w-full max-w-md sm:max-w-lg aspect-[4/3] sm:min-h-[340px] rounded-2xl border border-[#27272a] bg-[#09090b] flex items-center justify-center p-6 sm:p-8 overflow-hidden shadow-2xl">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Source preview"
              className="max-h-full max-w-full object-contain rounded-xl select-none"
            />
          ) : (
            <div className="text-xs text-zinc-600">No Image</div>
          )}
        </div>

        {/* Title & Process Notice */}
        <div className="space-y-2 w-full max-w-md sm:max-w-lg">
          <h1 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
            {isDone ? "3D Model Ready" : "Generating 3D Model"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            This process can take up to 30 seconds.
          </p>
        </div>

        {/* Slightly Rounded 4-Segment Progress Bar */}
        <div className="w-full max-w-md sm:max-w-lg space-y-4">
          <div className="grid grid-cols-4 gap-2.5">
            {PIPELINE_STEPS.map((step, idx) => {
              const isFinished = isDone || currentStepIdx > idx;
              const isCurrent = !isDone && currentStepIdx === idx && !errorMessage;

              return (
                <div key={step.id} className="space-y-2 text-left">
                  {/* Rounded Segment Track */}
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished
                          ? "bg-white w-full"
                          : isCurrent
                          ? "bg-zinc-300 w-3/4"
                          : "bg-transparent w-0"
                      }`}
                    />
                  </div>
                  <div
                    className={`text-[11px] sm:text-xs truncate transition-colors ${
                      isFinished
                        ? "text-zinc-300 font-medium"
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

          {/* Clean Status Line */}
          <div className="pt-2 text-xs sm:text-sm text-zinc-400 font-mono">
            {statusText}
          </div>
        </div>

        {/* Error Handling */}
        {errorMessage && (
          <div className="border border-red-900/40 bg-red-950/10 rounded-xl p-4 text-xs sm:text-sm text-red-300 max-w-md sm:max-w-lg w-full space-y-3 text-left">
            <div>{errorMessage}</div>
            <Link
              href="/create"
              className="inline-block border border-red-800/40 text-red-200 hover:bg-red-900/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              ← Return
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
