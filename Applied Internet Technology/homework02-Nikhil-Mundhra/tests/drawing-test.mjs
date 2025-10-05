import { expect } from "chai";
import { GenericElement, RectangleElement, RootElement, TextElement } from "../src/drawing.js";

const normalizeString = (str) => {
    return str.replace(/\s+/g, ' ').trim();
};

describe('drawing', function () {
    describe('GenericElement', function () {
        it('should have the name property', function () {
            const genElem = new GenericElement("circle");
            expect(genElem).to.have.property("name", "circle");
        });
    });

    describe('RootElement', function () {

        it(`should have the name property set to "svg"`, function () {
            const root = new RootElement();
            expect(root).to.have.property("name", "svg");
        });

        it(`should allow a child element to be added`, function () {
            const root = new RootElement();
            const child = new GenericElement("circle");
            root.addChild(child);
            const hasChild = Object.keys(root).some(key => Array.isArray(root[key]) && root[key].includes(child));
            expect(hasChild).to.be.true;
        });

        it(`should have a toString method`, function () {
            const root = new RootElement();
            expect(root).to.have.property('toString').that.is.a('function');
        });

        it(`should have a working toString method`, function () {
            const root = new RootElement();
            const child = new GenericElement("circle");
            const grandChild = new GenericElement("circle");
            child.addChild(grandChild);
            root.addChild(child);
            const str = `<svg xmlns="http://www.w3.org/2000/svg"><circle><circle></circle></circle></svg>`;
            expect(normalizeString(root.toString())).to.eql(str);
        });

        it(`should have the "xmlns" attribute`, function () {
            const root = new RootElement();
            expect(root.toString()).to.include(`xmlns="http://www.w3.org/2000/svg"`);
        });

        it(`should allow adding an attribute`, function () {
            const root = new RootElement();
            root.addAttr("hello", "world");
            expect(root.toString()).to.include(`hello="world"`);
        });

        it(`should allow setting an attribute`, function () {
            const root = new RootElement();
            root.addAttr("hello", "world");
            root.setAttr("hello", "AIT");
            expect(root.toString()).to.include(`hello="AIT"`);
        });

        it(`should allow adding multiple attributes`, function () {
            const root = new RootElement();
            const props = { cx: 25, cy: 100 };
            root.addAttrs(props);
            expect(root.toString()).to.include(`cx="25"`);
            expect(root.toString()).to.include(`cy="100"`);
        });

        it(`should allow removing attributes`, function () {
            const root = new RootElement();
            const props = { cx: 25, cy: 100 };
            root.addAttrs(props);
            root.removeAttrs(['cx', 'cy']);
            expect(root.toString()).to.not.include(`cx="25"`);
            expect(root.toString()).to.not.include(`cy="100"`);
        });

        it(`should not only remove existing attributes`, function () {
            const root = new RootElement();
            const props = { r: 5, cx: 25, cy: 100, fill: "blue" };
            root.addAttrs(props);
            root.removeAttrs(['cx', 'cy', 'x', 'y']);
            expect(root.toString()).to.not.include(`cx="25"`);
            expect(root.toString()).to.not.include(`cy="100"`);
            expect(root.toString()).to.include(`r="5"`);
            expect(root.toString()).to.include(`fill="blue"`);
        });

        it('should have a write method', function () {
            const root = new RootElement();
            expect(root).to.have.property('write').that.is.a('function');
        });

        it('should have a write method that accepts two arguments', function () {
            const root = new RootElement();
            expect(root.write.length).to.equal(2);
        });

    });

    describe('RectangleElement', function () {
        it('should extend from Generic Element or Root Element', function () {
            const rect = new RectangleElement(25, 50, 50, 100, "blue");
            const isRoot = rect instanceof RootElement;
            const isGeneric = rect instanceof GenericElement;
            expect(isGeneric || isRoot).to.be.true;
        });

        it(`should have the name property set to "rect"`, function () {
            const rect = new RectangleElement(25, 50, 50, 100, "blue");
            expect(rect).to.have.property("name", "rect");
        });

        it(`should have the "x", "y", "width", "height" and "fill" attribute`, function () {
            const rect = new RectangleElement(25, 50, 50, 100, "blue");
            expect(rect.toString()).to.include(`x="25"`);
            expect(rect.toString()).to.include(`y="50"`);
            expect(rect.toString()).to.include(`width="50"`);
            expect(rect.toString()).to.include(`height="100"`);
            expect(rect.toString()).to.include(`fill="blue"`);
        });
    });

    describe('TextElement', function () {
        it('should extend from Generic Element or Root Element', function () {
            const textElem = new TextElement(50, 70, 70, 'red', 'Hello World');
            const isRoot = textElem instanceof RootElement;
            const isGeneric = textElem instanceof GenericElement;
            expect(isGeneric || isRoot).to.be.true;
        });

        it(`should have the name property set to "text"`, function () {
            const textElem = new TextElement(50, 70, 70, 'red', 'Hello World');
            expect(textElem).to.have.property("name", "text");
        });

        it(`should have the "x", "y", "fontSize" and "fill" attribute`, function () {
            const textElem = new TextElement(50, 70, 70, 'red', 'Hello World');
            expect(textElem.toString()).to.include(`x="50"`);
            expect(textElem.toString()).to.include(`y="70"`);
            expect(textElem.toString()).to.include(`font-size="70"`);
            expect(textElem.toString()).to.include(`fill="red"`);
        });

        it(`should have a content property`, function () {
            const textElem = new TextElement(50, 70, 70, 'red', 'Hello World');
            expect(normalizeString(textElem.toString())).to.include(`>Hello World</text>`)
        });
    });
});
