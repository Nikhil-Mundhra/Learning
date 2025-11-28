// app.mjs
// npm install express hbs uuid nodemon --save
// npm install chai mocha supertest jsdom --save-dev

import express from 'express';
import { fileURLToPath } from 'url';
import hbs from "hbs";
import * as fs from "fs";
import { Query } from "./query.mjs";
import { v4 as uuidv4 } from "uuid";
import * as webLib from './web-lib.js';
import * as path from "path";

export let queries = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
export let server = null;

// Implement the decorate function
export const decorate = (answer, correct) => {
  return correct
    ? `<span class="correct-answer">${answer}</span>`
    : `<span class="incorrect-answer">${answer}</span>`;
};

// Continue with the rest of the code

app.use(express.urlencoded({extended: true}))

app.use((req, res, next) => {
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(req.query);
  next();
});

// serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

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
    console.log(`Server started; type CTRL+C to shut down`);
    console.log(`Access at http://${HOST}:${PORT}/`);
    console.log(`Serving from: ${rootDirFull}`);
    });


  } catch (parseErr) {
    //throw parseErr;
    console.error("Error parsing config file:", parseErr);
    process.exit(1);
  }
});

