import { createServer } from 'node:http';
import { createApp } from './app.ts';
import { withPublicRoutes } from './gateway.ts';
import { withPublicView } from './public-view.ts';
import { seededStore } from './store.ts';

const port = Number(process.env.PORT ?? 3000);
createServer(withPublicRoutes(withPublicView(createApp(seededStore())))).listen(port, () => {
  console.log(`listings-api on http://localhost:${port}`);
});
