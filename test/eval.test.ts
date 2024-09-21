import { expect, test, describe } from "bun:test";
import { parse } from "../src/parse";
import { evaluate } from "../src/eval";

describe("Lisp-Object Evaluator", () => {
	test("should evaluate simple arithmetic", () => {
		const ast = parse("(+ 1 2 3)");
		expect(evaluate(ast, {})).toBe(6);
	});

	test("should handle nested arithmetic", () => {
		const ast = parse("(* 2 (+ 3 4))");
		expect(evaluate(ast, {})).toBe(14);
	});

	test("should evaluate comparisons", () => {
		expect(evaluate(parse("(> 5 3)"), {})).toBe(true);
		expect(evaluate(parse("(< 5 3)"), {})).toBe(false);
		expect(evaluate(parse("(>= 5 5)"), {})).toBe(true);
		expect(evaluate(parse("(<= 5 6)"), {})).toBe(true);
		expect(evaluate(parse("(== 5 5)"), {})).toBe(true);
	});

	test("should handle conditional expressions", () => {
		const ast = parse("(if (> 5 3) 10 20)");
		expect(evaluate(ast, {})).toBe(10);
	});

	test("should evaluate object literals", () => {
		const ast = parse("{x 10 y (+ 5 5)}");
		expect(evaluate(ast, {})).toEqual({ x: 10, y: 10 });
	});

	test("should handle object spread", () => {
		const ast = parse("{... $obj x 20}");
		const inputs = { obj: { x: 10, y: 15 } };
		expect(evaluate(ast, inputs)).toEqual({ x: 20, y: 15 });
	});

	test("should access input values", () => {
		const ast = parse("(+ $a $b)");
		const inputs = { a: 5, b: 7 };
		expect(evaluate(ast, inputs)).toBe(12);
	});

	test("should handle complex nested expressions", () => {
		const ast = parse(`
      {... $1
       newValue (+ (value $1) 10)
       condition (if (> (value $1) 50) "High" "Low")}
    `);
    console.log("complex parsed=", ast)
		const inputs = { "1": { value: 45, otherProp: "test" } };
		expect(evaluate(ast, inputs)).toEqual({
			value: 45,
			otherProp: "test",
			newValue: 55,
			condition: "Low",
		});
	});

	test("should throw error for unknown functions", () => {
		const ast = parse("(unknown 1 2)");
		expect(() => evaluate(ast, {})).toThrow(
			"Unknown function or property: unknown",
		);
	});

	test("should throw error for unknown inputs", () => {
		const ast = parse("$unknownInput");
		expect(() => evaluate(ast, {})).toThrow("Unknown input: $unknownInput");
	});

	test("should throw error for invalid spread", () => {
		const ast = parse("{... 5}");
		expect(() => evaluate(ast, {})).toThrow("Spread value must be an object");
	});
});
