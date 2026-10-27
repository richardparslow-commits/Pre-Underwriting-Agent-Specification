import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteChrome";
import LandingPage from "@/pages/LandingPage";
import IntakePage from "@/pages/IntakePage";
import PrivacyPage from "@/pages/PrivacyPage";
import PortalPage from "@/pages/PortalPage";
import PortalCasePage from "@/pages/PortalCasePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="start" element={<IntakePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="portal" element={<PortalPage />} />
          <Route path="portal/:reference" element={<PortalCasePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
