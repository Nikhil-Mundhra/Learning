#include <stdio.h>
#include <ctype.h>
#include <string.h>

char to_upper(char letter) {
    if ((int)letter > 96){
        char upletter = letter - 32;
        return upletter;
    }
    return letter;
}

int main() {
    char str[] = "Nikhil is a fantastic CSO student";
    char upperstr[100];
    int length = strlen(str);

    for (int i = 0; i < length; i++){
        upperstr[i] = to_upper(str[i]);
    }
    printf("%s\n%s\n", str, upperstr);
    return 0;
}
