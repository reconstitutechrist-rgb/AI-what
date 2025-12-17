/**
 * Figma Plugin Main Code
 * Runs in Figma's sandbox environment
 */

import type { FigmaExtraction, PluginMessage, UIMessage } from './types/figma-data';
import {
  extractColors,
  extractTypography,
  extractSpacing,
  extractComponents,
  extractEffects,
  extractCornerRadius,
} from './extractors';

// Show the plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 500,
  themeColors: true,
});

// Track current selection
let currentSelection: readonly SceneNode[] = [];

/**
 * Extract all design data from selected nodes
 */
function extractDesignData(): FigmaExtraction | null {
  if (currentSelection.length === 0) {
    return null;
  }

  const firstNode = currentSelection[0];
  const page = figma.currentPage;

  // Get frame size from first selected node
  const frameSize = {
    width: 'width' in firstNode ? firstNode.width : 0,
    height: 'height' in firstNode ? firstNode.height : 0,
  };

  // Extract all design data
  const colors = extractColors(currentSelection);
  const typography = extractTypography(currentSelection);
  const spacing = extractSpacing(currentSelection);
  const components = extractComponents(currentSelection);
  const effects = extractEffects(currentSelection);
  const cornerRadius = extractCornerRadius(currentSelection);

  return {
    documentName: figma.root.name,
    pageName: page.name,
    selectionName: firstNode.name,
    colors,
    typography,
    spacing,
    effects,
    components,
    cornerRadius,
    frameSize,
  };
}

/**
 * Send selection status to UI
 */
function notifySelectionChange(): void {
  const message: PluginMessage = {
    type: 'selection-change',
    hasSelection: currentSelection.length > 0,
    selectionCount: currentSelection.length,
  };
  figma.ui.postMessage(message);
}

/**
 * Handle selection changes
 */
figma.on('selectionchange', () => {
  currentSelection = figma.currentPage.selection;
  notifySelectionChange();
});

// Initialize with current selection
currentSelection = figma.currentPage.selection;
notifySelectionChange();

/**
 * Handle messages from UI
 */
figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case 'start-extraction': {
      try {
        const data = extractDesignData();
        if (data) {
          const response: PluginMessage = {
            type: 'extraction-complete',
            data,
          };
          figma.ui.postMessage(response);
        } else {
          const error: PluginMessage = {
            type: 'error',
            error: 'No frames selected. Please select at least one frame to extract.',
          };
          figma.ui.postMessage(error);
        }
      } catch (err) {
        const error: PluginMessage = {
          type: 'error',
          error: err instanceof Error ? err.message : 'Unknown error during extraction',
        };
        figma.ui.postMessage(error);
      }
      break;
    }

    case 'resize': {
      if (msg.width && msg.height) {
        figma.ui.resize(msg.width, msg.height);
      }
      break;
    }

    case 'close': {
      figma.closePlugin();
      break;
    }
  }
};
