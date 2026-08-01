import { useState } from 'react'

// A draggable divider between two panels. Wider invisible hit-area (10px)
// than the visible line (2px) so it's easy to grab without needing pixel
// precision, matching common split-panel resizers (e.g. VS Code).
// `orientation="vertical"` (default) is a column divider dragged left/right;
// `orientation="horizontal"` is a row divider dragged up/down.
export default function ResizeHandle({ onMouseDown, orientation = 'vertical', size = 10 }) {
    const [hover, setHover] = useState(false)
    const isVertical = orientation === 'vertical'
    const lineOffset = (size - 2) / 2

    return (
        <div
            onMouseDown={onMouseDown}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                cursor: isVertical ? 'col-resize' : 'row-resize',
                position: 'relative',
                zIndex: 1,
                width: isVertical ? size : '100%',
                height: isVertical ? '100%' : size,
                flexShrink: 0,
            }}
        >
            <div
                style={
                    isVertical
                        ? {
                            position: 'absolute', top: 0, bottom: 0, left: lineOffset, width: 2, borderRadius: 10,
                            background: hover ? '#a8a49b' : '#e6e3dc', transition: 'background 0.15s',
                        }
                        : {
                            position: 'absolute', left: 0, right: 0, top: lineOffset, height: 2, borderRadius: 10,
                            background: hover ? '#a8a49b' : '#e6e3dc', transition: 'background 0.15s',
                        }
                }
            />
        </div>
    )
}
