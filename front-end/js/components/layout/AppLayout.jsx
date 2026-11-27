import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useApp } from '../../context/AppContext.jsx';
import { Button, ConfirmAction, Toasts } from '../ui.jsx';
import { dashboardPath, navigationByActor } from '../../data/navigation.js';

export function AppLayout({ children }) {
  const {
    state,
    logOut,
    setCurrentSupplierId,
    refreshSchoolData,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const actor = state.actors.find((item) => item.id === state.currentActorId);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!actor) return null;
  const currentTitle = navigationByActor[actor.id].find(([, path]) => path === location.pathname)?.[0] ?? 'Dashboard';

  async function signOut() {
    if (await logOut()) navigate('/login', { replace: true });
  }

  return (
    <>
      <div className="app-shell">
        <aside className="app-sidebar">
          <Link className="sidebar-brand" to={dashboardPath[actor.id]}>
            <span aria-hidden="true" className="brand-mark">S</span><span>School Management</span>
          </Link>
          <p className="nav-caption">WORKSPACE</p>
          <nav aria-label={`${actor.title} navigation`} className="app-navigation">
            {navigationByActor[actor.id].map(([label, path]) => (
              <NavLink className="app-navigation__link" key={path} to={path}>
                <span aria-hidden="true" className="nav-dot" />{label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-profile">
            <span aria-hidden="true" className="avatar">{actor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
            <span><strong>{actor.name}</strong><small>{actor.title}</small></span>
          </div>
        </aside>
        <div className="app-main">
          <header className="topbar">
            <div className="topbar-location"><span>Workspace</span><b>/</b><strong>{currentTitle}</strong></div>
            <div className="topbar-actions">
              {actor.id === 'supplier' && <select aria-label="Select supplier account" onChange={(event) => setCurrentSupplierId(event.target.value)} value={state.currentSupplierId}>{state.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>}
              <button aria-expanded={menuOpen} aria-label={`Notifications, ${state.notifications.length} new`} className="icon-button notification-button" onClick={() => setMenuOpen(!menuOpen)} type="button"><svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg><span>{state.notifications.length}</span></button>
              <Button onClick={signOut} variant="quiet">Log out</Button>
              <ConfirmAction message="Reload school data from the API?" onConfirm={refreshSchoolData} title="Reload school data" variant="secondary">Reload School Data</ConfirmAction>
            </div>
            {menuOpen && <div className="notification-menu"><strong>Recent notifications</strong>{state.notifications.length ? state.notifications.slice(0, 4).map((item) => <p key={item.id}>{item.message}</p>) : <p>No new notifications.</p>}</div>}
          </header>
          <main className="app-content">{children}</main>
        </div>
      </div>
      <Toasts />
    </>
  );
}
