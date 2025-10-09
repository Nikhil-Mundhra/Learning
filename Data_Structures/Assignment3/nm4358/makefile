# Set g++ as the C++ compiler
CC=g++

# Enforce C++ 2011 as the language standard
CXXFLAGS=-std=c++17 

# Enable all standard warnings, uninitialized variable warnings, 
# and treat all warnings as errors
CXXFLAGS+= -Wall

# NOTE: comment the following line temporarily if 
# your development environment is failing
# due to these settings - it is important that 
# you fix your environment at some point.
CXXFLAGS+=-fsanitize=address -fsanitize=undefined

# Object Files
OBJS=hashtable.o linkedlist.o maxheap.o main.o 
# Target
TARGET=wordcount

$(TARGET): $(OBJS)
	@echo "Linking: $(OBJS) -> $@"
	$(CC) $(CXXFLAGS) $(OBJS) -o $(TARGET)
hashtable.o:	hashtable.h hashtable.cpp
	@echo "Compiling: $^ -> $@"
	$(CC) $(CXXFLAGS) -c hashtable.cpp
linkedlist.o: linkedlist.cpp linkedlist.h
	@echo "Compiling: $^ -> $@"
	$(CC) $(CXXFLAGS) -c linkedlist.cpp	
maxheap.o: maxheap.cpp maxheap.h
	g++ maxheap.cpp -c	

main.o:	main.cpp
	@echo "Compiling: $< -> $@"
	$(CC) $(CXXFLAGS) -c  main.cpp
clean:
	@echo "Deleting: $(OBJS) $(TARGET)"
	rm -rf $(OBJS) $(TARGET)
