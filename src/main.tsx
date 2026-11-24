import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDurableStorage } from "./services/durableStorage.ts";

async function bootstrap() {
  try {
    await initDurableStorage();
  } catch (err) {
    console.error("[bootstrap] durable storage init failed", err);
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
