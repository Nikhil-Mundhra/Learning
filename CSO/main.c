#include <stdio.h>

int add(int, int);
int mult(int, int);

int main(){
    int sum = add(5,0);
    printf("Sum = %d\n", sum);

    int product = mult(5,0);
    printf("Product = %d\n", product);

    int res1 = add(mult(5,6), mult(5,7));
    int res2 = mult(5, add(6,7));

    printf("Result 1= %d\n", res1);
    printf("Result 2= %d\n", res2);

    return 0;
}