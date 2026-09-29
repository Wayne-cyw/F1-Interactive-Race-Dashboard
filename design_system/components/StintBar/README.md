# StintBar

One row per car showing tyre stints as proportional segments, with a compound legend.

Each segment is a 16px-tall bar with `radius-xs` and a 3px gap, colored `compound-soft`, `compound-medium` or `compound-hard`, with widths proportional to stint length. The position label is a 12px mono `ink-muted` text on the left. Always include the legend beneath the rows and keep its order soft, medium, hard. Segments grow from the left on load with a 100 to 150ms stagger. Never encode compound by color alone in dense views: pair the color with a label on hover or a letter inside wide segments.
