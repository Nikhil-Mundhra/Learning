import express from 'express'
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

import url from 'url'
import path from 'path'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, 'public')));

const server = createServer(app);
const io = new Server(server);

io.on('connect', sock => {
    console.log(sock.id, 'connected')
    sock.on('mouse', data => {
        console.log(data);
        sock.broadcast.emit('mouse', data)
    })
    // sock.emit (sends to currently connected client)
    // io.emit (sends to all clients)
    // sock.broadcast.emit (all clients except this one)
})
app.listen(3000);