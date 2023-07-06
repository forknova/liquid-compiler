export type VariableValue =
  | boolean
  | number
  | string
  | {[key: string]: VariableValue};

export type Variables = {
  [key: string]: VariableValue;
};

const openingIfStatementLength = 6; // Length of the open tag "{% if "
const elseStatementLength = 10; // Length of the open tag "{% else %}"
const endIfStatementLength = 11; // Length of the open tag "{% endif %}"
const closingTagLength = 2; // Length of the closing tag "%}"

export function compile(template: string, variables: Variables): string {
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

function processLine(
  line: string,
  variables: Variables,
  controlFlowStack: boolean[],
): string {
  line = processControlFlow(line, variables, controlFlowStack);

  if (line.includes('{{')) {
    line = processVariables(line, variables);
  }

  return line;
}

function processVariables(line: string, variables: Variables): string {
  const regex = /{{(.*?)}}/g;

  return line.replace(regex, (_match, variable) => {
    const value = evaluateVariable(variable.trim(), variables);
    return value.toString();
  });
}

function evaluateVariable(
  variable: string,
  variables: Variables,
): object | boolean | string | number {
  const parts = variable.split('.');
  const value = parts.reduce<VariableValue>((acc, part) => {
    if (typeof acc === 'object' && part in acc) {
      return acc[part];
    } else {
      throw new TypeError(
        `object path "${variable}" must be defined in variables`,
      );
    }
  }, variables);

  return value === undefined ? '' : coerceVariableValue(value);
}

function coerceVariableValue(
  value: object | boolean | string | number,
): object | boolean | string | number {
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

function processControlFlow(
  line: string,
  variables: Variables,
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

function evaluateCondition(condition: string, variables: Variables): boolean {
  const parts = condition.split(' ');
  const left = isLiteral(parts[0])
    ? evaluateLiteral(parts[0])
    : evaluateVariable(parts[0], variables);
  const operator = parts[1];
  const right = isLiteral(parts[2])
    ? evaluateLiteral(parts[2])
    : evaluateVariable(parts[2], variables);

  switch (operator) {
    case '==':
      return left == right;
    case '!=':
      return left != right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
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
