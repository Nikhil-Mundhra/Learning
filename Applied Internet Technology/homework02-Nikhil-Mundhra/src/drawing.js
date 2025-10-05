// drawing.js


import fs from "fs";

class GenericElement {
  constructor(name) {
    this.name = name;
    this.attrs = {};
    this.children = [];
    this.content = '';
  }

  addAttr(name, value) {
    this.attrs[name] = value;
  }

  setAttr(name, value) {
    if (this.attrs.hasOwnProperty(name)) {
      this.attrs[name] = value;
    }
  }

  addAttrs(obj) {
    Object.keys(obj).map(k => this.attrs[k] = obj[k]);
  }

  removeAttrs(arr) {
    arr.map(k => {
      if (this.attrs.hasOwnProperty(k)) {
        delete this.attrs[k];
      }
    });
  }

  addChild(child) {
    this.children.push(child);
  }

  toString() {
    const attrsString = Object.entries(this.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');

    const openTag = attrsString ? `<${this.name} ${attrsString}>` : `<${this.name}>`;
    const childrenString = this.children.map(c => c.toString()).join('');
    return `${openTag}${this.content}${childrenString}</${this.name}>`;
  }

  write(fileName, cb) {
    fs.writeFile(fileName, this.toString(), err => {
      if (err) throw err;
      cb();
    });
  }
}

class RootElement extends GenericElement {
  constructor() {
    super('svg');
    this.addAttr('xmlns', 'http://www.w3.org/2000/svg');
  }
}

class RectangleElement extends GenericElement {
  constructor(x, y, width, height, fill) {
    super('rect');
    this.addAttrs({ x, y, width, height, fill });
  }
}

class TextElement extends GenericElement {
  constructor(x, y, fontSize, fill, content) {
    super('text');
    this.addAttrs({ x, y, 'font-size': fontSize, fill });
    this.content = content;
  }
}

export { GenericElement, RootElement, RectangleElement, TextElement };