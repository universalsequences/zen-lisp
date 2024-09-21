import type {
  Expression,
  Message,
  ObjectLiteral,
  Atom,
  FunctionDefinition,
  Environment,
} from "./types";

function evaluate(expressions: Expression[], env: Environment): Message {
  let result: Message = null;
  for (const expr of expressions) {
    result = evaluateExpression(expr, env);
  }
  return result;
}

function evaluateExpression(expr: Expression, env: Environment): Message {
  const e = () => {
    if (Array.isArray(expr)) {
      return evaluateList(expr, env);
    } else if (typeof expr === "object" && expr !== null) {
      if ("type" in expr) {
        if (expr.type === "object") {
          return evaluateObject(expr, env);
        } else if (expr.type === "function") {
          return defineFunctionInEnv(expr, env);
        }
      }
    }
    return evaluateAtom(expr, env);
  };
  const r = e();
  return r;
}

function evaluateList(list: Expression[], env: Environment): Message {
  if (list.length === 0) {
    return null;
  }
  const [func, ...args] = list;
  if (typeof func === "string") {
    if (args.length === 1 && func !== "not" && !env.hasOwnProperty(func)) {
      const obj = evaluateExpression(args[0], env);
      if (typeof obj === "object" && obj !== null && obj.hasOwnProperty(func)) {
        return (obj as Record<string, Expression>)[func];
      }
    }
    if (func in env) {
      const fn = env[func];
      if (typeof fn === "function") {
        const evaluatedArgs = args.map((arg) => evaluateExpression(arg, env));
        return fn(...evaluatedArgs);
      }
    }
    switch (func) {
      case "+":
        return args.reduce((sum, arg) => (sum as number) + Number(evaluateExpression(arg, env)), 0);
      case "-":
        if (args.length === 1) {
          return -Number(evaluateExpression(args[0], env));
        }
        return Number(
          (evaluateExpression(args[0], env) as number) -
            (evaluateExpression(args[1], env) as number),
        );
      case "*":
        return args.reduce(
          (product, arg) => (product as number) * Number(evaluateExpression(arg, env)),
          1,
        );
      case "/":
        return args.reduce((quotient, arg, index) =>
          index === 0
            ? Number(evaluateExpression(arg, env))
            : (quotient as number) / Number(evaluateExpression(arg, env)),
        );
      case "%":
        if (args.length !== 2) {
          throw new Error("Modulo operation requires exactly two arguments");
        }
        return Number(evaluateExpression(args[0], env)) % Number(evaluateExpression(args[1], env));
      case ">":
        return Number(evaluateExpression(args[0], env)) > Number(evaluateExpression(args[1], env));
      case "<":
        return Number(evaluateExpression(args[0], env)) < Number(evaluateExpression(args[1], env));
      case ">=":
        return Number(evaluateExpression(args[0], env)) >= Number(evaluateExpression(args[1], env));
      case "<=":
        return Number(evaluateExpression(args[0], env)) <= Number(evaluateExpression(args[1], env));
      case "==":
        return evaluateExpression(args[0], env) === evaluateExpression(args[1], env);
      case "!=":
        return evaluateExpression(args[0], env) !== evaluateExpression(args[1], env);
      case "and":
        return args.every((arg) => Boolean(evaluateExpression(arg, env)));
      case "or":
        return args.some((arg) => Boolean(evaluateExpression(arg, env)));
      case "not":
        if (args.length !== 1) {
          throw new Error("Not operation requires exactly one argument");
        }
        return !Boolean(evaluateExpression(args[0], env));
      case "if":
        if (args.length !== 3) {
          throw new Error("If statement requires exactly three arguments");
        }
        const cond = evaluateExpression(args[0], env);
        return cond ? evaluateExpression(args[1], env) : evaluateExpression(args[2], env);
      case "list":
        return args.map((arg) => evaluateExpression(arg, env));
      case "car":
        if (args.length !== 1) {
          throw new Error("First operation requires exactly one argument");
        }
        const firstArg = evaluateExpression(args[0], env);
        if (!Array.isArray(firstArg)) {
          throw new Error("car operation requires a list argument");
        }
        return firstArg[0] ?? null;
      case "cdr":
        if (args.length !== 1) {
          throw new Error("cdr operation requires exactly one argument");
        }
        const restArg = evaluateExpression(args[0], env);
        if (!Array.isArray(restArg)) {
          throw new Error("cdr operation requires a list argument");
        }
        return restArg.slice(1);
      case "concat":
        return args.reduce((result, arg) => {
          const evaluated = evaluateExpression(arg, env);
          return Array.isArray(evaluated) ? result.concat(evaluated) : [...result, evaluated];
        }, []);
      case "length":
        if (args.length !== 1) {
          throw new Error("Length operation requires exactly one argument");
        }
        const lengthArg = evaluateExpression(args[0], env);
        if (typeof lengthArg === "string" || Array.isArray(lengthArg)) {
					return lengthArg.length;
        }
        throw new Error("Length operation requires a string or list argument");
      case "set":
        if (args.length !== 2) {
          throw new Error("set operation requires exactly two arguments");
        }
        if (typeof args[0] !== "string") {
          throw new Error("set operation requires string for variable name");
        }
        env[args[0]] = evaluateExpression(args[1], env);
        return env[args[0]];
      case "print":
        const printResult = args.map((arg) => evaluateExpression(arg, env));
        return printResult[printResult.length - 1] ?? null;
      default:
        throw new Error(`Unknown function: ${func}`);
    }
  }
  throw new Error(`Invalid function call: ${func}`);
}

function evaluateObject(obj: ObjectLiteral, env: Environment): Message {
  const result: Record<string, Message> = {};
  if (obj.spread) {
    const spreadValue = evaluateExpression(obj.spread, env);
    if (typeof spreadValue === "object" && spreadValue !== null) {
      Object.assign(result, spreadValue);
    } else {
      throw new Error("Spread value must be an object");
    }
  }
  for (const [key, value] of Object.entries(obj.properties)) {
    result[key] = evaluateExpression(value, env);
  }
  return result;
}

function evaluateAtom(atom: Atom, env: Environment): Message {
  if (typeof atom === "string") {
    const inputKey = atom;
    if (inputKey in env) {
      return env[inputKey];
    }
    if (atom.startsWith("$")) {
      throw new Error(`Unknown input: ${inputKey}`);
    }
    return atom;
  }
  return atom;
}

function defineFunctionInEnv(funcDef: FunctionDefinition, env: Environment): Message {
  const { params, body } = funcDef;
  env[params[0]] = (...args: Message[]) => {
    const localEnv = Object.create(env);

    params.slice(1).forEach((param, index) => {
      localEnv[param] = args[index];
    });
    return evaluateExpression(body, localEnv);
  };
  return null;
}
export { evaluate };
