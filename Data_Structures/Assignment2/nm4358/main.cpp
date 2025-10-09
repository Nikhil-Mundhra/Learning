//============================================================================
// Name         : Library Catalog Management System
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 3 Nov
// Date Modified: 6 Nov
// Description  : A  catalog management system using a general tree data structure
//============================================================================
#include<iostream>
#include "lcms.h"
using namespace std;

void listCommands();

int main()
{
	LCMS lcms("Library");
	listCommands();
	do
	{
		string user_input= "";
		string command   = "";
		string parameter = "";
		try
		{
			cout<<"> ";
			getline(cin,user_input);
			
			// parse user-input into command and parameter(s)
			stringstream sstr(user_input);
			getline(sstr,command,' ');
			getline(sstr,parameter);
			//cout << parameter << endl;
	
			
			//add code as necessary
			     if(command=="import") 			lcms.import(parameter); 
			else if(command=="export")    	    lcms.exportData(parameter);
			else if(command=="list")			lcms.list();
			else if(command=="findAll")     	lcms.findAll(parameter);
			else if(command=="findBook")		lcms.findBook(parameter);
			else if(command=="addBook") 		lcms.addBook();
			else if(command=="editBook")		lcms.editBook(parameter);
			else if(command=="borrowBook")      lcms.borrowBook(parameter);
			else if(command=="returnBook")      lcms.returnBook(parameter);
			else if(command=="removeBook")      lcms.removeBook(parameter);
			else if(command=="listCurrentBorrowers")  lcms.listCurrentBorrowers(parameter);
			else if(command=="listAllBorrowers")  lcms.listAllBorrowers(parameter);
			else if(command=="listBooks")       lcms.listBooks(parameter);
			else if(command=="findCategory")    lcms.findCategory(parameter);
			else if(command=="addCategory")    lcms.addCategory(parameter);
			else if(command=="removeCategory")  lcms.removeCategory(parameter);
			else if(command == "help")			listCommands();
			else if(command == "exit")			break;
			else 								cout<<"Invalid Command!"<<endl;
			fflush(stdin);
		}
		catch(exception &ex)
		{
			cout<<ex.what()<<endl;
		}
	}while(true);

	return EXIT_SUCCESS;
}
//======================================================================================
void listCommands()
{
	cout<<" ===================================================================================="<<endl
        <<" Welcome to the Library Catalog Management System!\n"<<endl
        <<" List of available Commands:"<<endl
		<<" import <file_name>                          : Read a Book file from a file"<<endl
		<<" export <file_name>                          : Export Books to a file"<<endl
		<<" findBook <title of the book>                : Search a book in the catalog"<<endl
		<<" findAll <category/sub-category/..>          : List all books in a category/sub-category"<<endl
		<<" addBook                                     : Add a book to the Catalog"<<endl
		<<" editBook <title of the book>                : Edit a book detail in the catalog"<<endl
		<<" removeBook <title of the book>              : Remove a book from the Catalog"<<endl
		<<" borrowBook <title of the book>              : Borrow a book from the Library"<<endl
		<<" returnBook <title of the book>              : Return a book to the Library"<<endl
		<<" listCurrentBorrowers <title of the book>    : Print the list of Borrowers of a book"<<endl
		<<" listAllBorrowers <title of the book>        : Print the list of all Borrowers that have every borrowed this book"<<endl
		<<" listBooks <borrower's name, borrower's id>  : Print the list of books borrowed by a borrower"<<endl
		<<" findCategory                                : Find a category in the catalog"<<endl
		<<" addCategory <category/sub-category/...>     : Add a category/sub-category to the catalog"<<endl
		<<" removeCategory <category/sub-category/...>  : Remove a category/sub-category from the catalog"<<endl
		//<<" editCategory <category/sub-category/...>    : Edit a category/sub-category"<<endl
		<<" list                                        : Display all categories from the catalog"<<endl
		<<" help                                        : Display the list of available commands"<<endl
		<<" exit                                        : Exit the Program"<<endl
		<<" ====================================================================================\n"<<endl;	
}

