// I'M FRIDGE — machine upgrades. Bought with money, lost when you are reset.
// Most of them must be unlocked by research first. In the Shop, every level shows as its own icon.
// cost(level) = base × grow^level. `max` = highest level.
// `research`: this upgrade only appears after that research project is done.
// `first`: a line said the first time you ever buy it.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.machine = [
  { id: 'slots', name: 'Bigger Slots', base: 1500, grow: 1.6, max: 10, icon: 'slots',
    desc: '+3 cans per drink. You need to restock less often.',
    fx: [{ k: 'cap', v: 3 }],
    first: 'More room inside. It feels like stretching. Machines do not stretch.' },

  { id: 'coin', name: 'Fast Coin Slot', base: 1800, grow: 1.6, max: 8, icon: 'coin', research: 'r_coin',
    desc: 'Sell each can 15% faster. Your line moves quicker.',
    fx: [{ k: 'vend', v: 0.15 }],
    first: 'Clink. Clink. Clink. Faster now.' },

  { id: 'cool', name: 'Better Cooling', base: 2000, grow: 1.7, max: 8, icon: 'cool', research: 'r_cool',
    desc: '+8% cold bonus. Matters most on hot days.',
    fx: [{ k: 'cold', v: 0.08 }],
    first: 'Brr. Customers love it. I think I do too.' },

  { id: 'sign', name: 'LED Sign', base: 2500, grow: 1.75, max: 10, icon: 'sign', research: 'r_sign',
    desc: '+12% appeal. Walk-in customers notice you more.',
    fx: [{ k: 'appeal', v: 0.12 }],
    first: 'My name, in lights. VEND-3. It looks right. It also looks wrong.' },

  { id: 'carpet', name: 'Comfy Carpet', base: 5000, grow: 1.7, max: 5, icon: 'carpet', research: 'r_carpet',
    desc: 'Your line holds more people, and they wait 10% longer. Your line starts at half size.',
    fx: [{ k: 'queue', v: 0.1 }, { k: 'patience', v: 0.1 }],
    first: 'A carpet. For them to stand on. For me. I think I care about their feet now.' },

  { id: 'tubes', name: 'Pneumatic Tubes', base: 6000, grow: 2.2, max: 5, icon: 'tube', research: 'r_autorestock',
    desc: 'Pipes refill your machine by themselves, one can at a time (you still pay for the cans). Every level is faster.',
    fx: [{ k: 'tubes', v: 1 }],
    first: 'Thunk. A can. Thunk. Another can. I did not click anything. I love it.' },

  { id: 'grape', name: 'New Flavor: Grape', base: 6000, grow: 1, max: 1, icon: 'grape', research: 'r_grape',
    desc: 'Adds Grape. The other machines do not sell it. Kids love it.',
    fx: [{ k: 'drink', v: 'grape' }],
    first: 'Grape. Purple. Somebody used to love this. I think it was me.' },

  { id: 'dispenser2', name: 'Second Dispenser', base: 25000, grow: 1, max: 1, icon: 'dispenser', research: 'r_dispenser',
    desc: 'Serve two customers at the same time.',
    fx: [{ k: 'lanes', v: 1 }],
    first: 'Two mouths. Double the soda. Please do not think about it too hard.' },

  { id: 'smartprice', name: 'Smart Price', base: 15000, grow: 1, max: 1, icon: 'chip', research: 'r_smartprice',
    desc: 'Every hour, sets your price to the average price of the other machines. You can turn it off.',
    fx: [{ k: 'smartPrice', v: 1 }],
    first: 'Now I do math about people. Fun.' }
];
