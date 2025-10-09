#include <stdio.h>

// Function to merge sorted array b into sorted array a in-place.
// 'a' has m valid elements, followed by space for n additional elements.
// 'b' has n elements.
void mergeFromBack(int a[], int m, int b[], int n) {
    int i = m - 1;     // Last valid element in a
    int j = n - 1;     // Last element in b
    int k = m + n - 1; // End of array a after merging

    // Merge from back: compare elements and place the larger one at a[k]
    while (i >= 0 && j >= 0) {
        if (a[i] > b[j])
            a[k--] = a[i--];
        else
            a[k--] = b[j--];
    }
    // If any elements remain in b, copy them
    while (j >= 0) {
        a[k--] = b[j--];
    }
    // Remaining elements in a are already in place.
}

int main(void) {
    // Example arrays:
    // a has 5 valid elements and extra space for 5 more elements.
    int a[10] = {1, 3, 5, 7, 9};
    int m = 5;
    // b is a sorted array with 5 elements.
    int b[5] = {2, 4, 6, 8, 10};
    int n = 5;

    mergeFromBack(a, m, b, n);

    printf("Merged array: ");
    for (int i = 0; i < m + n; i++) {
        printf("%d ", a[i]);
    }
    printf("\n");

    return 0;
}
