# Set g++ as the C++ compiler
CC=g++

# Enforce C++ 2011 as the language standard
CXXFLAGS=-std=c++11 

# Enable all standard warnings, uninitialized variable warnings, 
# and treat all warnings as errors
CXXFLAGS+= -Wall

# NOTE: comment following line temporarily if 
# your development environment is failing
# due to these settings - it is important that 
# you fix your environment at some point.
CXXFLAGS+=-fsanitize=address -fsanitize=undefined

# Object Files
OBJS=book.o borrower.o tree.o lcms.o main.o 
# Target
TARGET=lcms

$(TARGET): $(OBJS)
	@echo "Linking: $(OBJS) -> $@"
	$(CC) $(CXXFLAGS) $(OBJS) -o $(TARGET)
book.o:	book.h book.cpp
	@echo "Compiling: $^ -> $@"
	$(CC) $(CXXFLAGS) -c book.cpp
borrower.o: borrower.cpp borrower.h
	@echo "Compiling: $^ -> $@"
	$(CC) $(CXXFLAGS) -c borrower.cpp
tree.o:	tree.h tree.cpp
	@echo "Compiling: $^ -> $@"
	$(CC) $(CXXFLAGS) -c tree.cpp
lcms.o:	lcms.h lcms.cpp
	@echo "Compiling: $^ -> $@"
	$(CC) $(CXXFLAGS) -c lcms.cpp		
main.o:	main.cpp
	@echo "Compiling: $< -> $@"
	$(CC) $(CXXFLAGS) -c  main.cpp
clean:
	@echo "Deleting: $(OBJS) $(TARGET)"
	rm -rf $(OBJS) $(TARGET)
