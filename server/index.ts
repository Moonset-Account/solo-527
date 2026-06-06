import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import { fileURLToPath } from 'url';
import path from 'path';
import session from 'express-session';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pgSession from 'connect-pg-simple';

import { pool } from './db/index';
import { startOverdueChecker } from './services/overdueChecker';

import authRoutes from './routes/auth';
import issuesRoutes from './routes/issues';
import photosRoutes from './routes/photos';
import storesRoutes from './routes/stores';
import reportsRoutes from './routes/reports';
import offlineRoutes from './routes/offline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key';

async function createApp() {
  const app = express();

  app.use(compression());
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(morgan('combined'));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const PgSession = pgSession(session);
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'sessions'
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/issues', issuesRoutes);
  app.use('/api/photos', photosRoutes);
  app.use('/api/stores', storesRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/offline', offlineRoutes);

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  const viteDevServer = 
    process.env.NODE_ENV !== 'production'
      ? await import('vite').then(vite => 
          vite.createServer({
            server: { middlewareMode: true },
            appType: 'custom'
          })
        )
      : null;

  if (viteDevServer) {
    app.use(viteDevServer.middlewares);
  } else {
    app.use(
      '/assets',
      express.static(path.join(__dirname, '../build/client/assets'), {
        immutable: true,
        maxAge: '1y'
      })
    );
    app.use(express.static(path.join(__dirname, '../build/client'), {
      maxAge: '1h'
    }));
  }

  app.all(
    '*',
    createRequestHandler({
      build: viteDevServer
        ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build') as any
        : await import('../build/server/index.js' as any),
      mode: process.env.NODE_ENV || 'development'
    })
  );

  return app;
}

async function startServer() {
  const app = await createApp();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startOverdueChecker();
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default createApp;
