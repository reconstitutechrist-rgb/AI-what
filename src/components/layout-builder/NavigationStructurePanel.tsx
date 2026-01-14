/**
 * NavigationStructurePanel Component
 *
 * Tree view of detected navigation structure.
 * - Edit labels, reorder items
 * - Link items to pages
 * - Export as React Router config
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  LinkIcon,
  PlusIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  HomeIcon,
  MenuIcon,
  LayoutIcon,
} from '../ui/Icons';
import type {
  DetectedNavigation,
  NavigationItem,
  PageReference,
  InferredRoute,
} from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

interface NavigationStructurePanelProps {
  /** Detected navigation structure */
  navigation: DetectedNavigation | null;
  /** Available pages to link to */
  pages: PageReference[];
  /** Inferred routes */
  routes: InferredRoute[];
  /** Callback when navigation is updated */
  onNavigationUpdate: (navigation: DetectedNavigation) => void;
  /** Callback to export React Router config */
  onExportRouterConfig?: () => void;
  /** Custom class name */
  className?: string;
}

interface NavigationItemEditorProps {
  item: NavigationItem;
  pages: PageReference[];
  depth: number;
  onUpdate: (item: NavigationItem) => void;
  onRemove: () => void;
  onAddChild: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

function getNavigationStyleIcon(style: DetectedNavigation['style']) {
  switch (style) {
    case 'horizontal':
    case 'tabs':
      return <MenuIcon className="w-4 h-4 rotate-90" />;
    case 'vertical':
    case 'sidebar':
      return <MenuIcon className="w-4 h-4" />;
    case 'hamburger':
      return <MenuIcon className="w-4 h-4" />;
    case 'mega-menu':
      return <LayoutIcon className="w-4 h-4" />;
    default:
      return <MenuIcon className="w-4 h-4" />;
  }
}

// ============================================================================
// NAVIGATION ITEM EDITOR COMPONENT
// ============================================================================

function NavigationItemEditor({
  item,
  pages,
  depth,
  onUpdate,
  onRemove,
  onAddChild,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: NavigationItemEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);

  const hasChildren = item.children && item.children.length > 0;
  const linkedPage = pages.find((p) => p.slug === item.targetPageSlug);

  const handleLabelSubmit = useCallback(() => {
    if (editLabel.trim() && editLabel !== item.label) {
      onUpdate({ ...item, label: editLabel.trim() });
    }
    setIsEditingLabel(false);
  }, [editLabel, item, onUpdate]);

  const handlePageLink = useCallback(
    (pageSlug: string | undefined) => {
      onUpdate({ ...item, targetPageSlug: pageSlug });
    },
    [item, onUpdate]
  );

  const handleChildUpdate = useCallback(
    (index: number, updatedChild: NavigationItem) => {
      const newChildren = [...(item.children || [])];
      newChildren[index] = updatedChild;
      onUpdate({ ...item, children: newChildren });
    },
    [item, onUpdate]
  );

  const handleChildRemove = useCallback(
    (index: number) => {
      const newChildren = (item.children || []).filter((_, i) => i !== index);
      onUpdate({ ...item, children: newChildren });
    },
    [item, onUpdate]
  );

  const handleChildAdd = useCallback(() => {
    const newChild: NavigationItem = {
      label: 'New Item',
      order: item.children?.length || 0,
    };
    onUpdate({ ...item, children: [...(item.children || []), newChild] });
  }, [item, onUpdate]);

  const handleChildMoveUp = useCallback(
    (index: number) => {
      if (index === 0 || !item.children) return;
      const newChildren = [...item.children];
      [newChildren[index - 1], newChildren[index]] = [newChildren[index], newChildren[index - 1]];
      newChildren.forEach((child, i) => (child.order = i));
      onUpdate({ ...item, children: newChildren });
    },
    [item, onUpdate]
  );

  const handleChildMoveDown = useCallback(
    (index: number) => {
      if (!item.children || index >= item.children.length - 1) return;
      const newChildren = [...item.children];
      [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
      newChildren.forEach((child, i) => (child.order = i));
      onUpdate({ ...item, children: newChildren });
    },
    [item, onUpdate]
  );

  return (
    <div className="select-none">
      {/* Item Row */}
      <div
        className="group flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-0.5 rounded transition-colors ${hasChildren ? 'hover:bg-white/10' : 'invisible'}`}
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronRightIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          )}
        </button>

        {/* Drag Handle */}
        <div className="p-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVerticalIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Label */}
        {isEditingLabel ? (
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleLabelSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSubmit();
              if (e.key === 'Escape') {
                setEditLabel(item.label);
                setIsEditingLabel(false);
              }
            }}
            autoFocus
            className="flex-1 px-1.5 py-0.5 text-sm rounded border bg-transparent outline-none min-w-0"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--gold-500, #eab308)',
            }}
          />
        ) : (
          <button
            onClick={() => setIsEditingLabel(true)}
            className="flex-1 text-left text-sm font-medium truncate hover:text-gold-400 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {item.label}
          </button>
        )}

        {/* Page Link Indicator */}
        {linkedPage && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            <LinkIcon className="w-2.5 h-2.5" />
            {linkedPage.name}
          </div>
        )}

        {/* Page Link Dropdown */}
        <select
          value={item.targetPageSlug || ''}
          onChange={(e) => handlePageLink(e.target.value || undefined)}
          className="opacity-0 group-hover:opacity-100 text-xs px-1 py-0.5 rounded border bg-transparent transition-opacity"
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          <option value="">No link</option>
          {pages.map((page) => (
            <option key={page.id} value={page.slug}>
              {page.name}
            </option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ChevronRightIcon
              className="w-3 h-3 -rotate-90"
              style={{ color: 'var(--text-muted)' }}
            />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ChevronRightIcon
              className="w-3 h-3 rotate-90"
              style={{ color: 'var(--text-muted)' }}
            />
          </button>
          <button onClick={onAddChild} className="p-1 rounded hover:bg-white/10" title="Add child">
            <PlusIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/20" title="Remove">
            <XIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child, index) => (
            <NavigationItemEditor
              key={`${child.label}-${index}`}
              item={child}
              pages={pages}
              depth={depth + 1}
              onUpdate={(updated) => handleChildUpdate(index, updated)}
              onRemove={() => handleChildRemove(index)}
              onAddChild={handleChildAdd}
              onMoveUp={() => handleChildMoveUp(index)}
              onMoveDown={() => handleChildMoveDown(index)}
              canMoveUp={index > 0}
              canMoveDown={index < item.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NavigationStructurePanel({
  navigation,
  pages,
  routes,
  onNavigationUpdate,
  onExportRouterConfig,
  className = '',
}: NavigationStructurePanelProps) {
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Generate React Router config string
  const generateRouterConfig = useCallback(() => {
    if (!routes.length && !navigation) return '';

    const lines: string[] = [
      '// Generated React Router Configuration',
      "import { createBrowserRouter } from 'react-router-dom';",
      '',
    ];

    // Generate route imports
    pages.forEach((page) => {
      const componentName = page.name.replace(/[^a-zA-Z0-9]/g, '') + 'Page';
      lines.push(`import { ${componentName} } from './pages/${page.slug}';`);
    });

    lines.push('');
    lines.push('export const router = createBrowserRouter([');

    // Generate routes
    routes.forEach((route) => {
      const page = pages.find((p) => p.id === route.pageId);
      if (page) {
        const componentName = page.name.replace(/[^a-zA-Z0-9]/g, '') + 'Page';
        const isIndex = page.isMain;
        lines.push(`  {`);
        lines.push(`    path: '${route.path}',`);
        lines.push(`    element: <${componentName} />,`);
        if (isIndex) {
          lines.push(`    index: true,`);
        }
        lines.push(`  },`);
      }
    });

    lines.push(']);');
    lines.push('');

    // Generate Navigation component if detected
    if (navigation && navigation.items.length > 0) {
      lines.push('// Navigation Component');
      lines.push("import { Link } from 'react-router-dom';");
      lines.push('');
      lines.push('export function Navigation() {');
      lines.push('  return (');
      lines.push(`    <nav className="navigation navigation--${navigation.style}">`);

      navigation.items.forEach((item) => {
        if (item.targetPageSlug) {
          const route = routes.find((r) => {
            const page = pages.find((p) => p.id === r.pageId);
            return page?.slug === item.targetPageSlug;
          });
          lines.push(
            `      <Link to="${route?.path || '/' + item.targetPageSlug}">${item.label}</Link>`
          );
        } else {
          lines.push(`      <span>${item.label}</span>`);
        }
      });

      lines.push('    </nav>');
      lines.push('  );');
      lines.push('}');
    }

    return lines.join('\n');
  }, [navigation, pages, routes]);

  const handleCopyConfig = useCallback(() => {
    const config = generateRouterConfig();
    navigator.clipboard.writeText(config);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  }, [generateRouterConfig]);

  const handleItemUpdate = useCallback(
    (index: number, updatedItem: NavigationItem) => {
      if (!navigation) return;
      const newItems = [...navigation.items];
      newItems[index] = updatedItem;
      onNavigationUpdate({ ...navigation, items: newItems });
    },
    [navigation, onNavigationUpdate]
  );

  const handleItemRemove = useCallback(
    (index: number) => {
      if (!navigation) return;
      const newItems = navigation.items.filter((_, i) => i !== index);
      newItems.forEach((item, i) => (item.order = i));
      onNavigationUpdate({ ...navigation, items: newItems });
    },
    [navigation, onNavigationUpdate]
  );

  const handleAddItem = useCallback(() => {
    if (!navigation) return;
    const newItem: NavigationItem = {
      label: 'New Item',
      order: navigation.items.length,
    };
    onNavigationUpdate({ ...navigation, items: [...navigation.items, newItem] });
  }, [navigation, onNavigationUpdate]);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (!navigation || index === 0) return;
      const newItems = [...navigation.items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      newItems.forEach((item, i) => (item.order = i));
      onNavigationUpdate({ ...navigation, items: newItems });
    },
    [navigation, onNavigationUpdate]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (!navigation || index >= navigation.items.length - 1) return;
      const newItems = [...navigation.items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      newItems.forEach((item, i) => (item.order = i));
      onNavigationUpdate({ ...navigation, items: newItems });
    },
    [navigation, onNavigationUpdate]
  );

  const handleStyleChange = useCallback(
    (style: DetectedNavigation['style']) => {
      if (!navigation) return;
      onNavigationUpdate({ ...navigation, style });
    },
    [navigation, onNavigationUpdate]
  );

  const handlePositionChange = useCallback(
    (position: DetectedNavigation['position']) => {
      if (!navigation) return;
      onNavigationUpdate({ ...navigation, position });
    },
    [navigation, onNavigationUpdate]
  );

  // Empty state
  if (!navigation || navigation.items.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div
          className="text-center py-8 rounded-lg border-2 border-dashed"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <MenuIcon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No navigation detected
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Upload multiple pages to detect navigation structure
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          {getNavigationStyleIcon(navigation.style)}
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Navigation Structure
          </h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            {navigation.items.length} items
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyConfig}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            {copiedConfig ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="w-3.5 h-3.5" />
                Copy Config
              </>
            )}
          </button>
          {onExportRouterConfig && (
            <button
              onClick={onExportRouterConfig}
              className="px-2 py-1 rounded text-xs font-medium transition-colors"
              style={{ background: 'var(--gold-500, #eab308)', color: 'white' }}
            >
              Export
            </button>
          )}
        </div>
      </div>

      {/* Style & Position Controls */}
      <div
        className="flex items-center gap-4 px-4 py-2 border-b"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Style:
          </span>
          <select
            value={navigation.style}
            onChange={(e) => handleStyleChange(e.target.value as DetectedNavigation['style'])}
            className="text-xs px-2 py-1 rounded border bg-transparent"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="sidebar">Sidebar</option>
            <option value="tabs">Tabs</option>
            <option value="hamburger">Hamburger</option>
            <option value="mega-menu">Mega Menu</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Position:
          </span>
          <select
            value={navigation.position}
            onChange={(e) => handlePositionChange(e.target.value as DetectedNavigation['position'])}
            className="text-xs px-2 py-1 rounded border bg-transparent"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <option value="header">Header</option>
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
            <option value="floating">Floating</option>
          </select>
        </div>

        <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={navigation.isSticky || false}
            onChange={(e) => onNavigationUpdate({ ...navigation, isSticky: e.target.checked })}
            className="rounded"
          />
          Sticky
        </label>
      </div>

      {/* Navigation Items Tree */}
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {navigation.items.map((item, index) => (
          <NavigationItemEditor
            key={`${item.label}-${index}`}
            item={item}
            pages={pages}
            depth={0}
            onUpdate={(updated) => handleItemUpdate(index, updated)}
            onRemove={() => handleItemRemove(index)}
            onAddChild={() => {
              const newItem = {
                ...item,
                children: [
                  ...(item.children || []),
                  { label: 'New Child', order: item.children?.length || 0 },
                ],
              };
              handleItemUpdate(index, newItem);
            }}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            canMoveUp={index > 0}
            canMoveDown={index < navigation.items.length - 1}
          />
        ))}

        {/* Add Item Button */}
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 w-full py-2 px-4 mt-2 rounded-lg border-2 border-dashed transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm">Add navigation item</span>
        </button>
      </div>

      {/* Routes Preview */}
      {routes.length > 0 && (
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Inferred Routes
          </h4>
          <div className="flex flex-wrap gap-2">
            {routes.map((route) => {
              const page = pages.find((p) => p.id === route.pageId);
              return (
                <div
                  key={route.path}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {page?.isMain && <HomeIcon className="w-3 h-3" />}
                  <code>{route.path}</code>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NavigationStructurePanel;
