import { createInterface } from "readline";
import { parse } from "./parse";
import { evaluate } from "./eval";
import type { Environment } from "./types";

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const env: Environment = {};

function printResult(result: any) {
	if (typeof result === "object" && result !== null) {
		console.log(JSON.stringify(result, null, 2));
	} else {
		console.log(result);
	}
}

function repl() {
	rl.question("> ", (input) => {
		if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
			rl.close();
			return;
		}

		try {
			const ast = parse(input);
			const result = evaluate(ast, env);
			printResult(result);
		} catch (error) {
			if (error instanceof Error) {
				console.error("Error:", error.message);
			} else {
				console.error("An unknown error occurred");
			}
		}

		repl();
	});
}

console.log("Welcome to the zen-lisp REPL");
console.log(`
________  ____    ____
\___   /_/ __ \  /    \
 /    / \  ___/ |   |  \
/_____ \ \___  >|___|  /
      \/     \/      \/
`);

console.log('Type "exit" or "quit" to leave the REPL.');
repl();

rl.on("close", () => {
	console.log("Goodbye!");
	process.exit(0);
});
