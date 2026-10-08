import { ReactNode } from "react";
import { TailoredCV } from "@/lib/types";

export const parseTailoredCV = (raw: string | null): TailoredCV | null => {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<TailoredCV>;
    return {
      name: data.name ?? "",
      headline: data.headline ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      location: data.location ?? "",
      summary: data.summary ?? "",
      skills: data.skills ?? [],
      experience: (data.experience ?? []).map((exp) => ({
        title: exp.title ?? "",
        company: exp.company ?? "",
        period: exp.period ?? "",
        bullets: exp.bullets ?? [],
      })),
      education: data.education ?? [],
      certificates: data.certificates ?? [],
      languages: data.languages ?? [],
      projects: (data.projects ?? []).map((project) => ({
        name: project.name ?? "",
        description: project.description ?? "",
        tech: project.tech ?? [],
        link: project.link ?? "",
      })),
    };
  } catch {
    return null;
  }
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 mb-3">
      {title}
    </h4>
    {children}
  </section>
);

export const TailoredCVPreview = ({ cv }: { cv: TailoredCV }) => {
  const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  •  ");

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="h-1.5 bg-linear-to-r from-indigo-600 to-blue-500" />
      <div className="space-y-5 p-6 text-gray-800">
        <header>
          <h3 className="text-2xl font-bold text-indigo-900">{cv.name}</h3>
          {cv.headline && <p className="text-sm text-gray-500">{cv.headline}</p>}
          {contact && <p className="mt-1 text-xs text-gray-500">{contact}</p>}
        </header>

        {cv.summary && (
          <Section title="Profile">
            <p className="text-sm leading-relaxed">{cv.summary}</p>
          </Section>
        )}

        {cv.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((skill, i) => (
                <span
                  key={i}
                  className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {cv.experience.length > 0 && (
          <Section title="Experience">
            <div className="space-y-4">
              {cv.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      {exp.title}{" "}
                      <span className="font-normal text-gray-500">— {exp.company}</span>
                    </p>
                    <p className="text-xs text-gray-500">{exp.period}</p>
                  </div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {cv.projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-3">
              {cv.projects.map((project, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{project.name}</p>
                    {project.link && (
                      <p className="max-w-xs truncate text-xs text-indigo-600">{project.link}</p>
                    )}
                  </div>
                  {project.description && <p className="text-sm">{project.description}</p>}
                  {project.tech.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">{project.tech.join("  •  ")}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {cv.education.length > 0 && (
          <Section title="Education">
            <div className="space-y-2 text-sm">
              {cv.education.map((edu, i) => (
                <div key={i} className="flex flex-wrap justify-between gap-2">
                  <p>
                    <span className="font-semibold">{edu.degree}</span>
                    <span className="text-gray-500"> — {edu.school}</span>
                  </p>
                  <p className="text-xs text-gray-500">{edu.period}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {cv.certificates.length > 0 && (
          <Section title="Certificates">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {cv.certificates.map((cert, i) => (
                <li key={i}>{cert}</li>
              ))}
            </ul>
          </Section>
        )}

        {cv.languages.length > 0 && (
          <Section title="Languages">
            <p className="text-sm">{cv.languages.join("  •  ")}</p>
          </Section>
        )}
      </div>
    </div>
  );
};
