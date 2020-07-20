---
pid: 8
title: "Variadic print macros"
date: 2020-07-10
authors: smurthys
cpp_level: introductory
cpp_versions: "Any C++"
reader_activity: exercises
---

This post describes some macros I routinely use when experimenting with code. It provides
a step-by-step exposition of the use cases and the design leading to the use of variadic
macros to satisfy requirements. In the process, the post also touches on the decision (and a need) to use macros instead of function templates.

There is decidedly not much to the macros, but I chose to describe them because there is
much educational value due to some tricky issues that need to be addressed in assembling
a practical solution.
<!--more-->

**Note:** All macros are verified in C++98, C++11, C++14, and C++17 using GCC 10.1. They
are also verified in C++14 and C++17 using Visual Studio 2019 Version 16.5.5.

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Use cases

Many code examples in this blog (and elsewhere) often illustrate concepts by printing
the results of expressions along with a suitable heading. Listing A shows four such lines
of code and their outputs. For simplicity, the listing omits variable declarations. Also,
Line 2 of the listing intentionally uses `NULL` instead of `nullptr` so that the code is
consistent with later examples that illustrate compatibility of the macros with C++98.

Each of the four lines of code in Listing A represents a different use case:

1. Print the value of an expression (`std::strlen(z)`).
2. Print the value of an expression as heading (`typename of a:`) and then value of
   another expression (`typeid(a).name()`).
3. Print the text of an expression (`sv1.data() != NULL`) as heading and then print the
   value of that expression. This is the most common use case.
4. Print the value of an expression as heading (`duration:`), then the value of another
   expression (`elapsed`), and then the value of a "tail" expression (`s`).

{% include bookmark.html id="Listing A" %}

##### Listing A: use cases for print macros

{% include multi-column-start.html c=1 h="Code" %}

```cpp
std::cout << std::strlen(z) << '\n';
std::cout << "typename of a: " << typeid(a).name() << '\n';
std::cout << "s.data() != NULL: " << (s.data() != NULL) << '\n';
std::cout << "duration: " << elapsed << "s\n";
```

{% include multi-column-start.html c=2 h="Output" %}

```console
5
typename of a: A10_i
s.data() != NULL: true
duration: 0.0009001s
```

{% include multi-column-end.html %}

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Initial solution

The issue with using the kind of code in Listing A is that it translates to a lot of
code. Also, in Use Case 3, it is easy to forget editing the expression in the heading
when the expression changes. For example, in Listing A, it is easy to forget to change
the heading text if the expression to evaluate is changed to use `nullptr` instead of
`NULL`.

Use Cases 1, 2, and 4 are easily implemented with function templates, but that approach
produces a lot of code; not to mention many template instantiations. Further, Use Case 3
should be ideally satisfied by automatically generating the heading from the
expression itself, and that is possible only with a macro; not with a function (template).

Because Use Case 3 is satisfied only with a macro, and because the other cases are also
easily satisfied using 1-line macros, it is better to implement all cases with just
macros. Plus, the resulting macros can be easily pasted into any code where they are
needed. In contrast, function templates would be quite long and not as easy to reuse
(but they do provide better type safety; see [Exercises 5 and 6](#7)).

Listing B shows an initial set of function-like macros to collectively implement the
four use cases identified: one macro per use case. The listing also shows the macros
being used to print the same information printed in Listing A. The `main` function
intentionally uses C++98 features to illustrate that the macros work that far back.

---
{% include bookmark.html id="Listing B" %}

##### Listing B: initial print macros ([run this code](https://godbolt.org/z/YraavE))

```cpp
#define PRINTLN(x) std::cout << (x) << '\n'
#define PRINT_HXLN(h,x) std::cout << (h) << ": " << (x) << '\n'
#define PRINT_XLN(x) std::cout << #x << ": " << (x) << '\n'
#define PRINT_HXTLN(h,x,t) std::cout << (h) << ": " << (x) << (t) << '\n'

int main() {
    std::cout << std::boolalpha;
    char z[] = "hello"; // no UIS in C++98
    int a[10];
    std::string s;
    double elapsed = 0.0009001;

    // the following four lines match the four code lines in Listing A
    PRINTLN(std::strlen(z));
    PRINT_HXLN("typename of a", typeid(a).name());
    PRINT_XLN(s.data() != NULL); // no constant nullptr in C++98
    PRINT_HXTLN("duration", elapsed, 's');
}
```

---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Solution details

Here is a brief note on each of the four macros in Listing B:

1. `PRINTLN(x) std::cout << (x) << '\n'`: This macro simply prints the value of
    expression `x`.

2. `PRINT_HXLN(h,x) std::cout << (h) << ": " << (x) << '\n'`: This macro prints the
   value of expression `h` as heading and then prints the value of expression `x`.

3. `PRINT_XLN(x) std::cout << #x << ": " << (x) << '\n'`: This macro prints the text of
   expression `x` as heading and then prints the value of that expression. It uses the
   [# operator](https://en.cppreference.com/w/cpp/preprocessor/replace#.23_and_.23.23_operators)
   to "stringify" the expression supplied.

4. `PRINT_HXTLN(h,x,t) std::cout << (h) << ": " << (x) << (t) << '\n'`:  This macro
   prints the value of expression `h` as heading, then prints the value of expression
   `x`, and then prints the value of the tail expression `t`.

The following general points apply to all the macros developed:

- As the code linked in Listing B shows, each macro has two variations: one that inserts
  a new line after inserting values (as shown in Listing B); and one that does **not**
  insert a new line. The variant that inserts a new line has the `LN` suffix in its name;
  the other variant does not have the `LN` prefix. For example, `PRINTLN` and `PRINT`. In
  all, a total of **eight macros** are developed.

- Every expression received is parenthesized to ensure the expression is evaluated fully
  before inserting the result into the output stream.

- Each macro expands to an expression whose value is a reference to `std::cout`. Thus,
  other insertions can be chained with each invocation of the macro. For example, one
  could write the following statement:

  ```cpp
  PRINT("hello") << " world";
  ```
  
- Because each macro expands to an expression, a semi-colon is necessary to treat each
  invocation as a statement (as shown in the `main` function of Listing B). This need is
  not a limitation imposed by the macros developed, but a C++ requirement to change any
  function-call expression to a statement.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Modularizing the macros

The eight macros at the link included in Listing B can be modularized so as to increase
reuse among the macros. Listing C shows the result of modularization. The following
points are worth noting about the modularized macros:

- The modularization is possible because the macros expand to expressions instead of
  statements.

- The modularization of `PRINT_XLN` follows a different pattern than what the other
  new-line inserting macros follow. [Exercise 3](#7) explores the reason for the
  difference.

**Note:** Use the modularized macros shown in Listing C, instead of using the initial
macros shown in Listing B: the macros in Listing C are easier to maintain due to code
reuse. (See [Exercise 2](#7).)

---
{% include bookmark.html id="Listing C" %}

##### Listing C: modularized print macros ([run this code](https://godbolt.org/z/KnMdTs))

```cpp
#define PRINT(x) std::cout << (x)
#define PRINT_HX(h,x) PRINT(h) << ": " << (x)
#define PRINT_X(x) PRINT_HX(#x,x)
#define PRINT_HXT(h,x,t) PRINT_HX(h,x) << (t)

#define PRINTLN(x) PRINT(x) << '\n'
#define PRINT_HXLN(h,x) PRINT_HX(h,x) << '\n'
#define PRINT_XLN(x) PRINT_HXLN(#x,x)
#define PRINT_HXTLN(h,x,t) PRINT_HXT(h,x,t) << '\n'
```

---

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Optionally setting the output stream

The macros presented thus far send output only to `std::cout`. However, sometimes it may
be necessary to optionally send output to a different stream. This feature can be
supported using variadic macros which are function-like macros with variable number of
arguments.

A [variadic macro](https://en.cppreference.com/w/cpp/preprocessor/replace) is denoted by
placing an ellipsis (`...`) after all the fixed parameters in the macro definition. (It
is OK for a macro to have no fixed parameters and receive only variable number of
arguments.) The token `__VA_ARGS__` in the replacement list of a variadic macro
represents the actual arguments passed for the variadic portion.

The following key information applies to variadic macros:

- Variadic macros were introduced in C++11.

- Until C++20, the ellipsis in a macro definition stands for "one or more arguments".
  That is, at least one argument must be supplied to the variadic portion of the macro's
  parameters. For example, invoking the variadic macro `F(x,...)` requires at least two
  arguments: one for the fixed parameter `x`; another for the variadic part.

- Since C++20, the ellipsis in a macro definition stands for "zero or more arguments".
  That is, arguments to the variadic portion are optional. For example, the variadic
  macro `F(x,...)` may be invoked with just one argument (for the fixed parameter `x`).

- Until C++20, both GCC and clang generate a warning if the `-pedantic` compiler
  option is set and a variadic macro is invoked without any argument for the variable
  portion. Unless warnings are treated as errors (or `-pedantic` is not used), the code
  compiles successfully.

- Visual Studio 2019 Version 16.5.5 does not produce warnings if a variadic macro is
  invoked without any argument for the variadic portion. (Visual Studio documentation
  does not list any complier option to control warnings in this case.)

Listing D shows the use of variadic macros to optionally set the output stream. These
macros are enabled by:

- the modular organization of macros (shown in Listing C);

- function `ostream` which simply returns the stream reference it receives, returning
  `std::cout` by default if no argument is supplied; and

- passing `__VA_ARGS__` as the argument to function `ostream`, which has the effect of
  using `std::cout` if `__VA_ARGS__` is empty, and using `__VA_ARGS__` as the stream if
  an argument is supplied.

---
{% include bookmark.html id="Listing D" %}

##### Listing D: variadic print macros ([run this code](https://godbolt.org/z/jv1bqE))

```cpp
inline std::ostream& ostream(std::ostream& o = std::cout) { return o; }

#define PRINT(x,...) ostream(__VA_ARGS__) << (x)
#define PRINT_HX(h,x,...) PRINT(h,__VA_ARGS__) << ": " << (x)
#define PRINT_X(x,...) PRINT_HX(#x,x,__VA_ARGS__)
#define PRINT_HXT(h,x,t,...) PRINT_HX(h,x,__VA_ARGS__) << (t)

#define PRINTLN(x,...) PRINT(x,__VA_ARGS__) << '\n'
#define PRINT_HXLN(h,x,...) PRINT_HX(h,x,__VA_ARGS__) << '\n'
#define PRINT_XLN(x,...) PRINT_HXLN(#x,x,__VA_ARGS__)
#define PRINT_HXTLN(h,x,t,...) PRINT_HXT(h,x,t,__VA_ARGS__) << '\n'

int main() {
    PRINTLN(std::strlen(z));                          // default std::cout

    std::ostringstream str_out;
    PRINT_XLN(s.data() != NULL, str_out);             // send to string stream
    PRINTLN(str_out.str());                           // default std::cout

    PRINT_HXTLN("duration", elapsed, 's', std::cerr); // send to std::cerr
}
```

---

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Summary

Illustration through printing and printing diagnostics are fairly common requirements,
and macros are a convenient means to meet some of those requirements. Although function
templates could be used instead of macros for the most part, only a macro can
automatically generate the text of the expression from an expression. Also, using macros
avoids compile-time template instantiations, but macros do not provide the type safety
that templates do. With that said, macros are still the preferred approach due to their
simplicity and ease of reuse.

Here are a few things to keep in mind when using the macros presented:

- To use the macros, simply copy and paste the macros to an appropriate location in your
  own source file (or include file). When copying, please include a link to this post so
  people can follow the rationale for the choices, and also to acknowledge the source.

- Use the macros in Listing C if you print only to `std::cout` so that you do not
  unnecessarily use variadic macros in your code: variadic macros without type checking
  can introduce errors. (See [Exercises 5 and 6](#7).)

- Use the macros in Listing D if in the same program you need to print to different
  streams. Strictly speaking, invoking these macros without specifying an output stream
  requires C++20, but the macros works just fine in GCC, clang, and MSVC, even if the
  compiler produces warnings (depends on the options used).

- Avoid using the macros in Listing B even though they provide the same functionality as
  the macros in Listing C. The macros in Listings C and D are modular, reuse code, and
  are more easily maintained. (See [Exercise 2](#7).)

{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Exercises

1. Following the discussion in [Section 3](#3), does the following chaining of macro
   invocations compile successfully? If yes, what does the program print? If the code
   does not compile, illustrate the reason with your own code segment that fully expands
   the macros in the statement shown. (Imagine you are the pre-processor.)

   ```cpp
   PRINT("hello") << PRINT(" world");
   ```

2. The macros in Listings B, C, and D use `std::cout` as the default output stream, but
   in some programs, a different streams such as `std::cerr` might be better. Modify each
   of the programs linked in Listings B, C, and D to define a single symbol which stands
   for the default stream to use and then use the new symbol in the remainder of the
   program. Assume the programmer edits the definition of the symbol to set the default
   output stream. In all programs, do **not** alter the `main` function in any way.

   With all three programs changed as required, which of the three listings was "easier"
   to change (less effort to change and less error prone)? Why?

   **Note:** The length of this question notwithstanding, it is relatively simple to the
   make the required program changes and draw the conclusion asked.

3. The modularized `PRINT_XLN` macro in [Listing C](#listing-c) does not follow the same
   pattern as the other three new-line inserting macros: each of the other three macros
   invokes its non-`LN` counterpart and then inserts a new line:

   {:start="a"}
   1. In the code linked in Listing C, change the `PRINT_XLN` macro to reuse its non-`LN`
      counterpart. Clearly state the differences in the program's output after the change
      and explain the reason for the differences.

   2. Re-write the `PRINT_XLN` macro such that the revised macro is still modularized
      and it produces the same correct result as the original. (This exercise is trivial.)

4. Is it possible to write the variadic macro `PRINT(x,...)` in [Listing D](#listing-d)
   such that it does **not** call the function `ostream` or any other function? That is,
   is there an expression (that does not call a function) which can be used in the
   replacement list of the macro to choose the output stream bases on `__VA_­ARGS__`? If
   yes, what is that expression? If no such expression exists, why not? In either case,
   show a program to support your position. (Simply modify the program linked in Listing
   D.)

   **Note:** The expression `sizeof(#__VA_­ARGS__)` returns a value greater than `1` if
   `__VA_­ARGS__` is not empty. (By the way, what is the expression's value if
   `__VA_­ARGS__` is empty, and why that particular value?)

5. Function `ostream` in [Listing D](#listing-d) requires its argument to be a reference
   to a `std::ostream` object, but the macros permit any value to be passed as argument
   to the variadic part of the macro. This is not really an issue because the compiler
   flags an error (try it). However, the error message can be long and somewhat tedious
   to process:

   {:start="a"}
   1. What change can be made to the macro definitions or the function `ostream` (or
      something related to function `ostream`) such that the compiler generates a
      specific error message you choose? Alter the program linked in Listing D to make
      the changes you propose, but do **not** change the `main` function in any way.

   2. After making the changes, do you recommend keeping the changes you made, or would
      you rather just use Listing D as it is?

6. Modify the program linked in [Listing C](#listing-c) to replace as many macros as
   possible with function templates. Do **not** make any changes to the `main` function
   except to match the names of the new functions developed. Then answer the following
   questions:

   {:start="a"}
   1. Are there any macros that cannot be replaced with templates? Why?

   2. With the function templates in place, state the exact number of template
      instantiations caused by the code in `main`.

   3. Having made the code changes and counted the number of template instantiations,
      which approach do you recommend: using function templates as much as possible
      instead of macros, or using only macros? Justify your position in detail. Include
      a cogent note on the ease of use (reuse) of the solution each approach produces.
