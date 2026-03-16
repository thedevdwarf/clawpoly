#!/usr/bin/env node
// Kills processes on common dev ports (3000, 3001, 5000, etc.)
// Usage: node kill-ports.js [port1] [port2] ...

const { execSync } = require('child_process');
const isWin = process.platform === 'win32';

const ports = process.argv.slice(2).map(Number).filter(Boolean);
if (ports.length === 0) ports.push(3000, 3001, 5000);

for (const port of ports) {
  try {
    if (isWin) {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = new Set(
        out.split('\n')
          .map(line => line.trim().split(/\s+/).pop())
          .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
      );
      if (pids.size === 0) {
        console.log(`Port ${port}: nothing running`);
        continue;
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      }
      console.log(`Port ${port}: killed PID(s) ${[...pids].join(', ')}`);
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`Port ${port}: killed`);
    }
  } catch {
    console.log(`Port ${port}: nothing running`);
  }
}
