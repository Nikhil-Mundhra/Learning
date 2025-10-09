#ifndef _MAXHEAP_H
#define _MAXHEAP_H

#include <iostream>
#include <exception>
#include <math.h>
#include <ctime>
#include <vector>
#include <iomanip>
#include <sstream>
#include <string>

//#include "linkedlist.h" // Ensure linkedlist.h is included properly


#include "linkedlist.h" // Ensure linkedlist.h is included properly
#include "hashtable.h"

using namespace std;

// Forward declaration of LinkedList to resolve circular dependency
class LinkedList;

class Heap
{
	private:
		vector<LinkedList*> array;
	public:
		Heap();
		void insert(LinkedList* key);
		LinkedList* removeMax();
		string getMax();
		int parent(int k);
		int left(int k);
		int right(int k);
		void bubbleup(int k);
		void bubbledown(int k);
		void print();
		void sort();
};

#endif