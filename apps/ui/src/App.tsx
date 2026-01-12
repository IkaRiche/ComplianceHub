import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LandingPage } from './pages/LandingPage.js';
import { ValidatorPage } from './pages/ValidatorPage.js';
import { ApiDocs } from './pages/ApiDocs.js';
import { Privacy } from './pages/Privacy.js';
import { Terms } from './pages/Terms.js';
import { Security } from './pages/Security.js';
import { Pricing } from './pages/Pricing.js';
import { VidaValidator } from './pages/VidaValidator.js';
import { En16931Validation } from './pages/En16931Validation.js';
import { OfficialReport } from './pages/OfficialReport.js';
import { Faq } from './pages/Faq.js';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          {/* Core App */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/validator" element={<ValidatorPage />} />

          {/* Trust Pages */}
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* SEO Pages */}
          <Route path="/vida-validator" element={<VidaValidator />} />
          <Route path="/en-16931-validation" element={<En16931Validation />} />
          <Route path="/official-compliance-report" element={<OfficialReport />} />
          <Route path="/faq" element={<Faq />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}