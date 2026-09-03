// In-memory client job store for seamless SPA route transitions
interface PendingJob {
  file: File | null;
  prompt: string;
  previewUrl: string | null;
}

let pendingJob: PendingJob = {
  file: null,
  prompt: "",
  previewUrl: null,
};

export const setPendingJob = (file: File, prompt: string, previewUrl: string) => {
  pendingJob = { file, prompt, previewUrl };
};

export const getPendingJob = (): PendingJob => {
  return pendingJob;
};

export const clearPendingJob = () => {
  pendingJob = { file: null, prompt: "", previewUrl: null };
};
