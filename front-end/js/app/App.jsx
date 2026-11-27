import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppProvider, useApp } from '../context/AppContext.jsx';
import { routeDefinitions } from './routes.jsx';

export function AppRoutes() {
  const { isLoading, loadError, refreshSchoolData } = useApp();

  if (isLoading) {
    return <main className="app-content" aria-live="polite">Loading school data…</main>;
  }

  if (loadError) {
    return (
      <main className="app-content">
        <p role="alert">{loadError}</p>
        <button onClick={refreshSchoolData} type="button">Try again</button>
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
      </BrowserRouter>
    </AppProvider>
  );
}
