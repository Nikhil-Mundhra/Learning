//============================================================================
// Name         : lcms.cpp
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 5 Nov
// Date Modified: 7 Nov
// Description  : Implementation of Library Circulation Management System (LCMS)
//============================================================================

#include "lcms.h"
#include "book.h"
#include "tree.h"
#include "myvector.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <ios>

using namespace std;

// Constructor
LCMS::LCMS(string name) {
    libTree = new Tree(name);
    cout << "LCMS initialized with root category: " << name << endl;
}

// Destructor
LCMS::~LCMS() {
    delete libTree;
    cout << "LCMS cleaned up." << endl;
}

// Import books from a CSV file
int LCMS::import(string path) {
    ifstream file(path); 
    if (!file) {
        cout << !file << endl;
        cerr << "Failed to open file: " << path << endl;
        return -1;
    }
    int n = 0;
    string line;
    getline(file, line);
    while (getline(file, line)) {
        //CSV file format
        //Title,Author,ISBN,Publication Year,Category,Total Copies,Available Copies

        stringstream ss(line);
        string title, author, isbn, category;
        int pub_year, total_copies, available_copies; 

        // Extract title, handling quotes
        if (line[0] == '"') {  // Title is enclosed in quotes
            size_t endPos = line.find('"', 1);
            if (endPos != string::npos) {
                title = line.substr(1, endPos - 1);
                line = line.substr(title.length() + 3); // Update the line after extracting the title
            } else {
                cerr << "Malformed title in line: " << line << std::endl;
                continue;
            }
        } else {
            getline(ss, title, ',');
            line = line.substr(title.length() + 1); // Update the line after extracting the title
        }

        ss.clear();  // Clear the previous stream state
        ss.str(line);  // Reset stringstream with the remaining line

        // Now handle author with potential quotes
        if (line[0] == '"') {  // Author is enclosed in quotes
            size_t endPos = line.find('"', 1);
            if (endPos != string::npos) {
                author = line.substr(1, endPos - 1);
                line = line.substr(author.length() + 3);
            } else {
                cerr << "Malformed author in line: " << line << std::endl;
                continue;
            }
        } else {
            getline(ss, author, ',');
            line = line.substr(author.length() + 1);
        }

        ss.clear();  // Clear the previous stream state
        ss.str(line);  // Reset stringstream with the remaining line
        //cout << line << endl;
        // Parse the rest of the fields
        getline(ss, isbn, ',');
        ss >> pub_year;
        ss.ignore(1, ',');  // Skip comma
        getline(ss, category, ',');
        ss >> total_copies;
        ss.ignore(1, ',');
        ss >> available_copies;
        
        // Create a new book object
        Book* book = new Book(title, author, isbn, pub_year, total_copies, available_copies);

        // Find or create the category node
        Node* categoryNode = libTree->getNode(category);
        if (!categoryNode) {
            categoryNode = libTree->createNode(category);
        }

        // Insert the book into the category node
        categoryNode->books.push_back(book);
        libTree->updateBookCount(categoryNode, 1);
        n++;
        //cout << "Book '" << title << "' added to category '" << category << "'" << std::endl;
        }
    cout << n << " records have been imported" << endl;
    file.close();
    return 0;
}

// Export all books to a given file
void LCMS::exportData(string path) {
    ofstream file(path);
    if (!file) {
        cerr << "Failed to open file: " << path << endl;
        return;
    }

    // Write CSV header
    file << "Title,Author,ISBN,Publication Year,Category,Total Copies,Available Copies" << endl;

    // Initialize stack for iterative tree traversal
    Node* root = libTree->getRoot();
    stack<Node*> nodesToVisit;
    nodesToVisit.push(root);

    while (!nodesToVisit.empty()) {
        Node* currentNode = nodesToVisit.top();
        nodesToVisit.pop();

        // Process each book in the current node
        for (int i = 0; i < currentNode->books.size(); i++) {
            Book* book = currentNode->books[i];

            // Manually construct each field to handle quotes and commas
            string title = book->title;
            string author = book->author;
            string isbn = book->isbn;
            int pub_year = book->publication_year;
            string category = currentNode->name;
            int total_copies = book->total_copies;
            int available_copies = book->available_copies;

            // Escape quotes and commas in title
            file << '"';
            for (int j = 0; j < title.size(); j++) {
                if (title[j] == '"') {
                    file << "\"\"";  // Double quote for escaping
                } else {
                    file << title[j];
                }
            }
            file << "\",";
            
            // Escape quotes and commas in author
            file << '"';
            for (int j = 0; j < author.size(); j++) {
                if (author[j] == '"') {
                    file << "\"\"";  // Double quote for escaping
                } else {
                    file << author[j];
                }
            }
            file << "\",";

            // Write remaining fields without special escaping
            file << isbn << ",";
            file << pub_year << ",";
            
            // Escape quotes and commas in category
            file << '"';
            for (int j = 0; j < category.size(); j++) {
                if (category[j] == '"') {
                    file << "\"\"";  // Double quote for escaping
                } else {
                    file << category[j];
                }
            }
            file << "\",";

            file << total_copies << ",";
            file << available_copies << endl;
        }

        // Push children nodes onto stack for later traversal
        for (int i = 0; i < currentNode->children.size(); i++) {
            nodesToVisit.push(currentNode->children[i]);
        }
    }

    file.close();
    cout << "Data exported to " << path << endl;
}


// Display all books of a category 
void LCMS::findAll(string category) {
    // to do
    Node* categoryNode = libTree->getNode(category);
    if (categoryNode) {
        //cout << "Books in the category '" << category << "':" << endl;
        libTree->printAll(categoryNode); // Recursively print books in this category and sub-categories
    } else {
        cout << "Category '" << category << "' not found." << endl;
    }
}

// Finds a given book by title and display its details
void LCMS::findBook(string bookTitle) {
    Node* root = libTree->getRoot();

    // Starting from root and check for the book in current node
    Book* book = libTree->findBook(root, bookTitle);
    if (book) {
        book->display();
        return;
    }
    // If the book wasn't found in any of the nodes
    cout << "Book not found." << endl;
}

// Add a new book to the catalog
void LCMS::addBook() {
    string title, author, isbn, category;
    int pub_year, total_copies;

    cout << "Title:             ";
    getline(cin, title);  // Use getline to handle spaces in the title
    while (title.empty()) {
        if (title.empty()) {
            cout << "Title cannot be empty. Please enter a valid title." << endl;
            cin >> title;
        }
    };
    cout << "Author:            ";
    getline(cin, author);  // Use getline to handle spaces
    cout << "ISBN:              ";
    getline(cin, isbn);  // Use getline to handle spaces
    while (true) {
        cout << "Publication Year:   ";
        if (cin >> pub_year && !cin.fail() && pub_year > 0 && pub_year <= 2024) { // Only accept valid integer within range
            break;
        } else {
            cout << "Please enter a valid publication year (an integer between 0 and 2024)." << endl;
            cin.clear(); // clear the error flag
            cin.ignore(numeric_limits<streamsize>::max(), '\n'); // discard invalid input
        }
    }
    cout << "Total Copies:    ";
    cin >> total_copies;
    cout << "Category:        ";
    cin.ignore();  // Clear any leftover newlines
    getline(cin, category);  // Use getline to handle spaces

    // Use the getNode() function to find the category node or create it if it doesn’t exist
    Node* categoryNode = libTree->getNode(category);
    if (categoryNode == nullptr) {
        categoryNode = libTree->createNode(category);
    }
    // If title, author, isbn, pub_year is same, simply update total_copies
    // Check if the book with the same title exists
    Book* existingBook = libTree->findBook(categoryNode, title);
    if (existingBook) {
        if (existingBook->author == author && existingBook->isbn == isbn && existingBook->publication_year == pub_year) {
            // Book exists, update the total copies
            existingBook->total_copies += total_copies;
            existingBook->available_copies += total_copies;
            cout << "Book updated with additional copies." << endl;
            return;
        }
    }

    // Create a new book
    Book* book = new Book(title, author, isbn, pub_year, total_copies, total_copies);

    // Update the book count in the category node
    libTree->updateBookCount(categoryNode, 1);

    categoryNode->books.push_back(book);  // Directly add book to the category’s book vector
    cout << title << " has been successfully added into the catalog" << endl;

}


// Edit an existing book's details
void LCMS::editBook(string bookTitle) {
    Node* root = libTree->getRoot();
    Book* book = libTree->findBook(root, bookTitle);
    
    if (!book) {
        cout << "Book not found." << endl;
        return;
    }

    cout << "1.     Title:             " << endl;
    cout << "2.     Author:            " << endl;
    cout << "3.     ISBN:              " << endl;
    cout << "4.     Publication Year:  " << endl;
    cout << "5.     Total Copies:      " << endl;
    cout << "6.     Available Copies:  " << endl;
    cout << "7.     Exit:  " << endl;

    string new_title = "", new_author = "", new_isbn = "";
    int new_pub_year = 2050, new_total_copies = -1, new_available_copies = -1;
    int choice = 0;
    while (choice != 7) {
        cout << "Choose the field you want to edit: ";
        cin >> choice;
        switch(choice) {
        case 1:
            cout << "Enter New Title: ";
            cin.ignore();  // Clear any leftover newlines
            getline(cin, new_title);  // Use getline to handle spaces in the title
            break;
        case 2:
            cout << "Enter New Author: ";
            cin.ignore();  // Clear any leftover newlines
            getline(cin, new_author);  // Use getline to handle spaces in the author
            break;
        case 3:
            cout << "Enter New ISBN: ";
            cin >> new_isbn;
            break;
        case 4:
            cout << "Enter New Publication Year: ";
            cin >> new_pub_year;
            break;
        case 5:
            cout << "Enter New Total Copies: ";
            cin >> new_total_copies;
            break;
        case 6:
            cout << "Enter New Available Copies: ";
            cin >> new_available_copies;
            break;
        case 7:
            cout << "Exiting edit..." << endl;
            break;
        default:
            cout << "Invalid choice. Please try again." << endl;
        }
    }
    //cout << new_title << endl;
    book->title = (new_title.empty() ? book->title : new_title);
    book->author = (new_author.empty() ? book->author : new_author);
    book->isbn = (new_isbn.empty() ? book->isbn : new_isbn);
    book->publication_year = (new_pub_year != 2050 ? new_pub_year : book->publication_year);
    book->total_copies = (new_total_copies != -1 ? new_total_copies : book->total_copies);
    book->available_copies = (new_available_copies != -1 ? new_available_copies : book->available_copies);
}

// Borrow a book
void LCMS::borrowBook(string bookTitle) {
    // Find the book starting from the root node
    Node* root = libTree->getRoot();
    Book* book = libTree->findBook(root, bookTitle);

    // Check if the book is available for borrowing
    if (book){
        if (book->available_copies == 0) {
            cout << "Book not available for borrowing." << endl;
            return;
        }

    // Prompt for borrower ID and Name
    string borrower_id, borrower_name;
    cout << "Enter Borrower Name:   ";
    getline(cin, borrower_name);  // Use getline to handle spaces in the title
    cout << "Enter Borrower ID:     ";
    cin >> borrower_id;

    Borrower* borrower = findBorrowerByID(borrower_id);
    
    // If borrower is not found
    if (!borrower) {
        cout << "Borrower not registered. Creating new registration" << endl;
        Borrower* newBorrower = new Borrower(borrower_name, borrower_id);
        borrowers.push_back(newBorrower);
        borrower = newBorrower;
    }

    // Process the borrowing manually
    book->available_copies--;                  // Decrement available copies of the book
    borrower->books_borrowed.push_back(book);   // Add the book to the borrower's borrowed books
    book->currentBorrowers.push_back(borrower);
    book->allBorrowers.push_back(borrower);

    cout << "Book '" << bookTitle << "' has been issued to " << borrower->name << "." << endl;
} 
}


// Return a borrowed book
void LCMS::returnBook(string bookTitle) {
    // Find the book in the tree
    Book* book = libTree->findBook(libTree->getRoot(), bookTitle);
    if (!book) {
        cout << "Book not found." << endl;
        return;
    }

    string borrower_id, borrower_name;
    cout << "Enter Borrower Name:   ";
    getline(cin, borrower_name);  // Use getline to handle spaces in the title
    cout << "Enter Borrower ID:     ";
    cin >> borrower_id;

    // Find the borrower
    Borrower* borrower = findBorrowerByID(borrower_id);
    if (!borrower) {
        cout << "Borrower not registered." << endl;
        return;
    }

    // Check if the borrower has borrowed this book
    bool found = false;
    for (size_t i = 0; i < book->currentBorrowers.size(); i++) {
        if (book->currentBorrowers[i] == borrower) {
            found = true;
            book->currentBorrowers.erase(i); // Remove the borrower
            break;
        }
    }

    if (!found) {
        cout << "This book was not borrowed by the specified borrower." << endl;
        return;
    }

    // Removing book from borrower's list
    book->available_copies++;
    for (int i = 0; i > borrower->books_borrowed.size(); i++){
        if (borrower->books_borrowed[i]->title == bookTitle) {
            borrower->books_borrowed.erase(i);
            break;
    }}

    cout << "Book has been returned successfully." << endl;
}


// List current borrowers of a book
void LCMS::listCurrentBorrowers(string bookTitle) {
    Book* book = libTree->findBook(libTree->getRoot(), bookTitle);
    if (book) {
        for (int i = 0; i < book->currentBorrowers.size(); i++){
            cout << 1 << book->currentBorrowers[i]->name << "(" << book->currentBorrowers[i]->id << ")" << endl;
        }
    }
    else {
        cout << "Book not found." << endl;  }
}

// List all borrowers who have ever borrowed a book
void LCMS::listAllBorrowers(string bookTitle) {
    Book* book = libTree->findBook(libTree->getRoot(), bookTitle);
    if (book) {
        for (int i = 0; i < book->allBorrowers.size(); i++){
            cout << "1 "<< book->currentBorrowers[i]->name << "(" << book->currentBorrowers[i]->id << ")" << endl;
        }
        cout << endl;
    }
    else cout << "Book not found." << endl;
}

// Display books a borrower has ever borrowed
void LCMS::listBooks(string borrower_name_id) {
    string b_id = "";
    stringstream ss(borrower_name_id);
    getline(ss, b_id, ',');
    getline(ss, b_id, ',');
    cout << b_id << endl;
    Borrower* borrower = findBorrowerByID(b_id);
    if (borrower) {
        for (int i = 0; i < borrower->books_borrowed.size(); i++){
            cout << i+1 << ": " << borrower->books_borrowed[i]->title << endl;
        }
    }
    else cout << "Borrower not found." << endl;
}

// Remove a book from the catalog
void LCMS::removeBook(string bookTitle) {
    Node* root = libTree->getRoot();
    string confirmation;
    cout << "Are you sure you want to delete the book " << bookTitle << "(yes/no): " << endl;
    cin >> confirmation;
    if (confirmation == "yes") {
        if (libTree->removeBook(root, bookTitle)){
            cout << "Book '" << bookTitle << "' has been successfully deleted." << endl;
        } else {
        cout << "Book not found." << endl;
        }
    }
}

// Add a category/subcategory in the catalog
void LCMS::addCategory(string category) {
    // Check if the category is valid or empty
    if (category.empty()) {
        cout << "Category name cannot be empty!" << endl;
        return;
    }

    // Split category string by '/'
    vector<string> categoryParts;
    stringstream ss(category);
    string part;
    
    while (getline(ss, part, '/')) {
        categoryParts.push_back(part);
    }

    // Start with the root node of the tree
    Node* currentNode = libTree->getRoot();

    // Traverse through each part of the category (e.g., "category/subcategory")
    for (int i = 0; i < categoryParts.size(); ++i) {
        bool found = false;

        // Check if the current category part already exists in the current node's children
        for (int j = 0; j < currentNode->children.size(); ++j) {
            if (currentNode->children[j]->name == categoryParts[i]) {
                currentNode = currentNode->children[j];  // Move to the child node
                found = true;
                break;
            }
        }

        // If the category part is not found, create a new node for it
        if (!found) {
            Node* newCategoryNode = new Node(categoryParts[i]);
            currentNode->children.push_back(newCategoryNode);
            currentNode = newCategoryNode;  // Move to the new child node
        }
    }

    cout << "Category '" << category << "' added to the catalog." << endl;
}


// Find a category in the catalog
void LCMS::findCategory(string category) {
    Node* root = libTree->getRoot();
    bool found = false;

    // Create a vector to simulate a stack
    vector<Node*> stack;
    stack.push_back(root);

    while (!stack.empty()) {
        // Get the current node from the end of the vector (simulating a stack's top)
        Node* currentNode = stack.back();
        stack.pop_back();  // Remove the last element

        // Check if the current node's name matches the category
        if (currentNode->name == category) {
            cout << "Category '" << category << "' was found in the catalog." << endl;
            found = true;
            break;
        }

        // Add all children of the current node to the vector (simulating pushing onto the stack)
        for (size_t i = 0; i < currentNode->children.size(); ++i) {
            stack.push_back(currentNode->children[i]);
        }
    }

    if (!found) {
        cout << "No such Category/SubCategory was found in the catalog." << endl;
    }
}


// Remove a category and all it's books from the catalog
void LCMS::removeCategory(string category) {
    Node* root = libTree->getRoot();

    // Create a vector to simulate a stack
    vector<Node*> stack;
    stack.push_back(root);

    bool categoryFound = false;
    Node* parentNode = nullptr;

    while (!stack.empty()) {
        Node* currentNode = stack.back();
        stack.pop_back(); // Remove the last element (LIFO)

        // Check if the current node's name matches the category
        if (currentNode->name == category) {
            categoryFound = true;
            parentNode = currentNode->parent;
            break;
        }

        // Add all children of the current node to the stack
        for (size_t i = 0; i < currentNode->children.size(); ++i) {
            stack.push_back(currentNode->children[i]);
        }
    }

    if (!categoryFound) {
        cout << "Category not found." << endl;
        return;
    }

    // Remove the category from its parent's children vector
    if (parentNode != nullptr) {
        for (size_t i = 0; i < parentNode->children.size(); ++i) {
            if (parentNode->children[i]->name == category) {
                parentNode->children.erase(i);
                cout << "Category '" << category << "' removed." << endl;
                break;
            }
        }
    } else {
        cout << "Cannot remove the root category." << endl;
    }
}


// Edit a category in the catalog
// Edit a category in the catalog
void LCMS::editCategory(string category) {
    // Get the root of the tree
    Node* root = libTree->getRoot();

    // Create a vector to simulate a stack for depth-first traversal
    vector<Node*> stack;
    stack.push_back(root);

    bool categoryFound = false;
    Node* currentNode = nullptr;

    while (!stack.empty()) {
        // Get the current node from the stack
        currentNode = stack.back();
        stack.pop_back(); // Remove the last element (LIFO)

        // Check if the current node's name matches the category
        if (currentNode->name == category) {
            categoryFound = true;
            break; // Category found, exit the loop
        }

        // Add all children of the current node to the stack
        for (size_t i = 0; i < currentNode->children.size(); ++i) {
            stack.push_back(currentNode->children[i]);
        }
    }
    if (!categoryFound) {
        cout << "Category not found." << endl;
        return;
    }
    // Prompt user for the new category name
    string newCategoryName;
    cout << "Enter new category name: ";
    cin >> newCategoryName;

    // Ensure the new category name is not empty or the same as the current name
    if (newCategoryName.empty() || newCategoryName == category) {
        cout << "Invalid category name." << endl;
        return;
    }
    // Update the category name
    currentNode->name = newCategoryName;
    cout << "Category name updated to: " << newCategoryName << endl;
}


// Find a borrower by ID
Borrower* LCMS::findBorrowerByID(string id) {
    for (int i = 0; i < borrowers.size(); i++) {
        if (borrowers[i]->id == id) return borrowers[i];
    }
    return nullptr;
}
