// public/main.js

async function main(){

    const url = 'http://localhost:3000/api/messages'

    const res = await fetch(url)
    const data = await res.json()

    const divs = data.map(m => {
        const d = document.createElement('div')
        d.textContent = `${m.text} from ${m.name}`
        return d;
    })

    document.body.append(...divs)

}

async function sendMessage() {
    const newMsg = '???'
    const opts = {
        method: 'POST'
        headers: {
            'Content-Type': 'application/json',

        }
        body: JSON.stringify(newMsg)
    }
    const res = await fetch(url, opts)
}

getMessages()
main()