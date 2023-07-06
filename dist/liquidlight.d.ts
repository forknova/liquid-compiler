type VariableValue$1 = boolean | number | string | {
    [key: string]: VariableValue$1;
};
type Variables$1 = {
    [key: string]: VariableValue$1;
};

type VariableValue = boolean | number | string | {
    [key: string]: VariableValue;
};
type Variables = {
    [key: string]: VariableValue;
};
declare function compile(template: string, variables: Variables): string;

export { VariableValue$1 as VariableValue, Variables$1 as Variables, compile };
