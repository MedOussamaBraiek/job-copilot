"use client";

import { useState } from "react";
import { Check, Copy, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationResponse } from "@/lib/types";
import { notifyError, notifySuccess } from "@/lib/notify";
import { parseTailoredCV, TailoredCVPreview } from "@/components/TailoredCVPreview";

export const API = "http://localhost:8000/api/applications";

const STATUSES = ["pending", "applied", "emailed"] as const;

export const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={copy}>
      {copied ? (
        <Check className="size-4 text-green-600" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
};

export const DownloadPdfButton = ({
  href,
  label,
}: {
  href: string;
  label: string;
}) => (
  <Button
    variant="ghost"
    size="icon"
    aria-label={label}
    title={label}
    nativeButton={false}
    render={<a href={href} download />}
  >
    <Download className="size-4" />
  </Button>
);

export const CompanyNameEditor = ({
  app,
  onChange,
}: {
  app: ApplicationResponse;
  onChange: (app: ApplicationResponse) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(app.company_name ?? "");

  const save = async () => {
    const res = await fetch(`${API}/${app.id}/company`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: value }),
    });
    if (res.ok) {
      onChange({ ...app, company_name: value.trim() || null });
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-4xl font-bold text-gray-900 wrap-break-word">
          {app.company_name || "Unknown company"}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit company name"
          title="Edit company name"
          onClick={() => {
            setValue(app.company_name ?? "");
            setEditing(true);
          }}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        className="border rounded p-2 text-2xl"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      <Button size="sm" onClick={save}>
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  );
};

export const ApplicationActions = ({
  app,
  onChange,
}: {
  app: ApplicationResponse;
  onChange: (app: ApplicationResponse) => void;
}) => {
  const [email, setEmail] = useState(app.hiring_email ?? "");
  const [cvSource, setCvSource] = useState<"saved" | "tailored">("saved");
  const [sending, setSending] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const tailored = parseTailoredCV(app.tailored_cv);

  const tailorCv = async () => {
    setTailoring(true);
    try {
      const res = await fetch(`${API}/${app.id}/tailor-cv`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "" }));
        notifyError("Could not tailor CV", err.detail || "Try again in a minute.");
        return;
      }
      const data = await res.json();
      onChange({ ...app, tailored_cv: JSON.stringify(data.tailored_cv) });
      notifySuccess("Tailored CV ready", "Review it below before sending.");
    } finally {
      setTailoring(false);
    }
  };

  const sendEmail = async () => {
    setSending(true);
    try {
      const form = new FormData();
      form.append("hiring_manager_email", email);
      form.append("cv_source", cvSource);

      const res = await fetch(`${API}/${app.id}/send-email`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      onChange({ ...app, status: "emailed" });
      notifySuccess("Email sent", `Sent to ${email}`);
    } catch {
      notifyError("Email not sent", "Check the address and try again.");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: ApplicationResponse["status"]) => {
    const res = await fetch(`${API}/${app.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onChange({ ...app, status });
      notifySuccess("Status updated", `Now ${status}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm mr-2">Status:</span>
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={app.status === s ? "default" : "outline"}
            onClick={() => changeStatus(s)}
            disabled={app.status === s}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Tailored CV</p>
          {tailored && (
            <DownloadPdfButton
              href={`${API}/${app.id}/tailored-cv.pdf`}
              label="Download tailored CV (PDF)"
            />
          )}
        </div>

        {tailored ? (
          <TailoredCVPreview cv={tailored} />
        ) : (
          <p className="text-sm text-gray-600">
            Not generated yet. The AI rewrites your saved CV for this job, using only what is already in it.
          </p>
        )}

        <Button variant="outline" size="sm" onClick={tailorCv} disabled={tailoring}>
          {tailoring
            ? "Tailoring..."
            : tailored
              ? "Regenerate tailored CV"
              : "Generate tailored CV"}
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Send application</p>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="cv-source"
              checked={cvSource === "saved"}
              onChange={() => setCvSource("saved")}
            />
            Saved CV
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="cv-source"
              checked={cvSource === "tailored"}
              disabled={!tailored}
              onChange={() => setCvSource("tailored")}
            />
            Tailored CV{!tailored && " (generate it first)"}
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            className="border rounded p-2 text-sm flex-1 min-w-64"
            placeholder="Hiring manager email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={sendEmail}
            disabled={sending || !email || (cvSource === "tailored" && !tailored)}
          >
            {sending ? "Sending..." : "Send email"}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          The drafted email is the body. The cover letter is attached as PDF.
        </p>
      </div>
    </div>
  );
};
