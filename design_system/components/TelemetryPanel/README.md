# TelemetryPanel

A floating `surface-100` panel that holds a labelled chart, used for the hero circuit and for lap comparison.

The panel uses `radius-lg`, a 1px `line` border, `space-5` padding and the single `shadow-panel`. Its header is an uppercase mono label on the left and a live tag on the right. Traces are 2.5px round-capped strokes: Driver A in `data-a`, Driver B in `data-b`, over 1px `line` gridlines. Traces draw across in the first 70% of an 8s loop and fade; stagger the second series by 120ms. Always add a legend below the chart and an `aria-label` on the SVG. Use one shadowed panel per screen. Under reduced motion, show the traces fully drawn.
