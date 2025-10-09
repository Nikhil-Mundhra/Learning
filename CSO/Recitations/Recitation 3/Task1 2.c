#include <stdio.h>

int main(){
    unsigned char u_value = 0xA9;
    signed char s_value = (signed char)0xA9;

    unsigned char logical_shift = u_value >> 3;
    signed char arithmetic_shift = s_value >> 3;

    printf("Original value:             0x%02X\n", u_value);
    printf("Logical right shift (>> 3): %d\n", logical_shift);
    printf("Arithmetic right shift (>> 3): %d\n", (signed char)arithmetic_shift);

    return 0;
}