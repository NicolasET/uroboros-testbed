import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { seededStore } from './store.ts';

const port = Number(process.env.PORT ?? 3000);
createServer(createApp(seededStore())).listen(port, () => {
  console.log(`listings-api on http://localhost:${port}`);
});
