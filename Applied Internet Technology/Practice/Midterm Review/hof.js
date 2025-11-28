// function that accepts a function as an arg
// and/or returns a function


/*
flip function:
take a function as an arg
give back a new function
    ... behave just like the old function
    (num args are the same, return is the same)
    BUT ... new function will takes its arguments
    in reverse order
*/

/*
const reversedLog = flip(console.log);
reveredLog(1, 2, 3);
3 2 1
*/





function flip(oldFn) {
    return function(...args) {
        // arguments // arguments object
        args.reverse();
        //return oldFn.apply(this, args); 
        return oldFn(...args);
    }
}

const flipped = flip(parseInt);
// const flipped = flip(parseInt()); // don't do this
console.log(flipped(2, "101"));


/*
function makeAdder(original) {
    const n = original;
    return function(x) {
        return x + n;
    }
}

const f = makeAdder(10);
f(5);
*/












