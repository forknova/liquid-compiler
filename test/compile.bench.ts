import Handlebars from 'handlebars';
import {Liquid} from 'liquidjs';
import {bench} from 'vitest';
import {compile} from '@/compile';

describe('compile', () => {
  const template = `<p>Hello, {{ first_name }} {{ last_name }}!</p>`;
  const variables = {
    first_name: 'Ryan',
    last_name: 'Foobar',
  };

  bench('simple compile', () => {
    simpleCompile(template, variables);
  });

  bench('liquidlite', () => {
    compile(template, variables);
  });

  bench('liquidjs', async () => {
    const engine = new Liquid();
    const tpl = engine.parse(template);

    await engine.render(tpl, variables);
  });

  bench('handlebars', async () => {
    const tplFn = Handlebars.compile(template);

    tplFn(variables);
  });
});

function simpleCompile<T>(template: string, context: T) {
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
