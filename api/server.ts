import app from './app.js';
import { execSync } from 'child_process';

const PORT = parseInt(process.env.PORT || '34567', 10);

function killExistingPort(port: number): void {
  try {
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf-8' }).trim();
    if (result) {
      const pids = result.split('\n').filter(Boolean);
      for (const pid of pids) {
        try {
          process.kill(Number(pid), 'SIGKILL');
          console.log(`Killed existing process ${pid} on port ${port}`);
        } catch {}
      }
    }
  } catch {}
}

killExistingPort(PORT);

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
