---
type: note
title: "Monads, Functors, and More: Functional Patterns in Rust"
description: "Explore functional programming patterns in Rust, including functors, applicatives, monads, combinators, and lazy evaluation, with practical examples."
stage: evolving
created: 2019-11-07
updated: 2019-11-07
topics: [technology]
---

Wikipedia states - In software engineering, a software design pattern is a general, reusable solution to a commonly occurring problem within a given context in software design. It is not a finished design that can be transformed directly into source or machine code. It is a description or template for how to solve a problem that can be used in many different situations. Design patterns are formalized best practices that the programmer can use to solve common problems when designing an application or system.

Design patterns may be viewed as a structured approach to computer programming intermediate between the levels of a programming paradigm and a concrete algorithm.

If you are keen on functional programming, I would recommend reading [Category Theory for Programmers](https://github.com/hmemcpy/milewski-ctfp-pdf/), and in this post, we will be exploring some common functional programming design patterns

**Functor Pattern**

A functor is approximately the inverse of a function. A function defines a transformation, accepts data, and returns the result of the transformation. A functor defines data, accepts a function, and returns the result of the transformation.

```text
fn main() {
   let m: Vec<u64> = vec![1, 2, 3];
   let n: Vec<u64> = m.iter().map(|x| { x*x }).collect();
   println!("{:?}", m);
   println!("{:?}", n);
}
```

here 'map' is a functor. Thus a functor lifts or upgrades a function from one that cannot operate on an effect1 to one that can work on a single effect1, leaving the effect1 intact after the function is done.

effect1: ability to bring about a result i.e. list, array, tuple, struct, record, object, future, promise, function, tree, hashmap, dictionary etc.

I think of a functor as being a component of the command pattern, which also involves other infrastructure such as the invoker and command recipients.

Trait:

```text
pub trait Functor: Generic1 {
    fn fmap<Y, F: Fn(Self::Type) -> Y>(self, f: F) -> Self::Type 
        where Self: Rebind1<Y>;
}
```

**Applicatives Pattern**

Applicative functors allow us to deal with function of two arguments and two functors, by mapping curried function onto functor and then applying it to second functor

```text
let v1 = vec![1,2,3]; 
let v2 = vec![4,5]; 
let result: Vec = v1.iter().map(|x||y| x*y)).apply(v2.iter()).collect(); 
let expect = vec![4, 5, 8, 10, 12, 15]; 
assert_eq!(expect, result);
```

Based on above example a product of each element of V1 with V2 is **applied**, creating six elements in result vector. Then the following trait can form the foundation of applicative functors.

```text
pub trait Applicative: Functor {
    fn apply<X, U>(self, x: X) -> Applied<Self, X> 
        where X: Applicative, Self: Sized { ... }
}
```

This pattern isn’t practically used in rust very often because this pattern is not considered idiomatic rust.

**Monad Pattern**

There is a natural hierarchy of types: any Monad is an Applicative, and any Applicative is a Functor.

This allows structuring programs generically while automating away the boilerplate code needed by the program logic. Monads achieve this by providing their own data type, which represents a specific form of computation, along with one procedure to wrap values of any basic type within the monad \(yielding a monadic value\) and another to compose functions that output monadic values \(called monadic functions\). Thus a monad defines return and bind operations for a type. The return operation is like a constructor to make the monad. The bind operation incorporates new information and returns a new monad.

```text
Monad::return(value)  //We start with a new Monad<X>
        .bind(|x| x+x)  //We take a step into Monad<X+1>
        .bind(|y| y*y); //Similarly we get to Monad<X+2>
```

Monadic bind operations are also polymorphic, meaning they should permit returning monads of different types from the current monad. A monad can hide state inside itself, which becomes essentially a larger, more complex function than what the programmer interacts with. One concrete example of side-effect hiding is the concept of a logger.

```text
use std::fmt::{Debug};

struct UniversalLogger<T>(T);

impl<T> UniversalLogger<T> {
   fn return(t: T) -> UniversalLogger<T>
   where T: Debug {
      println!("{:?}", t);
      UniversalLogger(t)
   }
   fn bind<R,F>(&self, f: F) -> UniversalLogger<R>
   where F: FnOnce(&T) -> R,
   R: Debug {
      let r = f(&self.0);
      println!("{:?}", r);
      UniversalLogger(r)
   }
}

fn main() {
   UniversalLogger::return(27111985)
            .bind(|x| x+x)
            .bind(|y| y*y)
            .bind(|z| format!("{}{}{}", z, z, z));
}
```

The monad pattern is also very useful for chaining together code that can't be written in a normal code block e.g. the lazy monad pattern such as an asynchronous web server.

Trait:

```text
pub trait Monad: Functor {
    fn unit(value: Self::Type) -> Self;
    fn bind<U, F: Fn(Self::Type) -> Self::Type>(self, f: F) 
        -> Self::Type where Self: Rebind1<U>;

    fn join<U>(self) -> Self::Type 
        where Self::Type: Equals<Self::Type>, 
                Self: Rebind1<U> + Sized { ... }
}
```

**Combination Pattern**

A combinator is a function that takes other functions as arguments and returns a new function. A simple example of a combinator would be the composition operator, which chains two functions together:

```text
fn compose<A,B,C,F,G>(f: F, g: G) -> impl Fn(A) -> C
   where F: 'static + Fn(A) -> B,
         G: 'static + Fn(B) -> C {
   move |x| g(f(x))
}

fn main() {
   let fa = |x| x+1;
   let fb = |y| y*2;
   let fc = |z| z/3;
   let g = compose(compose(fa,fb),fc);
   println!("g(1) = {}", g(1));
   println!("g(12) = {}", g(12));
   println!("g(123) = {}", g(123));
}
```

**Lazy Eval Pattern**

A code blocks are always evaluated eagerly. If you want to define code that will be evaluated later or in pieces, the lazy eval pattern is very convenient. Lazy evaluation is a term used to describe code or data that is not evaluated until it is referenced. This is contrary to the typical eager evaluation of Rust code that will execute immediately regardless of context.

Iterators are lazy. They don't do anything until you collect or otherwise iterate over them

_Side Note_  
_The last lazy pattern that we will introduce is functional reactive programming, FRP for short. There are entire programming languages, such as Elm, based on this concept. Popular web UI frameworks, such as React or Angular, are also influenced by FRP concepts._ _The FRP concept is an extension of the side-effect/state monad example. Event handling, state transitions, and side-effects can be turned into units of reactive programming. This is an advance concept and shall be covered in a separate post later._