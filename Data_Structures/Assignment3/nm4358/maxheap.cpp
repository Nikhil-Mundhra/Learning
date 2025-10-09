#include <string>
#include "hashtable.h"
#include "linkedlist.h"
#include "maxheap.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <stdexcept>
using namespace std;
using std::ifstream;
using std::string;
using std::stringstream;
#include "maxheap.h"


//This method prints a Heap in 2D format. 
void Heap::print()
{   
	int array_size = 16;  // replacing array.size with this
    if (array_size > array.size()){ array_size = array.size();}

	if(array_size>1)
	{
		int levels = int(log2(array_size));

		int *spaces = new int[levels+1];
		spaces[levels]=0;

		for(int j=levels-1; j>=0; j--)
		{
				spaces[j]=2*spaces[j+1]+1;
		}
		
		int level=0;
		for (int i=0; i<array_size-1; i++)
		{
			if(i == (pow(2,level)-1))
			{
				cout<<endl<<endl;
			
				for(int k=0; k < spaces[level]*2; k ++) cout <<   "   ";
				level++;
			}
			cout<<std::left<<setw(3)<<array[i+1]->head->getKey() << "["<< array[i+1]->getSize() <<"]";
		
			if(level>1)
			{
				for(int k=0; k< spaces[level-2]*2; k ++)
					cout<<"   ";
			}
			
		}
		cout<<endl;
		for(int i=0; i<spaces[0]*log2(array_size/2)+4; i++)
			cout<<"___";
		
		cout<<endl;
		delete[] spaces;
	}

}

//Constructor
Heap::Heap()
{
	array.push_back(0); //add a dummy value to the first location of the array that will remain unused
}
//starter_code_begins (please do not remove this line)
//==================================================================

// Insert an element in Heap keeping the Heap property intact 
void Heap::insert(LinkedList* key)
{
	//to-do
	array.push_back(key);         // Add the new key at the end
	bubbleup(array.size() - 1);   // Restore heap property by bubbling up
}
// Remove the minimum value from Heap keeping the Heap property intact
LinkedList* Heap::removeMax()
{
	//to-do
	if (array.size() <= 1) {
		throw out_of_range("Heap is empty.");
	}

	LinkedList* max = array[1];                 // The root element is the minimum
	array[1] = array.back();             // Replace root with the last element
	array.pop_back();                    // Remove last element
	if (array.size() > 1) {
		bubbledown(1);                   // Restore heap property by bubbling down
	}

	return max;
}
// Return (but don't remove) the minimum value from the Heap
string Heap::getMax()
{
	//to-do
	if (array.size() <= 1) {
		throw out_of_range("Heap is empty.");
	}
	return array[1]->head->getKey();   // The root element is the minimum
}
// Returns the index of the parent of the node k
int Heap::parent(int k)
{
	//to-do
	return k / 2; 	// Taking advantage of the binary tree structure
}
// Returns the index of the left child of the node k
int Heap::left(int k)
{
	//to-do
	return 2 * k;
}
// Returns the index of the right child of the node k
int Heap::right(int k)
{
	//to-do
	return 2 * k + 1;
}

void Heap::bubbleup(int k)
{
	//to-do
	while (k > 1 && array[k]->getSize() > array[parent(k)]->getSize()) {
		swap(array[k], array[parent(k)]);
		k = parent(k);
	}
}

void Heap::bubbledown(int k)
{
	//to-do
	int biggest = k;
	int leftChild = left(k);
	int rightChild = right(k);
    int biggest_size = array[biggest]->getSize();

	if (leftChild < array.size() && array[leftChild]->getSize() > biggest_size) {
		biggest = leftChild;
	}
	if (rightChild < array.size() && array[rightChild]->getSize() > biggest_size) {
		biggest = rightChild;
	}
	if (biggest != k) {
		swap(array[k], array[biggest]);
        //cout << "Swapped "<< array[biggest]->head->getKey() <<" with " << array[k]->head->getKey() << endl;
		bubbledown(biggest);
	}
}
//=====================================
// This method will sort the internal array/vector 
// Hints: 
// 		Keep extracting the min value from the heap and store them into an auxiliary array.
// 		Copy the values from auxiliary array to the internal array/vector of heap
void Heap::sort()
{
	//to-do
	vector<LinkedList*> sortedArray;
	int n = 0;
	// Extract min values to create sorted array
	while (array.size() > 1) {
		sortedArray.push_back(removeMax());
		n++;
	}
	// Copy sorted values back to the internal array
	for (int key = 0; key < n; key++) {
		array.push_back(sortedArray[key]);
	}
}
//=============================================