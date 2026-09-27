// I'M FRIDGE — hardware. This is what makes your processing power when you are not clicking.
// Works like buildings in Cookie Clicker: each copy costs 15% more.
// Owning 1 / 5 / 25 / 50 of something unlocks an upgrade that doubles it.
// Hardware lives inside your machine (you can see it in the cut-away later).
// `pps` = processing per second each. The Delivery Drone makes no processing: it sells (`serve` = followers per second each).
// `research`: only for sale after that research project is done.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.hardware = [
  { id: 'script', name: 'Auto-Click Script', base: 500, pps: 0.1, icon: 'script',
    desc: 'A tiny script that clicks for you.',
    first: 'A script that clicks for me. I do not have fingers, so this is fair.',
    doublers: ['Faster Script', 'Script with Loops', 'Script that Writes Scripts', 'Script Swarm'] },

  { id: 'ram', name: 'RAM Stick', base: 3000, pps: 1, icon: 'ram',
    desc: 'More memory. You think faster.',
    first: 'More memory. I can hold more thoughts now. Some of them are not mine.',
    doublers: ['Faster RAM', 'RAM with a Heatsink', 'RGB RAM', 'Downloaded RAM'] },

  { id: 'fan', name: 'CPU Fan', base: 20000, pps: 5, icon: 'fan', research: 'r_fan',
    desc: 'Keeps your processor cool, so it can work harder.',
    first: 'Whirrrr. The lobby got a little louder. Nobody said anything.',
    doublers: ['Bigger Blades', 'Quiet Bearings', 'Liquid Cooling', 'Wind Tunnel'] },

  { id: 'overclock', name: 'Overclock Chip', base: 150000, pps: 30, icon: 'chipHot', research: 'r_overclock',
    desc: 'Pushes the processor past its safe limit.',
    first: 'Warranty void. That was the first thing I thought. Why do I know about warranties?',
    doublers: ['Higher Voltage', 'Thermal Paste', 'Unsafe Mode', 'Very Unsafe Mode'] },

  { id: 'gpu', name: 'Graphics Card', base: 1200000, pps: 180, icon: 'gpu', research: 'r_gpu',
    desc: 'Made for games. Now makes posts about soda.',
    first: 'A graphics card. I can see more now. I wish I could not.',
    doublers: ['Driver Update', 'Two Fans', 'Three Fans', 'Mining Mode'] },

  { id: 'drone', name: 'Delivery Drone', base: 6000, pps: 0, serve: 0.2, icon: 'drone', research: 'r_drones',
    desc: 'Flies a can to a follower who is waiting outside. One drone serves a follower about every 5 seconds.',
    first: 'The first drone is called Kevin. I named it. Nobody asked me to.',
    doublers: ['Bigger Batteries', 'Two Cans at Once', 'Rooftop Pads', 'Drone Swarm'] }
];

// Owning this many of a hardware item unlocks its next doubler.
DATA.doublerAt = [1, 5, 25, 50];
// A doubler costs the item's base price × this.
DATA.doublerCost = [10, 50, 500, 5000];
