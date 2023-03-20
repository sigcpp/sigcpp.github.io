---
title: "C++ Resources"
---

### C++ standard

**Note:** 
- For most versions, the links are to the final draft which are virtually identical to the actual final standard.
- HTML versions are link-friendly due to sections, paragraphs, and clauses being anchored.
- The PDF files linked tend to be *very large* and are not as link-friendly as their HTML counterparts.

| Version | Document type  |   |
|---------|----------------|---|
| Current draft | [HTML](https://eel.is/c++draft/)||
| C++20 | [HTML](https://timsong-cpp.github.io/cppwp/n4868/) | [PDF](https://timsong-cpp.github.io/cppwp/n4868/draft.pdf) |
| C++17 | [HTML](https://timsong-cpp.github.io/cppwp/n4659/) | [PDF](https://timsong-cpp.github.io/cppwp/n4659/draft.pdf) |
| C++14 | [HTML](https://timsong-cpp.github.io/cppwp/n4140/) | [PDF](https://timsong-cpp.github.io/cppwp/n4140/draft.pdf) |
| C++11 | [HTML](https://timsong-cpp.github.io/cppwp/n3337/) | [PDF](https://timsong-cpp.github.io/cppwp/n3337/draft.pdf) |
| C++03 | | [PDF](https://cs.nyu.edu/courses/fall11/CSCI-GA.2110-003/documents/c++2003std.pdf) |
| C++98 | | [PDF](http://www.lirmm.fr/~ducour/Doc-objets/ISO+IEC+14882-1998.pdf) |

### Related to the standard
* [GitHub repo](https://github.com/cplusplus/draft/tree/master/papers) with working drafts of the C++ standard
* [C++ Reference](http://en.cppreference.com/): unofficial but quite accurate
* [Compiler support for C++ standard](http://en.cppreference.com/w/cpp/compiler_support)

### Popular compilers (in no particular order)

* [GCC, the GNU Compiler Collection](http://gcc.gnu.org/)
* [clang](https://clang.llvm.org/)
* [Visual C++](https://docs.microsoft.com/en-us/cpp/cpp/c-cpp-language-and-standard-libraries) aka MSVC

### Online compilers

#### Compiler Explorer

| Compiler | Output type  |   |
|----------|--------------|---|
| GCC 12.2 | [Execution](https://sigcpp.godbolt.org/z/818Pj8zT6) | [Assembly](https://sigcpp.godbolt.org/z/WjfbKqG3K) |
| clang 16.0.0 | [Execution](https://sigcpp.godbolt.org/z/M9K773z91) | [Assembly](https://sigcpp.godbolt.org/z/x71TdM3qe) |
| MSVC 19.33 | - | [Assembly](https://godbolt.org/z/Pdjhb53z8) |
| GCC and clang | [Execution](https://sigcpp.godbolt.org/z/Gddj6PYoG) | [Assembly](https://sigcpp.godbolt.org/z/M54xWo8E8) |

#### Wandbox
  * [GCC 12.1](https://wandbox.org/permlink/ZbHdT9rcNv3CU1cE) 
  * [clang 15.0.0](https://wandbox.org/permlink/rf0DhNskZKWo6MPK)

#### About the links to online compilers

All links target x86-64. Compiler Explorer links target C++20. Wandbox links target `c++2b`. All GCC and clang
links use the following commandline options: `-Wall -Wextra -pedantic -pedantic-errors -Werror=pedantic -O0`

All links select a particular compiler version instead of "trunk/head/latest" so that the exact compiler version
is clear in conversations.

All links configure the compiler to report most warnings, but none asks the compiler to treat warnings as errors. This
choice is made so that the distinction between errors and warnings remains apparent. However, it is important to **treat
every warning as an error**, and ignore warnings only consciously.

All links explicitly disable optimization so that the exact effect of the source code is evident and can be compared
against the standard, as well as easily compare different compilers, without interference from optimization.

Compiler Explorer does not support execution for MSVC. Please review the status of this
[issue](https://github.com/mattgodbolt/compiler-explorer/issues/1502) and let us know if the situation has changed so we can
update the compiler link above. 

Many other online compiler services are available \(see [a list](https://arnemertz.github.io/online-compilers/)\), but most
have limitations with respect to compiler version, language standard, and other factors. However, no matter which online
service you use, make sure it uses a relatively new version of the compiler. Also make sure the service supports at
least C++17 (preferably C++20) and that you set the service to use the appropriate C++ standard version.

### Online resources

* [GCC options](https://gcc.gnu.org/onlinedocs/gcc/Option-Index.html#Option-Index)
* [MSVC options](https://learn.microsoft.com/en-us/cpp/build/reference/compiler-options?view=msvc-170)
* [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
* [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
* [More C++ Idioms](https://en.wikibooks.org/wiki/More_C%2B%2B_Idioms)
* [CodeStepByStep](https://www.codestepbystep.com/problem/list/cpp)