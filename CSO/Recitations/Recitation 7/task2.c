#include <stdio.h>
#include <stdint.h>

int main() {
    uint8_t a = 127;  // Max positive 8-bit signed int
    uint8_t b = 127;  // Same
    uint8_t result = a + b;

    printf("a = %u, b = %u, result = %u\n", a, b, result);
    return 0;
}
