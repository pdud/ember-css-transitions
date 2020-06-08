# Introduction

`ember-css-transitions` provides some utilities that help you define animations purely in CSS.

This can be thought of a port of Vue's transitions for Ember.

To install it run:

```bash
ember install ember-css-transitions
```


This addon is perfect for libraries like [Animate.css](https://animate.style/) and [Tailwind CSS](https://tailwindcss.com/). If you write your own css it will be of the following structure:


```css
.example-enter {
  /* enter initial state */
  opacity: 0;
}

.example-enter-active {
  /* enter final state and how to transition to it */
  opacity: 1;
  transition: opacity 0.5s ease-in;
}

.example-leave {
  /* leave initial state */
  opacity: 1;
}

.example-leave-active {
  /* leave final state and how to transition to it */
  opacity: 0;
  transition: opacity 0.5s ease-in;
}
```

Check out the other sections of the docs for more info on how to use the addon.
