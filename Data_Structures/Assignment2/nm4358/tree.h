//============================================================================
// Name         : tree.h
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 5 Nov
// Date Modified: 6 Nov
// Description  : Tree implementation in C++
//============================================================================
#ifndef _TREE_H
#define _TREE_H
#include<string>
#include "myvector.h"
#include "book.h"
using namespace std;
class Node
{
	private:
		string name;				//name of the Node
		MyVector<Node*> children;	//Children of Node
		MyVector<Book*> books;		//Books in every Node
		unsigned int bookCount;
		Node* parent; 				//link to the parent 

	public:
		//constructor to create an empty node (category/sub-category)
		Node(string name);

		// return category of a node (e.g. "Computer Science/Operating Systems")
		// where "Operator System" is the name of current node and "Operating System"
		// is the name of the parent node which is a child of the root node.
		string getCategory(Node* node);
		
		//deletes a node and clear/clean all its vectors
		~Node();	

	public:
		friend class Tree;
		friend class LCMS;
};
//==========================================================
class Tree
{
	private:
		Node *root;				//root of the Tree
		
	public:	 	//Required methods
		Tree(string rootName);	
		~Tree();
		Node* getRoot();
		void insert(Node* node,string name);			//insert a new child to a given node of of the tree
		void remove(Node* node,string child_name);		//remove a specific child from a given node of the tree
		bool isRoot(Node* node); 						//return true if the given node is the root, false otherwise
		Node* getNode(string path);						//given a path (category/sub-category/sub-category/..) the method should return the Node if found, false otherwise
		Node* createNode(string path);					//Create a node on a given path, e.g. category/sub-category/sub-category/...
		Node* getChild(Node *ptr, string childname);	//given a node and name of a child, the method returns pointer to the child node if exist, nullptr otherwise
		void updateBookCount(Node *ptr, int offset);	//update a books count by an offset e.g. +1/-1
		Book* findBook(Node *node, string bookTitle);	//find a book in a given node, returns nullptr the book is not found
		bool removeBook(Node* node,string bookTitle);   //remove a book from a given node
		void printAll(Node *node);					    //printAll books of a node and it children recursively (see output of findAll command)
		bool isLastChild(Node *ptr);	//given a pointer to node, the method should determine that the node is the last child in the children vector or not
		void print();			//Print all categories/sub-categories of a the tree. see output of list command (please use the implementation given below)
		void print_helper(string padding, string pointer,Node *node); // helper method for the print() (please use the implementation given below)
		int exportData(Node *node,ofstream& file);		//Export all books of a given node to a specific file.
		//bool isEmpty();									//return true if the tree is empty false otherwise
};
/*
//=========================================================================
void Tree::print()	//Print all categories/sub-categories in a tree format
{
	print_helper("","",root);
}
//==========================================================================
void Tree::print_helper(string padding, string pointer,Node *node) //helper method for the print method
{
    if (node != nullptr) 
    {

        cout <<padding<<pointer<<node->name<<"("<<node->bookCount<<")"<<endl;

		if(node!=root)	padding+=(isLastChild(node)) ? "   " : "│  ";

        for(int i=0; i<node->children.size(); i++)	//remove the file/folder from original path
		{
			string marker = isLastChild(node->children[i]) ? "└──" : "├──";
			print_helper(padding,marker, node->children[i]);
		}
    }
}*/
#endif
