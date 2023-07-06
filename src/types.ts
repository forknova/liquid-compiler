export type VariableValue =
  | boolean
  | number
  | string
  | {[key: string]: VariableValue};

export type Variables = {
  [key: string]: VariableValue;
};
