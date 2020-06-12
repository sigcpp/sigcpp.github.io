---
pid: 5
title: "Guidelines for processing immutable text"
date: 2020-04-20
authors: smurthys
cpp_level: intermediate
cpp_version: "C++17, C++20"
reader_activity: exercise
tweet_url: https://twitter.com/sigcpp/status/1270055858706305024
---

This post presents detailed guidelines for using `std::string_view`. It includes a total
of 21 guidelines, grouped into five categories.

This post concludes the 3-part series on processing immutable text.
[Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} )
of the series focuses on efficiency aspects of processing immutable text. [Part 2]( {{ '/2020/04/07/safely-processing-immutable-text' | relative_url }} )
focuses on safety.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; General

Overall, there are three means to model immutable text: character arrays (including
C-strings), `std::string` ("string"), and `std::string_view` ("string_view"). The
guidelines in this section pertain to choosing among the three means.

1. **Prefer string_view over character arrays**. A character array uses less memory
   (string_view maintains both a pointer and a size), but the benefit from the memory
   saved is small compared to the safety obtained with a string_view. Also, working
   directly with an array often requires carrying array size in an additional variable
   (or requires computing length in case of C-strings).

2. **Prefer string_view over string** if many objects are created either directly using
   constructors or indirectly using `substr` function (because string creation is [slower]( {{ '/2020/04/03/efficiently-processing-immutable-text#2' | relative_url }} )).
   Likewise, prefer string_view over string if many assignments are made.

3. **`const` qualify immutable data**. In a situation where data is mutable and a part
   of the code performs immutable operations, refactor the part with immutable
   operations into a separate function and receive `const` parameters in the new
   function.

4. **Model compile-time constants as string_view** instead of character arrays or string
   objects.

5. **Mark compile-time constants `constexpr`** if the increased compilation time is
   acceptable. (Excessive use of `constexpr` could significantly increase compile time
   for large programs.)

   ```cpp
   const char z1[]{"hello"};            // lighter than string_view; less safe
   const std::string s1{"hello"};       // heavier and slower than string_view
   const std::string_view sv1{"hello"}; // see the note on const qualification

   constexpr char z2[]{"hello"};
   constexpr std::string s2{"hello"};       // since C++20
   constexpr std::string_view sv2{"hello"};
   ```

   **Note:** Data in a string_view is immutable even if the string_view is not `const`
   qualified. The effect of `const` qualification is to prevent assignment and the use of
   [modifier functions]( {{ '/2020/04/03/efficiently-processing-immutable-text#4' | relative_url }} ).

   It is good practice to `const` qualify string_views and selectively remove `const`
   where assignment or modification is required.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; "Run-time" data

{:start="6"}

6. If text is read at run time and is immutable after reading, model the text as a
   character array or a string object and create a string_view after the text is read.
   This 2-step approach is required because, expectedly, string_view does not provide any
   means to read text.

   ```cpp
   char z3[10];                // z3 cannot be const
   std::cin >> z3;             // safe only if fewer than 10 chars are read
   std::string_view sv3_1{z3}; // sv3_1 provides read-only access to z3

   std::string s3;             // s3 cannot be const
   std::cin >> s3;             // safe to read large amount of text
   std::string_view sv3_2{s3}; // sv3_2 provides read-only access to data in s3
   ```

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Specific to character arrays

**Note:** For ease of writing, this section uses the term "bare array" to mean a character
array that is not null-terminated, and the term "character array" to mean an array that
may or may not be null-terminated.

{:start="7"}

7. **Use string_view instead of character array** if find, sub-string, comparison, and
   iteration operations are required. All these operations on string_view are generally
   safer than comparable operations performed directly on arrays.

8. **Use string_view instead of an array if array size should also be tracked**, and it is
   often necessary to track array size. In fact, only a local array (with automatic
   storage) can ever be used without explicitly knowing its size, and even that use is
   limited to the `sizeof` operator and range-based for loops (as illustrated in
   [this program](https://godbolt.org/z/iN5CQN)).
   
9. **Use string_view if the code should work for both C-strings and bare arrays.** Using
   string_view expands the contexts in which code can be used while also improving
   efficiency, safety, and maintainability.

   For example, consider function `vowel_count` in [Listing D of Part 2]( {{ '/2020/04/07/safely-processing-immutable-text#listing-d' | relative_url }} ).
   The string_view overload there works for any kind of character arrays, but the
   `const char*` overload works only for C-strings. Indeed, anyone attempting [Exercise 4 of Part 2]( {{ '/2020/04/07/safely-processing-immutable-text#6' | relative_url }} )
   sees that supporting `vowel_count` for bare arrays can result in inefficient code,
   redundant code, or somewhat convoluted (less maintainable) code.

10. **Avoid using a character array directly while it is also wrapped in a string_view**,
    or do so with a lot of care. For example, avoid mixing access as shown in the
    following code segment. If such mixed access is required, it may be better to model
    text as a mutable string object:

    ```cpp
    char z[]{"hello"};
    std::string_view sv{z};    // create a string_view for immutability
    std::strncpy(z+1, "a", 1); // mutable operation directly on z
    //... other mutable and immutable operations directly/indirectly on z
    std::cout << sv;           // immutable operation on z
    ```

11. **Replace `const` character array parameters with string_views**. However, it is OK
    to receive an array parameter and create a string_view at an appropriate juncture
    within the function. The idea is to get the benefit of using string_view but
    prevent premature creation of string_view object in the calling function, if the
    called function is less likely or unlikely to use the parameter.

    If a function receives a non-`const` array parameter, see if the function really
    performs mutable operations. If it does not, add `const` qualification to the
    parameter or change the parameter to string_view.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Specific to string objects

{:start="12"}

12. **Use string, not string_view, if access to null-terminated data is required.**
    The [`data`](https://en.cppreference.com/w/cpp/string/basic_string/data) function
    member of string is guaranteed to return a null-terminated array (since C++11), and
    the return value is never `nullptr`. In contrast, the same function in string_view
    returns a null-terminated array only if the array used to construct the string_view
    is null-terminated. Also, that function returns `nullptr` for a default-initialized
    string_view.

    I recommend studying [this program](https://godbolt.org/z/jUo9bh) (presented in Part
    2) to visualize the differences in the behavior of `data` function between string and
    string_view.

13. **Replace `const` string variables with string_view**. `std::string_view` is a
    drop-in replacement for `std::string` as far as immutable operations are concerned.

14. **Replace `const` string parameters received by value with string_view**.

15. **Replace `const` string parameters received by reference with string_view reference**
    only if the function calls the `substr` function many times, because sub-string
    creation is slower with `std::string` due to new object construction.

    It is **not** beneficial to replace a `const std::string&` with
    `const std::string_view&` if the function does not create sub-strings, because the
    change would unnecessarily create a new string_view object when the existing string
    object already provides the same functionality and efficiency.

16. **Create a function template if a function should work with both string and
    string_view arguments** without converting a string to string_view and vice versa.
    This need is likely to arise as the use of string_views increases over time. For
    example, it makes sense to have function [`vowel_count`]( {{ '/2020/04/07/safely-processing-immutable-text#listing-d' | relative_url }} )
    work with both string and string_view arguments without creating new a object first.

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Using string_view

{:start="17"}

17. **Do not let a string_view object outlive the data it wraps**. [Part 2]( {{ '/2020/04/07/safely-processing-immutable-text#4' | relative_url }} )
discusses the safety issue that motivates this guideline.

18. **Check string_view size before accessing data**. The subscript operator as well as
     functions `front`, `back`, `remove_prefix`, and `remove_suffix` do **not** check
     bounds and thus can result in undefined behavior. Use the [`at`](https://en.cppreference.com/w/cpp/string/basic_string_view/at)
    function if bounds checking is required.

19. **Use subscript operator instead of `at` function to improve speed**, but only if it
    is certain that index cannot be out of bounds. The subscript operator is faster only
    because it does not check bounds.

20. **Avoid using the `data` function directly.** Instead, use task-specific functions and
    operators. For example:

    - Use member functions such as `at`, `find`, `substr`, and `copy`
    - Use iterators: For cleaner code, use range-based for loops where possible
    - Use the [algorithms library](https://en.cppreference.com/w/cpp/algorithm)
      where possible
    - Use operators such as subscript, comparison, and stream insertion
    
21. **Do not cast away `const`ness of data**. Sometimes it might be necessary to use the
    `data` member when invoking a function that can only receive a character array, but
    beware of functions that require a non-`const` array. Having to remove `const`ness
    is a code smell and it is a hint that the program design needs to be reviewed.

    Instead of removing `const`ness, [copy](https://en.cppreference.com/w/cpp/string/basic_string_view/copy)
    the string_view data to another array and work on the copy. However, the copy and the
    string_view data are not synchronized. If string_view's data should match the copy
    after it is worked on, assign the copy back to the string_view.

    I recommend studying [this program](https://godbolt.org/z/pibWqB) prepared to
    illustrate some means and side effects of removing `const`ness from string_view data.
    The program also includes an example of copying string_view data, changing the copy,
    and then assigning the changed copy back to string_view.

    **Note:** An alternative to creating a copy of string_view data is to model the text
    as mutable string and use the `data` function of string to access the array.

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Summary

As [Part 1]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} )
of this series shows, `std::string_view` can be more efficient than `std::string` when
working with immutable text. And, as [Part 2]( {{ '/2020/04/07/safely-processing-immutable-text' | relative_url }} )
shows, string_view is safer than directly operating on an immutable character array.
However, there are many efficiency and safety considerations to be made when using
string_view. The guidelines included in this post are designed to help make informed
choices.

{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Exercise

Write a function template to count the number of vowel occurrences in an immutable string
or an immutable string_view.
