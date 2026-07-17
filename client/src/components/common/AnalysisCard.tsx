import type { AnalysisResult } from "../../types/analysis";

type Props = {
  analysis: AnalysisResult;
};

export default function AnalysisCard({ analysis }: Props) {
  return (
    <div className="mt-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Website Analysis</h2>

      <div className="mt-3">
        <p>
          <strong>Score:</strong> {analysis.score}/100
        </p>

        <p>
          <strong>Priority:</strong> {analysis.priority}
        </p>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Issues</h3>

        {analysis.issues.length === 0 ? (
          <p className="text-green-600 mt-2">
            ✅ No issues found.
          </p>
        ) : (
          <ul className="mt-2 list-disc pl-5">
            {analysis.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}