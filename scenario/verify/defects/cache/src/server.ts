import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { withPublicRoutes } from './gateway.ts';
import { withSearchCache } from './search-cache.ts';
import { seededStore } from './store.ts';

const port = Number(process.env.PORT ?? 3000);
createServer(withPublicRoutes(withSearchCache(createApp(seededStore())))).listen(port, () => {
  console.log(`listings-api on http://localhost:${port}`);
});
