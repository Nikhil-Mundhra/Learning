# Homework 3: Custom HTTP/1.1 Web Server (Raw TCP Sockets)

An RFC-compliant HTTP/1.1 web server implemented from scratch in Node.js using low-level TCP sockets (`net` module), built without Express or external HTTP libraries.

## Overview

This project explores network protocols and the mechanics of the web by implementing the HTTP protocol directly on top of the Transmission Control Protocol (TCP). The server parses incoming raw HTTP byte streams, routes requests, negotiates MIME types, compiles Markdown to HTML on the fly, and manages URL redirection.

## Key Features

- **Raw Socket Protocol Handling**: Utilizes Node's `net.createServer` to manage bi-directional TCP socket connections and stream events (`data`, `end`, `error`).
- **Custom HTTP Request Parser (`Request`)**:
  - Parses raw HTTP byte streams into structured request objects.
  - Extracts the request line (Method, Path, HTTP version) and headers.
- **Custom HTTP Response Builder (`Response`)**:
  - Formats standards-compliant HTTP responses.
  - Supports standard status codes: `200 OK`, `308 Permanent Redirect`, `404 Page Not Found`, and `500 Internal Server Error`.
  - Injects appropriate HTTP headers (`Content-Type`, `Location`, `Content-Length`).
- **Static File Serving & MIME Negotiation**: Resolves and serves assets (`.html`, `.css`, `.png`, `.jpg`, `.txt`) from a configured root directory.
- **On-the-Fly Markdown Compilation**: Automatically compiles requested `.md` documents into clean, styled HTML on the fly using `markdown-it`.
- **Configurable Redirection Engine**: Reads redirection mapping rules from `config.json` to issue HTTP 308 Permanent Redirects.

## Project Structure

```text
.
├── src/
│   ├── web-lib.js      # Core HTTP server library (HTTPServer, Request, Response classes)
│   ├── server.js       # Entry point; loads config and binds TCP listener
│   └── config.json     # Configuration for root directory and redirect maps
├── public/             # Static web assets (HTML, CSS, images, Markdown files)
└── private/            # Protected/non-served internal resources
```

## Running the Server

```bash
cd "Applied Internet Technology/homework03-Nikhil-Mundhra"
npm install
node src/server.js
```

The server will start listening at:
```text
Server running at http://127.0.0.1:3000/
Serving from: .../public
```

Open `http://localhost:3000/` in any browser to verify static page rendering, Markdown conversions, and redirects.
