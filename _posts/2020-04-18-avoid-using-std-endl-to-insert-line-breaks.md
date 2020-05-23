---
title: "Avoid using std::endl to insert line breaks"
date: 2020-04-18
authors: smurthys
cpp_level: introductory
cpp_version: "Any version"
---

To insert a line break into an output stream, just insert the newline character (`'\n'`) instead of inserting `std::endl`. For example, write `std::cout << "hello world" << '\n';` instead of writing `std::cout << "hello world" << std::endl;`.
<!--more-->

Inserting [`std::endl`](https://en.cppreference.com/w/cpp/io/manip/endl) inserts a line break and also "flushes" the output stream
(ensures that data is actually written to the final destination\), which blocks the program until flushing completes. However, flushing
is meaningful only with files and other kinds of streams where the final destination is some place other than main memory (a 
simplification that suffices for this post). Thus, flushing is unnecessary for destinations such as console (`std::cout`) and string 
streams. 

Even when flushing is required, endeavor to use the [`flush`](https://en.cppreference.com/w/cpp/io/basic_ostream/flush) member function
to make flushing apparent and to potentially improve performance as shown in function `useStream` below. Obviously, the call to `flush`
in function `useStream` would be pointless if the output stream is `std::cout` or a string stream, but that call is made only once and
thus may be acceptable. 

By the way, explicit flushing is unnecessary for any kind of stream because the stream is automatically flushed when it is closed or
when the associated memory buffer becomes full. Thus, call the `flush` function only if you really need to ensure data reaches its final 
destination at that particular point in the program.

```cpp
#include <iostream>
#include <fstream>

void useStream(std::ostream& out);

int main() {
   char c;
   std::cout << "Choose destination: f for file; anything else for console: ";
   std::cin >> c;

   if (c == 'f') {
      std::ofstream f("sample.txt");
      useStream(f);
   } else
      useStream(std::cout);
}


//write some numbers to an output stream
//insert a line break after each number, but don't flush
//flush once at end
void useStream(std::ostream& out) {
   for (int i = 0; i < 6; ++i)
      out << i << '\n';

   out.flush(); //even this flush is unnecessary in most cases
}
```
---
⚠️ It might seem like the code in the `if` and `else` statements in `main` could be condensed as follows, but that is not possible
because the class `std::basic_ostream` does not support a necessary constructor.

```cpp
useStream(c == 'f' ? std::ofstream("sample.txt") : std::cout);
```
---
