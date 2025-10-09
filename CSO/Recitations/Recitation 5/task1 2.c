#include <stdio.h>
#include <string.h>

struct student
    {
        /* data */
        int StuID;
        char name[20];
        char address[100];
    };

struct teacher
{
    /* data */
    char name[20];
    int age;
    char subject[20];
};

void print_s(struct student s){
    printf("Student ID: %d\n", s.StuID);
    printf("Student Name: %s\n", s.name);
    printf("Student Address: %s\n\n", s.address);
}

void print_t(struct teacher t){
    printf("Teacher Name: %s\n", t.name);
    printf("Teacher Age: %d\n", t.age);
    printf("Teacher Subject: %s\n \n", t.subject);
}

int main(){
    struct student Nikhil;
    Nikhil.StuID = 1;
    strcpy (Nikhil.name, "Nikhil Mundhra");
    strcpy (Nikhil.address, "79, West Mukherjee Nagar");
    print_s(Nikhil);
    
    struct teacher ABC = {"Some Name", 42, "Computer Science"};
    print_t(ABC);

    struct teacher *CBA = &ABC;
    CBA->age = 43;
    strcpy (CBA->name, "Crazy name");
    strcpy (CBA->subject, "Crazy Science");
    print_t(ABC);

    struct student Stu_Array[10];
    for (int i = 0; i < 10; i++){
        Stu_Array[i].StuID = -1;
    }

    for (int i = 2; i < 6; i++){
        Stu_Array[i-2].StuID = i;
        strcpy (Stu_Array[i-2].name, "Random Student");
        strcpy (Stu_Array[i-2].address, "Random Address");
    }
    
    // counting 
    int student_count = 0;
    for (int i = 0; i < 10; i++) {
        if (Stu_Array[i].StuID != -1) {
            student_count++;
        }
    }
    printf("Total students: %d\n\n", student_count);

    for (int i = 0; i < student_count; i++){
        print_s(Stu_Array[i]);
    }
    
    

}