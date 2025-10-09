#include <stdio.h>
#include <stdlib.h>

struct node
{
    /* data */
    struct node *ptr;
    int value;
};  

void print_nodes(struct node *cursor){
    while (cursor != NULL){
        printf("%d ", cursor->value);
        cursor = cursor->ptr;
    }
    printf("\n");
}

// Function to add a node at the end
void add_node(struct node **head, int val) {
    struct node *new_node = (struct node *)malloc(sizeof(struct node));
    if (new_node == NULL) {
        printf("Memory allocation failed!\n");
        return;
    }
    new_node->value = val;
    new_node->ptr = NULL;

    if (*head == NULL) { // If list is empty, new node becomes head
        *head = new_node;
        return;
    }

    struct node *temp = *head;
    while (temp->ptr != NULL) { // Traverse to the last node
        temp = temp->ptr;
    }
    temp->ptr = new_node;
}

int main(){
    struct node *head = (struct node *)malloc(sizeof(struct node)); //  Allocate memory

    // declare new node
    struct node *new_node = (struct node *)malloc(sizeof(struct node));
    new_node->value = 0;
    new_node->ptr = NULL;

    head->ptr = new_node;

    print_nodes(head);
    
    struct node *ptr = head->ptr;
    head = head->ptr->ptr;   // Now head = NULL
    free(ptr);  
    ptr = NULL;

    print_nodes(head);
}