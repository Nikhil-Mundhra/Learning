#include <stdio.h>
#include <ctype.h>
#include <string.h>

int check_vowel(char letter) {
    letter = tolower(letter);
    printf("%c", letter);
    if ((letter == 'a') || (letter == 'e') || (letter == 'i') || (letter == 'o') || (letter == 'u')) {
        return 1;
    }
    return 0;
}

int main() {
    char str[] = "Nikhil";
    int length = strlen(str);
    int count = 0;
    for (int i = 0; i < length; i++){
        count = count + check_vowel(str[i]);
    }
    printf("\n%d\n", count);
    return 0;
}
