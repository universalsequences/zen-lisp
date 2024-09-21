// Types for our AST
export type Atom = string | number | boolean | null;
export type Expression = Atom | List | ObjectLiteral;
export type List = Expression[];
export type ObjectLiteral = {
	type: "object";
	spread: Expression | null;
	properties: { [key: string]: Expression };
};
export type AST = Expression;
