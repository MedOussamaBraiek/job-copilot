"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { AnalysisResult } from "@/lib/types";
import { notifyError } from "@/lib/notify";
import { API } from "@/lib/config";

interface ProgressStep {
  step: string;
}

export const ProgressStreamer = ({
  show,
  cvFile,
  jobUrl,
  jobDescription,
  companyName,
  onComplete,
  onFailed,
}: {
  show: boolean;
  cvFile?: File | null;
  jobUrl?: string;
  jobDescription?: string;
  companyName?: string;
  onComplete?: (result: AnalysisResult) => void;
  onFailed?: () => void;
}) => {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!show) startedRef.current = false;
  }, [show]);

  useEffect(() => {
    if (!show || !cvFile || (!jobUrl && !jobDescription) || startedRef.current) return;
    startedRef.current = true;

    setSteps([]);

    const streamAnalysis = async () => {
      const formData = new FormData();
      formData.append("file", cvFile);
      formData.append("job_url", jobUrl ?? "");
      formData.append("job_description", jobDescription ?? "");
      formData.append("company_name_input", companyName ?? "");

      try {
        const response = await fetch(
          `${API}/analyze`,
          {
            method: "POST",
            body: formData,
          },
        );

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.status === "in_progress") {
                  setSteps((prev) => [...prev, { step: data.step }]);
                } else if (data.status === "error") {
                  notifyError("Analysis failed", data.message);
                  onFailed?.();
                } else if (data.status === "complete") {
                  onComplete?.({
                    cv_text: data.cv_text,
                    job_posting: data.job_posting,
                    match_score: data.match_score,
                    gaps: data.gaps,
                    strengths: data.strengths,
                    cover_letter: data.cover_letter,
                    draft_email: data.draft_email,
                    feedback: data.feedback,
                    company_name: data.company_name,
                    hiring_email: data.hiring_email,
                  });
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      } catch (error) {
        notifyError("Analysis failed", "Could not reach the server.");
        onFailed?.();
      }
    };

    streamAnalysis();
  }, [show, cvFile, jobUrl, jobDescription, companyName, onComplete, onFailed]);

  if (!show) return null;

  return (
    <Card className="mt-8 p-6">
      <h2 className="text-xl font-bold mb-4">Analyzing...</h2>
      <div className="space-y-3">
        {steps.length === 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 animate-spin" />
            <span className="text-sm">Starting analysis...</span>
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500" />
              <span className="text-sm">{s.step}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
