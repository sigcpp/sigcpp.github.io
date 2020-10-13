---
pid: 9
title: "Ponder runtime efficiency"
date: 2020-10-12
authors: smurthys
cpp_level: introductory
cpp_versions: "Any C++" 
reader_activity: exercise
---

A student recently brought me a simple introductory-level problem found on the web and
asked if their program is "efficient". Though the problem is simple enough that most C++
beginners are likely to solve it in minutes, I noticed it provides good opportunity to
discuss certain efficiency considerations that are not typically discussed in an
introductory course.

This post describes the problem and invites students to develop alternative solutions and
analyze the runtime space and time (memory and speed) needs of the solutions. I encourage
students who have completed a first course in C++ to ponder this problem, even if
(and especially if) they have completed multiple C++ courses. The overall goal is to
become aware of implementation choices and their consequences.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Problem description

The problem is to read a whole number greater than zero from the user and print the
number as a word as long as the number is under 10. For example, if the user enters `1`,
print the text `one`; if the user enters `2`, print `two`; and so on. If the input number
exceeds nine, just print the text `greater than nine`.

Example runs of a program might look as follows in a Microsoft Windows environment, where
`2` and `15` are values the user inputs at run time, and `as-text.exe` is the executable
file's name:

```console
C:\>as-text.exe
Enter a whole number greater than 0: 2
Number in text: two

C:\>as-text.exe
Enter a whole number greater than 0: 15
Number in text: greater than nine
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

### 2.&nbsp;&nbsp; Exercise

Write a **baseline** C++ program using just selection statements to solve the problem
and analyze its space and time needs at run time. Then **revise** the program and
analyze its space and time needs in relation to the baseline. If you are able to write
only the baseline version, do attempt to analyze its space and time needs.

I recommend using this pre-configured [Compiler Explorer link](https://godbolt.org/z/xvaY1n)
to develop the baseline program and the revision. I also recommend placing the analysis
text in a GitHub gist or repo. Please follow the instructions included at the end of this
post to submit solutions.

{% include start-aside.html kind="warn" show_icon=true %}

Do **not** use compiler options (such as `-O1`) to optimize the generated code. The goal
is to study the impact of implementation choices without compiler optimization. However,
it is OK to enable optimization as part of an extended analysis.

Refrain from overthinking, over-optimizing, or developing clever code that is not
realistic: this problem does **not** deserve such effort. Instead, develop distinct and
realistic solutions that illustrate the impact of implementation choices on runtime space
and time needs.

{% include end-aside.html %}
