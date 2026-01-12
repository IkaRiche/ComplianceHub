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
import { ThemeProvider } from './context/ThemeContext.js';
import { Layout } from './components/Layout.js';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Core App */}
            <Route path="/" element={<Layout><LandingPage /></Layout>} />
            <Route path="/validator" element={<ValidatorPage />} />

            {/* Trust Pages */}
            <Route path="/api-docs" element={<Layout><ApiDocs /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/security" element={<Layout><Security /></Layout>} />
            <Route path="/pricing" element={<Layout><Pricing /></Layout>} />

            {/* SEO Pages */}
            <Route path="/vida-validator" element={<Layout><VidaValidator /></Layout>} />
            <Route path="/en-16931-validation" element={<Layout><En16931Validation /></Layout>} />
            <Route path="/official-compliance-report" element={<Layout><OfficialReport /></Layout>} />
            <Route path="/faq" element={<Layout><Faq /></Layout>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider >
  );
}