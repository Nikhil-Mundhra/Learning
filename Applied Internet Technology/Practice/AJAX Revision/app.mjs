
import path from 'path'
import express from 'express'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path(__filename);

const app = express();

app.use(express.static(path.join(__dirname,'public')));

PORT = 3000;
app.listen(PORT, () => console.log(`Listening on www.localhost/${PORT}/`));