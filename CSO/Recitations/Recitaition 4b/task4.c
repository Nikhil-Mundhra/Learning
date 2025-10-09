#include <stdio.h>
#include <ctype.h>
#include <string.h>

char print_permutations(char string[], int length) {
    char str[length];
    for (int i = 0; i < length; i++){
        str[0] = string[i];
        str[1] = print_permutations(string[i], --length);
    }
}

int main() {
    char str[] = "abc";
    char upperstr[100];
    int length = strlen(str);

    print_permutations(str[0], length);

    printf("%s\n%s\n", str, upperstr);
    return 0;
}
