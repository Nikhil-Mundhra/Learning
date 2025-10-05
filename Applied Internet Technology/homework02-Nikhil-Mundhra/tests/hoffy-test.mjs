import { expect } from 'chai';
import * as hoffy from '../src/hoffy.js';
import os from 'os';
import path from 'path';
import mochaSinon from 'mocha-sinon';

Object.assign(global, hoffy);

// use to test console output while still allowing console.log
// to _actually_ output to screen
// source: http://stackoverflow.com/a/30626035
function mockConsoleOutput() {
    const log = console.log;
    this.sinon.stub(console, 'log').callsFake(function(...args) {
        return log(...args);
    });
}
describe('hoffy', function() {

    describe('getEvenParam', function() {
        it('returns the even indexed parameters that are passed in', function() {
            expect(getEvenParam(1, 2, 3)).to.have.all.members([1,3]);
            expect(getEvenParam('a','b','c','d','e')).to.have.all.members(['a','c','e']);
            expect(getEvenParam('A')).to.have.all.members(['A']);
        });
        it('returns empty list if there are no arguments passed in', function() {
            expect(getEvenParam()).to.have.all.members([]);
        });
    });

    describe('maybe', function() {
        function createFullName(firstName, lastName) {
            return `${firstName} ${lastName}`; 
        }
        it('creates a new function that calls the old function and returns the old functions value', function() {
            expect(maybe(createFullName)('Frederick', 'Functionstein')).to.be.equal('Frederick Functionstein');
        });
        it('creates a new function that returns undefined if any of the arguments passed to it are null or undefined', function() {
            expect(maybe(createFullName)(null, 'Functionstein')).to.be.undefined;
            expect(maybe(createFullName)('Freddy', undefined)).to.be.undefined;
        });
    });

    describe('filterWith', function() {
        function even(n) {return n % 2 === 0;} 
        const nums = [1, NaN, 3, NaN, NaN, 6, 7];
        const filterNaN = filterWith(n => !isNaN(n));
        it('gives back a function rather than executing the callback immediately', function() {
            expect(filterWith(even)([1,2,3,4])).to.have.all.members([2,4])
            expect(filterNaN(nums)).to.have.all.members([1,3,6,7])
        });

    });

    describe('repeatCall', function() {
        
        beforeEach(mockConsoleOutput);

        it('calls function n times', function() {
            const n = 2;
            repeatCall(console.log, n, "Hello!");
            expect(console.log.callCount).to.equal(n);
            expect(console.log.alwaysCalledWithExactly('Hello!')).to.be.true;
        });

    });
    
    describe('limitCallsDecorator', function() {

        beforeEach(mockConsoleOutput);

        it('decorates a function so that it can only be called a specified number of times', function() {
            const n = 3;
            const limitedParseInt = limitCallsDecorator(parseInt, n);
            expect(limitedParseInt("423")).to.equal(423);
            expect(limitedParseInt("423")).to.equal(423);
            expect(limitedParseInt("423")).to.equal(423);
            expect(limitedParseInt("423")).to.be.undefined;
            console.log(limitedParseInt("423"));
        });
    });

    describe('myReadFile', function() {
        it('calls a success function (passed as the 2nd argument) if the file is read successfully', function(done) {
            myReadFile('tests/words.txt', (data) => {
                // use the following line for testing on Windows
                expect(data).to.equal("ant bat\ncat dog emu\nfox\n");
                // use the following line for testing on MacOS
                // expect(data).to.equal("ant bat" + os.EOL + "cat dog emu" + os.EOL + "fox" + os.EOL);
                done();
            }, err => console.log('Error opening file:', err));
        });

        it('calls an error function (passed as the 3rd argument) if an error occurs while reading the file', function(done) {
            myReadFile('tests/fileDoesNotExist.txt', console.log, err => {
                expect(err).to.be.not.null;
                done();
            });
        });
    });

    describe('stringFieldToList', function() {
        it('converts the value of a particular field in an object from a string to a list of strings', function() {
            const recipe = {
                name: "pizza",
                ingredients: "cheese, salt, flour, yeast, olive oil"
            };
            const expected = {
                name: "pizza",
                ingredients: ["cheese", "salt", "flour", "yeast", "olive oil"]
            };
            expect(stringFieldToList(recipe, "ingredients")).to.eql(expected);
        });
    });

    describe('rowsToObjects', function() {
        it('converts headers and rows (as arrays within an object) into a single array of objects', function() {
            const headers = ['a', 'b', 'c'];
            const rows = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
            const expected = [{a: 1, b: 2, c: 3}, {a: 4, b: 5, c: 6}, {a: 7, b: 8, c: 9}];
            expect(rowsToObjects({headers, rows})).to.eql(expected);
        });
    });

    describe('myFlatten', function() {
        it('it "flattens" an array - converting a  2d array into a 1d array', function() {
            expect(myFlatten([[1, 2, 3], [4, 5]])).to.have.all.members([1, 2, 3, 4, 5])
        });
    });
});
