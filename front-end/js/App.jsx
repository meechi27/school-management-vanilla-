import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Button } from './components/ui/button.jsx';
import { Toaster } from './components/ui/sonner.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { routeDefinitions } from './routes.jsx';

export function AppRoutes() {
  const { isLoading, loadError, refreshSchoolData } = useApp();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground" aria-live="polite">
        Loading school data…
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm font-medium text-destructive" role="alert">{loadError}</p>
        <Button onClick={refreshSchoolData} type="button">Try again</Button>
      </main>
    );
  }

  return (
    <Routes>
      {routeDefinitions.map(({ path, element }) => (
        <Route element={element} key={path} path={path} />
      ))}
    </Routes>
  );
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AppProvider>
  );
}
