"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AnalysisResult } from "@/lib/types";

interface ProgressStep {
  step: string;
}

export const ProgressStreamer = ({
  show,
  cvFile,
  jobUrl,
  onComplete,
}: {
  show: boolean;
  cvFile?: File | null;
  jobUrl?: string;
  onComplete?: (result: AnalysisResult) => void;
}) => {
  const [steps, setSteps] = useState<ProgressStep[]>([]);

  useEffect(() => {
    if (!show || !cvFile || !jobUrl) return;

    setSteps([]);

    const streamAnalysis = async () => {
      const formData = new FormData();
      formData.append("file", cvFile);
      formData.append("job_url", jobUrl);

      try {
        const response = await fetch(
          "http://localhost:8000/api/applications/analyze",
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
                } else if (data.status === "complete") {
                  // Call parent with results
                  if (onComplete) {
                    onComplete({
                      cv_text: data.cv_text,
                      job_posting: data.job_posting,
                      match_score: data.match_score,
                      gaps: data.gaps,
                      strengths: data.strengths,
                      cover_letter: data.cover_letter,
                      draft_email: data.draft_email,
                      feedback: data.feedback,
                    });
                  }
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
      }
    };

    streamAnalysis();
  }, [show, cvFile, jobUrl, onComplete]);

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
