//============================================================================
// Name         : book.cpp
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 3 Nov
// Date Modified: 6 Nov
// Description  : Book class implementation
//============================================================================

#include "book.h"
#include "borrower.h"
#include <iostream>
using namespace std;

// Constructor to initialize a book with given details
Book::Book(string title, string author, string isbn, int publication_year, int total_copies, int available_copies)
    : title(title), author(author), isbn(isbn), publication_year(publication_year), total_copies(total_copies), available_copies(available_copies) {}

// Display function to show the details of the book
void Book::display() {
    cout << "Title:             " << title << endl;
    cout << "Author(s):         " << author << endl;
    cout << "ISBN:              " << isbn << endl;
    cout << "Year:              " << publication_year << endl;
    cout << "Total Copies:      " << total_copies << endl;
    cout << "Available Copies:  " << available_copies << endl;

    cout << "Current Borrowers: ";
    for (size_t i = 0; i < currentBorrowers.size(); ++i) {
        Borrower* j = currentBorrowers.at(i);
        cout << j->name << (i < currentBorrowers.size() - 1 ? ", " : "");
    }
    cout << endl;

    cout << "All Borrowers:     ";
    for (size_t i = 0; i < allBorrowers.size(); ++i) {
        cout << allBorrowers.at(i)->name << (i < allBorrowers.size() - 1 ? ", " : "");
    }
    cout << endl;
    cout << "-------------------------------------------------------------" << endl;
}
