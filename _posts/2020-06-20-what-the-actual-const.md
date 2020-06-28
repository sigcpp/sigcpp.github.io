---
pid: 7
title: "What the actual const?"
date: 2020-06-20
authors: smurthys
cpp_level: intermediate
cpp_versions: "Any C++"
reader_activity: exercises
tweet_url: https://twitter.com/sigcpp/status/1276606804303192064
---

This post discusses the effect of `const` qualifications in pointer declarations,
specifically the distinction between pointer `const`ness and data `const`ness. It first
examines `const` qualifications of pointers to non-array data, and then examines `const`
qualifications of pointers to array data, including arrays of pointers. In all cases, the
post discusses declarations of variables, function parameters, and function return types.
It assumes the reader is familiar with pointers and the relationship between arrays and
pointers.

This post is motivated by the observation that those new to pointers tend to mistake
data `const`ness in a pointer declaration with pointer `const`ness. It is also motivated
by the need to emphasize the subtleties of parameter declarations in functions that
receive arrays of pointers (such as command-line arguments).

But first, some advice: Avoid using pointers directly, and instead use references. Also
prefer `std::array` over traditional arrays. However, there are situations where
pointers and traditional arrays are the only/better choice, and in those cases use
`const` qualification correctly to maximize safety.
<!--more-->

**Note:** All examples in this post are verified in both C++98 and C++17 using GCC 10.1.
The examples are also verified in C++17 using Visual Studio 2019 Version 16.5.5.

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Pointers to non-array data

This section discusses the distinction between `const`ness of pointer and `const`ness of
non-array data, both in the context of pointer declarations. "Non-array data" includes
both fundamental types and objects (including container objects such as vectors, lists,
and maps).

There are four permutations of pointer `const`ness and data `const`ness in the context of
pointer declarations. Each permutation is due to a specific form of pointer declaration,
which is in turn based on where the keyword `const` is placed. Listing A illustrates the
four forms with a separate pointer variable declared using each form.

**Note:** The `const` keyword in a variable declaration is part of what is called the
[_cv-qualifier-sequence_](https://timsong-cpp.github.io/cppwp/n4659/dcl.ptr#1).

This post uses the colloquial "West `const`" convention to place the `const` keyword
(the same convention the C++ standard uses). The link included in Listing A's caption
shows code using both West `const` and ["East `const`"](https://mariusbancila.ro/blog/2018/11/23/join-the-east-const-revolution/)
conventions.

---
{% include bookmark.html id="Listing A" %}

##### Listing A: declaration forms of non-array pointers ([run this code](https://godbolt.org/z/AngpMJ))

```cpp
int main() {
    int a{ 5 }, b{ 8 };

    int* p1 = &a;              // variable ptr, variable data
    p1 = &b;                   // change ptr
    *p1 = 7;                   // change data; b = 7

    const int* p2 = &a;        // variable ptr, const data
    p2 = &b;                   // change ptr
    *p2 = 7;                   // error: can't change const data

    int* const p3 = &a;        // const ptr, variable data
    p3 = &b;                   // error: can't change const ptr
    *p3 = 9;                   // change data; a = 9

    const int* const p4 = &a;  // const ptr, const data
    p4 = &b;                   // error: can't change const ptr
    *p4 = 7;                   // error: can't change const data
}
```

---

The `const`ness permutations and their corresponding declaration forms shown in Listing A
are:

1. `int* p1`: `p1` can be assigned the address of any `int`, and it can be used to
   modify the value of the `int` to which it points at the time of modification. `p1` can point to any number of `int`s over its lifetime.

   Read this declaration as "pointer to `int`".

   This form is quite common for variable declarations. It is also used for a function
   parameter if the function is to cause a side effect (that is, modify the pointed data by dereferencing the pointer parameter).

2. `const int* p2`: `p2` can be assigned the address of any `int`, but it **cannot** be
   used to alter the value of the `int` to which it points. Like `p1`, `p2` can point to any number of `int`s over its lifetime.

   Read this declaration as "pointer to `const int`".

   This form is rare for variable declarations, but it is common for parameters where the
   function guarantees it does **not** modify the pointed data.

3. `int* const p3`: `p3` can be initialized with the address of only one `int` ever (and
   only at declaration), but it **can** be used to modify the value of the `int` to which it points. `p3` can point to only one `int` over its lifetime.

   Read this declaration as "`const` pointer to `int`".

   This form is rarely used for non-array pointers. Also, the use of this form is
   unnecessary in most cases because references provide an elegant alternative (a
   reference must be initialized at declaration and its binding cannot change after
   initialization). For example, use `int& r = i;` instead of `int* const r = &i;`.
   Likewise, receive function parameters by reference as in `void trim(std::string& s);`

   This form could potentially be useful to store the address of dynamically-allocated
   data to ensure that the pointer is not overwritten, perhaps to ensure that the address
   is available for freeing memory later. Example usage: `int* const p = new int;`

4. `const int* const p4`: `p4` can be initialized with the address of only one `int` ever
   (at declaration), and it **cannot** be used to alter the value of the `int` to which
   it points. Like `p3`, `p4` can point to only one `int` over its lifetime.

   Read this declaration as "`const` pointer to `const int`".

   This form too is rare for non-array pointers, and it is better to use `const`
   references instead. For example, use `const int& r = i;` instead of using
   `const int* const r = &i;`. Indeed functions routinely use `const` references to
   efficiently receive objects and assure that there are no side effects. For example,
   `int compare(const std::string& s);`

**Note**: The use of Forms 3 and 4 (the forms where the pointer is `const`) is
unnecessary for parameter declarations because Forms 1 and 2 already guarantee that any
change the called function makes to the pointer parameter does not have side effect. This
guarantee is due to the pointer (that is, the address) being passed by value.

Study [this program](https://godbolt.org/z/8_KTcd) prepared to illustrate the
declaration forms of non-array pointer parameters.

**Advice:** Strive to use references instead of pointers for both variables and
parameters.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Function return types

All four forms of pointer declarations listed in Section 1 may be used as function
return types, but the compiler [ignores](https://timsong-cpp.github.io/cppwp/n4659/dcl.fct#7)
the pointer `const`ness in Forms 3 and 4. Thus, only Forms 1 and 2 are relevant to
function return types.

Listing B shows the use of the four forms of pointer return types and calls out the
places where the compiler ignores pointer `const`ness. (Compiling the code linked in the listing's caption produces warnings about ignored qualifiers. The code still runs.)

---
{% include bookmark.html id="Listing B" %}

##### Listing B: forms of pointer return types ([run this code](https://godbolt.org/z/UBQYv7))

```cpp
int* f1() {
    return new int { 1 };
}

const int* f2() {
    return new int { 2 };
}

int* const f3() {          // ptr const qual ignored; returns int*
    return new int { 3 };
}

const int* const f4() {    // ptr const qual ignored; returns const int*
    return new int { 4 };
}

int main() {
    auto p1 = f1(); // type: int*
    auto p2 = f2(); // type: const int*
    auto p3 = f3(); // expected type: int* const; actual: int*
    auto p4 = f4(); // expected type: const int* const; actual: const int*

    //omit: save variables p1-p4 for later deleting

    p1 = p3;        // change ptr
    *p1 = 6;        // change data

    p2 = s1;        // change ptr
    *p2 = 6;        // error: can't change const data

    //omit: p3 and p4 behave as p1 and p2, respectively
    //omit: free dynamically-allocated ints using saved ptrs
}
```

---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Pointers and arrays

Pointer declarations are relevant in the context of traditional arrays because every
array "decays" to a pointer. For example, if `a` is an array of `int` values, then the
type of `a` decays to `int*`. In other words, the type of `a` is compatible with `int*`.
Likewise, if `a` is an array of `const int` values, then the type of `a` decays to
`const int*`. Note that the `const` qualification is on data; not on the pointer.

Following the decay principle, it is possible to assign an array variable to a pointer
variable of its decay type and place any of the four `const`ness permutations on the
pointer variable.

Array decay types are useful to receive array parameters, but as with non-array
pointers, the use of pointer `const`ness is uncommon. Study [this program](https://godbolt.org/z/qmvoVm)
prepared to illustrate `const` qualification on an array's decay types.

Array decay types with and without data `const`ness are frequently used with
[C-strings]( {{ '/2020/03/30/exploring-c-strings' | relative_url }} ), which are just
`char` arrays. For example, the library function [`std::strcpy`](https://en.cppreference.com/w/cpp/string/byte/strcpy)
receives the destination array as `char*` so that the destination can be modified, but it
receives the source array as `const char*` because the source is only read.  

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Pointers and arrays of pointers

This section discusses `const`ness of pointers to arrays of pointers. Because this topic
comes up frequently in the context of command-line processing, the examples in this
section use arrays of C-strings, but the details apply equally to arrays of pointers to
any type of data.

**Note:** When processing command-line arguments, it may be better to transform C-strings
into `std::string` or [`std::string_view`]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} )
objects, and if necessary, collect those objects in a container such as `std::vector`.
However, there are situations where it is better to directly work with C-strings and
arrays of C-strings. In those situations, take care to access only the portions of
memory that are allocated for the data with which you are working.  

A C++ program is able to receive command-line arguments with a [`main` function](https://timsong-cpp.github.io/cppwp/n4659/basic.start.main#2.2)
of the form `int main(int argc, char** argv)`, where `argc` is the number of arguments
received and `argv` is a pointer to pointer to `char`. However, due to the array decay
principle, the function can also be of the form `int main(int argc, char* argv[])`,
where `argv` is an array of `char` pointers.

Given that an array of C-strings could be modeled either as an array of `char` pointers
(say `char* argv[]`) or as a pointer to pointer to `char` (say `char** argv`), it helps
to understand the effect of `const` qualifications in each case. The effect of the
qualifications is the same whether the data is declared as a variable or a function
parameter. However, because command-line arguments are often consumed by functions, the
discussion and the examples in this section model the data as a parameter.

The following sub-sections summarize the effects of `const`ness permutations of `argv`, a
function parameter representing an array of C-strings. The effects are summarized under
two headings: `argv` as an array of `char` pointers, and `argv` as a pointer to pointer
to `char`.

Listing C shows some code to illustrate the effect of `const`ness permutations. For
simplicity only, the code assumes that the argument passed is an array of at least two
C-strings and that the first C-string has at least one non-null character in it. The
code at the link included in the listing's caption has additional comments.

**Note:** The summaries show that it is better to receive `argv` as an array of `char`
pointers (instead of a pointer to pointer to `char`), because that approach makes it
possible for a function to guarantee that it does **not** modify the characters in the
C-strings or the pointers to C-strings. It can provide this guarantee by declaring the
parameter using Form 4 as follows: `const char* const argv[]`. Also, as evidenced in
Listing C, this form makes the code more readable due to one less level of explicit
indirection needed to access both the pointers to C-strings and the characters in
C-strings.

{% include bookmark.html id="4.1" %}

#### 4.1&nbsp; Parameter is an array of `char` pointers

All permutations in this case permit modification of `argv` itself, and any such
modification would **not** have side effect. Also, If any permutation permits
modification of the pointers to C-strings or the characters in C-strings, such
modification would have side effects.

1. `char* argv[]`: Nothing is `const`. The characters in the C-strings and the pointers
   to C-strings may be modified.

2. `const char* argv[]`: The characters in the C-strings are `const`, but the pointers to
   C-strings are not.

3. `char* const argv[]`: The pointers to C-strings are `const`, but the characters in the
   the C-strings are not.

4. `const char* const argv[]`: Both the characters in the C-strings and the pointers to
   C-strings are `const`.

{% include bookmark.html id="4.2" %}

#### 4.2&nbsp; Parameter is a pointer to pointer to `char`

All permutations in this case permit modification of the pointers to C-strings, and any
such modification would have side effect. If any permutation permits modification of
the characters in C-strings, such modification would also have side effects. However,
where `argv` itself is modifiable, such modification would **not** have side effect.

1. `char** argv`: Nothing is `const`. The characters in the C-strings and `argv` itself
    may be modified.

2. `const char** argv`: The characters in the C-strings are `const`, but `argv` is not.

3. `char** const argv`: `argv` is `const`, but the characters in the C-strings are not.

4. `const char** const argv`: Both the characters in the C-strings and `argv` are
   `const`.

---
{% include bookmark.html id="Listing C" %}

##### Listing C: forms of pointer to array of pointers ([run this code](https://godbolt.org/z/cbJRJG))

{% include multi-column-start.html c=1 h="Array of <code>char</code> pointers" %}

```cpp
static char s1[]{"g1"}, s2[]{"g2"},
            s3[]{"g3"}, s4[]{"g4"};

void g1(char* argv[]) {
    *argv[0] = '1'; // alter data
    argv[1] = s1;   // alter C-string ptr
    ++argv;         // alter argv
}

void g2(const char* argv[]) {
    *argv[0] = '2'; // error: const data
    argv[1] = s2;
    ++argv;
}

void g3(char* const argv[]) {
    *argv[0] = '3';
    argv[1] = s3;   // error: const ptr
    ++argv;
}

void g4(const char* const argv[]) {
    *argv[0] = '4'; // error: const data
    argv[1] = s4;   // error: const ptr
    ++argv;
}
```

{% include multi-column-start.html c=2 h="Pointer to pointer to <code>char</code>" %}

```cpp
static char s1[]{"g1"}, s2[]{"g2"},
            s3[]{"g3"}, s4[]{"g4"};

void g1(char** argv) {
    **argv = '1';     // alter data
    *(argv+1) = s1;   // alter C-string ptr
    ++argv;           // alter argv
}

void g2(const char** argv) {
    **argv = '2';   // error: const data
    *(argv+1) = s2;
    ++argv;
}

void g3(char** const argv) {
    **argv = '3';
    *(argv+1) = s3;
    ++argv;         // error: const ptr
}

void g4(const char** const argv) {
    **argv = '4';   // error: const data
    *(argv+1) = s4;
    ++argv;         // error: const ptr
}
```

{% include multi-column-end.html %}

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Summary

Every pointer declaration can include up to two `const` qualifications, one for the data
pointed, another for the pointer itself. As a result of this allowance, four `const`ness
permutations exist and each permutation has a corresponding declaration form. All four
forms apply to variables, parameters, and function return types. However, two of the
parameter declaration forms could be replaced by reference declarations in most cases,
and the compiler ignores two of the forms of return type declarations.

The declaration forms apply to pointers to non-array data as well as array data. There
are two different ways to model the decay type of an array of pointers and the two means
subtly differ in their effect, with only one of those means offering complete safety.

Although it is generally better to use references instead of pointers, and containers
instead of traditional arrays, some situations do require the use of pointers and
traditional arrays. Thus, it is important to fully understand `const` qualification of
pointers so as to maximize safety. For example, for maximal safety, a function to process
command-line arguments should treat the arguments as an array of `char` pointers and
impose both data `const`ness and pointer `const`ness on the array parameter.

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Exercises

**Note:** Complete the exercises in C++17 using GCC 10.1. Do **not** suppress any
compiler warning. Use the following exact set of compiler options:

```
-std=c++17 -Wall -Wextra -pedantic
```

1. Write a program with the following functions. In `main`, print the type name of the
   value returned from each function. Also, briefly describe in English what the presence
   or absence of compiler warnings means with respect to each pair of functions.

    {:start="a"}
    1. Two functions named `a1` and `a2`, both returning some (any) `int` value, except
       the second function's return type is `const int`.

    2. Two functions named `b1` and `b2`, both returning a reference to a global `int`
       variable, except the second function's return type is `const int&`.

    3. Two functions named `c1` and `c2`, both returning a local default-initialized
       `std::string` object, except the second function's return type is
       `const std::string`.

    4. Two functions named `d1` and `d2`, both returning a reference to a
       default-initialized file-scoped `std::string` object, except the second function's
       return type is `const std::string&`.

2. Write four versions of a function to return the length of a C-string. Name the
   versions `len_1`, `len_2`, `len_3`, and `len_4`, and have each version receive a
   C-string parameter using a different permutation of `const`ness. In the body of each
   version, declare/use only pointer variables and apply the strictest `const`ness on the
   variables based on the operations performed on the variable. For example, if the
   pointer variable is not used to modify the data, give it data `const`ness; if the
   address is not modified, (also) give it pointer `const`ness.

    {:start="a"}
    1. In `main`, call each of the four functions to find the length of the same
       C-string literal (for example, `"hello"`), and print the value returned from each
       call. Directly specify the literal as the argument in all four function calls.
       Use any casting operations necessary to remove any compiler error or warning. (Do
       **not** suppress errors or warnings using compiler options.)

    2. Also in `main`, call each of the four functions again to find the length of some
       text the user supplies at run time, and print the value returned from each call.
       Use the same user-supplied text in all four calls. Model the user-supplied text
       as a C-string and assume the user enters no more than 99 characters.

    3. Which version of the length function is safest for another function to call in
       terms of assuring no side effect to the caller? Why?

    4. Which version of the length function is safest within itself in terms of assuring
       that only the variables (including the parameter) intended to be modified are
       modified? If none of four versions is the safest within itself, write another
       version you deem is safest (OK to use non-pointer variables). Explain how the new
       version improves safety within the function.

    5. Which version of the length function is "safe enough" for use overall? Why?

    6. Is there some code that can be used **unchanged as the entire function body in
       all four initial versions** of the length function? If yes, what is it? If no such
       code exists, why not?

    7. Write a new version of the length function that declares no variables in its body
       and provides its parameter both data `const`ness and pointer `const`ness. This
       version should **not** call any other version of the length function.
