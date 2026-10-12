export const LandingKeyframes = () => (
  <style>{`
    @keyframes fill-bar { from { width: 0; } to { width: 78%; } }
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: none; }
    }
    @keyframes pill-cycle {
      0%, 100% { background: #ffffff; color: #000000; }
      10%, 33% { background: #000000; color: #ffffff; }
      40%, 99% { background: #ffffff; color: #000000; }
    }
  `}</style>
);

export const MatchPreview = () => (
  <div className="w-full space-y-3 text-left">
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-gray-500">Match score</span>
      <span className="text-2xl font-bold text-black">
        78<span className="text-sm text-gray-400">/100</span>
      </span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div className="h-full rounded-full bg-black" style={{ animation: "fill-bar 1.4s ease-out forwards" }} />
    </div>
    <ul className="space-y-1 text-xs text-gray-600">
      <li>+ FastAPI, React, PostgreSQL</li>
      <li>− Kubernetes (gap to close)</li>
    </ul>
  </div>
);

export const EmailPreview = () => (
  <div className="w-full space-y-2 rounded-lg border border-gray-200 p-3 text-left text-xs text-gray-600">
    <p className="font-semibold text-black" style={{ animation: "fade-in-up 0.5s ease-out both" }}>
      Subject: Application for Backend Engineer
    </p>
    <p style={{ animation: "fade-in-up 0.5s ease-out 0.4s both" }}>Dear Hiring Team,</p>
    <p style={{ animation: "fade-in-up 0.5s ease-out 0.8s both" }}>
      I would love to bring my FastAPI and data experience to your team.
    </p>
    <p style={{ animation: "fade-in-up 0.5s ease-out 1.2s both" }}>Best regards, Alex Morgan</p>
  </div>
);

export const CVPreview = () => (
  <div className="mx-auto w-44 rounded border border-gray-200 bg-white p-3 text-left shadow-sm">
    <div className="h-2.5 w-28 rounded bg-black" />
    <div className="mt-1.5 h-1.5 w-20 rounded bg-gray-300" />
    <div className="mt-2 h-px bg-gray-300" />
    <div className="mt-2 flex flex-wrap gap-1">
      {["Python", "FastAPI", "React", "SQL"].map((skill) => (
        <span key={skill} className="rounded-full border border-gray-400 px-1.5 text-[8px] text-gray-700">
          {skill}
        </span>
      ))}
    </div>
    <div className="mt-2 h-px bg-gray-300" />
    <div className="mt-2 h-1.5 w-24 rounded bg-gray-700" />
    <div className="mt-1.5 h-1 w-full rounded bg-gray-200" />
    <div className="mt-1 h-1 w-11/12 rounded bg-gray-200" />
    <div className="mt-1 h-1 w-10/12 rounded bg-gray-200" />
    <div className="mt-2 h-1.5 w-20 rounded bg-gray-700" />
    <div className="mt-1.5 h-1 w-full rounded bg-gray-200" />
    <div className="mt-1 h-1 w-9/12 rounded bg-gray-200" />
  </div>
);

const stages = ["pending", "applied", "emailed"];

export const TrackPreview = () => (
  <div className="flex items-center justify-center gap-2">
    {stages.map((stage, index) => (
      <span
        key={stage}
        className="rounded-full border border-black px-3 py-1 text-xs capitalize"
        style={{ animation: `pill-cycle 6s ${index * 2}s infinite` }}
      >
        {stage}
      </span>
    ))}
  </div>
);
