// hoffy.js

export function getEvenParam(...sN){
    return sN.filter((_value, index) => index % 2 === 0); // takes 3 args: element, index, array
}

export function myFlatten(arr2d) {  // Returns: a new 1-dimensional array
    // .reduce() iterates over each sub-array (val) and concatenates it in acc.
    return arr2d.reduce((acc, val) => acc.concat(val), []);

}

export function maybe(fn){
    if (typeof fn === "function"){ // Ensures that the argument passed to maybe is actually callable.
        return function(...args) {
            if (args.some(arg => arg === null || arg === undefined)) {
                return undefined;
            }
            // Call the original function with the arguments
            return fn(...args);
        };
    } else {
        return undefined;
    }
}

export function filterWith(fn){
    if (typeof fn === "function"){ // Ensures that the argument passed is actually callable.
        return function(array){
            return array.filter((value) => fn(value) === true);
        };
    }
}

export function repeatCall(fn, n, arg){
    if (typeof fn !== "function"){ // Ensures that the argument passed is actually callable.
        console.error("Error: Function entered wasn't a function");
        return;
    }
    if (n <= 0) return;

    fn(arg);
    repeatCall(fn, n - 1, arg); // recursively goes down
    
}

export function limitCallsDecorator(fn, n){
    if (typeof fn !== "function") {
        throw new Error("First argument must be a function");
    }
    
    let calls = 0; // closure variable to track usage
    
    return function(...args) {
        if (calls < n) {
            calls++;
            return fn(...args); // pass all arguments
        }
        return undefined; // after n calls
    }; 
}

import fs from 'fs';

export function myReadFile(fileName, successFn, errorFn) {
    fs.readFile(fileName, "utf-8", (err, data) => {
        if (err) {
            errorFn(err);   // call the error callback
        } else {
            successFn(data); // call the success callback
        }
    });
}

export function stringFieldToList(data, key) {
    // Make a shallow copy so we don't modify the original object
    const newObj = { ...data };

    // Check if the key exists and is a string
    if (typeof newObj[key] === "string") {
        newObj[key] = newObj[key]
            .split(",")              // turn "a, b, c" into ["a", " b", " c"]
            .map(str => str.trim()); // remove extra spaces
    }

    return newObj;
}

export function rowsToObjects({ headers, rows }) {
    return rows.map(row =>
        Object.fromEntries(headers.map((header, i) => [header, row[i]]))
    );
}