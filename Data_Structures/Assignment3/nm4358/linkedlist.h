//============================================================================
// Author       : Khalid Mengal
// Version      : 1.0
// Date Created : 22-09-2020
// Date Modified: 18-11-2024
// Description  : Singly Linked-List implementation in C++
//============================================================================

#ifndef _LINKEDLIST_H
#define _LINKEDLIST_H
#include<iostream>
#include<string>
#include "maxheap.h"
using std::string;
//====================================
class Node
{
	private:
		string key;		// Stores the word 
		int value;		// Stores Hashcode of the word
		Node* next; 
		
	public:
		int freq = 1;
		Node(string key, int value); 
		string getKey();
		int getValue();
		void setKey(string key);
		void setValue(int value);
		friend class LinkedList;
		friend class Heap;
};
//=====================================
class LinkedList
{
	private:
		Node* head; // pointer to the head of list
		int size;	// number of elements in the list
	public:
		LinkedList (); // empty list constructor
		~LinkedList (); // destructor to clean up all nodes
		bool empty() const; // is  the list empty?
		unsigned int getSize() const; //return number of elements in the linked list
		void insert(string key, int value);	//Add a new key, pair value to the list, if the key already exist then update its value;
		Node* find(string key);	// Find a key and return the Node containing the key. return nullptr if the key is not found in the list
		void clear();	//clear/remove all nodes of the linked list
		friend class HashTable;
		friend class Heap;
};
#endif