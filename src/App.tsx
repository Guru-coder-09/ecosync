import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortalGateway } from './pages/PortalGateway';
import { TouristPortal } from './pages/TouristPortal';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { Checkpost } from './pages/Checkpost';
import { ZoneSelector } from './pages/ZoneSelector';
import { PermitApply } from './pages/PermitApply';
import { PassView } from './pages/PassView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unified Role Gateway & Login */}
        <Route path="/" element={<PortalGateway />} />

        {/* New TN ePass-style tourist pathway */}
        <Route path="/tourist/zones" element={<ZoneSelector />} />
        <Route path="/tourist/apply" element={<PermitApply />} />
        <Route path="/tourist/pass" element={<PassView />} />

        {/* Legacy full tourist portal (live capacity map) */}
        <Route path="/tourist" element={<TouristPortal />} />

        {/* Staff portals — unchanged */}
        <Route path="/authority" element={<AuthorityDashboard />} />
        <Route path="/checkpost" element={<Checkpost />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
