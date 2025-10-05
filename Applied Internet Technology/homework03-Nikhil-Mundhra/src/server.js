import * as webLib from './web-lib.js';
import * as path from "path";
import * as fs from "fs";
import * as url from "url";
import * as net from "net";

// TODO: configure and start server

import { fileURLToPath } from "url";

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config.json
const configPath = path.join(__dirname, "config.json");


fs.readFile(configPath, "utf-8", (err, data) => {
  if (err) {
    throw err;
    //console.error("Error reading config file:", err);
    //process.exit(1);
  }
  try {
    const config = JSON.parse(data);
    // Resolve root directory (relative to project root)
    const rootDirFull = path.resolve(__dirname, "..", config.root_directory);

    // TCP server
    const HOST = "127.0.0.1";
    const PORT = 3000;
    
    const server = new webLib.HTTPServer(rootDirFull, config.redirect_map || {});

    server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
    console.log(`Serving from: ${rootDirFull}`);
    });


  } catch (parseErr) {
    //throw parseErr;
    console.error("Error parsing config file:", parseErr);
    process.exit(1);
  }
});
