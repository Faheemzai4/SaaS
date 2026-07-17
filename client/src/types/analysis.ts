export interface AnalysisResult {
  score: number;
  priority: "High" | "Medium" | "Low";
  issues: string[];
}