import net from 'net';
const HOST = '127.0.0.1';
const PORT = 8080;

const server = net.createServer((sock) => {
    console.log(`got connection from ${sock.remoteAddress}:${sock.remotePort}`);

// setup above

    sock.on('data', function(binaryData) {
        console.log('\n==got==\n' + binaryData); 
        sock.write(String(binaryData).trim() === "Kimetsu No Yaiba"? 
        "Omoshiroi": "\n-==-sent-==-\n" + binaryData + "-=-=-==-=-=-\n");
    });

    sock.on('close', (data) => {
        console.log(`closed - ${sock.remoteAddress}:${sock.remotePort}`);
    });

    // within create server
    

        // uncomment me if you want the connection to close
        // immediately after we send back data
        // sock.end();
});

// listen below

server.listen(PORT, HOST);