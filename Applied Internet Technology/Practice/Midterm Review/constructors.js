function Werewolf(desc) {
    // const this = {};
    this.desc = desc;
    this.scary = true;

    //this.howl = function() {
    //    console.log('howl');
    //};
    // return this
}
// this identifiers points to
// some object that serves as
// the conceptual prototype [[prototype]]
// of all instances of constructor
Werewolf.prototype.howl = function() { };

function PartyWerewolf {
    // const this = {};
    // kind of like calling super
    Werewolf.call(this, 'party')
    // Werewolf('party');
    // return this;
}
// PartWerewolf.prototype = new Werewolf('party');
// instantiating Werewolf, but not including 
// its properties
PartyWerewolf.prototype = Object.create(Werewolf.prototype);


// PartyWerewolf.prototype = Werewolf.prototype

// Werewolf 




const p = new PartyWerewolf();



// kind of like static Werewolf.howl = function() {}

const c1 = new Werewolf('sad');
/*
c1.howl = function() {
    console.log('howl');
}
*/
const c2 = new Werewolf('party');

console.log(c1.desc);
console.log(c2.desc);
c1.hasOwnProperty('desc');
c1.hasOwnProperty('howl');

// syntactic sugar for above
// Werewolf is a function
// howl is defined on 
// Werewolf.prototype
class Werewolf {
    constructor(desc) {
        this.desc = desc; 
    }
    howl() {
        console.log('howl');
    }
}

const c = new Werewolf('another one');
// c.howl = function() {}
//c.howl = console.log.bind();

class PartyWerewolf extends Werewolf {
    constructor() {
        super('party'); 
    }
}





console.log(typeof Werewolf)




