/**
 * Common component syntax rules - shared across all routes
 * Prevents nested function declaration errors in React
 */

export const COMPONENT_SYNTAX_RULES = `
COMPONENT SYNTAX (React/JSX):
- NEVER nest function declarations: function Helper() {} inside another function is INVALID
- Correct: Declare helpers BEFORE main export OR use arrow functions inside
- Wrong: export default function App() { function Helper() {} } ← SyntaxError
- React strict mode forbids nested function declarations
`.trim();
