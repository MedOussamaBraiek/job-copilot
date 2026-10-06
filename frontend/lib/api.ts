import { AnalysisResult, RegeneratedContent } from "./types";

export async function analyzeApplication(
  cvFile: File,
  jobUrl: string,
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", cvFile);
  formData.append("job_url", jobUrl);
  const response = await fetch(
    "http://localhost:8000/api/applications/analyze",
    {
      method: "POST",
      body: formData,
    },
  );
  return response.json();
}

export async function regenerateApplication(
  cv_text: string,
  job_posting: string,
  cover_letter: string,
  draft_email: string,
  user_feedback: string,
): Promise<RegeneratedContent> {
  const response = await fetch(
    "http://localhost:8000/api/applications/regenerate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cv_text,
        job_posting,
        cover_letter,
        draft_email,
        user_feedback,
      }),
    },
  );
  return response.json();
}
