// Prisma CLI bridge for environments with a provider-specific root CA.
// Only the local loopback leg is plaintext. Every remote leg verifies Supabase's
// hostname and supplied root CA. Database URIs are redacted from captured output.
import net from 'node:net';
import tls from 'node:tls';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });
if (!process.env.DATABASE_SSL_CA_FILE || !process.env.DIRECT_URL) {
  const child = spawn("node_modules/.bin/prisma", process.argv.slice(2), { stdio: "inherit", env: process.env });
  const code = await new Promise(resolve => { child.once("exit", resolve); child.once("error", () => resolve(1)); });
  process.exit(code ?? 1);
}
const remote = new URL(process.env.DIRECT_URL);
const ca = readFileSync(process.env.DATABASE_SSL_CA_FILE, 'utf8');
const connections = new Set();
const server = net.createServer(local => {
  local.pause();
  connections.add(local);
  local.on('close', () => connections.delete(local));
  local.on('error', () => {});
  const upstream = net.connect({ host: remote.hostname, port: Number(remote.port || 5432) });
  upstream.on('error', () => local.destroy());
  local.on('close', () => upstream.destroy());
  upstream.once('connect', () => {
    const request = Buffer.alloc(8); request.writeInt32BE(8); request.writeInt32BE(80877103, 4);
    upstream.write(request);
  });
  upstream.once('data', reply => {
    if (reply.length !== 1 || reply[0] !== 83) { local.destroy(); upstream.destroy(); return; }
    const secure = tls.connect({ socket: upstream, servername: remote.hostname, ca, rejectUnauthorized: true });
    secure.on('error', () => local.destroy());
    secure.once('secureConnect', () => {
      if (!secure.authorized) { secure.destroy(); local.destroy(); return; }
      local.pipe(secure).pipe(local); local.resume();
    });
    local.on('close', () => secure.destroy());
  });
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const address = server.address();
const localUrl = new URL(remote);
localUrl.hostname = '127.0.0.1'; localUrl.port = String(address.port);
for (const parameter of ['sslcert','sslrootcert','sslaccept','sslmode','pgbouncer']) localUrl.searchParams.delete(parameter);
localUrl.searchParams.set('sslmode', 'disable');
const child = spawn('node_modules/.bin/prisma', process.argv.slice(2), {
  cwd: process.cwd(), env: { ...process.env, DIRECT_URL: localUrl.toString(), DATABASE_SSL_CA_FILE: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const safe = text => text.toString().replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[REDACTED_DATABASE_URL]');
let stdout = '', stderr = '';
child.stdout.on('data', data => { stdout += data.toString(); });
child.stderr.on('data', data => { stderr += data.toString(); });
const code = await new Promise(resolve => { child.once('exit', resolve); child.once('error', () => resolve(1)); });
process.stdout.write(safe(stdout));
process.stderr.write(safe(stderr));
for (const socket of connections) socket.destroy();
await new Promise(resolve => server.close(resolve));
process.exitCode = code ?? 1;
