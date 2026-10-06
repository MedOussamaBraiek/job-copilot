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

// update name with Oussama Braiek,
// phone with +216 92994247
// and email with oussemabraiek@gmail.com
