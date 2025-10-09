//============================================================================
// Name         : borrower.cpp
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 5 Nov
// Date Modified: 6 Nov
// Description  : Borrower class implementation
//============================================================================

#include "borrower.h"
#include <iostream>

using namespace std;

// Constructor: Initializes a borrower with a name and ID
Borrower::Borrower(string name, string id) : name(name), id(id) {}

// Method to list all borrowed books by the borrower
void Borrower::listBooks() {
    cout << "Books borrowed by " << name << " (ID: " << id << "):" << endl;
    for (int i = 0; i < books_borrowed.size(); i++) {
        if (books_borrowed[i] != nullptr) {
            cout << "- " << books_borrowed[i]->title << endl;
        }
    }
}