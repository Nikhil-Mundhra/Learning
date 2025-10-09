//============================================================================
// Name         : borrower.h
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 3 Nov
// Date Modified: 6 Nov
// Description  : 
//============================================================================
#ifndef _BORROWER_H
#define _BORROWER_H
#include "myvector.h"
#include "book.h"


class Borrower
{
	private:
		string name;
		string id;
		MyVector<Book*> books_borrowed;
	public:
		Borrower(string name, string id);
		friend class LCMS;
		friend class Tree;
		friend class Book;
		void listBooks();
};
#endif
