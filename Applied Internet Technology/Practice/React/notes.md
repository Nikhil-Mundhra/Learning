All components are functional componenets
names must be title case
Your function must return a single react element

props 

* data that is handed down to component via attributes
* accessible via parameter (by convention props... alt destructure)
* meant for causing a re-render of component

state 

* data that is "owned" by component
* any changes cause composentn to re-render
* to create state, use a react hook... a function that start with a "use"
    * useState...
    * single param: initial value of that state
    * returns an array with 2 values:
        1. current val of state
        2. function to modify the state

class App(){
    constructor() {
        this.foo = []
    }
}