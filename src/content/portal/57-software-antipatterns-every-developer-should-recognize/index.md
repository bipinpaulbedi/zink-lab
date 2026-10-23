---
type: miscellaneous
title: "57 Software Anti-Patterns Every Developer Should Recognize"
description: "Explore 57 common software anti-patterns across design, coding, architecture, and development practices to recognize pitfalls and avoid costly mistakes."
stage: evolving
created: 2019-03-27
updated: 2019-03-27
topics: [frameworks]
---

Software designers talk about design patterns or the best practices for application designing. The choice is between which mistake is easier to correct: under-doing it or overdoing it.

We keep on adding ingredients to the curry and food is left with no taste. Let’s explore some anti-patterns and explore the pitfalls of Software designing.

**Organisational anti-patterns**

* Analysis paralysis - Devoting disproportionate effort to the analysis phase of the project.
* Cash cow - A profitable legacy product that often leads to complacency about new product.
* Design by committee - The result of having many contributors to a design - but no unifying vision.
* Moral hazard - Insulating a decision-maker from the consequences of his or her decision.
* Stovepipe or Silos - A structure that supports mostly up-down flow of data but inhibits cross organisational communication.
* Vendor lock-in - Making a system extensively dependent on an external supplied component.

**Design anti-patterns**

* Abstraction inversion - Not exposing implemented functionality required by user, so that they reimplement it using higher level functions.
* Ambiguous viewpoint - Presenting a model \(OOAD\) without specifying its viewpoint.
* Big ball of mud - A system with no recognisable structure.
* Database as IPC - Using DB as message queue for inter-process communication where a more lightweight mechanism would be suitable.
* Gold plating - Continuing to work on a project well past the point at which extra effort is not adding value.
* Inner - platform effect - A software so customisable as to become poor replica of software development platform.
* Input kludge - Failing to specify and implement handling of possibly invalid inputs.
* Interface bloat - making an interface so powerful that it is extremely difficult to implement.
* Magic push button - Coding implementation logic directly within interface code, without using abstraction.
* Race hazard - Failing to see consequences of different orders of events.
* Stovepipe system - A barely maintainable assemblage of ill-related components.

**OOD anti-patterns**

* Anaemic domain model - Use of domain model without business knowledge.
* Base bean - Inheriting functionality from utility class rather than delegating to it.
* Call super - Requiring subclasses to call a superclass’s overridden method.
* Circle ellipse problem - Sub typing variable-types on the bases of value-subtypes.
* Circular dependency - Introducing unnecessary direct or indirect mutual dependencies between objects.
* Constant interface - using interface to define constants.
* God object - Concentrating too many functionalities in a single part of design.
* Object cesspool - Reusing objects whose state does not confirm to the contract of reuse.
* Object orgy - Failing to properly encapsulate objects permitting unrestricted access to their internals.
* Poltergeists - Objects whose sole purpose is to pass information to another object.
* Sequential coupling - A class that requires its method to be called in a particular order.
* Yo-yo problem - A structure that is hard to understand due to excessive fragmentation.
* Dependency hell - Problem with versions of required product.
* DLL hell - Inadequate management of dynamic linked libraries.

**Programming anti-patterns**

* Accidental complexity - Introducing unnecessary complexity into a solution.
* Action at distance - Unexpected interaction between widely separated parts of system.
* Blind faith - Lack of checking of correctness of a bug fix or result of a subroutine.
* Boat anchor - Retaining a part of a system that is no longer has any use.
* Busy spin - Consuming CPU while waiting for something to happen, usually by repeated checking rather than message passing.
* Caching failure - Forgetting to reset an error flag when an error has been corrected.
* Cargo cult programming - Using patterns and methods without understanding why.
* Coding by exception - Adding a new code to handle each special case as it is recognised.
* Error hiding - Catching an error message before it can be shown to the user, either showing nothing or showing a meaningless message.
* Hard code - Embedding assumption about environment of a system in its implementation.
* Lava flow - Retaining undesirable code because removing it is too expensive or has unpredictable consequences.
* Loop switch sequence - Encoding a set of sequential steps using a switch within a loop.
* Magic numbers - Including unexplained numbers in algorithm.
* Magic strings - Including literal strings in code, for comparison, as event types etc.
* Soft code - Storing business logic in configuration files rather than source code.
* Spaghetti code - Programs whose structure is barely comprehensible.

**Methodological anti-patterns**

* Copy-paste programming. Copying \(modifying\) and pasting existing code rather than implementing generic solution.
* Golden hammering - Assuming that a favourite solution is universally applicable.
* Improbability factor - Assuming that it is improbably that a known error will occur.
* NHI syndrome - The tendency towards reinventing the wheel, assuming it does not exist here before.
* Premature optimisation - Coding early on for a perceived efficiency, sacrificing good design, maintainability, and sometimes even real world efficiency.
* Programming by permutation - Trying to approach a solution by successively modifying the code to see if it works.
* Reinventing the wheel - Failing to adopt an existing, adequate solution.
* Reinventing the square wheel - Failing to adopt an existing solution and instead adopting a custom solution which performs much worse than an existing one.
* Silver bullet - Assuming that a favourite technical solution can solve a larger process or problem.
* Tester driven development - Projects in which new requirements are specified in bug reports.

Phew… don’t stop here, explore more on internet as there can be more pitfalls that you might be already digging. Please share your findings in the comments section below.