---
title: "Safely processing immutable text"
date: 2020-04-07
authors: smurthys
---

This is Part 2 of a 3-part series on [`std::string_view`](https://en.cppreference.com/w/cpp/string/basic_string_view).
This part focuses on the safety `std::string_view` provides over character arrays, and on
the safety considerations when using `std::string_view`.

[Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} ) focuses on efficiency of
`std::string_view` over [`std::string`](https://en.cppreference.com/w/cpp/string/basic_string).
Part 3 provides guidelines on using `std::string_view`.
<!--more-->

### String_view creation means

As stated in [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#creating-string_view-objects' | relative_url }} )
of this series, a string_view object is simply a read-only wrapper around a character
array. This statement is true regardless of the creation means used: from nothing, from a
[C-string]( {{ '/2020/03/30/exploring-c-strings' | relative_url }} ), from a character array that is not a
C-string, or from a `std::string` object.

Listing A shows creation of four string_view objects, each using a different creation
means. The object created from nothing (variable `sv1`) is effectively as if it is
created from the empty C-string `""`. 

**Note:** Internally, a [string_view created from nothing](https://timsong-cpp.github.io/cppwp/n4659/string.view#cons-2)
is **not** the same as a string_view created from an empty C-string.

---
##### Listing A: creating string_view objects using four different means

```cpp
std::string_view sv1;          // from nothing: approximates std::string_view sv1("");

std::string_view sv2("hello"); // from C-string

char a[]{'h','e','l','l','o'};
std::string_view sv3(a, 5);    // from character array that is not a C-string

std::string s("hello");
std::string_view sv4(s);       // from string: approx. std::string_view sv4(s.c_str());
```

---

A string_view created from a string object is the same as a string_view created using the
C-string obtained via the [`c_str`](https://en.cppreference.com/w/cpp/string/basic_string/c_str)
function on the string object. That is, the code associated with variable `sv4` could be
rewritten as: `std::string_view sv4(s.c_str());`

**Note:** As discussed in [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#creating-string_view-objects' | relative_url }} ),
creating a string_view from a string actually invokes an operator function in
`std::string`.

### Simplicity and safety over character arrays

It is much cleaner and safer to use the string_view wrapper instead of directly using a
character array because string_view has functions and operators that abstract over
low-level C-style functions. For example, we could simply test if `sv1 > sv2`, instead of
testing if `std::strcmp(z1, z2) > 0`, where `z1` and `z2` represent C-strings, and sv1
and sv2 are corresponding string_view objects. Likewise, we can use the function member
`find` instead of the low-level functions `std::strchr`, and `std::strstr`. (The
string_view function `find` can find both single characters and multi-character texts.)

The string_view approach also has the advantage that it works with any character array,
not just with C-strings. As a result, there is no need to resort to using functions such
as `std::memcmp` to compare arrays and `std::memchr` to locate a character. Plus, with
string_view, there is no need to explicitly carry around the size of every character
array.

Also, because a string_view is immutable by design, it eliminates the many `const`
qualifications that would be necessary to guarantee immutability of character arrays.

Lastly, The string_view approach is safer because the programmer does not have to worry
about buffer overflow and other issues associated with low-level functions such as
`std::strcmp` and `std::strchr`.

### Inside a string_view

As stated in [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#modification-efficiency' | relative_url }} ),
just two internal data members facilitate the entire string_view functionality:

- `data_`: a pointer to the first character of the array wrapped
- `size_`: the number of characters of interest in the array

Using just these two data members, a string_view is able to become a wrapper to a
character array regardless of the creation means used: In all four creation means shown
in Listing A, the internal member `data_` points to the first character in the array
wrapped, and the `size_` member contains the number of characters of interest.

String_view function members [`data`](https://en.cppreference.com/w/cpp/string/basic_string_view/data)
and [`size`](https://en.cppreference.com/w/cpp/string/basic_string_view/size) provide
access to the internal data members `data_` and `size_` respectively.

**Note:** It is important to understand how a string_view is able to wrap any character
array using just the aforementioned data members. I recommend studying [this program](https://godbolt.org/z/ZfFpZn)
prepared to illustrate the effects of different creation means of string view.

### Safety concerns about string_view

There are three major issues when using string_views:

- assuming a string_view object makes a copy of the character array it wraps;
- having a string_view object outlive the character array it wraps; and
- assuming the `data` function member always returns a C-string.

String_view does **not** make a copy of the character array it wraps; nor does it own the
array. Instead, the string_view object's creator continues to own the character array and
is responsible for the array's management. Specifically, after a string_view object has
served its purpose, the object owner should deallocate the array if the array was
dynamically allocated.

Thus, a string_view object should **never** outlive the character array it wraps. For
example, a function should **not** return a string_view object that wraps a local array.

Listing B shows examples of incorrect and acceptable uses of string_view. The comments in
the code are self-explanatory.

---
##### Listing B: examples of incorrect and acceptable uses of string_view

```cpp
std::string_view bad_idea() {
    char z[]{"hello"};          // z is deallocated when function returns
    return std::string_view(z); // bad: sv points to deallocated array
}

std::string_view another_bad_idea() {
    std::string s("hello");     // s is deleted when function returns
    return std::string_view(s); // bad: sv points to data in deleted object
}

void also_bad_idea() {
    char* p = new char[6]{};
    std::string_view sv(p);     // sv points to dynamically allocated array
    delete[] p;                 // bad: sv still points to deallocated array
    std::cout << sv.data();     // no longer safe to consume sv.data()
}

std::string_view acceptable() {
    return std::string_view("hello"); // OK: "hello" has static storage
}

void process(std::string_view& sv) {
    std::cout << sv;            // safe only if sv points to a legit array
}

int main() {
    char z[]{"hello"};
    std::string_view sv(z);
    process(sv);                // OK: z lives until end of main
}
```

---

Another issue to be aware of when using string_view is that the function member
`data` is not guaranteed to return a C-string. Specifically, that function simply returns
a pointer to the first character in the array that was passed to it. (It could return a
pointer to a later character in the array if the function [`remove_prefix`]((/2020/04/03/efficiently-processing-immutable-text#modification-efficiency))
was called earlier.)

The following code segment illustrates the need for care when consuming the value returned
by the `data` function.

```cpp
char z[]{"hello"};       // z is a C-string
std::string_view sv5(z);
std::cout << sv5.data(); // OK: sv5 wraps a C-string

char a[]{'h','e'};       // a is not a C-string
std::string_view sv6(a);
std::cout << sv6.data(); // unsafe: sv6 does not wrap a C-string

std::cout << sv6;        // OK: insertion operator is safely overloaded
```

### Part-2 summary

Overall, `std::string_view` provides a cleaner and safer means to process immutable data
than character arrays do. However, there are some safety concerns in using string_view,
especially concerns related to object lifetime.

Whereas this part of the 3-part series on string_view focuses on safety, [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} )
focuses on efficiency. Part 3 provides guidelines on using string_view.
