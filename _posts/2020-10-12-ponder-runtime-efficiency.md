---
pid: 9
title: "Ponder runtime efficiency"
date: 2020-10-12
authors: smurthys
cpp_level: introductory
cpp_versions: "Any C++" 
reader_activity: exercises
tweet_url: https://twitter.com/sigcpp/status/1316031474999721985
---

A student recently brought me a simple introductory-level problem found on the web and
asked if their program is "efficient". Though the problem is simple enough that most C++
beginners are likely to solve it in minutes, I noticed it provides good opportunity to
discuss certain efficiency considerations that are not typically discussed in an
introductory course.

This post describes the problem and invites students to develop alternative solutions and
analyze the runtime space and time (memory and speed) needs of the solutions. I encourage
students who have completed a course in C++ to ponder this problem, especially if they
have completed multiple C++ courses. The overall goal is to become aware of implementation
choices and their consequences.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Problem description

The problem is to read a whole number greater than zero from the user and print the
number as a word as long as the number does not exceed nine. For example, if the user
enters `1`, print the text `one`; if the user enters `2`, print `two`; and so on. If the
input number exceeds nine, just print the text `greater than nine`.

Example runs of a program might look as follows in a Microsoft Windows environment, where
`2` and `15` are values the user inputs at run time, and `as-text.exe` is the executable
file's name:

```console
C:\>as-text.exe
Enter a whole number greater than 0: 2
Number as text: two

C:\>as-text.exe
Enter a whole number greater than 0: 15
Number as text: greater than nine
```

Obviously, at the point when selection statements are introduced in the course, cascaded
selection (`if...else if...` or `switch`) solves the problem just fine. However, by
course completion, students will have learned enough to develop cleverer solutions, and
not every clever solution is more efficient than the original simple solution in terms of
runtime space and time.

{% include start-aside.html kind="info" %}

Sorry, no link to the page that discusses the problem because that site teaches some bad
habits. For example, it recommends including `<bits/stdc++.h>`.

{% include end-aside.html %}

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Exercises

Each exercise asks to develop two versions of a program. I recommend using this
pre-configured [Compiler Explorer link](https://godbolt.org/z/da9c8c) to develop the
two versions. I also recommend placing the text of your analysis in a GitHub gist or
repo.

For simplicity, omit validating the state of the input stream object `std::cin` in all
programs developed for the exercises.

1. Write a **baseline** C++ program using just selection statements to solve the problem
   and analyze its runtime space and time needs. Then **revise** the program and analyze
   the space and time needs of the revised program in relation to the baseline. If you
   are able to write only the baseline version, please do attempt to analyze its space
   and time needs.

   Both versions of the program should have only one function: the obligatory `main`.

2. Write a function `as_text` which receives a number and returns the text version of the
   number using the same logic described in Section 1. Do **not** perform any user
   interaction (input or output) in the function. In `main`, read a number from the user,
   use function `as_text` to obtain the text version of the number, and print the text
   version.

   Develop two programs: one where the `as_text` function corresponds to the baseline
   version developed for Exercise 1; another where `as_text` corresponds to the revised
   version developed for Exercise 1.

   Write a note on how the runtime space and time needs of the programs in this exercise
   differ from those of their corresponding programs in Exercise 1. Also describe what
   (if any) changes you made to the programs of Exercise 1 due to observations as you
   developed the programs for this exercise. Include a rationale for any changes made.

   **Note:** This exercise simply asks to move the conversion logic that is in `main`
   function in Exercise 1 to its own function such that `main` now performs only user
   interaction and calls the new function `as_text`.

{% include start-aside.html kind="warn" show_icon=true %}

Do **not** use compiler options (such as `-O1`) to optimize the generated code. The goal
of the exercises is to study the impact of implementation choices without compiler
optimization. However, it is OK to enable optimization as part of an extended analysis.

Refrain from overthinking, over-optimizing, or developing clever code that is
unrealistic: these exercises do **not** require or deserve much effort. Instead, develop
distinct and realistic solutions that illustrate the impact of implementation choices on
runtime space and time needs.

{% include end-aside.html %}
