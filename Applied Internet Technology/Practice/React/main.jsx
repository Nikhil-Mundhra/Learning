import { createRoot } from 'react-dom/client'
import { useState } from 'react';
import { copyFile } from 'fs';

const root = createRoot(document.getElementById('root'))

const Clicker = (props) => {
    return <div className="clicker">{props.value}</div>
}

const App = () => {
    const [counts, setCounts] = useState(0);
    const handleClick = (evt, i) => {
        const copy = [...counts]
        // won't work cuz must make copy for react to know state has changed 
        // counts[i] =+ 1
        copy[i] += 1
        setCounts(copy)
        console.log('clicked', i)
    }
    const clickers = counts.map((val, i) => {
        return (
            <Clicker 
            key = {i} 
            value={val}
            clickHandler = {evt => handleClick(evt, i)} />
        )
    })
    return (
        <div>
            {clickers}
        </div>
    )
}

root.render(<App></App>)


// Your function must return a single react element... can use react fragment as container <> </>
/*
const App = () => {
    return (
        <div>
            <h1>hello</h1>
            <h2>world</h2>
        </div>
    )
}
root.render(<App />);
*/

/*
const App = props => {
    return (
        <div>
            <h1>{props.greeting.toUpperCase()}</h1>
            <h2>world</h2>
        </div>
    )
}
*/
/*
const App = props => {
    return (
        <div>
            <h1>{props.greeting.toUpperCase()}</h1>
            <h2>world</h2>
        </div>
    )
}
*/
/*
const Clicker = () => {
    const [count, setCount] = useState(0)
    const handleClick = () => {
        console.log('clicked!')
        setTimeout(() => {
            setCount(c => c + 1) // Guaranteed to run when the state changes
        }, 2000)
        // setCount(count+1) - This wont work here
        // setCount(c => c + 1)
        // count +=1
    }
    return (
        <div onClick={handleClick} className="clicker"> {count} </div>
    )
}
*/

//root.render(<Clicker/>)
/*
const Clicker = () => {
    const [count, setCount] = useState(0)
    const handleClick = () => {
        setCount(count+1)
        // setCount(c => c + 1)
        // count +=1
    }
    return (
        <div onClick={handleClick} className="clicker"> {count} </div>
    )
}

root.render(<Clicker/>)
*/
//root.render(<div> <App greeting = "hello"/> <App greeting = "hola"/>  <App greeting = "howdy"/> </div>);

//const a = < a href= "https://news.ycombinator.com"> hello </a>
//root.render(a);