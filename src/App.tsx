import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EscalationPoliciesPage } from './pages/EscalationPoliciesPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { LoginPage } from './pages/LoginPage';
import { ServicesPage } from './pages/ServicesPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:serviceId/incidents" element={<IncidentsPage />} />
          <Route path="/escalation-policies" element={<EscalationPoliciesPage />} />
          <Route path="*" element={<Navigate to="/services" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
