// Pattern: ${ followed immediately by `
const MALFORMED_TEMPLATE_REGEX = /\$\{\s*`/;

const invalidCode = `
<span className={\`flex-1 \${\`
  todo.completed ? 'line-through' : ''
\`}\`}>Test</span>
`;

const validCode = `
<span className={\`flex-1 \${
  todo.completed ? 'line-through' : ''
}\`}>Test</span>
`;

console.log('Testing regex:', MALFORMED_TEMPLATE_REGEX);

function check(code) {
    const lines = code.split('\n');
    return lines.some(line => MALFORMED_TEMPLATE_REGEX.test(line));
}

console.log('Invalid code detected (expected true):', check(invalidCode));
console.log('Valid code detected (expected false):', check(validCode));
