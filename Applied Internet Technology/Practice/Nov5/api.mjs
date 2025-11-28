import express from 'express'
import cors from 'cors'

app = express();
app.get('api/users/:username/repos', (req,res)=>{
    res.json()
})

app.use()
app.use((req, res, next) =>{
    // manually set header 
    res.set('Access-Control-Allow-Origin: *')
    console.log(req.method,req.path)
    next()
})

app.listen(3000);