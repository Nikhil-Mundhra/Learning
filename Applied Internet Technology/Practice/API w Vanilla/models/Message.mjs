import mongoose from 'mongoose'
const MessageSchema = new mongoose.Schema({
    text = {type: String, required: true},
    name = {type: String, required: true},
    sentDate =  {type: String, required: false}
})

export MessageSchema as 'Message';