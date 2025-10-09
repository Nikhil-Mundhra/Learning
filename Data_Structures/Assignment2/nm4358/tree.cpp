//============================================================================
// Name         : tree.cpp
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 3 Nov
// Date Modified: 7 Nov
// Description  : Tree class implementation
//============================================================================

#include "tree.h"
#include "book.h"
#include "myvector.h"
#include <iostream>
#include <fstream>

using namespace std;

// Node constructor
Node::Node(string name) : name(name), bookCount(0), parent(nullptr) {}

// Node destructor
Node::~Node() {
    for (int i = 0; i < children.size(); i++) {
        delete children[i];
    }
    for (int i = 0; i < books.size(); i++) {
        delete books[i];
    }
}

// Get category path for a node
string Node::getCategory(Node* node) {
    if (!node) return "";
    if (!node->parent) return node->name;
    return node->parent->getCategory(node->parent) + "/" + node->name;
}

// Tree constructor
Tree::Tree(string rootName) {
    root = new Node(rootName);
}

// Tree destructor
Tree::~Tree() {
    delete root;
}

// Get the root of the tree
Node* Tree::getRoot() {
    return root;
}

// Insert a new child into the specified node
void Tree::insert(Node* node, string name) {
    Node* child = new Node(name);
    child->parent = node;
    node->children.push_back(child);
}

// Remove a specific child by name from a given node
void Tree::remove(Node* node, string child_name) {
    for (int i = 0; i < node->children.size(); i++) {
        if (node->children[i]->name == child_name) {
            delete node->children[i];
            node->children.erase(i);
            return;
        }
    }
}

// Check if the given node is the root
bool Tree::isRoot(Node* node) {
    return node == root;
}

// Get a node based on the specified path (e.g., "category/sub-category")
Node* Tree::getNode(string path) {
    Node* current = root;
    size_t pos = 0;
    while ((pos = path.find('/')) != string::npos) {
        string category = path.substr(0, pos);
        current = getChild(current, category);
        if (!current) return nullptr;
        path.erase(0, pos + 1);
    }
    return getChild(current, path);
}

// Create a node at a specified path
Node* Tree::createNode(string path) {
    Node* current = root;
    size_t pos = 0;
    while ((pos = path.find('/')) != string::npos) {
        string category = path.substr(0, pos);
        Node* child = getChild(current, category);
        if (!child) {
            insert(current, category);
            child = getChild(current, category);
        }
        current = child;
        path.erase(0, pos + 1);
    }
    Node* child = getChild(current, path);
    if (!child) {
        insert(current, path);
        child = getChild(current, path);
    }
    return child;
}

// Get a child node by name
Node* Tree::getChild(Node* ptr, string childname) {
    for (int i = 0; i < ptr->children.size(); i++) {
        if (ptr->children[i]->name == childname) return ptr->children[i];
    }
    return nullptr;
}

// Update the book count for a node by the specified offset
void Tree::updateBookCount(Node* ptr, int offset) {
    while (ptr) {
        ptr->bookCount += offset;
        ptr = ptr->parent;
    }
}

// Find a book within a specific node
Book* Tree::findBook(Node* node, string bookTitle) {
    // Check if the book is in the current node
    for (int i = 0; i < node->books.size(); i++) {
        if (node->books[i]->title == bookTitle) return node->books[i];
    }

    // Traversing all children nodes recursively
    MyVector<Node*>& children = node->children; // Use 'node' instead of 'root'
    for (int i = 0; i < children.size(); ++i) {
        Book* book = findBook(children.at(i), bookTitle);
        if (book != nullptr) {
            return book;  // Return the book found in the child node
        }
    }

    // If book is not found in current node or any child nodes
    return nullptr;
}

// Remove a book from a specific node by title
bool Tree::removeBook(Node* node, string bookTitle) {
    // Check if the book is in the current node
    for (int i = 0; i < node->books.size(); i++) {
        if (node->books[i]->title == bookTitle) {
            delete node->books[i];
            node->books.erase(i);
            updateBookCount(node, -1);
            return true;
        }
    }
    // Traversing all children nodes recursively
    MyVector<Node*>& children = node->children; // Use 'node' instead of 'root'
    for (int i = 0; i < children.size(); ++i) {
        if (removeBook(children[i], bookTitle)) {
            return true;  // Stop searching once the book is removed
        }
    }

    return false;
}

// Print all books in the node and its children
void Tree::printAll(Node* node) {
    if (node == nullptr) return;

    // Print books in the current node
    for (int i = 0; i < node->books.size(); i++) {
        Book* book = node->books[i];
        if (book != nullptr) {
            book->display(); // Assume display() prints details of the book
        }
    }
    // Recursively print books for each child node
    for (int i = 0; i < node->children.size(); i++) {
        printAll(node->children[i]);
    }
}
// Check if the node is the last child of its parent
bool Tree::isLastChild(Node* ptr) {
    if (!ptr->parent) return false;
    return ptr->parent->children[ptr->parent->children.size() - 1] == ptr;
}

// Print all categories and sub-categories in a tree format
void Tree::print() {
    print_helper("", "", root);
}

// Helper function for print
void Tree::print_helper(string padding, string pointer, Node* node) {
    if (!node) return;

    cout << padding << pointer << node->name << " (" << node->bookCount << ")" << endl;
    padding += isLastChild(node) ? "   " : "│  ";
    for (int i = 0; i < node->children.size(); i++) {
        string marker = isLastChild(node->children[i]) ? "└──" : "├──";
        print_helper(padding, marker, node->children[i]);
    }
}

// Export all books of a given node to a specified file
int Tree::exportData(Node* node, ofstream& file) {
    int count = 0;
    for (int i = 0; i < node->books.size(); i++) {

        file << node->books[i]->title << ",";
        file << node->books[i]->author << ",";
        file << node->books[i]->isbn << ",";
        file << node->books[i]->publication_year << ",";
        file << node->books[i]->total_copies << ",";
        file << node->books[i]->available_copies << "\n";
        count++;
    }
    for (int i = 0; i < node->children.size(); i++) {
        count += exportData(node->children[i], file);
    }
    return count;
}
