# Motion

Motion tokens are not part of the token file, so they live here. All motion is CSS, and all of it stops under `prefers-reduced-motion`.

| Name | Duration | Easing | Use |
| --- | --- | --- | --- |
| Rise | 900ms | `cubic-bezier(.2,.7,.2,1)` | Page-load reveal. Elements move up 28px and fade in, staggered by 150 to 200ms. |
| Lift | 250 to 350ms | `cubic-bezier(.2,.7,.2,1)` | Button and card hover. Buttons rise 3px, cards 8px. |
| Nudge | 250ms | `cubic-bezier(.2,.7,.2,1)` | The arrow inside a button moves 6px right on hover. |
| Pulse | 1.6s, loop | `ease-in-out` | Live dot: opacity 1 to .35 and scale 1 to .7. |
| Draw | 8s, loop | `cubic-bezier(.45,.05,.4,1)` | Telemetry traces draw across in the first 70% of the cycle, hold, then fade. A cursor line sweeps with them. |
| Marquee | 26s, loop | linear | Section ticker, moving left. |
| Lap line | 5s, loop | `cubic-bezier(.6,0,.4,1)` | A 2px red line travels along the bottom edge of the hero. |
| Start sequence | 6s, loop | linear steps | Five start lights come on at 0.5s intervals, go out together at 3.5s, and "Lights out." flashes. Progress fills over the same 6s. |

Rules: one orchestrated moment per screen (the load reveal or the start sequence), ambient loops kept quiet, and never animate layout properties. Use `transform` and `opacity`.
