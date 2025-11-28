// public/main.js
import { relative } from 'path';
import { io } from 'socket.io/socket.io.esm.min.js'

// sock represents server we're connected to
const sock = io();

document.addEventListener('mousemove', evt => {
    console.log(evt.x, evt.y);
    sock.emit('mouse', {x:evt.x, y:evt.y});

});


sock.on('mouse', data => {
    console.log(data);
    const c = document.getElementById(data.id);
    if (!c) {
        c = document.createElement('div');
        c.style.position = 'relative';
        c.style.top = data.y + 'px';
        c.id = data.id;
        c.textContent = data.id;
    }

})