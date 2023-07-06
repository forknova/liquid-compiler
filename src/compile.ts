export type Variables<Context = unknown> = {
  [Key in keyof Context]: VariableValue<Context, Key>;
};

export type VariableValue<Context, Key extends keyof Context> =
  | string
  | boolean
  | number
  | Context[Key];

const openingIfStatementLength = 6; // Length of the open tag "{% if "
const elseStatementLength = 10; // Length of the open tag "{% else %}"
const endIfStatementLength = 11; // Length of the open tag "{% endif %}"
const closingTagLength = 2; // Length of the closing tag "%}"

export function compile<Context>(
  template: string,
  variables: Variables<Context>,
): string {
  const lines = template.split('\n');
  const outputLines: string[] = [];
  const controlFlowStack: boolean[] = [];

  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    const processedLine = processLine(line, variables, controlFlowStack);
    outputLines.push(processedLine);
  }

  return outputLines.join('\n').trim();
}

function processLine<Context>(
  line: string,
  variables: Variables<Context>,
  controlFlowStack: boolean[],
): string {
  line = processControlFlow(line, variables, controlFlowStack);

  if (line.includes('{{')) {
    line = processVariables(line, variables);
  }

  return line;
}

function processVariables<Context>(
  line: string,
  variables: Variables<Context>,
): string {
  const regex = /{{(.*?)}}/g;

  return line.replace(regex, (_match, variable) => {
    const value = evaluateVariable(variable.trim(), variables);
    return value ? value.toString() : '';
  });
}

function evaluateVariable<Context>(
  variable: keyof Context,
  variables: Variables<Context>,
): null | object | boolean | string | number {
  const parts = variable.toString().split('.');
  const value = parts.reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as {[key: string]: unknown})[part];
    } else {
      throw new TypeError(
        `object path "${variable.toString()}" must be defined in variables`,
      );
    }
  }, variables);

  return value === undefined ? '' : coerceVariableValue(value);
}

function coerceVariableValue(
  value: null | object | boolean | string | number,
): null | object | boolean | string | number {
  if (typeof value === 'string') {
    if (isStringNumber(value)) {
      return parseFloat(value);
    } else if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
  }

  return value;
}

function processControlFlow<Context>(
  line: string,
  variables: Variables<Context>,
  controlFlowStack: boolean[],
): string {
  const processedChars: string[] = [];
  const lineLength = line.length;
  let cursor = 0;

  while (cursor < lineLength) {
    const char = line[cursor];

    if (isOpeningTag(char, line, cursor)) {
      const closingIndex = line.indexOf('%}', cursor + closingTagLength);

      if (closingIndex !== -1) {
        const tag = line.slice(cursor, closingIndex + closingTagLength);

        if (tag.startsWith('{% if ')) {
          const ifCondition = line
            .slice(cursor + openingIfStatementLength, closingIndex)
            .trim();
          const ifConditionResult = evaluateCondition(ifCondition, variables);

          controlFlowStack.push(ifConditionResult);
          cursor = closingIndex + closingTagLength;

          continue;
        } else if (tag.startsWith('{% elseif ')) {
          // TODO: add support for {% elsif x > 10 %}
        } else if (tag === '{% endif %}') {
          controlFlowStack.pop();
          cursor = closingIndex + closingTagLength;
          continue;
        }
      }
    }

    const controlFlowLength = controlFlowStack.length;

    // Skip to {% else %} or {% endif %} when the result is false
    if (controlFlowStack[controlFlowLength - 1] === false) {
      const elseIndex = line.indexOf('{% else %}');
      const endIfIndex = line.indexOf('{% endif %}');

      if (elseIndex !== -1) {
        controlFlowStack.pop();
        cursor = elseIndex + elseStatementLength - 1;
      } else if (endIfIndex !== -1) {
        controlFlowStack.pop();
        cursor = endIfIndex + endIfStatementLength - 1;
      }
    } else if (
      controlFlowLength > 0 &&
      controlFlowStack.every((value) => value)
    ) {
      // Is inside of control flow
      processedChars.push(char);
    } else if (controlFlowLength === 0) {
      // Is outside of control flow
      processedChars.push(char);
    }

    cursor++;
  }

  return processedChars.join('');
}

function evaluateCondition<Context>(
  condition: string,
  variables: Variables<Context>,
): boolean {
  const parts = condition.split(' ');
  const left = isLiteral(parts[0])
    ? evaluateLiteral(parts[0])
    : evaluateVariable(parts[0] as keyof Context, variables);
  const operator = parts[1];
  const right = isLiteral(parts[2])
    ? evaluateLiteral(parts[2])
    : evaluateVariable(parts[2] as keyof Context, variables);

  switch (operator) {
    case '==':
      return left == right;
    case '!=':
      return left != right;
    case '>':
      return Boolean(left && right && left > right);
    case '>=':
      return Boolean(left && right && left >= right);
    case '<':
      return Boolean(left && right && left < right);
    case '<=':
      return Boolean(left && right && left <= right);
    default:
      return false;
  }
}

function evaluateLiteral(variable: string): string | number | boolean {
  if (variable.startsWith('"')) {
    return variable.substring(1, variable.length - 1);
  } else if (variable === 'true') {
    return true;
  } else if (variable === 'false') {
    return false;
  } else {
    return parseFloat(variable);
  }
}

function isLiteral(variable: string): boolean {
  if (isStringNumber(variable)) {
    return true;
  } else if (variable.startsWith('"')) {
    return true;
  } else {
    return false;
  }
}

function isOpeningTag(char: string, line: string, cursor: number): boolean {
  return char === '{' && line.slice(cursor, cursor + closingTagLength) === '{%';
}

function isStringNumber<T extends string>(value: T): boolean {
  return Boolean(parseFloat(value));
}
