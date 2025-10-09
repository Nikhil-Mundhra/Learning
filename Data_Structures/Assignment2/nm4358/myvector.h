//============================================================================
// Name         : myvector.h
// Author       : Nikhil Mundhra
// Version      : 1.0
// Date Created : 5 Nov
// Date Modified: 6 Nov
// Description  : Vector implementation in C++
//============================================================================
#ifndef MYVECTOR_H
#define MYVECTOR_H
#include<iostream>
#include<cstdlib>
#include<iomanip>
#include <stdexcept>
#include<sstream>

using namespace std;
template <typename T>
class MyVector
{
	private:
		T *data;						//pointer to int(array) to store elements
		int v_size;						//current size of vector (number of elements in vector)
		int v_capacity;					//capacity of vector
	public:
		MyVector();						//No argument constructor
		MyVector(int cap);				//One Argument Constructor
		MyVector(const MyVector& other);		//Copy Constructor
		~MyVector();					//Destructor
		void push_back(T element);		//Add an element at the end of vector
		void insert(int index, T element); //Add an element at the index 
		void erase(int index);			//Removes an element from the index
		T& operator[](int index);		//return reference of the element at index
		T& at(int index); 				//return reference of the element at index
		const T& front();				//Returns reference of the first element in the vector
		const T& back();				//Returns reference of the Last element in the vector
		int size() const;				//Return current size of vector
		int capacity() const;			//Return capacity of vector
		bool empty() const; 			//Return true if the vector is empty, False otherwise
		void shrink_to_fit();			//Reduce vector capacity to fit its size
};
//========================================
template <typename T>
MyVector<T>::MyVector()
{
	//to-do
	data = nullptr;
	v_size = 0;
	v_capacity = 0;
}
//========================================
template <typename T>
MyVector<T>::MyVector(int cap)
{
	//to-do
	v_size = 0;
	v_capacity = cap;
	data = new T[v_capacity];
}
//========================================
template <typename T>
MyVector<T>::MyVector(const MyVector &other) : v_size(other.v_size), v_capacity(other.v_capacity) 
{
	//to-do
    data = new T[v_capacity];
    for (int i = 0; i < v_size; ++i) {
        data[i] = other.data[i];
    }
}
//========================================
template <typename T>
MyVector<T>::~MyVector()
{
	//to-do
	delete[] data;
}
//========================================
template <typename T>
int MyVector<T>::size() const
{
	//to-do
	return v_size;
}
//========================================
template <typename T>
int MyVector<T>::capacity() const
{
	//to-do
	return v_capacity;
}
//========================================
template <typename T>
bool MyVector<T>::empty() const
{
	//to-do
	return v_size == 0;
}
//========================================
template <typename T>
void MyVector<T>::push_back(T element)
{

	//to-do
	if (v_size == v_capacity) {
        v_capacity = (v_capacity == 0) ? 1 : v_capacity * 2;
        T *new_data = new T[v_capacity];
        for (int i = 0; i < v_size; ++i) {
            new_data[i] = data[i];
        }
        delete[] data;
        data = new_data;
    }
    data[v_size++] = element;
}
//===============================================================================
template <typename T>	
void MyVector<T>::insert(int index,T element)
{

	//to-do
	if (index < 0 || index > v_size) {
        throw out_of_range("Index out of range");
    }
    if (v_size == v_capacity) {
        v_capacity = (v_capacity == 0) ? 1 : v_capacity * 2;
        T *new_data = new T[v_capacity];
        for (int i = 0; i < v_size; ++i) {
            new_data[i] = data[i];
        }
        delete[] data;
        data = new_data;
    }
    for (int i = v_size; i > index; --i) {
        data[i] = data[i - 1];
    }
    data[index] = element;
    v_size++;
}
//================================================================================
template <typename T>	
void MyVector<T>::erase(int index)
{
	//to-do
	if (index < 0 || index >= v_size) {
        throw out_of_range("Index out of range");
    }
    for (int i = index; i < v_size - 1; ++i) {
        data[i] = data[i + 1];
    }
    v_size--;
}
//==================================================================================
template <typename T>
T& MyVector<T>::operator[](int index)
{
		//to-do
		if (index < 0 || index >= v_size) {
        	throw out_of_range("Index out of bounds");
    	}
		return data[index];
}
//========================================
template <typename T>
T& MyVector<T>::at(int index)
{
		//to-do
		if (index < 0 || index >= v_size) {
        	throw out_of_range("Index out of range");
		}
		return data[index];
}
//========================================
template <typename T>
const T& MyVector<T>::front()
{
		//to-do
		if (empty()) {
        	throw out_of_range("Vector is empty");
		}
		return data[0];
}
//========================================
template <typename T>
const T& MyVector<T>::back()
{
		//to-do
		if (empty()) {
        	throw out_of_range("Vector is empty");
		}
		return data[v_size-1];
}
//======================================
template <typename T>
void MyVector<T>::shrink_to_fit()		//Reduce vector capacity to fit its size.
{
		//to-do
		if (v_capacity > v_size) {
			v_capacity = v_size;
			T *new_data = new T[v_capacity];
			for (int i = 0; i < v_size; ++i) {
				new_data[i] = data[i];
			}
			delete[] data;
			data = new_data;
    }
}
#endif