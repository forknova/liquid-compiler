type Variables<Context = unknown> = {
    [Key in keyof Context]: VariableValue<Context, Key>;
};
type VariableValue<Context, Key extends keyof Context> = string | boolean | number | Context[Key];
declare function compile<Context>(template: string, variables: Variables<Context>): string;

export { VariableValue, Variables, compile };
