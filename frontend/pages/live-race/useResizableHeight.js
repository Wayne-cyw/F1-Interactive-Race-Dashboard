import { useCallback, useState } from 'react'

// Same idea as useResizableWidth, but drives a row's pixel height from a
// drag handle on its top or bottom edge. `edge: 'bottom'` (handle below the
// panel, dragging down grows it) is the common case for a panel stacked
// above other content.
export function useResizableHeight(initialHeight, { min = 60, max = 400, edge = 'bottom' } = {}) {
    const [height, setHeight] = useState(initialHeight)

    const onHandleMouseDown = useCallback((e) => {
        e.preventDefault()
        const startY = e.clientY
        const startHeight = height
        document.body.style.cursor = 'row-resize'
        document.body.style.userSelect = 'none'

        function onMouseMove(moveEvent) {
            const delta = moveEvent.clientY - startY
            const signedDelta = edge === 'bottom' ? delta : -delta
            setHeight(Math.min(max, Math.max(min, startHeight + signedDelta)))
        }
        function onMouseUp() {
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }, [height, min, max, edge])

    return [height, onHandleMouseDown]
}
