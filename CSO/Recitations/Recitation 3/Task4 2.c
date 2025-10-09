#include <stdio.h>

// Method 1: Bit-by-bit checking
unsigned int countSetBits(unsigned int x) {
    unsigned int count = 0;
    while (x) {
        // Add 1 if the least significant bit is 1.
        count += (x & 1);
        // Shift x right by one bit.
        x = x >> 1;
    }
    return count;
}

// Method 2: Brian Kernighan's Algorithm
unsigned int countSetBitsBK(unsigned int x) {
    unsigned int count = 0;
    while (x) {
        // Clear the lowest set bit.
        x &= (x - 1);
        count++;
    }
    return count;
}

int main(void) {
    //unsigned int x;

    // Prompt the user for input.
    //printf("Enter an unsigned integer: ");
    //if (scanf("%u", &x) != 1) {
    //    printf("Error reading input.\n");
    //    return 1;
    //}
    unsigned int x = 254;
    // Count the set bits using both methods.
    unsigned int count1 = countSetBits(x);
    unsigned int count2 = countSetBitsBK(x);
    
    printf("\nFor the number %u:\n", x);
    printf("Number of set bits (bit-by-bit method): %u\n", count1);
    printf("Number of set bits (Brian Kernighan's method): %u\n", count2);
    
    return 0;
}
