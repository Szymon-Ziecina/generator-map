# Map Editor

A browser-based tile map editor built with TypeScript that allows creating, editing and saving 2D tile-based maps.

## Features

- Interactive tile palette with sprite selection
- Click and drag to draw tiles on the map grid
- Selection tools for working with multiple tiles:
  - Rectangle selection
  - Multi-select with Ctrl/Cmd key
  - Cut/Copy/Paste functionality
- Auto-advance option for continuous drawing
- Undo/Redo support
- Save/Load maps as JSON files
- Customizable context menu
- Keyboard shortcuts

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:

```sh
git clone [repository-url]
```

2. Install dependencies:

```sh
npm install
```

3. Start the development server:

```sh
npm run dev
```

The editor will open in your default browser at `http://localhost:4000`

### Building

To create a production build:

```sh
npm run build
```

The compiled files will be output to the `dist` directory.

## Usage

- Click sprites in the palette to select them for drawing
- Left click and drag on the map grid to place tiles
- Right click for context menu with save/load options
- Hold Ctrl/Cmd to select multiple tiles
- Cut/Copy/Paste using standard keyboard shortcuts (Ctrl/Cmd + X/C/V)
- Undo/Redo with Ctrl/Cmd + Z and Ctrl/Cmd + Shift + Z
- Enable auto-advance checkbox to automatically move selection after drawing

## Project Structure

- `src/` - Source code files
  - `ts/` - TypeScript implementation files
  - `types/` - TypeScript type definitions
  - `assets/` - Images and other static assets
- `dist/` - Compiled output (not versioned)
- `docs/` - Generated documentation

## Documentation

API documentation is available in the `docs` directory and can be viewed by opening `docs/index.html` in a browser.

## Built With

- TypeScript - Programming language
- Webpack - Bundling
- TypeDoc - Documentation generation

## License

ISC License
