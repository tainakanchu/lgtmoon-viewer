import { useRef, useState } from "react";
import {
  loadSettings,
  saveSettings,
  getDefaultSettings,
} from "../services/settingsStore.ts";
import { buildImageUrl } from "../services/imageUrlBuilder.ts";
import { canLoadImage } from "../services/imageProbe.ts";
import {
  applyBackup,
  backupFileName,
  buildBackup,
  parseBackup,
  serializeBackup,
  type ImportMode,
  type ImportResult,
} from "../services/backupService.ts";
import type { Settings } from "../types.ts";

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [testNumber, setTestNumber] = useState("1");
  const [testResult, setTestResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleReset = () => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
    saveSettings(defaults);
  };

  const handleTest = async () => {
    const n = Number(testNumber);
    if (Number.isNaN(n)) {
      setTestResult("Invalid number");
      return;
    }
    const url = buildImageUrl(n);
    setTestResult("Loading...");
    const ok = await canLoadImage(url);
    setTestResult(ok ? `OK: ${url}` : `Failed: ${url}`);
  };

  const handleExport = () => {
    const payload = buildBackup();
    const blob = new Blob([serializeBackup(payload)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const payload = parseBackup(text);

      if (
        importMode === "replace" &&
        !window.confirm(
          "Replace mode will overwrite all existing favorites, ignore ranges, and settings. Continue?",
        )
      ) {
        return;
      }

      const result = applyBackup(payload, importMode);
      setImportResult(result);

      if (result.settings.applied) {
        setSettings(loadSettings());
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to import backup",
      );
    }
  };

  return (
    <div className="page settings-page">
      <h2>Settings</h2>

      <div className="settings-form">
        <div className="form-group">
          <label htmlFor="minImageNumber">Min Image Number</label>
          <input
            id="minImageNumber"
            type="number"
            value={settings.minImageNumber}
            onChange={(e) =>
              setSettings({ ...settings, minImageNumber: Number(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxImageNumber">Max Image Number</label>
          <input
            id="maxImageNumber"
            type="number"
            value={settings.maxImageNumber}
            onChange={(e) =>
              setSettings({ ...settings, maxImageNumber: Number(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="retryLimit">Retry Limit</label>
          <input
            id="retryLimit"
            type="number"
            value={settings.retryLimit}
            onChange={(e) =>
              setSettings({ ...settings, retryLimit: Number(e.target.value) })
            }
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            {saved ? "Saved!" : "Save Settings"}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      </div>

      <section className="backup-section">
        <h3>Backup / Restore</h3>
        <p className="backup-description">
          Favorites, ignore ranges, and settings をまとめて JSON として
          エクスポート・インポートできます。
        </p>

        <div className="backup-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            Export to JSON
          </button>
        </div>

        <div className="backup-import">
          <div className="backup-mode">
            <label className="backup-mode-option">
              <input
                type="radio"
                name="import-mode"
                value="merge"
                checked={importMode === "merge"}
                onChange={() => setImportMode("merge")}
              />
              <span>
                <strong>Merge</strong> — 既存データに追加 (重複はスキップ、
                ignore range はマージ、settings は上書きなし)
              </span>
            </label>
            <label className="backup-mode-option">
              <input
                type="radio"
                name="import-mode"
                value="replace"
                checked={importMode === "replace"}
                onChange={() => setImportMode("replace")}
              />
              <span>
                <strong>Replace</strong> — 既存データをすべて置き換える
              </span>
            </label>
          </div>

          <div className="backup-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              className="btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Import from JSON…
            </button>
          </div>

          {importError && <div className="error-message">{importError}</div>}

          {importResult && (
            <div className="import-result">
              <h4>Import Result</h4>
              <ul>
                <li>
                  Favorites: added {importResult.favorites.added}
                  {importMode === "merge" &&
                    `, skipped ${importResult.favorites.skipped}`}
                </li>
                <li>
                  Ignore ranges: imported {importResult.ignoreRanges.added} (
                  {importResult.ignoreRanges.total} total after merge)
                </li>
                <li>
                  Settings: {importResult.settings.applied ? "replaced" : "kept"}
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="test-section">
        <h3>URL Preview Test</h3>
        <div className="test-controls">
          <input
            type="number"
            placeholder="Image number"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
          />
          <button className="btn" onClick={handleTest}>
            Test Load
          </button>
        </div>
        {testResult && <div className="test-result">{testResult}</div>}
        <div className="test-preview">
          <code>{buildImageUrl(Number(testNumber) || 0)}</code>
        </div>
      </section>
    </div>
  );
}
