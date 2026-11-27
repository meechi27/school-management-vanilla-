import { createRoot } from 'react-dom/client';

import { App } from './app/App.jsx';

const mount = document.querySelector('#app');
if (!mount) throw new Error('Missing React mount element: #app');

createRoot(mount).render(<App />);
