#include <stdio.h>

void printArray(int *arr, int size) {
    int *ptr = arr; // Pointer to the first element of the array

    printf("Array elements: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", *(ptr + i)); // Accessing array elements using pointer arithmetic
    }
    printf("\n");
}

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int size = sizeof(arr) / sizeof(arr[0]); // Calculate array size

    printArray(arr, size); // Call function to print array using pointers

    return 0;
}
