import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { withPublicRoutes } from './gateway.ts';
import { withRankFloor } from './rank-floor.ts';
import { seededStore } from './store.ts';

const port = Number(process.env.PORT ?? 3000);
const store = seededStore();
createServer(withPublicRoutes(withRankFloor(createApp(store), store))).listen(port, () => {
  console.log(`listings-api on http://localhost:${port}`);
});
