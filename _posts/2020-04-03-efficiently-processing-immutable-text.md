---
pid: 2
title: "Efficiently processing immutable text"
date: 2020-04-03
authors: smurthys
cpp_level: intermediate
cpp_version: "C++17"
---

Introduced in C++17, the STL class `std::string_view` provides more efficient ways than
`std::string` to process immutable (read only) text data. It also provides a safer means
to perform read-only operations on character arrays. Overall, using `std::string_view` for
read-only operations on text data can improve execution speed as well as reduce both
main-memory usage and executable size. It can also make programs safer and more
maintainable.

This is Part 1 of a 3-part series on `std::string_view`. This part focuses on efficiency
of `std::string_view` over `std::string`. [Part 2]( {{ '/2020/04/07/safely-processing-immutable-text' | relative_url }} )
focuses on safety. [Part 3]( {{ '/2020/04/20/guidelines-for-processing-immutable-text' | relative_url }} ) provides guidelines for using `std::string_view`.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Creating string_view objects

[`std::string_view`](https://en.cppreference.com/w/cpp/string/basic_string_view) is just a
read-only wrapper around a character array ("a constant contiguous sequence of `char`-like
objects", to be precise [[string.view](https://timsong-cpp.github.io/cppwp/n4659/string.view)]).

A string_view object can be created using one of its [five constructors](https://en.cppreference.com/w/cpp/string/basic_string_view/basic_string_view):

1. Default constructor: represents an empty string
2. Copy constructor
3. Custom constructor which accepts a character array and a size
4. Custom constructor which accepts a [C-string]( {{ '/2020/03/30/exploring-c-strings' | relative_url }} )
5. Custom constructor which accepts a range of characters as iterators (not discussed
   in this post)

A string_view object can also be constructed using or be assigned from a
[`std::string`](https://en.cppreference.com/w/cpp/string/basic_string) object because
`std::string` defines an [operator](https://en.cppreference.com/w/cpp/string/basic_string/operator_basic_string_view)
to return a string_view version of a string object. For example, the following creation
operations are permitted:

```cpp
std::string s{"hello"};
std::string_view sv1{s};  // initialize from string using copy ctor
std::string_view sv2 = s; // initialize by assigning a string
```

**Note:** [Part 2]( {{ '/2020/04/07/safely-processing-immutable-text#1' | relative_url }} )
of this series examines string_view creation means in more detail.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Creation efficiency

For starters, compare the effect of creating an object to work with the text `"hello"`
using `std::string` and `std::string_view`. A [comparison](https://godbolt.org/z/2tEvxC)
of the code generated shows the following differences:

1. `std::string s1("hello");`
   - 316 instructions: 32 in `main`
   - Calls to constructors of `std::allocator` and `std::basic_string`
   - Calls to destructors  of `std::allocator` and `std::basic_string`
   - Several calls to constructors, destructors, and other functions in supporting
     classes

2. `std::string_view s1("hello");`  
   - 95 instructions: 10 in `main`
   - Call to constructor of `std::basic_string_view`
   - Just two calls to supporting functions

Because higher number of instructions does not necessarily mean poor code, and because it
is possible `std::string` has greater fixed overhead, it is helpful to study the code
generated when [two object declarations](https://godbolt.org/z/vjLVGt) are made: The
`std::string` approach ("string approach" going forward) has 24 additional instructions
in `main`, whereas the `std::string_view` approach ("string_view approach" going
forward) has just four additional instructions in `main`. Thus, simplistically speaking,
we could say that each declaration of string object adds about 24 instructions, whereas
each declaration of a string_view object adds only about four instructions. (Revise the
code to declare three objects in each approach and see if the growth numbers hold.)

However, the more salient observation is that the string approach results in multiple
calls to elaborate functions which can reduce execution speed. For example, Listing A
shows a program to measure the elapsed wall time to create 500,000 empty objects using
both the string and string_view approaches. The exact elapsed time can vary across runs,
but the results from this program consistently show that the string approach is an order
of magnitude slower than the string_view approach (for example, 5 msecs versus 0.7 msecs).

---
{% include bookmark.html id="Listing A" %}

##### Listing A: measure time to create string and string_view objects ([run this code](https://godbolt.org/z/SFRVNo))

```cpp
#include <iostream>
#include <string>
#include <string_view>
#include <chrono>

int main() {
    //construct many std::string instances
    auto start = std::chrono::steady_clock::now();
    for (int i = 0; i < 500000; ++i)
        std::string s;

    auto end = std::chrono::steady_clock::now();
    std::chrono::duration<double> elapsed = end-start;
    std::cout << "string: " << elapsed.count() << "s\n";

    //construct many std::string_view instances
    start = std::chrono::steady_clock::now();
    for (int i = 0; i < 500000; ++i)
        std::string_view sv;

    end = std::chrono::steady_clock::now();
    elapsed = end-start;
    std::cout << "string_view: " << elapsed.count() << "s\n";
}
```

---

**Note:** It can be instructive to change Listing A to pass an empty C-string literal to
the constructor in each approach. For example, in the string approach, use
`std::string s{""}` instead of `std::string s;`. This simple change should significantly
increase the elapsed time for both approaches, meaning we should use the default
constructor when representing empty text.

Likewise, it can also be instructive to study the results after revising Listing A to use
the copy constructor in each approach. For this study, add the following lines to the
beginning of function `main`. Then change the constructor call in each loop to use the
copy constructor, passing either `cs` or `csv` to the constructor, depending on the
approach. For example, for the string approach, change `std::string s;` to
`std::string s(cs);`.

```cpp
const std::string cs{"pack my box with five dozen liquor jugs"};
const std::string_view csv{"pack my box with five dozen liquor jugs"};
```

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Processing efficiency

Generally speaking, `std::string_view` supports only the sub-set of the functionality of
`std::string` that pertains to the following operations: reading array elements,
obtaining read-only iterators, finding text size, extracting a read-only sub-string,
comparing with another string_view, and searching for sub-strings. In addition to these
functions, the `<string_view>` header includes functions to perform relational
operations on string_view objects and a function to insert a string_view to an output
stream.

In short, `std::string_view` is designed to be a drop-in replacement for `std::string` as
far as read-only operations are concerned. However, some of the string_view operations
are more efficient than their string counterparts. For example, the function `substr` to
return a substring is more efficient because its return value is a new string_view
object which we have already established is more efficient to create than creating a new
string object.

Listing B shows a program to extract space-delimited words from some text. It is written
using `std::string_view`, but the program works if the type name `std::string_view` is
replaced with `std::string` throughout the program, and the `<string>` header is
included instead of the `<string_view>` header.

If the word-extraction in Listing B is performed a large number of times
([a simple version](https://godbolt.org/z/sARC8Q), [a templatized version](https://godbolt.org/z/6FnfcS))
using both string and string_view approaches, it becomes apparent that the string
approach is slower (25%-150%) than the string_view approach.

(For simplicity, the links included in the preceding paragraph use command-line compiler
options to globally suppress warnings about some unused variables. However, it is better
to selectively suppress warnings locally from within code. See [Jonathan Boccara's post](https://www.fluentcpp.com/2019/08/30/how-to-disable-a-warning-in-cpp/)
on this topic.)

---

{% include bookmark.html id="Listing B" %}

##### Listing B: extract space-delimited words ([run this code](https://godbolt.org/z/G-EbgE))

```cpp
#include <iostream>
#include <string_view>

int main() {
    const std::string_view sv{"pack my box with five dozen liquor jugs"};

    std::string_view::size_type pos{sv.find(' ')}, lastPos = 0;
    while(pos != std::string_view::npos) {
        std::cout << sv.substr(lastPos, pos-lastPos) << '\n';
        lastPos = pos+1;
        pos = sv.find(' ', lastPos);
    }

    std::cout << sv.substr(lastPos, pos-lastPos) << '\n';
}
```

---

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Modification efficiency

Contrary to what their names suggest, the modifier functions of string_view do *not*
alter the character array wrapped. Instead, they alter two internal data members used to
provide the entire string_view functionality. The two internal data members are:

- `data_`: a pointer to the first character of the array wrapped
- `size_`: the number of characters of interest in the array

(In contrast, many of the modifier functions of `std::string` actually alter data.)

The modifier functions `remove_prefix` and `remove_suffix` have the effect of reducing
the part of the array on which the string_view can operate. Function [`remove_prefix`](https://en.cppreference.com/w/cpp/string/basic_string_view/remove_prefix)
advances the data pointer by the specified number of positions and also reduces size by
the same amount. In contrast, [`remove_suffix`](https://en.cppreference.com/w/cpp/string/basic_string_view/remove_suffix)
leaves the data pointer unchanged but reduces size by the specified count. This simple
approach to modification provides string_view considerable efficiency over the function
[`erase`](https://en.cppreference.com/w/cpp/string/basic_string/erase)
defined for string objects.

**Note:** It is **not** possible to restore the range of the array once it is reduced
using either `remove_prefix` or `remove_suffix`.  

Listing C shows a program to extract space-delimited words from a string_view using
function `remove_prefix`. A comparison with Listing B shows that Listing C is a bit
easier to read and maintain. However, a [comparison of the approaches in Listings B and C](https://godbolt.org/z/XsvGf4)
shows that Listing B's approach is *marginally* faster (1%-2%). This behavior is
expected because `remove_prefix` in Listing C does more work than Listing B does in
changing the value of variable `lastPos`. Yet, with the increase in execution speed
being relatively small, in some cases, one might prefer using the Listing C approach due
to its improved readability and maintainability.

---

{% include bookmark.html id="Listing C" %}

##### Listing C: extract space-delimited words through modification ([run this code](https://godbolt.org/z/68raty))

```cpp
#include <iostream>
#include <string_view>

int main() {
    std::string_view sv{"pack my box with five dozen liquor jugs"};

    std::string_view::size_type pos{sv.find(' ')};
    while(pos != std::string_view::npos) {
        std::cout << sv.substr(0, pos) << '\n';
        sv.remove_prefix(pos+1);
        pos = sv.find(' ');
    }

    std::cout << sv << '\n';
}
```

---

With strings, word extraction by modification is similar to what is shown in Listing C
except the call to `remove_prefix` needs to be replaced with a call to function `erase`.

A [comparison](https://godbolt.org/z/53RF7r) of word-extraction through modification in
the string and string_view approaches shows that the string approach is slightly slower
(20%-160%).

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Part-1 summary

Overall, `std::string_view` provides more efficient ways to process immutable data than
`std::string` does. This efficiency is seen in object creation, general processing, and
"modification".

Whereas this part of the 3-part series on string_view focuses on efficiency, [Part 2]( {{ '/2020/04/07/safely-processing-immutable-text' | relative_url }} )
focuses on safety. [Part 3]( {{ '/2020/04/20/guidelines-for-processing-immutable-text' | relative_url }} )
provides guidelines on using string_view.
