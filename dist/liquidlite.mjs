const CLOSING_TAG_LENGTH = 2; // Length of the closing tag "%}"
const END_IF_STATEMENT_LENGTH = 11; // Length of the open tag "{% endif %}"
const OPENING_IF_STATEMENT_LENGTH = 6; // Length of the open tag "{% if "
const VARIABLE_REGEX = /{{(.*?)}}/g;
function compile(template, variables) {
    const lines = template.split('\n');
    const outputLines = [];
    const controlFlowStack = [];
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        const processedLine = processLine(line, variables, controlFlowStack);
        outputLines.push(processedLine);
    }
    return outputLines.join('\n').trim();
}
function processLine(line, variables, controlFlowStack) {
    if (line.includes('{% ') || controlFlowStack.length > 0) {
        line = processControlFlow(line, variables, controlFlowStack);
    }
    if (line.includes('{{')) {
        line = processVariables(line, variables);
    }
    return line;
}
function processVariables(line, variables) {
    const matches = line.match(VARIABLE_REGEX);
    if (!matches) {
        return line;
    }
    for (const match of matches) {
        const variable = match
            .slice(CLOSING_TAG_LENGTH, -CLOSING_TAG_LENGTH)
            .trim();
        const value = evaluateVariable(variable, variables);
        line = line.replace(match, value ? value.toString() : '');
    }
    return line;
}
function evaluateVariable(variable, variables) {
    let value;
    if (variable.includes('.')) {
        const parts = variable.split('.');
        value = parts.reduce((acc, part) => {
            if (acc && typeof acc === 'object' && part in acc) {
                return acc[part];
            }
            else {
                return '';
            }
        }, variables);
    }
    else {
        value = variables[variable];
    }
    return value === undefined ? '' : value;
}
function coerceVariableValue(value) {
    if (typeof value === 'string') {
        if (isStringNumber(value)) {
            return parseFloat(value);
        }
        else if (value === 'true') {
            return true;
        }
        else if (value === 'false') {
            return false;
        }
    }
    return value;
}
function processControlFlow(line, variables, controlFlowStack) {
    const processedChars = [];
    const lineLength = line.length;
    let cursor = 0;
    while (cursor < lineLength) {
        const char = line[cursor];
        if (isOpeningTag(char, line, cursor)) {
            const closingIndex = line.indexOf('%}', cursor + CLOSING_TAG_LENGTH);
            if (closingIndex !== -1) {
                const tag = line.slice(cursor, closingIndex + CLOSING_TAG_LENGTH);
                if (tag.startsWith('{% if ')) {
                    const ifCondition = line
                        .slice(cursor + OPENING_IF_STATEMENT_LENGTH, closingIndex)
                        .trim();
                    const ifConditionResult = evaluateCondition(ifCondition, variables);
                    controlFlowStack.push(ifConditionResult);
                    cursor = closingIndex + CLOSING_TAG_LENGTH;
                    continue;
                }
                else if (tag.startsWith('{% elseif ')) ;
                else if (tag.startsWith('{% else')) {
                    // Skip to {% endif %} when the result is true
                    const controlFlowLength = controlFlowStack.length;
                    if (controlFlowLength > 0 &&
                        controlFlowStack[controlFlowLength - 1] === true) {
                        const endIfIndex = line.indexOf('{% endif %}');
                        if (endIfIndex !== -1) {
                            controlFlowStack.pop();
                            cursor = endIfIndex + END_IF_STATEMENT_LENGTH - 1;
                            continue;
                        }
                    }
                    else {
                        cursor = closingIndex + CLOSING_TAG_LENGTH;
                        continue;
                    }
                    // TODO: add support for {% elsif x > 10 %}
                }
                else if (tag === '{% endif %}') {
                    controlFlowStack.pop();
                    cursor = closingIndex + CLOSING_TAG_LENGTH;
                    continue;
                }
            }
        }
        const controlFlowLength = controlFlowStack.length;
        // Skip to {% else %} or {% endif %} when the result is false
        if (controlFlowLength > 0 &&
            controlFlowStack[controlFlowLength - 1] === false) {
            const endIfIndex = line.indexOf('{% endif %}');
            if (endIfIndex !== -1) {
                controlFlowStack.pop();
                cursor = endIfIndex + END_IF_STATEMENT_LENGTH - 1;
            }
        }
        else if (controlFlowLength > 0 &&
            controlFlowStack.every((value) => value)) {
            // Is inside of control flow
            processedChars.push(char);
        }
        else if (controlFlowLength === 0) {
            // Is outside of control flow
            processedChars.push(char);
        }
        cursor++;
    }
    return processedChars.join('');
}
function evaluateCondition(condition, variables) {
    const parts = condition.split(' ');
    // if statement without a condition
    if (parts.length === 1) {
        const part = isLiteral(parts[0])
            ? evaluateLiteral(parts[0])
            : coerceVariableValue(evaluateVariable(parts[0], variables));
        return Boolean(part);
    }
    const left = isLiteral(parts[0])
        ? evaluateLiteral(parts[0])
        : coerceVariableValue(evaluateVariable(parts[0], variables));
    const operator = parts[1];
    const right = isLiteral(parts[2])
        ? evaluateLiteral(parts[2])
        : coerceVariableValue(evaluateVariable(parts[2], variables));
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
function evaluateLiteral(variable) {
    if (variable.startsWith('"')) {
        return variable.substring(1, variable.length - 1);
    }
    else if (variable === 'true') {
        return true;
    }
    else if (variable === 'false') {
        return false;
    }
    else {
        return parseFloat(variable);
    }
}
function isLiteral(variable) {
    if (isStringNumber(variable)) {
        return true;
    }
    else if (variable.startsWith('"')) {
        return true;
    }
    else {
        return false;
    }
}
function isOpeningTag(char, line, cursor) {
    return (char === '{' && line.slice(cursor, cursor + CLOSING_TAG_LENGTH) === '{%');
}
function isStringNumber(value) {
    return Boolean(parseFloat(value));
}

export { compile };
//# sourceMappingURL=liquidlite.mjs.map
