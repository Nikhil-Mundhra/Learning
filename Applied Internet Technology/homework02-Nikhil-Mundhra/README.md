# Homework 2: Higher-Order Functions & SVG Visualization Pipeline

A JavaScript project exploring advanced functional programming patterns (higher-order functions, closures, decorators) paired with an object-oriented SVG rendering engine to generate data visualizations from movie dataset statistics.

## Overview

This project consists of two core components:
1. **Functional JavaScript Library (`hoffy.js`)**: A collection of functional programming utilities, decorators, and recursive data transformers.
2. **SVG Document Model & Reporting Engine (`drawing.js`, `report.js`)**: An object-oriented SVG generation library that parses real-world IMDb movie records and produces an automated visual bar chart (`genres.svg`).

## Key Components

### 1. Functional Programming Utilities (`src/hoffy.js`)
- `getEvenParam(...args)`: Filters positional arguments by even index using functional array methods.
- `myFlatten(arr2d)`: Flattens multi-dimensional arrays using `reduce()` without mutating source data.
- `maybe(fn)`: Function decorator that returns a wrapped version of a function that safely guards against `null` or `undefined` arguments.
- `filterWith(fn)`: Curried higher-order function returning a custom filtering closure.
- `repeatCall(fn, n, arg)`: Recursive function dispatcher executing a callback $n$ times.

### 2. SVG Document Object Model (`src/drawing.js`)
- `GenericElement`: Base XML node class supporting dynamic attribute mapping (`addAttr`, `addAttrs`, `removeAttrs`), nested child elements, and `.toString()` XML serialization.
- `RootElement`: Top-level `<svg>` element with dimension constraints and direct file export (`.write(fileName, callback)`).
- `RectangleElement` & `TextElement`: Subclasses for rendering colored SVG rectangles and typography.

### 3. Data Processing & Visualization (`src/imdb.js`, `src/report.js`)
- Ingests tab-delimited movie datasets (`data/title.basics.tsv`).
- Computes aggregated frequency distributions across cinematic genres.
- Automatically constructs and writes `genres.svg` with dynamically scaled bar charts and axis labels.

## Running the Project

```bash
cd "Applied Internet Technology/homework02-Nikhil-Mundhra"

# Test functional utilities and basic SVG generation:
node src/index.js

# Generate the full movie genre report:
node src/report.js
```

## Running Tests

```bash
npm test
```
