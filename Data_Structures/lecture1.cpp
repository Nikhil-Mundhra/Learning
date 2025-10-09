#include <iostream>
#include <string>
using namespace std;

void f(int& x, int& y){
    x++;    // increase x by 1
    y++;    // increase y by 1
    cout<< x << endl;
}
int main() {
    char ch = 'Q';
    char* p = &ch;
    char* ptr = p;
    cout << ptr;
    int n = 5; int m = 10;
    f(n,m);
    cout << n << m;
    return EXIT_SUCCESS;
}