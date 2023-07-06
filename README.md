# 💧 Liquid (Lite)

Liquid (Lite) is a minimal Shopify Liquid compiler for the browser.

## Getting started

```bash
# for npm
npm install liquid-lite
# for yarn
yarn add liquid-lite
```

```js
import {compile} from 'liquid-lite';

const template = `<p>Hi, my name is {{ name }}.</p>`;
const variables = {name: 'Ryan'};

compile(template, variables);
// <p>Hi, my name is Ryan.</p>
```

## Why build a compiler for a subset of liquid?

Liquid is a popular templating language and used to build Shopify themes. I've often needed a basic templating language to load in some dynamic content, but I don't want to use a different syntax like handlebars.

This project started because I was always including this snippet of code:

```js
export function compile(template, context) {
  let output = template;

  for (const variable in context) {
    const value = context[variable];

    if (typeof value === 'string') {
      output = output
        .replaceAll(`{{${variable}}}`, value)
        .replaceAll(`{{ ${variable} }}`, value);
    }
  }

  return output;
}
```

It's not the best, but it was largely working for what I needed.

It finally got to a point where I need some control flow statements. And there you have it, `liquid-lite`.

## Supported features

| Feature                  | Symbol      | Support |
| ------------------------ | ----------- | ------- |
| objects                  | `{{ }}`     | ✅      |
| equals                   | `==`        | ✅      |
| greater than             | `>`         | ✅      |
| less than                | `<`         | ✅      |
| greater than or equal to | `>=`        | ✅      |
| less than or equal to    | `<=`        | ✅      |
| logical or               | `or`        | ❌      |
| logical and              | `and`       | ❌      |
| contains                 | `contains`  | ❌      |
| control flow if          | `if`        | ✅      |
| control flow unless      | `unless`    | ❌      |
| control flow elsif       | `elsif`     | ❌      |
| control flow else        | `else`      | ❌      |
| control flow case        | `case`      | ❌      |
| iteration for            | `for`       | ❌      |
| template comment         | `comment`   | ❌      |
| template inline comment  | `#`         | ❌      |
| template raw             | `raw`       | ❌      |
| template liquid          | `liquid`    | ❌      |
| template echo            | `echo`      | ❌      |
| template render          | `render`    | ❌      |
| template include         | `include`   | ❌      |
| variable assign          | `assign`    | ❌      |
| variable capture         | `capture`   | ❌      |
| variable increment       | `increment` | ❌      |
| variable decrement       | `decrement` | ❌      |
| filters                  | `\|`        | ❌      |
