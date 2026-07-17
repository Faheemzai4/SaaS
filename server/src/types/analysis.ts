export interface AnalysisResult {
  score: number;
  priority: "High" | "Medium" | "Low";
  issues: string[];
  summary: string;
  businessOpportunity: string;
  estimatedImpact: "High" | "Medium" | "Low";
}