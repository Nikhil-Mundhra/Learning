#include <stdio.h>

void MergeArray(int *arr, int *arr2, int size, int size2, int usize) {
    int *ptr1 = arr; // Pointer to the first element of the array
    int *ptr2 = arr2;
    int *ptr = arr;
    ptr = ptr + size-1;
    ptr1 = ptr1 + usize-1;
    ptr2 = ptr2 + size2-1; // access the back
    int j = size2;
    for (int i = 0; i < size; i++) {
        if (*ptr1 > *ptr2){
            *ptr = *ptr1;
            ptr1 = ptr1 - 1;
        } else {
            *ptr = *ptr2;
            ptr2 = ptr2 - 1;
        }
        ptr = ptr - 1;
    }
}

void printArray(int *arr, int size) {
    int *ptr = arr; // Pointer to the first element of the array

    printf("Array elements: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", *(ptr + i)); // Accessing array elements using pointer arithmetic
    }
    printf("\n");
}

int main() {
    int arr[10] = {2,4,6,9,12};
    int arr2[5] = {1,3,5,10,14};
    int useful_elements1 = 5;
    int size1 = sizeof(arr) / sizeof(arr[0]); // Calculate array size
    int size2 = sizeof(arr2) / sizeof(arr2[0]); // Calculate array size
    printf("%d\n",size1);
    MergeArray(arr, arr2, size1, size2, useful_elements1);
    printArray(arr, size1); // Call function to print array using pointers

    return 0;
}
