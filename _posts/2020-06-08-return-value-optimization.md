---
pid: 6
title: "Return value optimization (RVO)"
date: 2020-06-08
authors: smurthys
cpp_level: intermediate
cpp_versions: ["C++98", "C++03", "C++17"]
reader_activity: exercises
tweet_url: https://twitter.com/sigcpp/status/1272634370105450501
---

Return-value optimization is a compiler technique to avoid copying an object that a
function returns as its value, including avoiding creation of a temporary object. This
optimization permits a function to efficiently return large objects while also
simplifying the function's interface and eliminating scope for issues such as resource
leaks. However, there are situations where a compiler may be unable to perform this
optimization,  where a function does not capitalize on the optimization, and where it may
be acceptable or even be better to forego this optimization.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Overview

Return-value optimization is part of a category of optimizations enabled by "copy
elision" (meaning "omitting copying"). C++17 requires copy elision when a function returns a [temporary object](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/p0135r0.html)
(unnamed object), but [does not require it](https://timsong-cpp.github.io/cppwp/n4659/class.copy.elision#1.1)
when a function returns a named object. Also, whether copy elision is
helpful depends on how the function's return value is consumed. Thus, it is important to
understand the code organization of both the called and calling functions, and verify if
the optimization is performed or is helpful in a given situation.

The terms RVO and NRVO are frequently used in relation to copy elision, but the C++
standard does **not** define those terms. Also, the term RVO is sometimes used to mean
optimization with respect to unnamed objects, but sometimes also to mean optimization in
relation to both named and unnamed objects. Thus, for clarity, this post uses the
following terms and acronyms:

- RVO: copy elision for either unnamed objects or named objects
- Unnamed RVO and URVO: copy elision for unnamed objects only [the term URVO is my own creation for the
  purpose of this post]
- NRVO: copy elision for named objects only [NRVO is a well-established term]

Listing A shows a simple struct rigged to show which constructor is called as well as to
show when the assignment operator and the destructor are called. The static variable
`counter` is used to assign unique identifiers to instances of the struct. This post uses
this rig to illustrate RVO and to check the circumstances in which RVO is performed or
is helpful.

{% include start-aside.html kind="info" %}

All examples and optimizations described in this post are verified in C++17 using both
GCC 10.1 and Visual Studio 2019 Version 16.5.5. The code in Listings A, B, and C is also
verified in C++98 using GCC 4.1.2.

{% include end-aside.html %}

---
{% include bookmark.html id="Listing A" %}

##### Listing A: a struct rigged to show constructor, assignment, and destructor calls

```cpp
static int counter; // counter to identify instances of S

struct S {
    int i{ 0 };
    int id;

    S() : id{ ++counter } {
        std::cout << "default ctor " << id << "\n";
    }

    S(const S& s) : i{ s.i }, id{ ++counter } {
        std::cout << "copy ctor " << id << "\n";
    }

    S& operator=(const S& s) {
        i = s.i;
        std::cout << "assign " << s.id << " to " << id << "\n";
        return *this;
    }

    ~S() {
        std::cout << "dtor " << id << "\n";
    }
};
```

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Unnamed RVO

Unnamed RVO (URVO) relates to optimizing the return of "unnamed objects" or temporary
 objects, which are objects created on a `return` statement.

URVO is a relatively old technique and has been permitted since C++98 ([Section 12.2 of that standard](http://www.lirmm.fr/~ducour/Doc-objets/ISO+IEC+14882-1998.pdf)),
but it is required only since C++17. C++ compilers have likely supported URVO at least
as far back as 2001. MSVC has supported it at least since [Visual C++ 2005](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80)),
but in the GCC world, due to my limited access to tools, I am able to trace it back only
to [GCC 4.1.2](https://godbolt.org/z/4HdRj7) (which was released in [2007](https://gcc.gnu.org/releases.html)).

Listing B analyzes the same code in two scenarios. In both scenarios, the object value
to return is created on the `return` statement. In the scenario without URVO, the code
would create two objects: a temporary object in function `get_B` using the default
constructor, and the object named `s` in `main` using the copy constructor. However,
with URVO, the same code would create just one object. The comments in code call out the
location and sequence of object creation and destruction.

**Note:** Both GCC and MSVC perform URVO by default, and it is not possible to disable it because
C++17 guarantees copy elision when a temporary object is returned. (URVO can be disabled in C++14.
See [Exercise 1](#9).)

---
{% include bookmark.html id="Listing B" %}

##### Listing B: behavior without URVO and with URVO ([run this code](https://godbolt.org/z/Ape7pT))

{% include multi-column-start.html c=1 h="Without URVO" %}

```cpp
S get_B() {
    return S(); // 1. default ctor 1
} // 2. copy ctor 2; 3. dtor 1

int main() {
    S s = get_B();
} // 4. dtor 2
```

{% include multi-column-start.html c=2 h="With URVO" %}

```cpp
S get_B() {
    return S(); // 1. default ctor 1
}

int main() {
    S s = get_B();
} // 2. dtor 1
```

{% include multi-column-end.html %}

---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Named RVO

Named RVO (NRVO) is concerned with the optimization performed for "named objects", which
are objects returned but not created on a `return` statement. Listing C illustrates this
optimization. As the comments point out, without NRVO, the code creates two instances of
`S`, but with NRVO, it creates only one object.

{% include start-aside.html kind="warn" show_icon=true %}

- GCC performs NRVO by default, but it can be disabled using the
[`-fno-elide-constructors`](https://gcc.gnu.org/onlinedocs/gcc/C_002b_002b-Dialect-Options.html#C_002b_002b-Dialect-Options)
compiler option.

- MSVC disables NRVO by default, but it can be enabled using [`/O2` optimization](https://docs.microsoft.com/en-us/previous-versions/ms364057(v=vs.80)).

{% include end-aside.html %}

---
{% include bookmark.html id="Listing C" %}

##### Listing C: behavior without NRVO and with NRVO ([run this code](https://godbolt.org/z/TbroUH))

{% include multi-column-start.html c=1 h="Without NRVO" %}

```cpp
S get_C() {
    S s;      // 1. default ctor 1
    s.i = 8;
    return s;
} //  2. copy ctor 2; 3. dtor 1

int main() {
    S s = get_C();
} // 4. dtor 2
```

{% include multi-column-start.html c=2 h="With NRVO" %}


```cpp
S get_C() {
    S s;      // 1. default ctor 1
    s.i = 8;
    return s;
}

int main() {
    S s = get_C();
} // 2. dtor 1
```

{% include multi-column-end.html %}

---

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Compiler limitations

Presently, compilers are likely to perform NRVO only if the same named object is
returned from all paths of a function; **not** if different paths return different
named objects. Listing D sets up this comparison: Function `get_D1` has two different
paths and both paths return the same named object. Function `get_D2` also has two return
paths, but each path creates and returns a different named object.

**Note:** GCC performs NRVO in `get_D1`, but not in `get_D2` (not even with the `-O4`
compiler option which causes the highest level of optimization).

MSVC does **not** perform NRVO even in function `get_D1` (even with the `/O2` option
enabled). That is, at least for now, MSVC does not perform NRVO when branching is
involved, even if the function returns the same named object in all paths.

---
{% include bookmark.html id="Listing D" %}

##### Listing D: returning named objects from different paths ([run this code](https://godbolt.org/z/jQWwSh))

```cpp
S get_D1(int x) {
    S s;                // 1. default ctor 1
    if (x % 2 == 0) {
        s.i = 8;
        return s;
    } else {
        s.i = 22;
        return s;
    }
}

S get_D2(int x) {
    if (x % 2 == 0) {
        S s1;          // 2. default ctor 2 (or default ctor for s2 below)
        s1.i = 8;
        return s1;
    } else {
        S s2;          // 2. default ctor 2 (or default ctor for s1 above)
        s2.i = 22;
        return s2;
    }
} // 3. copy ctor 3 (either s1 or s2 above); 4. dtor 2

int main() {
    std::cout << "get_D1:\n";
    S s1 = get_D1(3);

    std::cout << "\nget_D2:\n";
    S s2 = get_D2(3);
} // 5. dtor 3, dtor 1
```

---

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Role of the calling function

Listing E shows a subtle logic error that causes loss of NRVO benefit: In `main`, an
instance of `S` is created using the default constructor in the first line and it is then
assigned the return value from function `get_E`. This situation requires the compiler to
create two objects and invoke the assignment operator to set variable `s` to the
function's return value.

**Note:** The loss of optimization benefit in Listing E applies even if function `get_E`
returns an unnamed object.

To repeat, the situation in Listing E is a logic error; not a case of the compiler not
performing RVO. If the compiler does any sort of RVO (and C++17 guarantees URVO), it does
so without regard for the calling context. To be precise, the compiler generates code such
that object copying is avoided if the return value is used as the initializer for a
receiving variable (and in a few other cases; see [Exercise 6](#9)).

Because the compiler performs RVO independent of the calling context, RVO benefits are
available whether the function is reused in source form or binary form, and it is always
up to the calling function to lose or gain the benefit.

---
{% include bookmark.html id="Listing E" %}

##### Listing E: losing NRVO benefit ([run this code](https://godbolt.org/z/Svn-K4))

```cpp
S get_E() {
    S s;         // 2. default ctor 2
    s.i = 8;
    return s;
} // 3. assign 2 to 1; 4. dtor 2

int main() {
    S s;         // 1. default ctor 1
    s = get_E();
} // 5. dtor 1
```

---

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Working around lack/loss of RVO

In a situation where the compiler does not perform RVO (either unnamed or named) or
if RVO cannot be exploited for some reason, a simple solution is for the calling function
to pass a reference to a pre-built instance and have the called function modify the
object it receives by reference. This approach assumes the object supports all necessary
modifier functions. It also makes the function interface a bit more complex.

An alternative is for the called function to dynamically allocate an object and return
an object pointer, but this approach is error prone (all the issues related to pointer
manipulation) and causes memory leaks if the object is not freed.

Listing F illustrates the use of the two alternatives just outlined: Function `get_F1`
receives a pre-created object by reference and alters the received object. `get_F2`
dynamically allocates an object, sets up the object's data, and returns a pointer to the
dynamic object. `main` is responsible for freeing the dynamically-allocated object.

---
{% include bookmark.html id="Listing E" %}

##### Listing F: working around lack/loss of RVO ([run this code](https://godbolt.org/z/5jbFzq))

```cpp
void get_F1(S& s) {
    s.i = 8;
}

S* get_F2() {
    S* ps = new S; // 2. default ctor 2
    ps->i = 8;
    return ps;     // should be freed later
}

int main() {
    S s;           // 1. default ctor 1
    get_F1(s);
    std::cout << s.i << '\n';

    S* ps{ get_F2() };
    std::cout << ps->i << '\n';
    delete ps;     // 3. dtor 2
} // 4. dtor 1
```

---

{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Foregoing optimization

In some situations it can be acceptable or be better to forego RVO. For example, if a
function returns a small object (such as an instance of the example struct `S`), it may
be acceptable to lose the benefit of the optimization. However, if a function returns a
large object such as a vector of 100 string objects, it might be important to take
advantage of RVO.

It is not possible to take advantage of RVO if the receiving variable in the calling
function is required after the block in which the variable receives the function value.
The loss of RVO benefit is due to the need to declare the receiving variable before the
block in which the variable receives its object value. In this situation, alternatives
such as those outlined in [Section 6](#6) would need to be used if it is necessary to
avoid copying objects.

Listing G shows two possible code organizations to meet the needs of a [real-life application](https://github.com/sigcpp/stl-lite/blob/87eef34616b5c5c377899f84f6bfb5b630b4501e/test/driver.cpp#L63-L135).
Functions `get` and `use` in the listing are some functions that return and accept an
instance of `S`, respectively. The code with the "Lose RVO" organization misses out on
the RVO benefit (why?), but it is simple and readable, mainly because the exception
handlers are sequential. In contrast, the code with the "Gain RVO" organization benefits
from RVO, but it is less readable, largely due to the nested exception handling.

**Note:** Listing G is meant only to illustrate common trade-offs involving RVO. It is
not meant to promote any particular program organization. Other (better) organizations
can exist, and the organizations possible as well as the best organization depend on the
application.

---
{% include bookmark.html id="Listing G" %}

##### Listing G: effect of code organization ([run this code](https://godbolt.org/z/XJRU92))

{% include multi-column-start.html c=1 h="Lose RVO, sequential exception handling" %}

```cpp
int main() {
    S s;           // default ctor
    try {
        s = get(); // lost RVO benefit
        use(s);
    } catch (...) {
        std::cout << "error get/use";
        return 1;
    }

    try {
        // stuff, unrelated to s
    } catch (...) {
        std::cout << "error";
        return 2;
    }

    if (s.i == 3) // use s again
        std::cout << "It was 3?";
}
```

{% include multi-column-start.html c=2 h="Gain RVO, nested exception handling" %}

```cpp
int main() {
    try {
        S s = get(); // RVO benefit
        use(s);

        try {
            // stuff, unrelated to s
        } catch (...) {
            std::cout << "error";
            return 2;
        }

        if (s.i == 3) // use s again
            std::cout << "It was 3?";

    } catch (...) {
        std::cout << "error get/use";
        return 1;
    }
}
```

{% include multi-column-end.html %}

---

{% include bookmark.html id="8" %}

### 8.&nbsp;&nbsp; Summary

RVO is a compiler technique to avoid copying objects when the object is returned as
function value. This optimization helps a function to efficiently return large objects
while also simplifying the function's interface and eliminating scope for errors.

C++ requires RVO only for temporary (unnamed) objects, but not for named objects. Also,
support for RVO varies by situation and across compilers. Thus, it is necessary to
verify if the compiler performs RVO in a given situation and rewrite code to benefit
from RVO, forego RVO, or to work around the loss or lack of RVO.

The struct `S` in [Listing A](#listing-a) is a good instrument to test RVO in a given
situation. The code in Listings [C](#listing-c) and [D](#listing-d) help determine if a
compiler performs NRVO in a given situation.  

Lastly, beware of the confusing use of the term RVO to mean optimization in relation to
only unnamed objects, or optimization in relation to either named or unnamed objects.

{% include bookmark.html id="9" %}

### 9.&nbsp;&nbsp; Exercises

1. Complete the following tasks with the code in [Listing B](#listing-b). Do **not**
   make any change to that code, and run the code only in GCC 10.1:

    {:start="a"}
    1. Run the code with copy elision enabled (which is the default), but in C++14, and
       confirm that the results are the same as for C++17. Use the compiler option
       `-std=c++14` to set the language to C++14.

    2. Disable copy elision (compiler option `-fno-elide-constructors`) and run the
       code in C++14. How is the result different from the result anticipated in
       [Section 2](#2) for the "Without URVO" scenario?

    3. With copy elision disabled, set the compiler to use C++17 and compare the result
       with the result from C++14. What confirmation does the comparison provide?

2. Answer the following questions in relation to [this program](https://godbolt.org/z/knnn46)
   prepared to verify copy elision in C++98 using GCC 4.6.4:

    {:start="a"}
    1. As is, which kind of optimization does the code perform: URVO or NRVO? What is the
       location and sequence of object construction and destruction?

    2. Change function `get` such that it performs a different kind of optimization than
       what is originally done: change the code to perform URVO if it already performs
       NRVO, and vice versa.

    3. With the program as given, disable copy elision and compare the result with the
       result from when copy elision is enabled. Explain the reason for the differences
       between the results.

    4. With the program as given, disable copy elision and compare the result with the
       result for the part of [Listing C](#listing-c) where copy elision is disabled.
       What differences are apparent and what are the likely reasons for the differences?

    5. In what ways does the C++98 code provided differ from the corresponding C++17
       code in Listing C?

       **Note:** This question is unrelated to RVO, but it is opportunistically
       included to highlight some syntactic differences between C++98 and C++17.

3. Disable copy elision for the code in Listings [D](#listing-d), [E](#listing-e), and
   [G](#listing-g). For each listing, explain the differences between the results with
   and without copy elision. Use only GCC 10.1 in all cases.

4. Run all the code examples in this post in MSVC. Run the code with optimization
   disabled (`/Od`, which is the default) and again with optimization-for-speed enabled
   (`/O2`) . Analyze the result from each run and compare the results across runs. For
   ease of use, set the active configuration to "Release" in all runs.

   **Note:** [Visual Studio Community](https://visualstudio.microsoft.com/vs/community/)
   is free, just in case you do not already have MSVC installed.

5. Consider the declaration `S f();` for a third-party library function `f` distributed
   in binary form. Assume we do **not** have access to the source code of `f`, but we
   know the library is compiled with GCC 10.1. State all assumptions you make.

    {:start="a"}
    1. What can we say about the RVO that might be performed in function `f`, without
       regard for how and where `f` is used? Include a rationale for your position.

    2. How and why would your position change for this statement: `S s = f();`

    3. How and why would your position change for this statement sequence: `S s; s = f();`

6. Revise the code in [Listing E](#listing-e) as follows in C++17 using GCC 10.1. Then,
   based on the revised program's output, answer this question: Does the revised `main`
   get the benefit of RVO? If yes, make a general statement on the circumstances in which
   a calling function gets the benefit of RVO. If you say `main` does not get the benefit
   of RVO, explain why and point to the part of the program's output that supports your
   position. In either case, submit a Compiler Explorer link to the revised program.

    {:start="i"}
    1. Add a function named `use_E` which receives a `const` reference to an instance of
       `S`. In the function, merely print to screen the value of `S`'s data member `i`.

    2. Change the entire body of `main` to contain just this one statement: `use_E(get_E());`

7. What revision to struct `S` and corresponding revision to function `get_D2` of
   [Listing D](#listing-d) permit `get_D2` to return different objects in each path
   while also enabling RVO? What does this RVO-enabling change in `S` and `get_D2`
   inform us about writing classes/structs and returning object values?

   [I apologize if this question seems underspecified, but being more specific gives
   away too much of the solution. Please DM if you like more information.]
