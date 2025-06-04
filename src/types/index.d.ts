/**
 * @packageDocumentation
 * Types definitions for Map editor module.
 */

/**
 * Interface defining the public API of the Map editor.
 */
interface MapClass {
  /**
   * Initializes sprite palette and map grid, binding necessary DOM elements.
   */
  init(): void;

  /**
   * Fills selected map tiles with the sprite at the given CSS background-position.
   * @param sprite - CSS background-position string (e.g., "-48px -96px").
   */
  drawMap(sprite: string): void;

  /**
   * Attaches event listeners for selection, drawing, keyboard shortcuts, and context menu.
   */
  bindEvents(): void;

  /**
   * Highlights or finalizes selection of tiles within the current drag rectangle.
   * @param selecting - If true, updates selection in real-time without finalizing.
   */
  selectTiles(selecting?: boolean): void;

  /**
   * Advances selection to the next tile when auto-advance is enabled.
   */
  selectNextTile(): void;

  /**
   * Triggers download of the current map state as a JSON file.
   */
  saveToFile(): void;

  /**
   * Generates a JSON-serializable structure of all tiles for export.
   * @returns Array of tile data objects.
   */
  createMapJSON(): ExportTile[];

  /**
   * Loads a map state from a JSON file and applies it to the grid.
   * @param file - JSON file selected by the user.
   */
  loadMapFromFile(file: File): void;

  /**
   * Copies currently selected tiles into an internal buffer for later pasting.
   */
  copySelected(): void;

  /**
   * Cuts currently selected tiles (copy + clear backgrounds) and records history.
   */
  cutSelected(): void;

  /**
   * Pastes previously copied tiles at the cursor's current tile and records history.
   */
  paste(): void;

  /**
   * Records the current map state into the undo/redo history stack.
   */
  addToHistory(): void;

  /**
   * Restores the map to a specific state from the history stack.
   * @param index - History index to restore.
   */
  restoreFromHistory(index: number): void;

  /**
   * Undoes the last change by stepping back in the history stack.
   */
  undo(): void;

  /**
   * Redoes the last undone change by stepping forward in the history stack.
   */
  redo(): void;
}

/**
 * Represents a menu item in the custom context menu.
 */
interface ContextMenuItem {
  /** Label displayed in the context menu */
  label: string;
  /** Callback invoked when the menu item is selected */
  callback: () => void;
}

/**
 * JSON-serializable representation of a single map tile.
 */
interface ExportTile {
  /** Unique identifier for the tile within the export sequence */
  id: number;
  /** CSS background-position value for the sprite image */
  bgPosition: string;
  /** Column index of the tile on the map grid */
  col: string;
  /** Row index of the tile on the map grid */
  row: string;
}

/**
 * Two-dimensional pixel position within the map container.
 */
interface Position2D {
  /** X-coordinate in pixels within the map container */
  x: number;
  /** Y-coordinate in pixels within the map container */
  y: number;
}
