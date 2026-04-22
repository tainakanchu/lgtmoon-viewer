import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout.tsx";
import { RandomPage } from "./pages/RandomPage.tsx";
import { FavoritesPage } from "./pages/FavoritesPage.tsx";
import { IgnoreRangesPage } from "./pages/IgnoreRangesPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { ImportPage } from "./pages/ImportPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RandomPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/ignore-ranges" element={<IgnoreRangesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/import" element={<ImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
