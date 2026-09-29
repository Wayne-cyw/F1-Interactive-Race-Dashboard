# StartLights

The loading indicator: five lights that come on in order, go out together, then release the dashboard.

Lights sit in a `radius-xl` housing on `surface-100`. An unlit light is `light-off`; a lit light is `brand` with a soft glow of the same color. They come on at 0.5s intervals, go out together at 3.5s of a 6s loop, and "Lights out." flashes in display type. A 6px `surface-200` track fills with `brand` over the same cycle, with a mono percentage and a status line beneath it. Status text says what is happening in plain words. Keep the housing centered, use it as the only large moving element, and show three lit lights under reduced motion.
