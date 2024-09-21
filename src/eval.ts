import type { Expression, Message, ObjectLiteral, Atom } from "./types";

/*
function evaluate(expr: Expression, inputs: Record<string, Message>): Message {
	if (Array.isArray(expr)) {
		return evaluateList(expr, inputs);
	} else if (
		typeof expr === "object" &&
		expr !== null &&
		"type" in expr &&
		expr.type === "object"
	) {
		return evaluateObject(expr, inputs);
	} else {
		return evaluateAtom(expr, inputs);
	}
}

function evaluateList(
	list: Expression[],
	inputs: Record<string, Message>,
): Message {
	if (list.length === 0) {
		return null;
	}
	const [func, ...args] = list;
	switch (func) {
		case "+":
			return args.reduce((sum, arg) => sum + Number(evaluate(arg, inputs)), 0);
		case "*":
			return args.reduce(
				(product, arg) => product * Number(evaluate(arg, inputs)),
				1,
			);
		case "-":
			if (args.length === 1) {
				return -Number(evaluate(args[0], inputs));
			}
			return args.reduce((diff, arg, index) =>
				index === 0
					? Number(evaluate(arg, inputs))
					: diff - Number(evaluate(arg, inputs)),
			);
		case "/":
			return args.reduce((quotient, arg, index) =>
				index === 0
					? Number(evaluate(arg, inputs))
					: quotient / Number(evaluate(arg, inputs)),
			);
		case ">":
			return (
				Number(evaluate(args[0], inputs)) > Number(evaluate(args[1], inputs))
			);
		case "<":
			return (
				Number(evaluate(args[0], inputs)) < Number(evaluate(args[1], inputs))
			);
		case ">=":
			return (
				Number(evaluate(args[0], inputs)) >= Number(evaluate(args[1], inputs))
			);
		case "<=":
			return (
				Number(evaluate(args[0], inputs)) <= Number(evaluate(args[1], inputs))
			);
		case "==":
			return evaluate(args[0], inputs) === evaluate(args[1], inputs);
		case "if":
			return evaluate(args[0], inputs)
				? evaluate(args[1], inputs)
				: evaluate(args[2], inputs);
		default:
			if (typeof func === "string" && func in inputs) {
				return inputs[func];
			}
			throw new Error(`Unknown function: ${func}`);
	}
}

function evaluateObject(
	obj: ObjectLiteral,
	inputs: Record<string, Message>,
): Message {
	const result: Record<string, Message> = {};
	if (obj.spread) {
		const spreadValue = evaluate(obj.spread, inputs);
		if (typeof spreadValue === "object" && spreadValue !== null) {
			Object.assign(result, spreadValue);
		} else {
			throw new Error("Spread value must be an object");
		}
	}
	for (const [key, value] of Object.entries(obj.properties)) {
		result[key] = evaluate(value, inputs);
	}
	return result;
}

function evaluateAtom(atom: Atom, inputs: Record<string, Message>): Message {
	if (typeof atom === "string" && atom.startsWith("$")) {
		const inputKey = atom.slice(1);
		if (inputKey in inputs) {
			return inputs[inputKey];
		}
		throw new Error(`Unknown input: ${atom}`);
	}
	return atom;
}

export { evaluate, Message as Input };

*/

type Message = number | string | boolean | null | object | Message[];

function evaluate(expr: Expression, inputs: Record<string, Message>): Message {
  if (Array.isArray(expr)) {
    return evaluateList(expr, inputs);
  } else if (typeof expr === 'object' && expr !== null && 'type' in expr && expr.type === 'object') {
    return evaluateObject(expr, inputs);
  } else {
    return evaluateAtom(expr, inputs);
  }
}

function evaluateList(list: Expression[], inputs: Record<string, Message>): Message {
  if (list.length === 0) {
    return null;
  }
  const [func, ...args] = list;
  switch (func) {
    case '+':
      return args.reduce((sum, arg) => sum + Number(evaluate(arg, inputs)), 0);
    case '*':
      return args.reduce((product, arg) => product * Number(evaluate(arg, inputs)), 1);
    case '-':
      if (args.length === 1) {
        return -Number(evaluate(args[0], inputs));
      }
      return args.reduce((diff, arg, index) =>
        index === 0 ? Number(evaluate(arg, inputs)) : diff - Number(evaluate(arg, inputs))
      );
    case '/':
      return args.reduce((quotient, arg, index) =>
        index === 0 ? Number(evaluate(arg, inputs)) : quotient / Number(evaluate(arg, inputs))
      );
    case '>':
      return Number(evaluate(args[0], inputs)) > Number(evaluate(args[1], inputs));
    case '<':
      return Number(evaluate(args[0], inputs)) < Number(evaluate(args[1], inputs));
    case '>=':
      return Number(evaluate(args[0], inputs)) >= Number(evaluate(args[1], inputs));
    case '<=':
      return Number(evaluate(args[0], inputs)) <= Number(evaluate(args[1], inputs));
    case '==':
      return evaluate(args[0], inputs) === evaluate(args[1], inputs);
    case 'if':
      return evaluate(args[0], inputs) ? evaluate(args[1], inputs) : evaluate(args[2], inputs);
    default:
      if (typeof func === 'string') {
        // Handle property access
        const obj = evaluate(args[0], inputs);
        if (typeof obj === 'object' && obj !== null && func in obj) {
          return obj[func];
        }
      }
      throw new Error(`Unknown function or property: ${func}`);
  }
}

function evaluateObject(obj: ObjectLiteral, inputs: Record<string, Message>): Message {
  const result: Record<string, Message> = {};
  if (obj.spread) {
    const spreadValue = evaluate(obj.spread, inputs);
    if (typeof spreadValue === 'object' && spreadValue !== null) {
      Object.assign(result, spreadValue);
    } else {
      throw new Error('Spread value must be an object');
    }
  }
  for (const [key, value] of Object.entries(obj.properties)) {
    result[key] = evaluate(value, inputs);
  }
  return result;
}

function evaluateAtom(atom: Atom, inputs: Record<string, Message>): Message {
  if (typeof atom === 'string' && atom.startsWith('$')) {
    const inputKey = atom.slice(1);
    if (inputKey in inputs) {
      return inputs[inputKey];
    }
    throw new Error(`Unknown input: ${atom}`);
  }
  return atom;
}

export { evaluate, Message };
