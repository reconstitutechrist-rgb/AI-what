# AI App Builder - Figma Plugin

A Figma plugin that extracts design tokens and layout structure from Figma files and sends them to the AI App Builder.

## Setup

1. Install dependencies:

   ```bash
   cd figma-plugin
   npm install
   ```

2. Build the plugin:

   ```bash
   npm run build
   ```

3. Load in Figma:
   - Open Figma Desktop
   - Go to Plugins → Development → Import plugin from manifest
   - Select `figma-plugin/manifest.json`

## Development

Watch mode (rebuilds on file changes):

```bash
npm run watch
```

Type checking:

```bash
npm run typecheck
```

## Usage

1. Select a frame in Figma
2. Run the plugin (Plugins → Development → AI App Builder Sync)
3. Click "Extract Design" to analyze the selection
4. Review the extracted colors, fonts, and layout
5. Click "Send to AI App Builder" to import into the app

## What Gets Extracted

- **Colors**: Fill colors, stroke colors, text colors, background colors
- **Typography**: Font families, weights, sizes, line heights
- **Spacing**: Auto-layout gaps, padding values
- **Effects**: Shadows, blur, corner radius
- **Components**: Header, sidebar, footer, cards, navigation (inferred from names/structure)

## Architecture

```
src/
├── code.ts          # Main plugin code (Figma sandbox)
├── ui.tsx           # Plugin UI (React)
├── extractors/      # Design data extraction
│   ├── colorExtractor.ts
│   ├── typographyExtractor.ts
│   ├── spacingExtractor.ts
│   └── componentExtractor.ts
├── api/
│   └── client.ts    # API client for web app
└── types/
    └── figma-data.ts
```

## API Endpoints

The plugin communicates with these endpoints:

- `POST /api/figma/import` - Send extracted design data
- `GET /api/health` - Check if server is online

## Notes

- The plugin requires the AI App Builder to be running locally (default: http://localhost:3000)
- For production, update `manifest.json` with your production domain
