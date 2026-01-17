'use client';
import React from 'react';
import { UISpecNode } from '@/types/schema';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface EngineProps {
  node: UISpecNode;
  definitions: Record<string, UISpecNode>;
  onSelect?: (id: string) => void;
  selectedId?: string;
  editable?: boolean;
}

export const Engine: React.FC<EngineProps> = ({ node, definitions, onSelect, selectedId, editable = false }) => {
  if (node.type === 'component-reference' && node.attributes.componentId) {
    const def = definitions[node.attributes.componentId];
    if (def) return <Engine node={def} definitions={definitions} onSelect={onSelect} selectedId={selectedId} editable={editable} />;
  }

  const tagMap: Record<string, any> = {
    container: 'div', text: 'p', button: 'button', input: 'input', list: 'div', image: 'img'
  };
  const Tag = tagMap[node.type] || 'div';
  const MotionTag = motion(Tag as any);

  if (node.type === 'icon' && node.attributes.src) {
    const IconCmp = (Icons as any)[node.attributes.src] || Icons.HelpCircle;
    return <IconCmp className={node.styles.tailwindClasses} />;
  }

  const isSelected = selectedId === node.id;
  const selectionStyle = editable && isSelected ? { outline: '2px solid #3b82f6', outlineOffset: '2px' } : {};

  return (
    <MotionTag
      className={node.styles.tailwindClasses}
      style={selectionStyle}
      initial={node.styles.motion?.initial}
      animate={node.styles.motion?.animate}
      onClick={(e: any) => { e.stopPropagation(); onSelect?.(node.id); }}
      {...node.attributes}
    >
      {node.attributes.text}
      {node.children?.map(c => (
        <Engine key={c.id} node={c} definitions={definitions} onSelect={onSelect} selectedId={selectedId} editable={editable} />
      ))}
    </MotionTag>
  );
};

/**
 * LayoutPreview - Wrapper that injects CSS variables from designSystem
 */
interface LayoutPreviewProps {
  manifest: {
    root: UISpecNode;
    definitions: Record<string, UISpecNode>;
    designSystem: {
      colors: Record<string, string>;
      fonts: { heading: string; body: string };
    };
  };
  onSelectNode?: (id: string) => void;
  selectedNodeId?: string;
  editMode?: boolean;
}

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ manifest, onSelectNode, selectedNodeId, editMode = false }) => {
  const cssVariables: Record<string, string> = {};
  Object.entries(manifest.designSystem.colors).forEach(([key, value]) => {
    cssVariables[`--${key}`] = value;
  });
  cssVariables['--font-heading'] = manifest.designSystem.fonts.heading;
  cssVariables['--font-body'] = manifest.designSystem.fonts.body;

  return (
    <div style={cssVariables as React.CSSProperties}>
      <Engine
        node={manifest.root}
        definitions={manifest.definitions}
        onSelect={onSelectNode}
        selectedId={selectedNodeId}
        editable={editMode}
      />
    </div>
  );
};
