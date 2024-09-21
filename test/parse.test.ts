import { describe, expect, it } from "bun:test";
import { parse } from "../src/parse";

describe("parse", async () => {
	it("should parse object expressions", async () => {
		const a = "{... $1 velocity (* (velocity $1) 0.2)}";
		const result = parse(a)[0];
		expect(result).toEqual({
			type: "object",
			spread: "$1",
			properties: {
				velocity: ["*", ["velocity", "$1"], 0.2],
			},
		});
	});

	it("should parse list expressions", async () => {
		const a = "((1 2) 3)";
		const result = parse(a)[0];
		expect(result).toEqual([[1, 2], 3]);
	});

	it("should parse object expressions with multiple properties", () => {
		const input = "{... $1 velocity 0.8 pitch (+ (pitch $1) 12)}";
		const result = parse(input)[0];
		expect(result).toEqual({
			type: "object",
			spread: "$1",
			properties: {
				velocity: 0.8,
				pitch: ["+", ["pitch", "$1"], 12],
			},
		});
	});

	it("should parse nested object expressions", () => {
		const input = "{... $1 metadata {... (metadata $1) lastModified (now)}}";
		const result = parse(input)[0];
		expect(result).toEqual({
			type: "object",
			spread: "$1",
			properties: {
				metadata: {
					type: "object",
					spread: ["metadata", "$1"],
					properties: {
						lastModified: ["now"],
					},
				},
			},
		});
	});

	it("should parse complex list operations", () => {
		const input = "(map (lambda (x) (* x 2)) (list 1 2 3))";
		const result = parse(input)[0];
		expect(result).toEqual([
			"map",
			["lambda", ["x"], ["*", "x", 2]],
			["list", 1, 2, 3],
		]);
	});

	it("should parse conditional expressions", () => {
		const input = "(if (> (tempo $1) 120) {fastTempo true} {slowTempo true})";
		const result = parse(input)[0];
		expect(result).toEqual([
			"if",
			[">", ["tempo", "$1"], 120],
			{ type: "object", spread: null, properties: { fastTempo: true } },
			{ type: "object", spread: null, properties: { slowTempo: true } },
		]);
	});

	it("should parse empty objects", () => {
		const input = "{}";
		const result = parse(input)[0];
		expect(result).toEqual({ type: "object", spread: null, properties: {} });
	});

	it("should parse complex nested expressions", () => {
		const input =
			"{... $1 notes (filter (lambda (note) (> note 60)) (notes $1)) highest (apply max (notes $1))}";
		const result = parse(input)[0];
		expect(result).toEqual({
			type: "object",
			spread: "$1",
			properties: {
				notes: [
					"filter",
					["lambda", ["note"], [">", "note", 60]],
					["notes", "$1"],
				],
				highest: ["apply", "max", ["notes", "$1"]],
			},
		});
	});

	it("should parse mixed list and object expressions", () => {
		const input =
			"(let ((factor (* 0.01 (tempo $1)))) {... $1 velocity (* (velocity $1) factor)})";
		const result = parse(input)[0];
		expect(result).toEqual([
			"let",
			[["factor", ["*", 0.01, ["tempo", "$1"]]]],
			{
				type: "object",
				spread: "$1",
				properties: {
					velocity: ["*", ["velocity", "$1"], "factor"],
				},
			},
		]);
	});

	it("should handle quoted expressions", () => {
		const input = "(quote (a b c))";
		const result = parse(input)[0];
		expect(result).toEqual(["quote", ["a", "b", "c"]]);
	});

	it("should parse boolean and null values", () => {
		const input = "{... $1 isActive true isNull null}";
		const result = parse(input)[0];
		expect(result).toEqual({
			type: "object",
			spread: "$1",
			properties: {
				isActive: true,
				isNull: null,
			},
		});
	});

	it("should parse complex nested expressions with whitespace", () => {
		const input = `{...
$1
notes
(filter
  (lambda (note) (> note 60)) (notes $1)) highest (apply max (notes $1))}`;
		const result = parse(input)[0];
		expect(result).toEqual({
			type: "object",
			spread: "$1",
			properties: {
				notes: [
					"filter",
					["lambda", ["note"], [">", "note", 60]],
					["notes", "$1"],
				],
				highest: ["apply", "max", ["notes", "$1"]],
			},
		});
	});

	it("should parse multiple expressions", () => {
		const input = "(list 1 2 4) (list 1 4 5)";
		const result = parse(input);
		expect(result).toEqual([
			["list", 1, 2, 4],
			["list", 1, 4, 5],
		]);
	});

	it("should parse multiple expressions w a function", () => {
		const input = "(defun (x 4) (* x 4)) (list 1 4 5)";
		const result = parse(input);
		expect(result).toEqual([

			{
				type: "function",
				params: ["x", 4],
				body: ["*", "x", 4],
			},
			["list", 1, 4, 5],
		]);
	});
});
