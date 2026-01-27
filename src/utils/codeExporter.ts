import { DetectedComponentEnhanced } from '@/types/layoutDesign';

/**
 * Converts a component styles object to a Tailwind class string.
 * Optimizes for arbitrary values where needed.
 */
function stylesToTailwind(style: Record<string, string | number>): string {
  const classes: string[] = [];

  Object.entries(style).forEach(([key, value]) => {
    // Basic mapping (expand as needed)
    if (key === 'backgroundColor') classes.push(`bg-[${value}]`);
    else if (key === 'color') classes.push(`text-[${value}]`);
    else if (key === 'width') classes.push(`w-[${value}]`);
    else if (key === 'height') classes.push(`h-[${value}]`);
    else if (key === 'borderRadius') classes.push(`rounded-[${value}]`);
    else if (key === 'padding') classes.push(`p-[${value}]`);
    else if (key === 'fontSize') classes.push(`text-[${value}]`);
    else if (key === 'fontWeight') classes.push(`font-[${value}]`);
    else if (key === 'display' && value === 'flex') classes.push('flex');
    else if (key === 'flexDirection' && value === 'column') classes.push('flex-col');
    else if (key === 'gap') classes.push(`gap-[${value}]`);
    else if (key === 'position' && value === 'absolute') classes.push('absolute');
    else if (key === 'top') classes.push(`top-[${value}]`);
    else if (key === 'left') classes.push(`left-[${value}]`);
  });

  return classes.join(' ');
}

/**
 * Recursively generates JSX for a component tree.
 */
function generateJSX(component: DetectedComponentEnhanced, indentLevel = 2): string {
  const indent = ' '.repeat(indentLevel);
  const tailwindClasses = stylesToTailwind(component.style);
  
  // Clean up content: escape generic text
  const content = component.content ? component.content.trim() : '';
  
  let jsx = `${indent}<div className="${tailwindClasses}" data-id="${component.id}">`;
  
  if (content) {
    jsx += `\n${indent}  ${content}`;
  }

  if (component.children && component.children.length > 0) {
    jsx += '\n' + component.children.map(child => generateJSX(child, indentLevel + 2)).join('\n');
    jsx += `\n${indent}</div>`;
  } else if (!content) {
    jsx += `</div>`; // Self-closing if desired, but <div> usually needs closing
  } else {
    jsx += `\n${indent}</div>`;
  }

  return jsx;
}

/**
 * Main Export Function
 */
export function exportToReact(components: DetectedComponentEnhanced[]): string {
  const jsxContent = components.map(c => generateJSX(c)).join('\n\n');

  return `
import React from 'react';

export default function GeneratedLayout() {
  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden">
${jsxContent}
    </div>
  );
}
  `.trim();
}
