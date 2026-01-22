# AGENTS.md

## Project Overview
This is a vanilla JavaScript tank temperature logger with HTML/CSS/JS. No build tools, frameworks, or external dependencies. Direct browser execution.

## Development Commands
This project has no build, lint, or test commands. It's a static HTML/CSS/JS application.
- Run locally: Open `index.html` in a browser or use a local server
- No package.json, npm, or build process

## Code Style Guidelines

### Imports & Modules
- No ES modules or imports used - plain vanilla JavaScript
- Single file approach with all code in `app.js`
- Script loaded via `<script src="app.js"></script>` in HTML

### Formatting
- **Indentation**: 2 spaces
- **Spacing**: Space around operators, after commas, before/after braces
- **Line length**: Keep reasonable, break long lines for readability
- **Blank lines**: One blank line between functions for separation

### Naming Conventions
- **Constants**: UPPER_SNAKE_CASE (POSITIONS, DEPTHS, STORAGE_KEY)
- **Variables/Functions**: camelCase (currentDepth, readRanges, statusForValue)
- **DOM IDs**: snake_case (topMin, topMax, botMin, tempTableBody)
- **CSS classes**: kebab-case (tank-rect, marker-dot, seg-btn)
- **CSS variables**: kebab-case with -- prefix (--ok, --out, --empty)

### Constants
- Define constants at top of file with const
- Group related constants together
- Use descriptive names that explain their purpose

### Functions
- camelCase names that describe what they do (not how)
- Pure functions preferred where possible (no side effects)
- Keep functions focused on single responsibility
- Use early returns to reduce nesting

### Error Handling
- Use try-catch for localStorage operations (lines 189-198)
- Return fallback values (empty arrays) instead of throwing for user-facing operations
- Use `clampNum` helper for number validation (returns null for invalid)
- Don't show alerts for data validation - use UI indicators instead

### DOM Manipulation
- Cache DOM references in an `els` object at initialization
- Use `getElementById` and `querySelector` for selecting
- Build DOM elements programmatically with `createElement`
- Use `classList` methods for class manipulation (add, remove, toggle)
- Attach event listeners with `addEventListener`, prefer arrow functions

### Data Structures
- Use objects for structured data with keys (positions, depths)
- Use arrays for ordered collections
- Null/undefined for missing values, not empty strings or 0
- Use localStorage with JSON serialization

### Comments
- Minimal functional comments, prefer self-documenting code
- Use inline comments only when logic is non-obvious
- Block comments at top explain overall purpose (lines 1-7)

### CSS Style
- Use CSS custom properties (variables) for theming in `:root`
- Group related styles together
- Mobile-first responsive design with @media queries
- Use semantic class names that describe purpose, not appearance

### Accessibility
- Use semantic HTML (header, main, section)
- Include ARIA attributes where appropriate (role, aria-label)
- Provide visual and semantic alternatives (text + color)

### Number Handling
- Use `parseFloat` for user input, `toFixed(1)` for display
- Use `Number.isFinite()` for validation
- Null for invalid/empty numeric values, not NaN
- Step attribute "0.1" for decimal precision in inputs

### TypeScript
- No TypeScript used - plain JavaScript
- No type annotations or interfaces
- Use JSDoc-style comments if documentation is needed (currently minimal)

### CSV Export
- Use double-quote escaping for values containing commas, quotes, or newlines
- Handle null/undefined as empty strings in CSV
- Include header row with descriptive column names
