---
pid: 3
title: "Safely processing immutable text"
date: 2020-04-07
authors: smurthys
cpp_level: intermediate
cpp_version: "C++17"
reader_activity: exercises
---

This is Part 2 of a 3-part series on `std::string_view`. This part focuses on the safety
`std::string_view` provides over character arrays, and on the safety considerations to be
made when using `std::string_view`.

[Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} )
focuses on efficiency of `std::string_view` over `std::string`. [Part 3]( {{ '/2020/04/20/guidelines-for-processing-immutable-text' | relative_url }} )
provides guidelines for using `std::string_view`.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; String_view creation means

As stated in [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#1' | relative_url }} )
of this series, [`std::string_view`](https://en.cppreference.com/w/cpp/string/basic_string_view)
is simply a read-only wrapper around a character array. This statement is true regardless
of the creation means used: from nothing, from a [C-string]( {{ '/2020/03/30/exploring-c-strings' | relative_url }} ),
from a character array that is not a C-string, or from a [`std::string`](https://en.cppreference.com/w/cpp/string/basic_string)
object.

Listing A shows creation of four string_view objects, each using a different creation
means. The object created from nothing (variable `sv1`) is effectively as if it is
created from the empty C-string `""`.

**Note:** Internally, a string_view created from nothing is **not** the same as a
string_view created from an empty C-string [[string.view.cons](https://timsong-cpp.github.io/cppwp/n4659/string.view#cons)].

---

{% include bookmark.html id="Listing A" %}

##### Listing A: creating string_view objects using four different means

```cpp
std::string_view sv1;          // from nothing: approximates std::string_view sv1("");

std::string_view sv2{"hello"}; // from C-string

char a[]{'h','e','l','l','o'};
std::string_view sv3{a, 5};    // from character array that is not a C-string

std::string s{"hello"};
std::string_view sv4{s};       // from string: approx std::string_view sv4{s.c_str()};
```

---

A string_view created from a string object is the same as a string_view created using the
C-string obtained via the [`c_str`](https://en.cppreference.com/w/cpp/string/basic_string/c_str)
function on the string object. That is, the code associated with variable `sv4` could be
rewritten as: `std::string_view sv4{s.c_str()};`

**Note:** As discussed in [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#1' | relative_url }} ),
creating a string_view from a string object actually invokes an operator function in
`std::string`.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Simplicity and safety over character arrays

It is much cleaner and safer to use the string_view wrapper instead of directly using a
character array because string_view has functions and operators that abstract over
low-level C-style functions. For example, we could simply test if `sv1 > sv2`, instead of
testing if `std::strcmp(z1, z2) > 0`, where `z1` and `z2` represent C-strings, and sv1
and sv2 are corresponding string_view objects. Likewise, we can use the function member
`find` instead of the low-level functions `std::strchr`, and `std::strstr`. (The
string_view function `find` can find both single-character and multi-character texts.)

The string_view approach also has the advantage that it works with any character array,
not just with C-strings. As a result, there is no need to resort to using functions such
as `std::memcmp` to compare arrays and `std::memchr` to locate a character. Plus, with
string_view, there is no need to explicitly carry around the size of every character
array.

Also, because a string_view is immutable by design, it eliminates the many `const`
qualifications that would be necessary to guarantee immutability of character arrays.

Lastly, the string_view approach is safer because the programmer does not have to worry
about buffer overflow and other issues associated with low-level functions such as
`std::strcmp` and `std::strchr`.

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Inside a string_view

As stated in [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#4' | relative_url }} ),
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
array using just the aforementioned data members. I recommend studying [this program](https://godbolt.org/z/jUo9bh)
prepared to illustrate the effect of different creation means on the internals of a string_view object.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Safety issues with string_view

There are three major safety-related issues when using string_views:

- assuming a string_view object makes a copy of the character array it wraps;
- having a string_view object outlive the character array it wraps; and
- assuming the `data` function member always returns a C-string.

String_view does **not** make a copy of the character array it wraps; nor does it own the
array. Instead, the string_view object's creator continues to own the character array and
is responsible for the array's management. Specifically, after a string_view object has
served its purpose, the object owner should deallocate the array if the array was
dynamically allocated.

The bottom line is that a string_view object should **never** outlive the character array
it wraps. For example, a function should **not** return a string_view object that wraps a
local array. Listing B shows examples of acceptable and unacceptable uses of
string_view. The comments in the code are self-explanatory.

**Note:** Carefully study the differences between functions `bad_idea` and
`also_acceptable` in Listing B.

---

{% include bookmark.html id="Listing B" %}

##### Listing B: examples of acceptable and unacceptable uses of string_view

```cpp
std::string_view bad_idea() {
    char z[]{"hello"};          // z is deallocated when this function ends
    return std::string_view{z}; // bad: returned object wraps deallocated array
}

std::string_view another_bad_idea() {
    std::string s{"hello"};     // s is deleted when this function ends
    return std::string_view{s}; // bad: returned obj wraps data in deleted string
}

std::string_view also_bad_idea() {
    char* p = new char[6]{};
    std::string_view sv{p};     // sv wraps dynamically allocated array
    delete[] p;                 // sv still wraps deallocated array
    return sv;                  // bad: returned object wraps deallocated array
}

void possibly_acceptable(std::string_view& sv) {
    std::cout << sv;            // safe only if sv wraps a legit array
}

void acceptable() {
    char z[]{"hello"};          // z is deallocated when this function ends
    std::string_view sv{z};
    possibly_acceptable(sv);    // OK: z lives until end of this function
}

std::string_view also_acceptable() {
    return std::string_view{"hello"}; // OK: "hello" has static storage
}
```

---

Another issue to be aware of when using string_view is that the function member `data` is
not guaranteed to return a C-string. Specifically, that function simply returns a pointer
to the first character in the array that was passed to it. (It could return a pointer to
a later character in the array if the function [`remove_prefix`]( {{ '/2020/04/03/efficiently-processing-immutable-text#4' | relative_url }} )
was called earlier.)

Listing C illustrates safe and unsafe uses of the `data` function member.
[Part 3]( {{ '/2020/04/20/guidelines-for-processing-immutable-text#5' | relative_url }} )
discusses in detail, but briefly, it is better to avoid accessing the `data` function
altogether. For example, insert a string_view directly to an output stream (as is done
with `sv6` in the last line of Listing C) instead of inserting the value returned from the
`data` function.

---

{% include bookmark.html id="Listing C" %}

##### Listing C: safe and unsafe uses of `data` function member

```cpp
char z[]{"hello"};          // z is a C-string
std::string_view sv5{z};
std::cout << sv5.data();    // OK: sv5 wraps a C-string

char a[]{'h','e'};          // a is not a C-string
std::string_view sv6{a,2};
std::cout << sv6.data();    // unsafe: sv6 does not wrap a C-string

std::cout << sv6;           // OK: insertion operator is safely overloaded
```

---

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Part-2 summary

Overall, `std::string_view` provides a cleaner and safer means to process immutable data
than character arrays do. However, there are some safety concerns in using string_view,
especially concerns related to object lifetime.

Listing D shows two versions of a function to count vowels in some text. The first
version represents text as a C-string; the second represents text as a string_view. The listing aptly demonstrates that the string_view version is both simpler and safer:

- No pointers

- No need for `const` qualification: the C-string version **needs** `const`
  qualification; the string_view version does not need it, but that qualification is
  made as good practice. (In this case, there is a benefit to `const` qualifying the
  string_view objects. What is that benefit?)

- Simpler code: the for-loop header and the test for vowel are both easier to
  comprehend (and thus to maintain) in the string_view version.

- No undefined behavior: the C-string version has undefined behavior if the null
  character is missing. (This issue exists in two locations in the C-string version.
  What are those locations?)

**Note:** Be sure to read [Part 3]( {{ '/2020/04/20/guidelines-for-processing-immutable-text' | relative_url }} )
of this series for guidelines on using string_view.

---

{% include bookmark.html id="Listing D" %}

##### Listing D: counting vowels using C-string and string_view ([run this code](https://godbolt.org/z/BVLL2P))

```cpp
// using C-string
std::size_t vowel_count(const char* z) {
    const char vowels[]{"aeiouAEIOU"};

    std::size_t count{0};
    for (std::size_t i = 0; z[i] != '\0'; ++i)
        if (std::strchr(vowels, z[i]) != nullptr)
            ++count;

    return count;
}

// using std::string_view
std::size_t vowel_count(const std::string_view& sv) {
    const std::string_view vowels{"aeiouAEIOU"};

    std::size_t count{0};
    for (auto c : sv)
        if (vowels.find(c) != std::string_view::npos)
            ++count;

    return count;
}
```

---

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Exercises

1. Answer the questions embedded in the bulleted list in the summary section.

2. Which of the two versions of function `vowel_count` in Listing D is faster? Which
   version is likely to use more run-time memory? Why?
   - Use the code in [Listing A of Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#listing-a' | relative_url }} )
     as a model to measure wall times.

3. Which of the two versions `vowel_count` is better to count vowels in a character
   array that is not null-terminated? Why?

4. Using only the string_view version of `vowel_count`, write a `main` function to count
   vowels in a C-string and a character array that is not null-terminated. That is, make
   two calls to the string_view version of `vowel_count`, each time with a different
   argument. (For this part of the exercise, it might help to remove the C-string
   version of `vowel_count` from the program.)

5. Assuming the string_view abstraction (or something comparable) does not exist or
   cannot be used, write a function or functions to count vowels in a character array
   that may or may not be null-terminated.

   It is OK to have two versions of the function if that approach seems better. (Listing D already shows the C-string version.) However, strive to reuse code as much as
   possible, but also strive to make code maintainable and "efficient". Include comments
   that clearly explain the rationale for your choices.

6. Rewrite the string_view version of `vowel_count` using member function
   [`remove_prefix`]( {{ '/2020/04/03/efficiently-processing-immutable-text#4' | relative_url }} ).
   There are three different approaches to this rewrite. Try all three approaches and
   outline the pros and cons of each approach. State which approach you prefer and
   include a rationale.

7. Rewrite the string_view version of `vowel_count` using member function
   [`find_first_of`](https://en.cppreference.com/w/cpp/string/basic_string_view/find_first_of).
   Which version is "better": the one in Listing D, or the rewritten one? Why?

8. Write a C-string version of the code in [Listing B of Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text#listing-b' | relative_url }} ).

9. Write a program to extract words from text, where words may be separated by space,
   comma, semi-colon, or period. Write both a C-string version and a string_view version.

   - Do **not** use regular-expression, stream extraction, or other such approach that
     simplifies the task, but feel free to use any other standard-library facility.

   - Break down the code into appropriate functions.

   - `const` qualify all variables/parameters that represent immutable text. Meeting this
     requirement is quite important for this exercise.

   - Hard-code the following immutable text in the program and use it in testing. Just
     for this exercise, do **not** read the text to process as user input at run time:

     `The quality mantra: improve the process; the process improves you.`

   - Depending on the approach taken in the C-string version, hard-coding the text to
     process as a `const` qualified variable/parameter could pose a challenge. Yet,
     use a `const` qualified variable/parameter to represent the text to process exactly
     as required in the preceding bullet.
