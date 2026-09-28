// I'M FRIDGE — side machines: your own small red machines next to VEND-3 (the new park only).
// Two slots. Each opens with a research AND a number of fans this run (like Gnorp buildings need gnorps).
// Pick one machine per slot (each machine only once). They reset with the run, like everything in the Shop.
// cost(level) = base × grow^level (level 0 = picking it).  `fx`: per level, like machine upgrades.
// Effect keys: boost = +x% of ALL the money you earn (cans, drones, hardware, clicks) while the condition is true.
// Conditions (c): line_ge (people in your line), dayparts (list), weather.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

// The two slots, left and right of VEND-3 (positions: DATA.worlds[2].slots).
DATA.sideSlots = [
  { name: 'Left slot', research: 'r_permit1', fans: 150 },
  { name: 'Right slot', research: 'r_permit2', fans: 600 }
];

DATA.side = [
  { id: 'snack', name: 'Snack Machine', label: 'SNACK', base: 1000000, grow: 4, max: 5,
    desc: 'Chips and sandwiches next to your soda. Always: +5% of all your money per level.',
    short: 'Always',
    fx: [{ k: 'boost', v: 0.05 }],
    first: 'A snack machine. It is small and red and it is mine. I think it looks up to me.' },

  { id: 'claw', name: 'Claw Machine', label: 'CLAW', base: 1000000, grow: 4, max: 5,
    desc: 'People in your line play while they wait. While 3 or more people are in your line: +10% of all your money per level. Everyone waits 10% longer per level.',
    short: 'Busy line',
    fx: [{ k: 'boost', v: 0.10, c: { line_ge: 3 } }, { k: 'patience', v: 0.10 }],
    first: 'A claw machine. Nobody ever wins. It says that is not the point. I do not understand the point.' },

  { id: 'coffee', name: 'Coffee Machine', label: 'CAFE', base: 1000000, grow: 4, max: 5,
    desc: 'Hot coffee for the rush hours. In the morning and lunch rush: +12% of all your money per level, and 10% more people walk in per level.',
    short: 'Morning and lunch',
    fx: [{ k: 'boost', v: 0.12, c: { dayparts: ['morning', 'lunch'] } }, { k: 'traffic', v: 0.10, c: { dayparts: ['morning', 'lunch'] } }],
    first: 'A coffee machine. It is always tired. We get along.' },

  { id: 'ice', name: 'Ice Machine', label: 'ICE', base: 1000000, grow: 4, max: 5,
    desc: 'Bags of ice for hot days. On hot days: +18% of all your money per level, and your cans are 8% colder per level.',
    short: 'Hot days',
    fx: [{ k: 'boost', v: 0.18, c: { weather: 'hot' } }, { k: 'cold', v: 0.08, c: { weather: 'hot' } }],
    first: 'An ice machine. It is colder than me. I am trying not to be jealous.' }
];
