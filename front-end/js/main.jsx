import { createRoot } from 'react-dom/client';

import '../css/shadcn.css';
import { App } from './App.jsx';

const mount = document.querySelector('#app');
if (!mount) throw new Error('Missing React mount element: #app');

createRoot(mount).render(<App />);
