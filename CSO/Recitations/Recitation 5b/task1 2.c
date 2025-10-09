#include <stdio.h>

void printarr(int arr[], int len){
    for (int i = 0; i < len; i++){
        printf("%d ",arr[i]);
    }
    printf("\n");
}
int main(){
    int arr[] = {1,2,3,4,5};
    arr[2] = 7;
    printarr(arr,5);
    arr[2] = 10;
    printarr(arr,5);
    arr[2] = 0;
    printarr(arr, 5);
}

