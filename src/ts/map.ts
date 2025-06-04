/**
 * @module Map
 * Implements a grid-based map editor with sprite selection, drawing, copy/paste, undo/redo,
 * and file import/export functionality.
 */
import sprites from "@/assets/sprites.png";

/**
 * Implements a grid-based map editor with sprite palette, selection rectangle,
 * drawing, copy/cut/paste, undo/redo, and import/export functionality.
 */
export default class Map implements MapClass {
  /** HTML container for the map grid */
  private readonly map: HTMLDivElement = document.querySelector("#map");
  /** Number of columns in the map grid */
  private readonly mapColsCount: number = 100;
  /** Number of rows in the map grid */
  private readonly mapRowsCount: number = 50;

  /** Path to the compiled sprite sheet image asset */
  private readonly sprites: string = sprites;
  /** Number of columns in the sprite sheet */
  private readonly spritesColsCount: number = 16;
  /** Number of rows in the sprite sheet */
  private readonly spritesRowsCount: number = 40;
  /** Size in pixels of the border between sprites in the sheet */
  private readonly spriteBorderSize: number = 1;
  /** Size in pixels of each sprite square */
  private readonly spriteSize: number = 47;
  /** HTML container for displaying sprite palette */
  private readonly board: HTMLDivElement = document.querySelector("#sprites");

  /** Visual indicator for click-and-drag selection */
  private selectIndicator: HTMLDivElement =
    document.querySelector("#select-indicator");
  /** Currently selected tiles within the map grid */
  private selectedTiles: HTMLDivElement[] = [];
  /** Indicates whether mouse button is held down during drag selection */
  private mouseDown: boolean = false;
  /** Indicates whether Ctrl or Cmd key is held during multi-select */
  private ctrlDown: boolean = false;
  /** Current mouse position within the map container */
  private mousePosition: Position2D = { x: 0, y: 0 };
  /** Mouse position at the start of drag selection */
  private dragStartPosition: Position2D | null = null;
  /** Mouse position at the end of drag selection */
  private dragEndPosition: Position2D | null = null;

  /** Checkbox input for enabling auto-advance after drawing */
  private readonly autoCheckbox: HTMLInputElement =
    document.querySelector("#auto-checkbox");
  /** Flag for whether auto-advance is enabled */
  private isAutoEnabled: boolean = false;

  /** Custom context menu container for map actions */
  private readonly contextMenu: HTMLDivElement =
    document.querySelector("#context-menu");
  /** Items to display in the context menu */
  private readonly contextMenuItems: ContextMenuItem[] = [
    { label: "Save", callback: () => this.saveToFile() },
    { label: "Load", callback: () => this.fileInput.click() },
  ];

  /** Hidden file input for loading map JSON files */
  private readonly fileInput: HTMLInputElement =
    document.querySelector("#file-input");

  /** Backing store for copy/cut tile elements */
  private coppiedTiles: HTMLDivElement[] = [];
  /** Last tile hovered under cursor (anchor for paste) */
  private tileUnderCoursor: HTMLDivElement;
  /** State snapshot before pasting tiles */
  private beforePasteState: HTMLDivElement[] = [];
  /** Data for copied tiles used during paste operation */
  private coppiedTileData: {
    row: number;
    col: number;
    bg: string;
    bgPos: string;
  }[] = [];

  /** History stack of tile states for undo/redo operations */
  private history: { row: number; col: number; bg: string; bgPos: string }[][] =
    [];
  /** Index pointer for current position within history stack */
  private currentHistoryIndex: number = 0;

  /**
   * Initializes the map editor: builds sprite palette and map grid.
   */
  constructor() {
    this.init();
    this.bindEvents();
  }

  /**
   * Populates the sprite selection board and map grid elements.
   */
  init() {
    // Build sprite palette
    for (let i = 0; i < this.spritesRowsCount; i++) {
      for (let j = 0; j < this.spritesColsCount; j++) {
        const sprite = document.createElement("div");
        const spritePosition = `-${
          this.spriteBorderSize * (j + 1) + this.spriteSize * j
        }px -${this.spriteBorderSize * (i + 1) + this.spriteSize * i}px`;
        sprite.classList.add("sprite");
        sprite.style.background = `url(${this.sprites})`;
        sprite.style.backgroundPosition = spritePosition;
        sprite.onclick = () => {
          this.drawMap(spritePosition);
        };

        this.board.appendChild(sprite);
      }
    }

    // Configure map grid layout
    this.map.style.gridTemplateColumns = `repeat(${this.mapColsCount}, 1fr)`;
    this.map.style.gridTemplateRows = `repeat(${this.mapRowsCount}, 1fr)`;

    // Create map tiles
    for (let i = 0; i < this.mapRowsCount; i++) {
      for (let j = 0; j < this.mapColsCount; j++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.setAttribute("data-col", j.toString());
        tile.setAttribute("data-row", i.toString());
        tile.addEventListener("mouseover", () => {
          this.tileUnderCoursor = tile;
          if (!this.beforePasteState || this.beforePasteState.length === 0)
            return;

          const matchingTile = this.beforePasteState.find(
            (t) =>
              t.getAttribute("data-row") === i.toString() &&
              t.getAttribute("data-col") === j.toString()
          );

          if (matchingTile) {
            tile.style.background = matchingTile.style.background;
          }
        });
        this.map.appendChild(tile);
      }
    }
  }

  /**
   * Attaches event handlers for map interaction: selection, drawing, keyboard shortcuts, and context menu.
   */
  bindEvents() {
    this.map.addEventListener("mousemove", (e) => {
      const bound = this.map.getBoundingClientRect();
      this.mousePosition = {
        x: e.clientX - bound.left,
        y: e.clientY - bound.top,
      };

      if (this.mouseDown) {
        const left = Math.min(this.dragStartPosition.x, this.mousePosition.x);
        const top = Math.min(this.dragStartPosition.y, this.mousePosition.y);
        const width = Math.abs(this.mousePosition.x - this.dragStartPosition.x);
        const height = Math.abs(
          this.mousePosition.y - this.dragStartPosition.y
        );

        this.selectIndicator.style.left = `${left}px`;
        this.selectIndicator.style.top = `${top}px`;
        this.selectIndicator.style.width = `${width}px`;
        this.selectIndicator.style.height = `${height}px`;
        this.selectIndicator.style.display = "block";

        this.selectTiles(true);
      }
    });

    this.map.addEventListener("mousedown", () => {
      document.querySelectorAll(".selected").forEach((tile: HTMLDivElement) => {
        if (
          !this.selectedTiles.includes(tile) &&
          tile.classList.contains("selected")
        )
          tile.classList.remove("selected");
      });

      if (!this.ctrlDown) this.selectedTiles = [];
      this.dragStartPosition = this.mousePosition;
      this.mouseDown = true;
    });

    this.map.addEventListener("mouseup", () => {
      this.dragEndPosition = this.mousePosition;
      this.mouseDown = false;
      this.selectIndicator.style.display = "none";
      this.selectTiles();
    });

    this.autoCheckbox.addEventListener("change", () => {
      this.isAutoEnabled = this.autoCheckbox.checked;
    });

    document.body.addEventListener("keydown", (e) => {
      if (e.key == "Delete") {
        this.selectedTiles.forEach((tile) => {
          tile.style.background = "transparent";
          tile.classList.remove("selected");
        });
        this.selectedTiles = [];
        this.addToHistory();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        this.copySelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "x") {
        e.preventDefault();
        this.cutSelected();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        e.preventDefault();
        this.paste();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      } else if (e.metaKey || e.ctrlKey) this.ctrlDown = true;
    });

    document.body.addEventListener("keyup", (e) => {
      if (!e.metaKey || !e.ctrlKey) {
        this.ctrlDown = false;
      }
    });

    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    this.map.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.contextMenu.innerHTML = null;
      this.contextMenuItems.forEach(({ label, callback }) => {
        const menuItem = document.createElement("div");
        menuItem.textContent = label;
        menuItem.classList.add("context-menu-item");
        menuItem.onclick = callback;
        this.contextMenu.appendChild(menuItem);
      });
      this.contextMenu.style.display = "block";
      this.contextMenu.style.top = `${this.mousePosition.y}px`;
      this.contextMenu.style.left = `${this.mousePosition.x}px`;
    });

    document.addEventListener("click", (e) => {
      this.contextMenu.style.display = "none";
    });

    this.fileInput.addEventListener("change", (e) => {
      this.loadMapFromFile((e.target as HTMLInputElement).files[0]);
    });
  }

  /**
   * Highlights tiles within the current drag selection rectangle.
   * @param selecting - If true, updates selection in real time without finalizing.
   */
  selectTiles(selecting?: boolean) {
    if (selecting) this.dragEndPosition = this.mousePosition;

    if (!this.dragStartPosition || !this.dragEndPosition) return;

    if (!this.ctrlDown) this.selectedTiles = [];

    const selectionBounds = {
      left: Math.min(this.dragStartPosition.x, this.dragEndPosition.x),
      right: Math.max(this.dragStartPosition.x, this.dragEndPosition.x),
      top: Math.min(this.dragStartPosition.y, this.dragEndPosition.y),
      bottom: Math.max(this.dragStartPosition.y, this.dragEndPosition.y),
    };

    const tiles = this.map.querySelectorAll(".tile");
    tiles.forEach((tile: HTMLDivElement) => {
      const bound = tile.getBoundingClientRect();
      const mapBound = this.map.getBoundingClientRect();
      const tilePosition = {
        left: bound.left - mapBound.left,
        right: bound.right - mapBound.left,
        top: bound.top - mapBound.top,
        bottom: bound.bottom - mapBound.top,
      };

      if (
        !this.selectedTiles.includes(tile) &&
        tile.classList.contains("selected")
      )
        tile.classList.remove("selected");

      if (
        tilePosition.left < selectionBounds.right &&
        tilePosition.right > selectionBounds.left &&
        tilePosition.top < selectionBounds.bottom &&
        tilePosition.bottom > selectionBounds.top
      ) {
        tile.classList.add("selected");
        if (!selecting) this.selectedTiles.push(tile);
      }
    });
  }

  /**
   * Applies the selected sprite background to all currently selected tiles.
   * @param sprite - CSS background-position string of the chosen sprite.
   */
  drawMap(sprite: string) {
    if (this.selectedTiles.length <= 0) return;

    this.selectedTiles
      .sort((a, b) => {
        const rowA = parseInt(a.getAttribute("data-row"));
        const colA = parseInt(a.getAttribute("data-col"));
        const rowB = parseInt(b.getAttribute("data-row"));
        const colB = parseInt(b.getAttribute("data-col"));
        if (rowA < rowB) return -1;
        if (rowA > rowB) return 1;
        if (colA < colB) return -1;
        if (colA > colB) return 1;
        return 0;
      })
      .forEach((tile: HTMLDivElement) => {
        tile.style.background = `url(${this.sprites})`;
        tile.style.backgroundPosition = sprite;
        tile.classList.remove("selected");
      });

    if (this.isAutoEnabled) this.selectNextTile();
    else this.selectedTiles = [];
    this.addToHistory();
  }

  /**
   * Selects the next tile in linear order when auto-advance is enabled.
   */
  selectNextTile() {
    const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
    const lastTilePositions = {
      col: parseInt(lastTile.getAttribute("data-col")),
      row: parseInt(lastTile.getAttribute("data-row")),
    };
    let newTile: HTMLDivElement;
    if (lastTilePositions.col >= this.mapColsCount - 1)
      newTile = document.querySelector(
        `div[data-col="0"][data-row="${lastTilePositions.row + 1}"]`
      );
    else
      newTile = document.querySelector(
        `div[data-col="${lastTilePositions.col + 1}"][data-row="${
          lastTilePositions.row
        }"]`
      );

    this.selectedTiles = [];

    if (
      !(
        lastTilePositions.col >= this.mapColsCount - 1 &&
        lastTilePositions.row >= this.mapRowsCount - 1
      )
    ) {
      newTile.classList.add("selected");
      this.selectedTiles.push(newTile);
    }
  }

  /**
   * Triggers download of the current map state as a JSON file.
   */
  saveToFile() {
    const data = JSON.stringify(this.createMapJSON());
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "hidden";
    a.href = url;
    a.download = "Mapa.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a JSON-serializable representation of the current map state.
   * @returns Array of tile data for export.
   */
  createMapJSON() {
    const tiles = Array.from(document.querySelectorAll(".tile"));
    const tilesJSON: ExportTile[] = [];

    tiles.forEach((tile, index) => {
      const computedStyle = window.getComputedStyle(tile);
      const col = tile.getAttribute("data-col");
      const row = tile.getAttribute("data-row");

      tilesJSON.push({
        id: index,
        bgPosition: computedStyle.backgroundPosition,
        col,
        row,
      });
    });

    return tilesJSON;
  }

  /**
   * Loads a map state from a user-selected JSON file and applies it to the grid.
   * @param file - JSON file containing an array of exported tile data.
   */
  loadMapFromFile(file: File) {
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = () => {
      const mapData: ExportTile[] = JSON.parse(reader.result as string);
      mapData.forEach((tileData) => {
        const tile = document.querySelector(
          `.tile[data-col="${tileData.col}"][data-row="${tileData.row}"]`
        ) as HTMLDivElement;

        if (tile && tileData.bgPosition !== "0% 0%") {
          tile.style.background = `url(${this.sprites})`;
          tile.style.backgroundPosition = tileData.bgPosition;
        }
      });
    };
  }

  /**
   * Copies the currently selected tiles into an internal buffer.
   */
  copySelected() {
    this.coppiedTiles = [...this.selectedTiles];
    this.coppiedTileData = this.selectedTiles.map((tile) => ({
      row: parseInt(tile.getAttribute("data-row")),
      col: parseInt(tile.getAttribute("data-col")),
      bg: tile.style.background,
      bgPos: tile.style.backgroundPosition,
    }));
    this.coppiedTiles.forEach((tile) => tile.classList.remove("selected"));
  }

  /**
   * Cuts the currently selected tiles (copy + clear backgrounds) and adds to history.
   */
  cutSelected() {
    this.copySelected();
    this.selectedTiles.forEach((tile) => {
      tile.style.background = "transparent";
    });
    this.addToHistory();
  }

  /**
   * Pastes previously copied tiles at the current cursor location and records history.
   */
  paste() {
    if (!this.coppiedTileData || this.coppiedTileData.length === 0) return;

    const anchorTile = this.tileUnderCoursor;
    if (!anchorTile) return;

    const anchorRow = parseInt(anchorTile.getAttribute("data-row"));
    const anchorCol = parseInt(anchorTile.getAttribute("data-col"));

    const refRow = this.coppiedTileData[0].row;
    const refCol = this.coppiedTileData[0].col;

    this.coppiedTileData.forEach((data) => {
      const rd = data.row - refRow;
      const cd = data.col - refCol;
      const targetRow = anchorRow + rd;
      const targetCol = anchorCol + cd;

      const targetTile = document.querySelector(
        `div.tile[data-row="${targetRow}"][data-col="${targetCol}"]`
      ) as HTMLDivElement;

      if (targetTile) {
        targetTile.style.background = data.bg;
        targetTile.style.backgroundPosition = data.bgPos;
      }
    });
    this.addToHistory();
  }

  /**
   * Records the current tile backgrounds into the undo/redo history stack.
   */
  addToHistory() {
    // Remove redo history if we are not at the end
    this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    const tilesState = Array.from(document.querySelectorAll("div.tile")).map(
      (tile) => ({
        row: parseInt(tile.getAttribute("data-row")),
        col: parseInt(tile.getAttribute("data-col")),
        bg: (tile as HTMLDivElement).style.background,
        bgPos: (tile as HTMLDivElement).style.backgroundPosition,
      })
    );
    this.history.push(tilesState);
    this.currentHistoryIndex = this.history.length - 1;
  }

  /**
   * Restores the map to a specific state from the history stack.
   * @param index - Index of the history entry to restore.
   */
  restoreFromHistory(index: number) {
    const state = this.history[index];
    state.forEach((data) => {
      const tile = document.querySelector(
        `.tile[data-row="${data.row}"][data-col="${data.col}"]`
      ) as HTMLDivElement;
      if (tile) {
        tile.style.background = data.bg;
        tile.style.backgroundPosition = data.bgPos;
      }
    });
  }

  /**
   * Undoes the last map modification by stepping back in history.
   */
  undo() {
    if (this.currentHistoryIndex <= 0) return;
    this.currentHistoryIndex--;
    this.restoreFromHistory(this.currentHistoryIndex);
  }

  /**
   * Redoes the last undone map modification by stepping forward in history.
   */
  redo() {
    if (this.currentHistoryIndex >= this.history.length - 1) return;
    this.currentHistoryIndex++;
    this.restoreFromHistory(this.currentHistoryIndex);
  }
}
