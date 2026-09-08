import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortalGateway } from './pages/PortalGateway';
import { TouristPortal } from './pages/TouristPortal';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { Checkpost } from './pages/Checkpost';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unified Role Gateway & Login */}
        <Route path="/" element={<PortalGateway />} />
        
        {/* Distinct Portals */}
        <Route path="/tourist" element={<TouristPortal />} />
        <Route path="/authority" element={<AuthorityDashboard />} />
        <Route path="/checkpost" element={<Checkpost />} />

        {/* Catch-all redirects to Gateway */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
