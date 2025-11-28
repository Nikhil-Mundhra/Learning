/*
 * this ... dpend on??
 * scope / how function was made
 * how it's invoked / executed
 */

/**
 * invoking...
 * =====
 * function
 * constructor with new
 * method call
 * call, apply 
 *
 * creating
 * ======
 * arrow function
 * bind
 */

function Werewolf(desc) {
    this.desc = desc;
}

// as a regular function, this will be bound to global
// const w = Werewolf('party');
// console.log(w); // undefined
// a (module scope) variable called desc will appear

// when you use new...
/*
// this is bound to a fresh empty 
// object
// which is eventually returned implicitly
function Werewolf(desc) {
    // when new is called
    // const this = {};
    this.desc = desc;
    // return this;
}
*/
// const w = new Werewolf();

function meow() {
    if(this.nationality === 'Japanese') {
        console.log('nyan'); 
    } else {
        console.log('default cat noise'); 
    }
}
/*
 * when used as a method, then this will
 * refer to object that method was CALLED on

const c = {meow: meow};
c.meow();

const c2 = {nationality: 'Japanese', meow: meow};
c2.meow();
*/
// c2.meow not the same as actually calling it


/*
const c3 = {nationality: 'Japanese'};
meow.call(c3); // other arguments appear after "this"
meow.apply(c3); // other arguments should be array after "this" 
*/
/*
const f = meow.bind(c3);
f();
*/
//meow.bind(c3)();


































