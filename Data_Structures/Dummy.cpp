#include <iostream>
#include <vector>
#include<iterator>
using namespace std;

int main ()
{
vector<int> myvector;
for (int i = 1; i <= 10; i++)
myvector.push_back(i);
myvector.erase (myvector.begin() + 6);
myvector.erase (myvector.begin(), myvector.begin() + 4);
for (unsigned i = 0; i < myvector.size(); ++i)
cout << ' ' << myvector[i];
return 0;
}

