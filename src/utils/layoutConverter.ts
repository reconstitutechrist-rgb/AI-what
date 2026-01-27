import { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { LayoutManifest, UISpecNode, ComponentType } from '@/types/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts a style object from DetectedComponentEnhanced to a Tailwind class string.
 * Uses arbitrary values for precision where necessary.
 */
function stylesToTailwind(style: Record<string, any>): string {
  const classes: string[] = [];

  Object.entries(style).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    
    // Stringify value for template literals
    const valStr = String(value);

    // Basic mapping
    if (key === 'backgroundColor') classes.push(`bg-[${valStr}]`);
    else if (key === 'color') classes.push(`text-[${valStr}]`);
    else if (key === 'width') classes.push(`w-[${valStr}]`);
    else if (key === 'height') classes.push(`h-[${valStr}]`);
    else if (key === 'borderRadius') classes.push(`rounded-[${valStr}]`);
    else if (key === 'padding') classes.push(`p-[${valStr}]`);
    else if (key === 'fontSize') classes.push(`text-[${valStr}]`);
    else if (key === 'fontWeight') classes.push(`font-[${valStr}]`);
    else if (key === 'display' && valStr === 'flex') classes.push('flex');
    else if (key === 'flexDirection' && valStr === 'column') classes.push('flex-col');
    else if (key === 'gap') classes.push(`gap-[${valStr}]`);
    else if (key === 'position' && valStr === 'absolute') classes.push('absolute');
    else if (key === 'top') classes.push(`top-[${valStr}]`);
    else if (key === 'left') classes.push(`left-[${valStr}]`);
    // Ensure zIndex is handled as arbitrary value if not a standard integer
    else if (key === 'zIndex') classes.push(`z-[${valStr}]`);
  });

  return classes.join(' ');
}

/**
 * Maps DetectedComponentEnhanced types to UISpecNode ComponentType
 */
function mapComponentType(detectedType: string): ComponentType {
  const typeMap: Record<string, ComponentType> = {
    'header': 'container',
    'sidebar': 'container',
    'hero': 'container',
    'cards': 'list',
    'navigation': 'container',
    'footer': 'container',
    'button': 'button',
    'input': 'input',
    'image': 'image',
    'text': 'text',
    'icon': 'icon',
    'video': 'video',
  };

  return typeMap[detectedType] || 'container';
}

/**
 * Recursively builds the UISpecNode tree from the flat component list
 */
function buildNodeTree(
  component: DetectedComponentEnhanced,
  allComponents: DetectedComponentEnhanced[]
): UISpecNode {
  const childNodes: UISpecNode[] = [];
  
  if (component.children && component.children.length > 0) {
    component.children.forEach(childId => {
      const childComponent = allComponents.find(c => c.id === childId);
      if (childComponent) {
        childNodes.push(buildNodeTree(childComponent, allComponents));
      }
    });
  }

  return {
    id: component.id,
    type: mapComponentType(component.type),
    semanticTag: component.type,
    // Type assertion to allow access to specific properties that might not be in the strict Record<string, string|number> definition
    const styleObj = component.style as any;

    styles: {
      tailwindClasses: stylesToTailwind(styleObj),
    },
    attributes: {
      text: component.content?.text,
      src: component.content?.hasImage ? 'placeholder.jpg' : undefined,
    },
    layout: {
      mode: styleObj.position === 'absolute' || component.bounds ? 'absolute' : 'flow',
      bounds: {
        x: component.bounds?.left || 0,
        y: component.bounds?.top || 0,
        width: component.bounds?.width || 0,
        height: component.bounds?.height || 0,
        unit: '%', 
      },
      zIndex: component.zIndex,
    },
    children: childNodes,
  };
}

/**
 * Main Conversion Function
 */
export function convertToLayoutManifest(components: DetectedComponentEnhanced[]): LayoutManifest {
  // 1. Identify Root Nodes (components with no parentId OR parentId not found in current set)
  // This handles cases where we might export a subset or the parent linkage is broken
  const rootComponents = components.filter(c => !c.parentId || !components.find(p => p.id === c.parentId));
  
  let rootNode: UISpecNode;

  if (rootComponents.length === 1) {
    rootNode = buildNodeTree(rootComponents[0], components);
  } else {
    // Create a virtual root container
    rootNode = {
      id: `root-container-${uuidv4()}`,
      type: 'container',
      semanticTag: 'body',
      styles: {
        tailwindClasses: 'w-full h-full relative',
      },
      attributes: {},
      children: rootComponents.map(c => buildNodeTree(c, components)),
    };
  }

  return {
    id: uuidv4(),
    version: '1.0.0',
    root: rootNode,
    definitions: {},
    detectedFeatures: [], 
    designSystem: {
      colors: {}, 
      fonts: { heading: 'Inter', body: 'Inter' },
    },
  };
}
