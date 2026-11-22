import { createServer, request, type RequestListener } from 'node:http';
import { Duplex } from 'node:stream';

interface TestRequest {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** Chạy bộ phân tích HTTP và middleware thật qua hai stream trong bộ nhớ. */
export function createTestRequest(listener: RequestListener) {
  const server = createServer(listener);

  return (path: string, { method = 'GET', headers, body }: TestRequest = {}) =>
    new Promise<Response>((resolve, reject) => {
      const socket = new Duplex({
        read() {},
        write(chunk, _encoding, done) { peer.push(chunk); done(); },
        final(done) { peer.push(null); done(); },
      });
      const peer = new Duplex({
        read() {},
        write(chunk, _encoding, done) { socket.push(chunk); done(); },
        final(done) { socket.push(null); done(); },
      });
      const close = () => { socket.destroy(); peer.destroy(); };
      const fail = (error: Error) => { close(); reject(error); };

      server.emit('connection', peer);
      const req = request({
        path,
        method,
        headers: { Connection: 'close', ...(body === undefined ? {} : { 'Content-Length': Buffer.byteLength(body) }), ...headers },
        createConnection: () => socket,
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.once('error', fail);
        res.once('end', () => {
          close();
          resolve(new Response(chunks.length ? Buffer.concat(chunks).toString('utf8') : null, { status: res.statusCode ?? 500 }));
        });
      });
      req.once('error', fail);
      req.end(body);
    });
}
