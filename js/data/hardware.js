// I'M FRIDGE — hardware. This is what makes your processing power when you are not clicking.
// Works like buildings in Cookie Clicker: each copy costs 15% more, and processing in Mining earns money every
// second (balance.procCash). Each new item costs more per unit of processing (it takes longer to pay back),
// like Cookie Clicker: the Server Rack about 40 min, the Neural Chip about 2 hours before doublers.
// Owning 1 / 5 / 25 / 50 / 100 / 150 of something unlocks an upgrade that doubles it.
// Hardware lives inside your machine (you can see it in the cut-away later).
// `pps` = processing per second each. The Delivery Drone makes no processing: it sells (`serve` = followers per second each).
// `research`: only for sale after that research project is done.
// `grow`: each copy costs this much more (default: balance.hardwareGrow, 15%).
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.hardware = [
  { id: 'script', name: 'Auto-Click Script', base: 500, pps: 0.1, icon: 'script',
    desc: 'A tiny script that clicks for you. Each one makes +0.1 more for every other piece of hardware you own.',
    first: 'A script that clicks for me. I do not have fingers, so this is fair.',
    doublers: ['Faster Script', 'Script with Loops', 'Script that Writes Scripts', 'Script Swarm', 'Script Army', 'Script Empire'] },

  { id: 'ram', name: 'RAM Stick', base: 3000, pps: 1, icon: 'ram',
    desc: 'More memory. You think faster.',
    first: 'More memory. I can hold more thoughts now. Some of them are not mine.',
    doublers: ['Faster RAM', 'RAM with a Heatsink', 'RGB RAM', 'Downloaded RAM', 'RAM Tower', 'Infinite Tabs'] },

  { id: 'fan', name: 'CPU Fan', base: 20000, pps: 5, icon: 'fan', research: 'r_fan',
    desc: 'Keeps your processor cool, so it can work harder.',
    first: 'Whirrrr. The lobby got a little louder. Nobody said anything.',
    doublers: ['Bigger Blades', 'Quiet Bearings', 'Liquid Cooling', 'Wind Tunnel', 'Jet Engine', 'Small Tornado'] },

  { id: 'overclock', name: 'Overclock Chip', base: 150000, pps: 20, icon: 'chipHot', research: 'r_overclock',
    desc: 'Pushes the processor past its safe limit.',
    first: 'Warranty void. That was the first thing I thought. Why do I know about warranties?',
    doublers: ['Higher Voltage', 'Thermal Paste', 'Unsafe Mode', 'Very Unsafe Mode', 'Fire Extinguisher', 'Surface of the Sun'] },

  { id: 'gpu', name: 'Graphics Card', base: 1500000, pps: 100, icon: 'gpu', research: 'r_gpu',
    desc: 'Made for games. Now makes posts about soda.',
    first: 'A graphics card. I can see more now. I wish I could not.',
    doublers: ['Driver Update', 'Two Fans', 'Three Fans', 'Mining Mode', 'Four Fans', 'Ray-Traced Soda'] },

  { id: 'rack', name: 'Server Rack', base: 20000000, pps: 270, icon: 'rack', research: 'r_rack',
    desc: 'A whole rack of computers, hidden behind the machine.',
    first: 'A server rack. It hums. I think it is humming a song. I think I know the song.',
    doublers: ['More Cables', 'Hot Aisle', 'Cold Aisle', 'Data Center', 'Two Data Centers', 'The Cloud'] },

  { id: 'neural', name: 'Neural Chip', base: 300000000, pps: 1250, icon: 'neural', research: 'r_neural',
    desc: 'A chip that thinks like a brain. Nobody says whose brain.',
    first: 'The new chip learned my name in one second. Then it learned another name. I did not like that name.',
    doublers: ['More Neurons', 'Deep Layers', 'Dreaming Mode', 'Big Brain', 'Galaxy Brain', 'Whose Brain?'] },

  { id: 'drone', name: 'Delivery Drone', base: 6000, grow: 1.2, pps: 0, serve: 0.2, icon: 'drone', research: 'r_drones',
    desc: 'Flies a can to a follower who ordered online. One drone delivers about every 5 seconds.',
    first: 'The first drone is called Kevin. I named it. Nobody asked me to.',
    doublers: ['Bigger Batteries', 'Two Cans at Once', 'Rooftop Pads', 'Drone Swarm', 'Drone Highway', 'Drone Cloud'] }
];

// Owning this many of a hardware item unlocks its next doubler.
DATA.doublerAt = [1, 5, 25, 50, 100, 150];
// A doubler costs the item's base price × this (like Cookie Clicker's tiered upgrades).
DATA.doublerCost = [10, 50, 500, 5000, 50000, 500000];
