import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/on-call">On-call</NavLink>
          <NavLink to="/escalation-policies">Escalation Policies</NavLink>
        </nav>
        <div className="app-user">
          <span>{user?.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
