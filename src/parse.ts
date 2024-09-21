// Types for our AST
type Atom = string | number | boolean | null;
type Expression = Atom | List | ObjectLiteral;
type List = Expression[];
type ObjectLiteral = {
  type: "object";
  spread: Expression | null;
  properties: { [key: string]: Expression };
};
type AST = Expression;

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      inString = !inString;
      current += char;
    } else if (inString) {
      current += char;
    } else if (char === '(' || char === ')' || char === '{' || char === '}') {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    } else if (char === ' ' && current.length > 0) {
      tokens.push(current);
      current = '';
    } else if (char !== ' ') {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function parse(input: string): AST {
  const tokens = tokenize(input);
  return parseExpression(tokens);
}

function parseExpression(tokens: string[]): Expression {
  const token = tokens.shift();
  if (token === undefined) {
    throw new Error("Unexpected end of input");
  }
  if (token === '(') {
    return parseList(tokens);
  } else if (token === '{') {
    return parseObjectLiteral(tokens);
  } else if (token === ')' || token === '}') {
    throw new Error("Unexpected closing bracket");
  } else {
    return parseAtom(token);
  }
}

function parseList(tokens: string[]): List {
  const list: Expression[] = [];
  while (tokens[0] !== ')') {
    if (tokens.length === 0) {
      throw new Error("Unexpected end of input: missing closing parenthesis");
    }
    list.push(parseExpression(tokens));
  }
  tokens.shift(); // Remove closing parenthesis
  return list;
}

function parseObjectLiteral(tokens: string[]): ObjectLiteral {
  const obj: ObjectLiteral = {
    type: "object",
    spread: null,
    properties: {},
  };

  if (tokens[0] === '}') {
    tokens.shift(); // Remove closing brace for empty object
    return obj;
  }

  if (tokens[0] === '...') {
    tokens.shift(); // Remove spread operator
    obj.spread = parseExpression(tokens);
  }

  while (tokens[0] !== '}') {
    if (tokens.length === 0) {
      throw new Error("Unexpected end of input: missing closing brace");
    }
    const key = parseExpression(tokens);
    if (typeof key !== 'string') {
      throw new Error("Object key must be a string");
    }
    const value = parseExpression(tokens);
    obj.properties[key] = value;
  }
  tokens.shift(); // Remove closing brace
  return obj;
}

function parseAtom(token: string): Atom {
  if (token === "true") return true;
  if (token === "false") return false;
  if (token === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  return token;
}

// Export the parse function
export { parse };
