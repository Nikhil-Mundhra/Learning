#include <stdio.h>

int main(){
    printf("\n  AND Table\n");
    for (int i = 0; i < 2; i++){
        for (int j = 0; j < 2; j++){
            printf("|-----------|\n| ");
            printf("%d & %d = %d |\n", i, j, (int) (i & j));
        }
    }
    printf("|-----------|\n ");
    printf("\n   OR Table\n");
    for (int i = 0; i < 2; i++){
        for (int j = 0; j < 2; j++){
            printf("|------------|\n| ");
            printf("%d || %d = %d |\n", i, j, (int) (i || j));
        }
    }
    printf("|------------|\n ");
    printf("\nBitwise exclusive OR (XOR) Table\n");
    for (int i = 0; i < 2; i++){
        for (int j = 0; j < 2; j++){
            printf("|-----------|\n| ");
            printf("%d ^ %d = %d |\n", i, j, (int) (i ^ j));
        }
    }
    printf("|-----------|\n");
    
    return 0;
}