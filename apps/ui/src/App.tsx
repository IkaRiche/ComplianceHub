import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import { EcosystemShell } from './components/EcosystemShell.js';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Core Tool - Root is now the Validator */}
            <Route path="/" element={
              <EcosystemShell productName="ViDA UBL Validator">
                <ValidatorPage />
              </EcosystemShell>
            } />

            {/* Legacy/Direct Route */}
            <Route path="/validator" element={<Navigate to="/" replace />} />

            {/* Info Pages - Wrapped in Shell */}
            <Route path="/api-docs" element={<EcosystemShell productName="ViDA UBL Validator"><ApiDocs /></EcosystemShell>} />
            <Route path="/pricing" element={<EcosystemShell productName="ViDA UBL Validator"><Pricing /></EcosystemShell>} />

            {/* Legal - Wrapped in Shell */}
            <Route path="/privacy" element={<EcosystemShell productName="ViDA UBL Validator"><Privacy /></EcosystemShell>} />
            <Route path="/terms" element={<EcosystemShell productName="ViDA UBL Validator"><Terms /></EcosystemShell>} />
            <Route path="/security" element={<EcosystemShell productName="ViDA UBL Validator"><Security /></EcosystemShell>} />

            {/* SEO Pages - Wrapped in Shell (Should be noindex'd via headers) */}
            <Route path="/vida-validator" element={<EcosystemShell productName="ViDA UBL Validator"><VidaValidator /></EcosystemShell>} />
            <Route path="/en-16931-validation" element={<EcosystemShell productName="ViDA UBL Validator"><En16931Validation /></EcosystemShell>} />
            <Route path="/official-compliance-report" element={<EcosystemShell productName="ViDA UBL Validator"><OfficialReport /></EcosystemShell>} />
            <Route path="/faq" element={<EcosystemShell productName="ViDA UBL Validator"><Faq /></EcosystemShell>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider >
  );
}