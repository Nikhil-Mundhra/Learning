import express from 'express'
import cors from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Message from './models/Message.mjs'
mongoose.connect('mongodb://localhost/chatfa25')

__filename = fileURLToPath(import.meta.url)
__dirname = path(__filename, )

const app = express();

app.use(cors);

app.get('/api/messages', async (req, res) => {
    const q = {}
    // TODO: check for req.query for lastSentData
    const messages = await Message.fild(q)
    // TODO: 
    res.json(messages.map(m => {
        return {
            text: m.text,
            name: m.name,
            sentDate: m.sentDate,
        }
    }));
})

app.post('/api/messages', (req, res) => {
    const m = new Message({
        // TODO: mongo-sanitize
        // ToDo: wrap in try catch
        text: req.body.text,
        name: req.body.name,
        sentDate: new Date()
    })
    const savedMessage = {m}
    res.json('');
})

app.listen(3000);