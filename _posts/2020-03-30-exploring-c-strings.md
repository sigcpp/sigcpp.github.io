---
title: "Exploring C-strings"
date: 2020-03-30
authors: smurthys
cpp_level: intermediate
cpp_version: "Any version"
reader_activity: quiz
---

This post discusses the use of C-strings in C++. It defines the terms C-string and NTBS
(*null-terminated byte string*); discusses C-string literals and variables; outlines
common patterns of C-string usage; and highlights a subtle technical difference between
C-strings and NTBSs.

But first, some advice: Avoid using C-strings in C++, and instead use `std::string` where
possible. However, there are situations where C-strings can provide better performance
over `std::string`, but make that choice on a case-by-case basis. Even when using a
C-string, consider using it with the light-weight wrapper `std::string_view`.
<!--more-->

{% include bookmark.html id="1" %}

### 1&nbsp;&nbsp; Terms

In C++, the informal term *C-string* is used to mean the "string" data structure defined
in the C programming language [[7.1.1](https://web.archive.org/web/20181230041359if_/http://www.open-std.org/jtc1/sc22/wg14/www/abq/c17_updated_proposed_fdis.pdf)]:

> A *string* is a contiguous sequence of characters terminated by and including the first
> null character.

Here, the term *null character* refers to the character whose integer code is 0. The
literal `'\0'` is the null character. It is different from the literal `'0'` whose
integer code is 48.

In contrast to C, a *string* in C++ is an abstract sequence of characters without regard
for how the sequence is represented or terminated. However, C++ defines the related term
*null-terminated byte string* [[byte.strings](https://timsong-cpp.github.io/cppwp/n4659/byte.strings)]:

> A *null-terminated byte string*, or NTBS, is a character sequence whose
> highest-addressed element with defined content has the value zero (the *terminating
> null* character); no other element in the sequence has the value zero.

C++ also defines the *length* of an NTBS as the number of elements that precede the
terminating null character. An NTBS of length 0 is called an "empty NTBS". C similarly
defines the length of a string as the number of bytes preceding the null character.

**Note:** When working with C++:

- Use the term "C-string", **not** "string", to mean the string data structure defined in
  C.
- Use the term "string" only to mean an abstract sequence of characters without regard
  for how the sequence is represented or terminated. (`std::string` is a concrete
  implementation of this abstraction.)
- Use the term NTBS to actually mean a null-terminated sequence of characters as defined
  in C++. (A subtle difference between C-strings and NTBSs is examined [later in this post](#6).)

{% include bookmark.html id="2" %}

### 2&nbsp;&nbsp; C-string literals

A literal such as `"hello"` is a C-string literal ("static NTBS" in C++, to be precise).
The compiler automatically places the null character after the last character inside the
double quotes.

There is no data type called C-string. Instead, the type of a C-string is `char` array of
the appropriate bound, where *bound* is the declared number of array elements (aka "array
size" or "array capacity"). The array type is `const` qualified for literals. For example,
the type of the literal `"hello"` is `const char[6]` because storing that literal requires
six characters including the null character.

The length of the literal `"hello"` is five, which is the number of characters preceding the
null character. In general, the length of a C-string is one less than the bound of the
character array that contains the C-string.

{% include bookmark.html id="3" %}

### 3&nbsp;&nbsp; C-string variables

The following code fragment declares six character-array variables, only four of which create
C-strings. The end-of-line comments provide additional information for each array.

**Note:** As the examples show, every C-string is a character array, but not every
character array is a C-string.

```cpp
char s1[]{'h','e','\0'}; // C-string; bound 3; length 2; explicit null at position 3
char s2[]{'h','e','r'};  // not C-string; bound 3; no null char

char s3[7];              // not C-string; bound 7; no null char

char s4[]{"he"};         // C-string; bound 3; length 2; auto null at position 3
char s5[8]{"he"};        // C-string; bound 8; length 2; auto null at position 3
```

{% include bookmark.html id="4" %}

### 4&nbsp;&nbsp; Being a C-string is a property of a `char` array

Being a C-string is just a property of a character array based on whether the array meets
the requirement of containing the null character, and this property can change over time
for an array within the program. That is, a character array could be a C-string at one
point in the program, and not be a C-string at another point in the same program. The
following code segment illustrates this possibility.

```cpp
char s6[]{'h','e','\0'}; // C-string; null character at position 3
s6[2] = 'r';             // no longer a C-string: null character replaced
s6[2] = '\0';            // C-string again: null character restored
```

{% include bookmark.html id="5" %}

### 5&nbsp;&nbsp; Working with C-strings

The C++ library includes many functions that operate on C-strings. These functions are
defined in the header `<cstring>` [[cstring.syn](https://timsong-cpp.github.io/cppwp/n4659/c.strings#cstring.syn)].
Example functions are: `strlen` to find length; `strcpy` to copy a C-string to another;
and `strcmp` to compare a C-string with another.

In addition, the insertion operator `<<` on output streams is overloaded to output
C-strings.

A function that operates on a C-string typically receives a parameter of type `char*`,
with the expectation that the caller passes a pointer to the first character of the
C-string. It is not necessary to also receive the C-string's length because the function
can use the null character to detect end of data.

Here are the declarations for some common C-string functions:

```cpp
std::size_t strlen(const char* s);          // find C-string length
char* strcpy(char* dest, const char* src);  // copy a C-string to another
int strcmp(const char *s1, const char *s2); // compare two C-strings
```

**Reminder:** For safety and other reasons, prefer `std::string` when working with
character data. If you must use a C-string, consider using it with the light-weight
wrapper `std::string_view`.

{% include bookmark.html id="6" %}

### 6&nbsp;&nbsp; C-string versus NTBS

For all practical purposes, a C-string is the same as an NTBS, but a careful examination
of their respective definitions reveals a subtle difference.

From C's definition of a string, it is clear that a C-string may include multiple null
characters, but the string is deemed to have ended as soon as the first null character is
seen. Thus, we could say a C-string is a character array with at least once occurrence of
the null character.

> A *string* is a contiguous sequence of characters terminated by and including the first
> null character.

However, reviewing the C++ definition of NTBS, it is clear that an NTBS must end with the
null character and the null character may appear only once:

> A *null-terminated byte string*, or NTBS, is a character sequence whose
> highest-addressed element with defined content has the value zero (the *terminating
> null* character); no other element in the sequence has the value zero.

In summary, C-strings and NTBSs are different with respect to the number of null character
occurrences permitted and the required location of the null character. However, I have yet
to encounter any situation where this subtlety causes an issue: If an array with multiple
null characters or a misplaced null character is used where an NTBS is expected, only the
portion of the array until the first occurrence of the null character is processed. That
is, in practice, an NTBS is treated just as a C-string.

**Conclusion:** It is OK to use the terms C-string and NTBS interchangeably, but it is
important to be aware of the subtle difference, especially when arguing a point, or when
discussing specifics in a job interview or other such scenario.

The following program shows how one could create valid C-strings but invalid NTBSs. The
program's output also shows that an NTBS with multiple null chars or misplaced null char
is treated just as a C-string.

```cpp
#include <iostream>
#include <cstring>

int main() {
    char s7[]{'h','e','\0','r','\0'};     // two explicit null chars
    char s8[]{"hello\0World"};            // explicit and implicit null chars
    char s9[]{'h','e','r','\0','s'};      // misplaced null char

    std::cout << s7 << '\n';              // "he": ignores chars after position 2
    std::cout << std::strlen(s8) << '\n'; // 5: ignores chars after position 5
    std::cout << std::strlen(s9) << '\n'; // 3: ignores chars after position 4
}
```

{% include bookmark.html id="7" %}

### 7&nbsp;&nbsp; Quiz

Strictly following the definitions of C-string and NTBS:

1. Which of the following declarations create C-strings?
2. Which declarations create NTBSs?
3. Which declarations create both a C-string and an NTBS?
4. What is the bound of each array declared?
5. What is the length of each C-string or NTBS created?
6. Independent of the declarations shown: Is every NTBS also a C-string? Is every C-string
   also an NTBS?

(The empty initializer `{}` in an array declaration writes the number zero to all array
elements.)

```cpp
char s10[]{'h','e'};
char s11[]{"he\0"};
char s12[4]{};
char s13[1]{};
char* p1 = s12;
char* p2 = s13;
char* p3;
```
