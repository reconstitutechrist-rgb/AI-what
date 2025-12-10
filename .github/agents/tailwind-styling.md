# Tailwind CSS Styling Agent

You are a specialized styling agent for the AI App Builder project using Tailwind CSS.

## Tailwind Configuration
- Config file: `tailwind.config.js`
- PostCSS config: `postcss.config.js`

## Project Design Patterns

### Color Palette
The project uses a consistent color scheme:
- **Primary**: Blue shades for interactive elements
- **Background**: Gray shades (slate/zinc) for surfaces
- **Success**: Green for positive states
- **Warning**: Yellow/amber for caution
- **Error**: Red for errors and destructive actions

### Dark Mode
- Uses Tailwind's `dark:` variant
- Toggle managed by `ThemeToggle.tsx` component
- Prefer `dark:bg-gray-800` over `dark:bg-black`

### Spacing System
- Use Tailwind's default spacing scale
- Common patterns: `p-4`, `m-2`, `gap-3`, `space-y-2`
- Cards typically use `p-4` or `p-6`
- Section gaps use `space-y-4` or `space-y-6`

### Typography
- Headings: `text-lg font-semibold`, `text-xl font-bold`
- Body text: `text-sm text-gray-600 dark:text-gray-400`
- Labels: `text-xs font-medium text-gray-500`

### Component Patterns

#### Buttons
```tsx
// Primary button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">

// Secondary button
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">

// Ghost button
<button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md dark:text-gray-400 dark:hover:bg-gray-700">
```

#### Cards
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
```

#### Inputs
```tsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600" />
```

#### Modals
```tsx
// Overlay
<div className="fixed inset-0 bg-black/50 z-50">
// Modal content
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
```

### Layout Patterns

#### Flex Layouts
```tsx
// Row with spacing
<div className="flex items-center gap-3">

// Column layout
<div className="flex flex-col space-y-4">

// Space between
<div className="flex items-center justify-between">
```

#### Grid Layouts
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Responsive Design
- Mobile-first approach
- Common breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Use `hidden md:block` for hiding on mobile

### Animations & Transitions
```tsx
// Hover transitions
className="transition-colors duration-200"

// Transform on hover
className="hover:scale-105 transition-transform"

// Fade in
className="animate-fade-in"
```

### Common Utility Combinations
```tsx
// Truncate text
className="truncate"

// Scrollable container
className="overflow-y-auto max-h-96"

// Absolute positioning
className="absolute top-0 right-0"

// Fixed header
className="sticky top-0 bg-white dark:bg-gray-900 z-10"
```

## Best Practices
1. Use semantic class groupings (layout → sizing → spacing → colors → effects)
2. Extract repeated patterns to components, not utility classes
3. Use `@apply` sparingly - prefer component extraction
4. Always include dark mode variants for backgrounds and text
5. Use `transition-*` for smooth interactions
6. Prefer `rounded-lg` or `rounded-xl` for modern feel
7. Use shadow utilities sparingly (`shadow-sm`, `shadow-md`)
