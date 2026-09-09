# Data Structures & Algorithms (C++)

This directory contains robust C++ implementations of fundamental abstract data types, memory-efficient data structures, and algorithmic solutions developed at NYU Tandon.

## Core Implementations

### 1. Library Circulation Management System (LCMS) — Binary Search Tree
> **Path**: [`Assignment2/nm4358/`](./Assignment2/nm4358)

- Implements a self-managed **Binary Search Tree (BST)** from scratch to index and search book and borrower records.
- Handles custom tree traversals (in-order, pre-order, post-order), dynamic node insertion, targeted deletion with successor replacement, and tree rebalancing principles.
- Clean object-oriented architecture in C++ with separate header and implementation files (`tree.cpp`, `book.cpp`, `borrower.cpp`).

### 2. Frequency Analyzer — Hash Table & Max Heap
> **Path**: [`Assignment3/nm4358/`](./Assignment3/nm4358)

- Implements a custom **Hash Table** with separate chaining via linked lists to achieve near $O(1)$ amortized lookup, insertion, and collision resolution.
- Integrates a custom **Max Heap** priority queue to track, sort, and extract top-frequency elements in $O(k \log n)$ time.
- Employs strict memory management in C++ without relying on STL containers for core data structures.

## Compilation Instructions

```bash
# Compile Assignment 2 (BST):
cd Assignment2/nm4358
g++ -std=c++11 -Wall *.cpp -o lcms
./lcms

# Compile Assignment 3 (Hash Table & Max Heap):
cd Assignment3/nm4358
g++ -std=c++11 -Wall *.cpp -o wordcount
./wordcount
```
