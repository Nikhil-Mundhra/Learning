#include <stdlib.h>  // for malloc

typedef struct node {
    long id ;
    char *name ;
    struct node *next ;
} node ;

int main(){
    // Q 1.1 Part 2: We must add this line to allocate memory for a node, and assign it the pointer n.
    node *n = (node *)malloc(sizeof(node));

    // Q 1.1 Part 1
    n->id = 10;     // movq $10, 0(%rdi)
    n->name = NULL; // movq $0, 8(%rdi)
    n->next = n;    // movq %rdi, 16(%rdi)
}

char* mystery(node* n, long id) {
    while (n != NULL) {
        if (n->id == id) {
            return n->name;
        }
        n = n->next;
    }
    return NULL;
}
