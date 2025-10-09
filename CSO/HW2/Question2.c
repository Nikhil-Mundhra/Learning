#include <stdio.h>
#include <stdlib.h>   // for malloc

typedef struct node {
    int val;
    struct node *next;
} node;

// insert val in the front of the linked list
// returns new head
void insert_front(node **headdp, int val) {
    node *new_node = (node *)malloc(sizeof(node)); // Allocating memory for new nodes using malloc
    if (new_node == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(EXIT_FAILURE);
    }
    new_node->val = val;            // set data field :contentReference[oaicite:3]{index=3}
    new_node->next = *headdp;       // point to old head :contentReference[oaicite:4]{index=4}
    *headdp = new_node;             // update head pointer
}

// Traverse the list from head to NULL, printing each value.
void print_list(node *head) {
    node *current = head;
    while (current != NULL) {       // iterate until end :contentReference[oaicite:5]{index=5}
        printf("%d -> ", current->val);
        current = current->next;
    }
    printf("NULL\n");
}

// Free all nodes in the list to avoid memory leaks.
void free_list(node *head) {
    node *temp;
    while (head != NULL) {          // loop until list is exhausted :contentReference[oaicite:6]{index=6}
        temp = head->next;          // save next pointer
        free(head);                 // free current node
        head = temp;                // move to next
    }
}

int main() {
    node *headp = NULL;             // Initially , the list is empty
    // Insert elements at the front of the list
    for (int i = 0; i < 3; i++) {
        insert_front(&headp, i);    // build list :contentReference[oaicite:7]{index=7}
    }

    // Print the list to verify
    print_list(headp);              // expected output: 2 -> 1 -> 0 -> NULL

    // Free all the allocated memory
    free_list(headp);

    return 0;
}
