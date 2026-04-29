import { useId, useMemo, useState } from "react";
import "./App.css";
import { DEFAULT_COLOR, createPalette, normalizeHexColor } from "./colorPalette";

export default function App() {
  const [baseColorInput, setBaseColorInput] = useState(DEFAULT_COLOR);
  const inputId = useId();
  const errorId = useId();

  const normalizedColor = useMemo(() => normalizeHexColor(baseColorInput), [baseColorInput]);
  const activeColor = normalizedColor ?? DEFAULT_COLOR;
  const hasValidationError = baseColorInput.trim().length > 0 && normalizedColor === null;
  const palette = useMemo(() => createPalette(activeColor), [activeColor]);

  return (
    <div className="app-shell">
      <main className="app-main">
        <header className="app-header">
          <h1>Colorhunting</h1>
          <p>Explore a balanced palette from a single hex color.</p>
        </header>

        <div className="controls">
          <div className="field">
            <label htmlFor={inputId}>Base color</label>
            <input
              id={inputId}
              aria-describedby={hasValidationError ? errorId : undefined}
              aria-invalid={hasValidationError ? "true" : undefined}
              inputMode="text"
              onChange={(event) => setBaseColorInput(event.currentTarget.value)}
              spellCheck="false"
              type="text"
              value={baseColorInput}
            />
            {hasValidationError ? (
              <p className="field-error" id={errorId} role="alert">
                Use a 3 or 6 digit hex color.
              </p>
            ) : null}
          </div>

          <input
            aria-label="Base color picker"
            className="color-picker"
            onChange={(event) => setBaseColorInput(event.currentTarget.value)}
            type="color"
            value={activeColor}
          />
        </div>

        <ul aria-label="Generated palette" className="palette-grid">
          {palette.map((color) => (
            <li className="swatch-card" key={color.id}>
              <div
                aria-hidden="true"
                className="swatch-preview"
                style={{ backgroundColor: color.hex }}
              />
              <div className="swatch-meta">
                <span>{color.label}</span>
                <code>{color.hex}</code>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
