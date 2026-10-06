"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "./ui/input";
import { analyzeApplication, regenerateApplication } from "@/lib/api";
import { AnalysisResult } from "@/lib/types";

const UploadForm = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const [showFeedback, setShowFeedback] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cvFile || !jobUrl) {
      return;
    }

    setLoading(true);

    try {
      const analysisResults = await analyzeApplication(cvFile, jobUrl);

      setResults(analysisResults);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setShowFeedback(true);
  };

  const handleApprove = async () => {};

  const handleRegenerateWithFeedback = async () => {
    if (!userFeedback.trim() || !results || !cvFile || !jobUrl) return;

    setRegenerating(true);
    try {
      const updated = await regenerateApplication(
        results.cv_text,
        results.job_posting,
        results.cover_letter,
        results.draft_email,
        userFeedback,
      );
      setResults({ ...results, ...updated });
    } finally {
      setRegenerating(false);
      setUserFeedback("");
      setShowFeedback(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed p-4 rounded">
          <label htmlFor="cv-file" className="cursor-pointer">
            <p className="text-sm text-gray-600">Click to upload CV (PDF)</p>
          </label>
          <input
            id="cv-file"
            type="file"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          {cvFile && <p className="text-sm mt-2">Selected: {cvFile.name}</p>}
        </div>
        <div>
          <label htmlFor="job-url" className="block text-sm font-medium mb-2">
            Job URL
          </label>
          <Input
            id="job-url"
            type="url"
            placeholder="https://..."
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading || !cvFile || !jobUrl}>
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </form>
      {results && (
        <>
          <Card className="mt-8 p-6 space-y-4">
            <h2 className="text-2xl font-bold">Analysis Results</h2>

            <div>
              <p className="text-sm text-gray-600">Match Score</p>
              <p className="text-3xl font-bold">{results.match_score}/100</p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Gaps to Address:</p>
              <ul className="list-disc list-inside space-y-1">
                {results.gaps.map((gap, i) => (
                  <li key={i} className="text-sm">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Your Strengths:</p>
              <ul className="list-disc list-inside space-y-1">
                {results.strengths.map((strength, i) => (
                  <li key={i} className="text-sm">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Cover Letter:</p>
              <p className="text-sm whitespace-pre-wrap bg-gray-100 p-3 rounded">
                {results.cover_letter}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Draft Email:</p>
              <p className="text-sm whitespace-pre-wrap bg-gray-100 p-3 rounded">
                {results.draft_email}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">AI Feedback:</p>
              <p className="text-sm whitespace-pre-wrap bg-blue-50 p-3 rounded">
                {results.feedback}
              </p>
            </div>
          </Card>

          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => handleApprove()}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve & Save
            </Button>
            <Button onClick={handleReject} variant="outline">
              Reject & Improve
            </Button>
          </div>

          {showFeedback && (
            <div className="mt-4 space-y-2">
              <textarea
                placeholder="What would you like to improve?"
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
              />
              <Button
                onClick={handleRegenerateWithFeedback}
                disabled={regenerating || !userFeedback.trim()}
              >
                {regenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default UploadForm;
