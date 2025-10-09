#include <stdio.h>
#include <limits.h>


int main(void) {
    // Compute range for signed char
    signed char smin_char = (signed char)1 << (sizeof(signed char) * 8 - 1);
    signed char smax_char = ~smin_char;
    unsigned char umin_char = 0;
    unsigned char umax_char = (unsigned char)~0;

    // Compute range for signed short
    short smin_short = (short)(1 << (sizeof(short) * 8 - 1)); // -32768
    short smax_short = ~smin_short;
    unsigned short umin_short = 0;
    unsigned short umax_short = (unsigned short)~0;

    // Compute range for signed int
    int smin_int = 1 << (sizeof(int) * 8 - 1);
    int smax_int = ~smin_int;
    unsigned int umin_int = 0;
    unsigned int umax_int = ~0U;

   

    // Print computed values and compare with <limits.h>
    printf("Signed char: computed min = %d, computed max = %d\n", smin_char, smax_char);
    printf("Signed char: <limits.h> SCHAR_MIN = %d, SCHAR_MAX = %d\n\n", SCHAR_MIN, SCHAR_MAX);
    
    printf("Unsigned char: computed min = %u, computed max = %u\n", umin_char, umax_char);
    printf("Unsigned char: <limits.h> UCHAR_MAX = %u\n\n", UCHAR_MAX);

    printf("Signed short: computed min = %d, computed max = %d\n", smin_short, smax_short);
    printf("Signed short: <limits.h> SHRT_MIN = %d, SHRT_MAX = %d\n\n", SHRT_MIN, SHRT_MAX);
    
    printf("Unsigned short: computed min = %u, computed max = %u\n", umin_short, umax_short);
    printf("Unsigned short: <limits.h> USHRT_MAX = %u\n\n", USHRT_MAX);

    printf("Signed int: computed min = %d, computed max = %d\n", smin_int, smax_int);
    printf("Signed int: <limits.h> INT_MIN = %d, INT_MAX = %d\n\n", INT_MIN, INT_MAX);
    
    printf("Unsigned int: computed min = %u, computed max = %u\n", umin_int, umax_int);
    printf("Unsigned int: <limits.h> UINT_MAX = %u\n", UINT_MAX);

    return 0;
}
