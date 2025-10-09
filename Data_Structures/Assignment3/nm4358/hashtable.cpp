//============================================================================
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 22-09-2020
// Date Modified: 18-11-2024
// Description  : Hash Table implementation in C++
//============================================================================

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

HashTable::HashTable(int capacity)
{
    this->capacity = capacity;
    this->buckets = new LinkedList[capacity]; // Create an array of linked lists
    this->myHeap = new Heap; // Create a heap
    this->collisions = 0;
    this->unique_words = 0;
    this->total_words = 0;
    this->hash_code_function = 1; // Default hash function
}

unsigned long HashTable::hashCode(string key) {
    unsigned long hash = 0;
    if (hash_code_function == 1) {      // Gives 584 collisions
        // Function 1: Simple Polynomial Rolling Hash (Base 31)
        for (int i = 0; i < key.length(); i++) {
            hash = hash * 31 + key[i];
        }
    } else if (hash_code_function == 2) {      // Gives 683 collisions
        // Function 2: Bitwise XOR-Based Hash
        for (int i = 0; i < key.length(); i++) {
            hash ^= (hash << 5) + (hash >> 2) + key[i];
        }
    } else if (hash_code_function == 3) {      // Gives 677 collisions
        // Function 3: Multiplicative Hash
        unsigned long multiplier = 37; // Prime multiplier
        for (int i = 0; i < key.length(); i++) {
            hash = hash * multiplier + key[i];
        }
    } else if (hash_code_function == 4) {        // Gives 666 collisions
        // Function 4: DJB2 Hash (Daniel J. Bernstein)
        hash = 5381; // Initial seed
        for (int i = 0; i < key.length(); i++) {
            hash = ((hash << 5) + hash) + key[i]; // hash * 33 + c
        }
    } else if (hash_code_function == 5) {        // Gives 693 collisions
        // Function 5: SDBM Hash
        for (int i = 0; i < key.length(); i++) {
            hash = key[i] + (hash << 6) + (hash << 16) - hash;
        }
    } else if (hash_code_function == 6) {        // Gives 695 collisions
        // Function 6: CRC-Like Hash
        for (int i = 0; i < key.length(); i++) {
            hash = (hash << 4) ^ (hash >> 28) ^ key[i];
        }
    } else {
        throw std::invalid_argument("Unsupported hash_code function");
    }

    return hash % capacity; // Ensure hash fits within the table size
}


unsigned int HashTable::getCollisions()
{
    return collisions;
}

unsigned int HashTable::getUniqueWords()
{
    return unique_words;
}

unsigned int HashTable::getTotalWords()
{
    return total_words;
}

void HashTable::insert(string word)
{
    unsigned long index = hashCode(word);
    // Search for the word in the linked list at the bucket
    Node* foundNode = buckets[index].find(word);
    if (foundNode == nullptr){
        // Word does not exist, insert it
        buckets[index].insert(word, index);
        unique_words++;
        myHeap->insert(&buckets[index]);
        if (buckets[index].getSize() > 1) {
            collisions++;   // Increment collision count
            //cout << word + " - " + buckets[index].head->getKey() + " :"<< index << endl;
        }
    }
    else if (foundNode->getKey() == word) {
        // Word already exists in the table, update its frequency
        foundNode->setValue(foundNode->freq++); // Increment frequency
        //cout << word + " : " << index << endl;
        // Update the heap
        myHeap->bubbleup(unique_words - 1);
        buckets[index].size++;
    }
    else {
        // Increment collision count if other distinct keys exist in the bucket
            collisions++;
            buckets[index].insert(word, index);
        }

    total_words++;
}

int HashTable::find_freq(string word)
{   
    if (word == ""){
        cout << "Error: Please try again. ";
        return 0;
    }
    unsigned long index = hashCode(word);
    Node* word_node =  buckets[index].find(word);
    if (word_node == nullptr) { return 0; } // No such word found
    else {
        return word_node->freq;
    }
}

void HashTable::import(string path){
    ifstream file(path);
    if (!file.is_open()){
        cout << "Unable to open file: " + path << endl;
        return;
    }
    string line, word;
    // Define a string containing all punctuation to be removed
    const string punctuation = ".,!?;\"'“”‘’"; //#[]:()-
    while (getline(file, line))
    {
        stringstream ss(line);
        while (ss >> word)
        {
            // Normalize word: remove leading/trailing punctuation
            size_t start = 0, end = word.size() - 1;

            // Remove punctuation from the start
            while (start < word.size() && punctuation.find(word[start]) != string::npos)
            {
                ++start;
            }
            // Remove punctuation from the end
            while (end > start && punctuation.find(word[end]) != string::npos)
            {
                --end;
            }
            // Extract the cleaned word
            string cleanedWord = word.substr(start, end - start + 1);
            // Convert to lowercase
            for (char &c : cleanedWord)
            {
                c = tolower(c);
            }
            // Insert the cleaned word if it is not empty
            if (!cleanedWord.empty())
            {
                insert(cleanedWord);
            }
        }
    }
    file.close();
    for (int i = 1; i < unique_words/2; i++){
        myHeap->bubbledown(i);
        myHeap->bubbleup(i);
    }
    cout << "Done!" << endl << endl;
    cout << "The number of collisions is:" << collisions << endl;
    cout << "The number of unique words is:" << unique_words << endl;
    cout << "The total number of words is:" << total_words << endl;

}

string HashTable::findMax(){	//Gives the max from maxheap
    return myHeap->getMax();
} 				

HashTable::~HashTable()
{
    delete[] buckets; // Free the array of linked lists
}

