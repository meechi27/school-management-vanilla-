import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppProvider } from '../context/AppContext.jsx';
import { routeDefinitions } from './routes.jsx';

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {routeDefinitions.map(({ path, element }) => (
            <Route element={element} key={path} path={path} />
          ))}
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
