import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CitizenLayout } from './layouts/CitizenLayout';
import { GovernmentLayout } from './layouts/GovernmentLayout';

// Universal & Authentication Views
import { UniversalLoginGateway } from './components/common/UniversalLoginGateway';
import { CitizenLogin } from './citizen/login/CitizenLogin';
import { CitizenRegister } from './citizen/register/CitizenRegister';
import { GovernmentLogin } from './government/login/GovernmentLogin';
import { AdminLogin } from './government/login/AdminLogin';

// Citizen Views
import { CitizenHome } from './citizen/home/CitizenHome';
import { CitizenVoice } from './citizen/voice/CitizenVoice';
import { CitizenMap } from './citizen/map/CitizenMap';
import { CitizenReports } from './citizen/reports/CitizenReports';
import { CitizenReportDetail } from './citizen/reports/CitizenReportDetail';
import { CitizenProfile } from './citizen/profile/CitizenProfile';

// Government & Admin Views
import { GovernmentDashboard } from './government/dashboard/GovernmentDashboard';
import { SuperAdminDashboard } from './government/admin/SuperAdminDashboard';
import { TriggeredRecords } from './government/triggered/TriggeredRecords';
import { ComplaintList } from './government/complaints/ComplaintList';
import { ComplaintDetail } from './government/complaints/ComplaintDetail';
import { GovernmentMap } from './government/map/GovernmentMap';
import { ClusterManagement } from './government/clusters/ClusterManagement';
import { AnalyticsView } from './government/analytics/AnalyticsView';
import { AiReviewQueue } from './government/aiReview/AiReviewQueue';
import { AiVerificationCenter } from './government/aiVerification/AiVerificationCenter';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Redirect to Citizen Home */}
        <Route path="/" element={<Navigate to="/citizen/home" replace />} />

        {/* Universal & Role-Specific Authentication Gateways */}
        <Route path="/login" element={<UniversalLoginGateway />} />
        <Route path="/citizen/login" element={<CitizenLogin />} />
        <Route path="/citizen/register" element={<CitizenRegister />} />
        <Route path="/government/login" element={<GovernmentLogin />} />
        <Route path="/officer/login" element={<GovernmentLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/superadmin/login" element={<AdminLogin />} />
        <Route path="/government/admin/login" element={<AdminLogin />} />

        {/* Standalone full-screen Voice Conversation View */}
        <Route path="/citizen/voice" element={<CitizenVoice />} />

        {/* Citizen Portal Routes */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route path="home" element={<CitizenHome />} />
          <Route path="map" element={<CitizenMap />} />
          <Route path="reports" element={<CitizenReports />} />
          <Route path="reports/:id" element={<CitizenReportDetail />} />
          <Route path="profile" element={<CitizenProfile />} />
        </Route>

        {/* Super Admin Dedicated High-Level Oversight Routes */}
        <Route path="/admin" element={<GovernmentLayout />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="escalations" element={<SuperAdminDashboard />} />
          <Route path="oversight" element={<SuperAdminDashboard />} />
        </Route>
        <Route path="/superadmin" element={<GovernmentLayout />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
        </Route>

        {/* Government Command Center Routes */}
        <Route path="/government" element={<GovernmentLayout />}>
          <Route path="dashboard" element={<GovernmentDashboard />} />
          <Route path="admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="triggered" element={<TriggeredRecords />} />
          <Route path="complaints" element={<ComplaintList />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="map" element={<GovernmentMap />} />
          <Route path="clusters" element={<ClusterManagement />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="ai-review" element={<AiReviewQueue />} />
          <Route path="ai-verification" element={<AiVerificationCenter />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/citizen/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
