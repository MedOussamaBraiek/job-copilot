import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  CVPreview,
  EmailPreview,
  LandingKeyframes,
  MatchPreview,
  TrackPreview,
} from "@/components/landing/FeaturePreviews";

const features = [
  {
    title: "Match score",
    text: "See how well your CV fits a job, with gaps and strengths explained.",
    preview: <MatchPreview />,
  },
  {
    title: "Cover letter and email",
    text: "Get a tailored cover letter and draft email, with your real details.",
    preview: <EmailPreview />,
  },
  {
    title: "Tailored CV",
    text: "Rewrite your CV for the job as a clean one-page PDF, using only what you have.",
    preview: <CVPreview />,
  },
  {
    title: "Track and send",
    text: "Track every application and email the hiring manager with your documents attached.",
    preview: <TrackPreview />,
  },
];

export default function Landing() {
  return (
    <main className="container mx-auto p-4">
      <LandingKeyframes />

      <section className="flex flex-col items-center py-16 text-center">
        <h1 className="text-5xl font-bold text-black">Job Copilot</h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Your AI assistant for job applications. Upload your CV and a job description, and get a
          match score, a tailored cover letter, and a CV built for that role.
        </p>
        <div className="mt-8 flex gap-4">
          <Show when="signed-out">
            <Button render={<Link href="/sign-up" />} nativeButton={false} className="bg-black text-white hover:bg-gray-800">
              Get started
            </Button>
            <Button render={<Link href="/sign-in" />} nativeButton={false} variant="outline">
              Sign in
            </Button>
          </Show>
          <Show when="signed-in">
            <Button render={<Link href="/new" />} nativeButton={false} className="bg-black text-white hover:bg-gray-800">
              Get started
            </Button>
          </Show>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 pb-16 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex h-48 items-center justify-center rounded-lg bg-gray-50 p-4">
              {feature.preview}
            </div>
            <h2 className="font-semibold text-black">{feature.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{feature.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
