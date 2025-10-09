#include <stdio.h>

void incArray(int *arr, int size) {
    int *ptr = arr; // Pointer to the first element of the array
    for (int i = 0; i < size; i++) {
        *ptr = *ptr + 1;
        ptr = ptr + 1;
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
    int arr[] = {20,40,60,90,10};
    int size = sizeof(arr) / sizeof(arr[0]); // Calculate array size

    incArray(arr, size);
    printArray(arr, size); // Call function to print array using pointers

    return 0;
}
