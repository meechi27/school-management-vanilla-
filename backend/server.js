import 'dotenv/config';

import { createApp } from './app.js';

const port = process.env.PORT || 3000;
const app = createApp(process.env.SESSION_SECRET);

app.listen(port, () => {
  console.log(`School management API is running at http://localhost:${port}`);
});
