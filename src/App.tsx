import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EscalationPoliciesPage } from './pages/EscalationPoliciesPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { LoginPage } from './pages/LoginPage';
import { OnCallPage } from './pages/OnCallPage';
import { ServicesPage } from './pages/ServicesPage';
import { StaffPage } from './pages/StaffPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:serviceId/incidents" element={<IncidentsPage />} />
          <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
          <Route path="/on-call" element={<OnCallPage />} />
          <Route path="/escalation-policies" element={<EscalationPoliciesPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/staff" element={<StaffPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/services" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
