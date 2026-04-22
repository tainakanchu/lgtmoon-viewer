import { useState } from "react";
import {
  loadSettings,
  saveSettings,
  getDefaultSettings,
} from "../services/settingsStore.ts";
import { buildImageUrl } from "../services/imageUrlBuilder.ts";
import { canLoadImage } from "../services/imageProbe.ts";
import type { Settings } from "../types.ts";

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [testNumber, setTestNumber] = useState("1");
  const [testResult, setTestResult] = useState<string | null>(null);

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
