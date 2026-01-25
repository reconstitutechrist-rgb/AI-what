import { LayoutManifest, UISpecNode } from '@/types/schema';
import { AppFile } from '@/types/railway';

export class CompilerService {
  public static compileToReact(manifest: LayoutManifest): AppFile[] {
    const files: AppFile[] = [];

    // 1. tailwind.config.ts (Fixed)
    files.push({
      path: 'tailwind.config.ts',
      content: this.generateTailwindConfig(manifest.designSystem),
    });

    // 2. Global CSS
    files.push({
      path: 'app/globals.css',
      content: this.generateGlobalsCss(manifest.designSystem),
    });

    // 3. Reusable Components (Generates first to ensure imports work)
    Object.entries(manifest.definitions).forEach(([name, node]) => {
      files.push({
        path: `components/generated/${name}.tsx`,
        content: this.generateComponentFile(name, node),
      });
    });

    // 4. Main Page (Injects imports for definitions)
    files.push({
      path: 'app/page.tsx',
      content: this.generatePage(manifest),
    });

    // 5. Root Layout
    files.push({
      path: 'app/layout.tsx',
      content: this.generateRootLayout(manifest),
    });

    return files;
  }

  // --- COMPONENT GENERATION ---

  private static generatePage(manifest: LayoutManifest): string {
    const { imports, hooks, jsx } = this.processNodeTree(manifest.root);
    const definitionImports = Object.keys(manifest.definitions)
      .map((name) => `import { ${name} } from '@/components/generated/${name}';`)
      .join('\n');

    // Collect only the icons actually used
    const iconNames = this.collectIconNames(manifest.root);
    if (manifest.definitions) {
      Object.values(manifest.definitions).forEach((node) => {
        iconNames.push(...this.collectIconNames(node));
      });
    }
    const uniqueIcons = [...new Set(iconNames)];
    const iconImport =
      uniqueIcons.length > 0
        ? `import { ${uniqueIcons.join(', ')} } from 'lucide-react';`
        : `import * as Icons from 'lucide-react';`;

    return `
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
${iconImport}
${definitionImports}

export default function GeneratedPage() {
  ${hooks.join('\n  ')}
  return (
    <main className="min-h-screen bg-background text-text">
      ${jsx}
    </main>
  );
}
`;
  }

  /**
   * Collect all icon names used in a node tree.
   */
  private static collectIconNames(node: UISpecNode): string[] {
    const icons: string[] = [];
    if (node.type === 'icon' && node.attributes.src) {
      icons.push(node.attributes.src as string);
    }
    node.children?.forEach((child) => {
      icons.push(...this.collectIconNames(child));
    });
    return icons;
  }

  private static generateComponentFile(name: string, node: UISpecNode): string {
    const { imports, hooks, jsx } = this.processNodeTree(node);
    return `
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import * as Icons from 'lucide-react';

export const ${name} = () => {
  ${hooks.join('\n  ')}
  return (
    <>
      ${jsx}
    </>
  );
};
`;
  }

  // --- TRAVERSAL & STATE EXTRACTION ---

  private static processNodeTree(node: UISpecNode): {
    imports: string[];
    hooks: string[];
    jsx: string;
  } {
    const hooks: string[] = [];
    const imports: string[] = [];

    // 1. GENERATE STATE HOOKS (Inferred from Video)
    let stateCondition = '';

    if (node.state?.isLoading) {
      const stateVar = `isLoading_${node.id.replace(/-/g, '_')}`;
      const setter = `setIsLoading_${node.id.replace(/-/g, '_')}`;
      // Generate the hook with default TRUE (as inferred from the video start)
      hooks.push(`const [${stateVar}, ${setter}] = useState(true);`);

      // Create the condition string
      stateCondition = stateVar;
    }

    if (node.state?.isHidden) {
      const visibilityVar = `isVisible_${node.id.replace(/-/g, '_')}`;
      const setVisibility = `setIsVisible_${node.id.replace(/-/g, '_')}`;
      hooks.push(`const [${visibilityVar}, ${setVisibility}] = useState(false);`);

      // If we have both loading and hidden, combine them
      stateCondition = stateCondition
        ? `${stateCondition} || !${visibilityVar}`
        : `!${visibilityVar}`;
    }

    // 2. RECURSIVE CHILDREN
    const childrenResult = node.children?.map((c) => this.processNodeTree(c)) || [];
    childrenResult.forEach((c) => {
      hooks.push(...c.hooks);
      imports.push(...c.imports);
    });

    const childrenJsx = childrenResult.map((c) => c.jsx).join('\n');

    // 3. RENDER THE COMPONENT
    let mainJsx = this.renderNodeJsx(node, childrenJsx);

    // 4. WRAP IN CONDITIONAL UI (The "Temporal" Implementation)
    if (stateCondition) {
      // If the architect saw a spinner, we generate a Skeleton fallback
      const skeletonClass = node.styles.tailwindClasses.replace(
        /bg-[\w/-]+/,
        'bg-slate-200 animate-pulse'
      );

      mainJsx = `
        {${stateCondition} ? (
          <div className="${skeletonClass} h-full w-full min-h-[50px] rounded-md" /> 
        ) : (
          ${mainJsx}
        )}
      `;
    }

    return { imports, hooks, jsx: mainJsx };
  }

  private static renderNodeJsx(node: UISpecNode, childrenJsx: string): string {
    // 1. Handle Components
    if (node.type === 'component-reference' && node.attributes.componentId) {
      return `<${node.attributes.componentId} />`;
    }

    // 2. Handle Motion Triggers (Inferred from Video)
    let props = `className="${node.styles.tailwindClasses}"`;
    let Tag = this.getTagForType(node.type);

    // If "trigger" is detected, map it to Framer Motion variants
    if (node.state?.trigger === 'hover') {
      props += ` whileHover={{ scale: 1.05 }}`;
      Tag = 'motion.div';
    }
    if (node.state?.trigger === 'click') {
      props += ` whileTap={{ scale: 0.95 }}`;
      Tag = 'motion.button';
    }

    // 3. Handle explicit motion props
    if (node.styles.motion) {
      Tag = `motion.${this.getTagForType(node.type)}`;
      props += ` initial={${JSON.stringify(node.styles.motion.initial)}}`;
      props += ` animate={${JSON.stringify(node.styles.motion.animate)}}`;
    }

    // 4. Handle Icons (with fallback for missing src)
    if (node.type === 'icon') {
      const iconName = node.attributes?.src || 'HelpCircle';
      return `<Icons.${iconName} ${props} />`;
    }

    // 5. Handle Next.js Image
    if (node.type === 'image') {
      return `<Image src="${node.attributes.src || '/placeholder.png'}" width={500} height={300} alt="alt" ${props} />`;
    }

    // 6. Handle Links
    if (node.attributes.linkHref) {
      return `<Link href="${node.attributes.linkHref}" ${props}>${childrenJsx}</Link>`;
    }

    // 7. Handle Text
    const content = node.attributes.text || childrenJsx;
    return `<${Tag} ${props}>${content}</${Tag}>`;
  }

  private static getTagForType(type: string): string {
    const map: Record<string, string> = {
      container: 'div',
      button: 'button',
      text: 'p',
      input: 'input',
      list: 'div',
      video: 'video',
    };
    return map[type] || 'div';
  }

  // --- CONFIG GENERATORS ---

  private static generateGlobalsCss(ds: LayoutManifest['designSystem']): string {
    const vars = Object.entries(ds.colors)
      .map(([key, val]) => `--${key}: ${val};`)
      .join('\n  ');
    return `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  ${vars}
  --font-heading: ${ds.fonts.heading};
  --font-body: ${ds.fonts.body};
}
`;
  }

  private static generateTailwindConfig(ds: LayoutManifest['designSystem']): string {
    const colorExtend = Object.keys(ds.colors)
      .map((key) => `${key}: "var(--${key})"`)
      .join(',\n        ');
    return `
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ${colorExtend}
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"]
      }
    },
  },
  plugins: [],
};

export default config;
`;
  }

  private static generateRootLayout(manifest: LayoutManifest): string {
    const fontBody = manifest.designSystem.fonts.body.replace(/ /g, '') || 'Inter';
    const fontHeading = manifest.designSystem.fonts.heading.replace(/ /g, '') || 'Inter';
    // De-dupe if same font
    const fonts = new Set([fontBody, fontHeading]);
    const importStr = Array.from(fonts).join(', ');
    return `
import type { Metadata } from "next";
import { ${importStr} } from "next/font/google";
import "./globals.css";

const bodyFont = ${fontBody}({ subsets: ["latin"], variable: '--font-body' });
const headingFont = ${fontHeading}({ subsets: ["latin"], variable: '--font-heading' });

export const metadata: Metadata = {
  title: "Generated App",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={\`\${bodyFont.variable} \${headingFont.variable} font-sans\`}>
        {children}
      </body>
    </html>
  );
}
`;
  }
}
