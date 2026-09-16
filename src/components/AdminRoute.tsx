import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Hides Admin-only screens from people who cannot use them.
 *
 * This is a courtesy, not a control. Every endpoint behind these screens checks the role on
 * the token server-side, so editing the claim client-side gets you a 403 and an empty table
 * rather than access. Treating this as the enforcement point would be the mistake.
 */
export function AdminRoute() {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/services" replace />;

  return <Outlet />;
}
