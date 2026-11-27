import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOutIcon, RefreshCwIcon, XIcon } from 'lucide-react';
import { cn } from 'cn';

import { useApp } from '../context/AppContext.jsx';
import { dashboardPath, navigationByActor } from '../routes.jsx';
import { Button, ConfirmAction } from './ui.jsx';

export function Layout({ children }) {
  const {
    state,
    actionError,
    clearActionError,
    logOut,
    setCurrentSupplierId,
    refreshSchoolData,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const actor = state.actors.find((item) => item.id === state.currentActorId);
  if (!actor) return null;

  const currentTitle =
    navigationByActor[actor.id].find(([, path]) => path === location.pathname)?.[0] ?? 'Dashboard';

  async function signOut() {
    if (await logOut()) navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card p-4 md:w-64 md:border-r md:border-b-0">
        <Link
          className="mb-6 flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          to={dashboardPath[actor.id]}
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
          >
            S
          </span>
          <span>School Management</span>
        </Link>

        <p className="mb-2 px-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Workspace
        </p>

        <nav aria-label={`${actor.title} navigation`} className="flex flex-1 flex-col gap-1">
          {navigationByActor[actor.id].map(([label, path]) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
              key={path}
              to={path}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-profile mt-6 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {actor.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-medium">{actor.name}</strong>
            <small className="block truncate text-xs text-muted-foreground">{actor.title}</small>
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Workspace</span>
            <span>/</span>
            <strong className="font-medium text-foreground">{currentTitle}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actor.id === 'supplier' && (
              <select
                aria-label="Select supplier account"
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) => setCurrentSupplierId(event.target.value)}
                value={state.currentSupplierId}
              >
                {state.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            )}
            <ConfirmAction
              message="Reload school data from the API?"
              onConfirm={refreshSchoolData}
              title="Reload school data"
              variant="secondary"
            >
              <RefreshCwIcon className="size-3.5" />
              Reload School Data
            </ConfirmAction>
            <Button onClick={signOut} variant="quiet">
              <LogOutIcon className="size-3.5" />
              Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {actionError && (
            <div
              className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <span>{actionError}</span>
              <Button
                aria-label="Dismiss error"
                onClick={clearActionError}
                size="icon-xs"
                type="button"
                variant="quiet"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
