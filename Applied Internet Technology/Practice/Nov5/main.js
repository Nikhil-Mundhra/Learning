
// 
const btn = document.querySelector('[type="Submit"]')
btn.addEventListener('click', handleClick)

// create evt handler
async function handleClick(evt){
    const username = document.querySelector('[type="text"]').value
    // constructed url to api endpoint using username
    const url = 'https://api.github.com/users/${username}/repos'
    console.log(url)
    const res = await fetch(url)
    
    // will parse the response body
    const data = await res.json()
    console.log(data)
    // take list of repo objects
    // extract name and use as text content for lis
    const lis = data.map(repo => repo.name)
    const ul = document.querySelector('ul')
    ul.textContent = '';
    // append, unlike appendChild allows for adding multiple children
    ul.append(...lis)
}
