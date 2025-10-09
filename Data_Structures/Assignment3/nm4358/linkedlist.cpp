//============================================================================
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 22-09-2020
// Date Modified: 18-11-2024
// Description  : Singly Linked-List implementation in C++
//============================================================================
#include "linkedlist.h"

// Node constructor
Node::Node(string key, int value) : key(key), value(value), next(nullptr) {}

// Getters for Node
string Node::getKey() {
    return key;
}

int Node::getValue() {
    return value;
}

// Setters for Node
void Node::setKey(string key) {
    this->key = key;
}

void Node::setValue(int value) {
    this->value = value;
}

// LinkedList constructor
LinkedList::LinkedList() : head(nullptr), size(0) {}

// LinkedList destructor
LinkedList::~LinkedList() {
    clear(); // Ensure all nodes are deleted to prevent memory leaks
}

// Check if the linked list is empty
bool LinkedList::empty() const {
    return size == 0;
}

// Get the size of the linked list
unsigned int LinkedList::getSize() const {
    return size;
}

// Insert a new key-value pair into the linked list
void LinkedList::insert(string key, int value) {
    Node* current = head;
    Node* prev = nullptr;

    // Traverse the list to check if the key already exists
    while (current != nullptr) {
        if (current->key == key) {
            current->value = value; // Update value if key exists
            return;
        }
        prev = current;
        current = current->next;
    }

    // Key not found, create a new node
    Node* newNode = new Node(key, value);

    if (prev == nullptr) {
        // Inserting at the head if list is empty
        head = newNode;
    } else {
        // Adding at the end of the list
        prev->next = newNode;
    }
    ++size;
}

// Find a node by key
Node* LinkedList::find(string key) {
    Node* current = head;

    // Traverse the list to find the node
    while (current != nullptr) {
        if (current->key == key) {
            return current;
        }
        current = current->next;
    }

    // Return nullptr if the key is not found
    return nullptr;
}

// Clear the linked list by deleting all nodes
void LinkedList::clear() {
    Node* current = head;

    while (current != nullptr) {
        Node* temp = current;
        current = current->next;
        delete temp;
    }

    head = nullptr;
    size = 0;
}
