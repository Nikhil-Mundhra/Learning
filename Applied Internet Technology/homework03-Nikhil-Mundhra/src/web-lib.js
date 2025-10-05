import * as path from "path";
import * as net from "net";
import * as fs from "fs";
import MarkdownIt from "markdown-it";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
    "jpg" : "image/jpg",
    "jpeg" : "image/jpeg",
    "png" : "image/png",
    "html" : "text/html",
    "css" : "text/css",
    "txt" : "text/plain"
};

/**
 * returns the extension of a file name (for example, foo.md returns md)
 * @param fileName (String)
 * @return extension (String)
 */
function getExtension(fileName) {
    const formatPath = path.extname(fileName).toLowerCase();
    if (formatPath.startsWith(".")) {
        return formatPath.substring(1);
    }
    return formatPath;
}

/**
 * determines the type of file from a file's extension (for example,
 * foo.html returns text/html
 * @param: fileName (String)
 * @return: MIME type (String), undefined for unkwown MIME types
 */
function getMIMEType(fileName) {
    const ext = path.extname(fileName);
    return ext.length > 0 ? MIME_TYPES[ext.substring(1)] : null;
}

// a class that represents an http request
class Request {
    constructor(reqStr) {
        const [method, path] = reqStr.split(" ");
        this.method = method;
        this.path = path;
    }
}

/* a class that represents an http response… 
of which instances can send back a response to the client */
class Response {

    static STATUS_CODES = {
        200 : "OK",
        308 : "Permanent Redirect",
        404 : "Page Not Found",
        500 : "Internal Server Error"
    };

    constructor(socket, statusCode = 200, version = "HTTP/1.1") {
        this.sock = socket;
        this.statusCode = statusCode;
        this.version = version;
        this.headers = {};
        this.body = null;
    }

    setHeader(name, value) {
        this.headers[name] = value;
    }

    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    }

    send(body) {
        this.body = body ?? "";
      
        if (!Object.hasOwn(this.headers, "Content-Type")) {
            this.headers["Content-Type"] = "text/html";
        }

        const statusCodeDesc = Response.STATUS_CODES[this.statusCode]; // Part 3.2.4

        const headersString = Object.entries(this.headers).reduce((s, [name, value]) => {
            return s + `${name}: ${value} \r\n`;
        }, "");

        this.sock.write(`${this.version} ${this.statusCode} ${statusCodeDesc}\r\n`);
        this.sock.write(`${headersString}\r\n`);
        this.sock.write(this.body);

        this.sock.end();
    }
}

class HTTPServer {
    constructor(rootDirFull, redirectMap) {
        this.rootDirFull = rootDirFull;
        this.redirectMap = redirectMap;
        this.server = net.createServer(this.handleConnection.bind(this));
    }

    listen(port, host) {
        this.server.listen(port, host);
    }

    handleConnection(sock) {
        sock.on("data", data => this.handleRequest(sock, data));
    }

    handleRequest(sock, binaryData) {
        const req = new Request(binaryData.toString());
        const res = new Response(sock);
    
        // Normalize and resolve the path to prevent directory traversal
        let reqPathFull = path.join(this.rootDirFull, req.path);
        reqPathFull = path.normalize(reqPathFull);
    
        if (!reqPathFull.startsWith(this.rootDirFull)) {
            // If the normalized path escapes the root directory -> Forbidden
            res.status(403);
            res.setHeader("Content-Type", "text/html");
            res.send(`
                <!DOCTYPE html>
                <html>
                    <head><title>403 Forbidden</title></head>
                    <body>
                        <h1>403 Forbidden</h1>
                        <p>Access to ${req.path} is forbidden.</p>
                    </body>
                </html>
            `);
            return;
        }
    
        // Handle redirects
        if (this.redirectMap[req.path]) {
            const target = this.redirectMap[req.path];
            res.status(308);
            res.setHeader("Location", target);
            res.send(`<html><body>Redirecting to <a href="${target}">${target}</a></body></html>`);
            return;
        }
    
        // Check if the path exists
        fs.access(reqPathFull, fs.constants.F_OK, (err) => {
            if (err) {
                // 404 Not Found
                res.status(404);
                res.setHeader("Content-Type", "text/html");
                res.send(`
                    <!DOCTYPE html>
                    <html>
                        <head><title>404 Not Found</title></head>
                        <body>
                            <h1>404 Not Found</h1>
                            <p>The requested resource ${req.path} was not found on this server.</p>
                        </body>
                    </html>
                `);
                return;
            }
    
            // Path exists -> check if directory or file
            fs.stat(reqPathFull, (err, stats) => {
                if (err) {
                    res.status(500);
                    res.setHeader("Content-Type", "text/plain");
                    res.send("500 Internal Server Error");
                    return;
                }
    
                if (stats.isDirectory()) {
                    const indexFile = path.join(reqPathFull, "index.html");
                    fs.access(indexFile, fs.constants.F_OK, (err) => {
                        if (!err) {
                            this._serveFile(res, indexFile);
                        } else {
                            // Directory listing
                            fs.readdir(reqPathFull, { withFileTypes: true }, (err, files) => {
                                if (err) {
                                    res.status(500);
                                    res.setHeader("Content-Type", "text/plain");
                                    res.send("500 Internal Server Error");
                                    return;
                                }
    
                                const links = files.map(f => {
                                    const href = path.join(req.path, f.name) + (f.isDirectory() ? '/' : '');
                                    return `<li><a href="${href}">${f.name}${f.isDirectory() ? '/' : ''}</a></li>`;
                                }).join("");
    
                                const html = `
                                    <!DOCTYPE html>
                                    <html>
                                        <head><title>Index of ${req.path}</title></head>
                                        <body>
                                            <h2>Index of ${req.path}</h2>
                                            <ul>${links}</ul>
                                        </body>
                                    </html>
                                `;
                                res.status(200);
                                res.setHeader("Content-Type", "text/html");
                                res.send(html);
                            });
                        }
                    });
                } else {
                    // File -> serve it
                    this._serveFile(res, reqPathFull);
                }
            });
        });
    }

    _serveFile(res, filePath) {
        const ext = getExtension(filePath);
    
        // Markdown files
        if (ext === "md") {
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    res.status(500);
                    res.setHeader("Content-Type", "text/plain");
                    res.send("500 Internal Server Error");
                    return;
                }
    
                const md = new MarkdownIt({ html: true });
                const html = md.render(data);
    
                res.setHeader("Content-Type", "text/html");
                res.send(html);
            });
        } else {
            // All other files (images, CSS, HTML, etc.) are read as binary
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.status(500);
                    res.setHeader("Content-Type", "text/plain");
                    res.send("500 Internal Server Error");
                    return;
                }
    
                res.setHeader("Content-Type", getMIMEType(filePath) || "application/octet-stream");
                res.send(data);
            });
        }
    };
};
// npm install eslint --save-dev
export {
    Request,
    Response,
    HTTPServer
};