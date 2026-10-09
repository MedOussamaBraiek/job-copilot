"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ApplicationResponse } from "@/lib/types";
import { API } from "@/lib/config";
import {
  ApplicationActions,
  CopyButton,
  DownloadPdfButton,
  CompanyNameEditor,
} from "@/components/ApplicationActions";

export default function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [app, setApp] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await fetch(
        `${API}/${id}`,
      );
      if (!response.ok) {
        setError(true);
        return;
      }
      const data = await response.json();
      console.log(data);
      setApp(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Application Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find this application.
          </p>
          <Link href="/history">
            <Button>← Back to Applications</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-full">
        {" "}
        <div className="mb-6">
          <Link href="/history">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
        </div>
        <Card className="p-8 space-y-8 shadow-lg">
          {/* Header */}
          <div className="border-b pb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <CompanyNameEditor app={app} onChange={setApp} />
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <a href={app.company_url} target="_blank" rel="noreferrer" />
                  }
                >
                  Open job posting
                </Button>
                <DownloadPdfButton
                  href={`${API}/${app.id}/cv.pdf`}
                  label="Download CV (PDF)"
                />
              </div>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <div>
                <span className="font-semibold text-green-600 text-lg">
                  {app.match_score}/100
                </span>{" "}
                Match
              </div>
              <div>
                {new Date(app.created_at).toLocaleDateString()} at{" "}
                {new Date(app.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Cover Letter</h2>
                <div className="flex gap-1">
                  <CopyButton text={app.cover_letter} label="Copy cover letter" />
                  <DownloadPdfButton
                    href={`${API}/${app.id}/cover-letter.pdf`}
                    label="Download cover letter (PDF)"
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap text-sm leading-relaxed flex-1 overflow-y-auto max-h-96">
                {app.cover_letter}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Draft Email</h2>
                <CopyButton text={app.draft_email} label="Copy draft email" />
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap text-sm leading-relaxed flex-1 overflow-y-auto max-h-96">
                {app.draft_email}
              </div>
            </div>

            {app.feedback && (
              <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  AI Feedback
                </h2>
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 flex-1 overflow-y-auto max-h-96">
                  <ul className="space-y-3 text-sm leading-relaxed">
                    {app.feedback.split("\n").map((line, i) => {
                      const cleaned = line
                        .replace(/^\d+\.\s*/, "")
                        .replace(/^\*\*/, "")
                        .replace(/\*\*:/, ":");

                      const colonIndex = cleaned.indexOf(":");
                      const hasColon = colonIndex > -1 && colonIndex < 50;

                      return cleaned.trim() ? (
                        <li key={i} className="flex gap-3">
                          <span className="text-blue-600 font-bold shrink-0">
                            •
                          </span>
                          <span className="text-gray-700">
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
            )}
          </div>
        </Card>

        <div className="mt-8">
          <ApplicationActions app={app} onChange={setApp} />
        </div>
      </div>
    </div>
  );
}
