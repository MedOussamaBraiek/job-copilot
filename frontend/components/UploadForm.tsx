"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "./ui/input";
import { regenerateApplication, saveApplication } from "@/lib/api";
import { AnalysisResult } from "@/lib/types";
import { notifyError, notifySuccess } from "@/lib/notify";
import { ProgressStreamer } from "./ProgressStreamer";

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const UploadForm = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile || (!jobUrl && !jobDescription.trim())) return;
    setResults(null);
    setAnalyzing(true);
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
        company_name: results.company_name,
        hiring_email: results.hiring_email,
        cv_pdf_base64: cvFile ? await toBase64(cvFile) : null,
        job_posting: results.job_posting,
        gaps: results.gaps,
        strengths: results.strengths,
      });
      notifySuccess("Application saved", "Added to your history.");

      setResults(null);
      setCvFile(null);
      setJobUrl("");
      setJobDescription("");
      setCompanyName("");
    } catch (error) {
      notifyError("Could not save", "Please try again.");
    }
  };

  const handleStreamComplete = (result: AnalysisResult) => {
    setResults(result);
    setAnalyzing(false);
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
        <div>
          <label htmlFor="job-description" className="block text-sm font-medium mb-2">
            Job description (recommended)
          </label>
          <textarea
            id="job-description"
            rows={8}
            placeholder="Paste the full job description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
        <div>
          <label htmlFor="company-name" className="block text-sm font-medium mb-2">
            Company name
          </label>
          <Input
            id="company-name"
            placeholder="e.g. Workstream Technologies"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={analyzing || !cvFile || (!jobUrl && !jobDescription.trim())}
        >
          {analyzing ? "Analyzing..." : "Analyze"}
        </Button>
      </form>

      <ProgressStreamer
        show={analyzing}
        cvFile={cvFile}
        jobUrl={jobUrl}
        jobDescription={jobDescription}
        companyName={companyName}
        onFailed={() => setAnalyzing(false)}
        onComplete={handleStreamComplete}
      />

      {!analyzing && results && (
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

            {results.match_score < 50 ? (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <p className="text-sm font-semibold text-yellow-800">
                  Score Below 50%
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your match score is {results.match_score}/100. Cover letter
                  not generated due to low match.
                  <br />
                  Consider building skills in the gap areas below before
                  applying.
                </p>
              </div>
            ) : (
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
                    <ul className="space-y-3 text-sm text-gray-800">
                      {results.feedback?.split("\n").map((line, i) => {
                        const cleaned = line.replace(/^\d+\.\s*/, "");
                        const colonIndex = cleaned.indexOf(":");
                        const hasColon = colonIndex > -1 && colonIndex < 50;

                        return cleaned.trim() ? (
                          <li key={i} className="flex gap-2">
                            <span className="text-blue-600 min-w-fit">•</span>
                            <span>
                              {hasColon ? (
                                <>
                                  <span className="font-bold text-gray-900">
                                    {cleaned.substring(0, colonIndex)}
                                  </span>
                                  <span>{cleaned.substring(colonIndex)}</span>
                                </>
                              ) : (
                                cleaned
                              )}
                            </span>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {!analyzing && results && results.match_score >= 50 && (
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
          )}

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
