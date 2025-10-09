#include <stdio.h>

void check_endianness() {
    unsigned int num = 1;
    char *byte = (char*)&num;

    if (*byte) {
        printf("Little Endian\n");
    } else {
        printf("Big Endian\n");
    }
}

int main() {
    check_endianness();
    return 0;
}
