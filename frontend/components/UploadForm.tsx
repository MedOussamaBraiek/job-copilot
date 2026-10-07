"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "./ui/input";
import {
  analyzeApplication,
  regenerateApplication,
  saveApplication,
} from "@/lib/api";
import { AnalysisResult } from "@/lib/types";
import { toast } from "@/components/ui/toast";

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

  const handleApprove = async () => {
    if (!results) return;

    try {
      await saveApplication({
        cv_text: results.cv_text,
        company_url: jobUrl,
        match_score: results.match_score,
        cover_letter: results.cover_letter,
        draft_email: results.draft_email,
        feedback: results.feedback,
      });
      toast.add({
        type: "Success",
        description: "Application saved!",
      });

      setResults(null);
      setCvFile(null);
      setJobUrl("");
      alert("Application saved!");
    } catch (error) {
      alert("Error saving application");
    }
  };

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
          <Card className="mt-8 p-6 space-y-6">
            <h2 className="text-2xl font-bold">Analysis Results</h2>

            {/* Full width summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Match Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {results.match_score}/100
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Gaps to Address:</p>
                <ul className="list-disc list-inside space-y-1">
                  {results.gaps.map((gap, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Your Strengths:</p>
              <ul className="list-disc list-inside space-y-1">
                {results.strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <hr className="my-4" />

            {/* 3-column responsive layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cover Letter */}
              <div className="flex flex-col">
                <p className="text-sm font-semibold mb-2">Cover Letter</p>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded border max-h-96">
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {results.cover_letter}
                  </p>
                </div>
              </div>

              {/* Draft Email */}
              <div className="flex flex-col">
                <p className="text-sm font-semibold mb-2">Draft Email</p>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded border max-h-96">
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {results.draft_email}
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="flex flex-col">
                <p className="text-sm font-semibold mb-2">AI Feedback</p>
                <div className="flex-1 overflow-y-auto bg-blue-50 p-4 rounded border max-h-96">
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {results.feedback}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 mt-6 flex-wrap">
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
