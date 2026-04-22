import { useState } from "react";
import { importLegacyFavorites } from "../services/legacyFavoritesAdapter.ts";

export function ImportPage() {
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const handleImport = () => {
    setError(null);
    setResult(null);
    try {
      const r = importLegacyFavorites(json);
      setResult(r);
      setJson("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse JSON");
    }
  };

  return (
    <div className="page import-page">
      <h2>Import Legacy Favorites</h2>

      <p>
        オリジナルの lgtmoon サイトの <code>localStorage["favorites"]</code>{" "}
        の内容を下のテキストエリアに貼り付けてインポートできます。
      </p>

      <div className="import-form">
        <textarea
          className="import-textarea"
          rows={10}
          placeholder={'[\n  { "url": "https://image.lgtmoon.dev/240374", "isConverted": true }\n]'}
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={json.trim().length === 0}
        >
          Import
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="import-result">
          <h3>Import Result</h3>
          <ul>
            <li>Imported: {result.imported}</li>
            <li>Skipped (duplicates): {result.skipped}</li>
            <li>Errors: {result.errors}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
