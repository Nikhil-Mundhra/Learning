#include <stdio.h>

int main(){

    int a = -1;
    unsigned int b = 1;
    
    if (a < (int) b) { // the (int) converts b into a signed int.
        printf("%d is smaller than %d\n", a, b);
    } else if (a > (int) b){ // without the (int), it will output -1 is larger than 1
        printf("%d is larger than %d\n", a, b);
    }
    return 0;
}