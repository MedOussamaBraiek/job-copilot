export interface AnalysisResult {
  cv_text: string;
  job_posting: string;
  match_score: number;
  gaps: string[];
  strengths: string[];
  cover_letter: string;
  draft_email: string;
  feedback: string | null;
}

export interface RegeneratedContent {
  cover_letter: string;
  draft_email: string;
}

export interface SaveApplicationRequest {
  cv_text: string;
  company_url: string;
  match_score: number;
  cover_letter: string;
  draft_email: string;
  feedback: string | null;
}

export interface ApplicationResponse {
  id: number;
  cv_text: string;
  company_url: string;
  match_score: number;
  cover_letter: string;
  draft_email: string;
  feedback: string | null;
  created_at: string;
}
