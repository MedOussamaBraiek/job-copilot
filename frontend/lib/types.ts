export interface AnalysisResult {
  cv_text: string;
  job_posting: string;
  match_score: number;
  gaps: string[];
  strengths: string[];
  cover_letter: string;
  draft_email: string;
  feedback: string | null;
  company_name: string | null;
  hiring_email: string | null;
}

export interface RegeneratedContent {
  cover_letter: string;
  draft_email: string;
}

export interface SaveApplicationRequest {
  cv_text: string;
  job_posting: string | null;
  gaps: string[] | null;
  strengths: string[] | null;
  company_url: string;
  company_name: string | null;
  hiring_email: string | null;
  cv_pdf_base64: string | null;
  match_score: number;
  cover_letter: string;
  draft_email: string;
  feedback: string | null;
}

export interface TailoredExperience {
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface TailoredEducation {
  degree: string;
  school: string;
  period: string;
}

export interface TailoredProject {
  name: string;
  description: string;
  tech: string[];
  link: string;
}

export interface TailoredCV {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: TailoredExperience[];
  education: TailoredEducation[];
  certificates: string[];
  languages: string[];
  projects: TailoredProject[];
}

export interface ApplicationResponse {
  id: number;
  cv_text: string;
  company_url: string;
  company_name: string | null;
  hiring_email: string | null;
  status: "pending" | "applied" | "emailed";
  tailored_cv: string | null;
  match_score: number;
  cover_letter: string;
  draft_email: string;
  feedback: string | null;
  created_at: string;
}
