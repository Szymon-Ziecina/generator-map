/**
 * Entry point for the application: initializes and exposes the Map editor.
 */
import "./main.css";
import Map from "./ts/map";

/**
 * Global instance of the Map editor, accessible via window.map in the browser console.
 */
const map = new Map();
(window as any).map = map;
