// I'M FRIDGE — the Refresh tree. Bought with Refresh Points on the reset screen. Kept forever.
// It is drawn as star groups (constellations) on a night sky.
// x, y = position on the sky (x: -5 left … 5 right, y: 0 top … 8 bottom). `req` = stars you need first.
// Everything you buy in a run starts over at a reset; these are the only permanent upgrades
// (plus the Memory Book). The "start with" stars give you a head start in every new run.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

// Names written faintly next to each star group.
DATA.treeGroups = [
  { name: 'The Machine', x: -3.9, y: -0.35 },
  { name: 'The Lab',     x: 3.2,  y: -0.35 },
  { name: 'The Crowd',   x: -3.4, y: 8.25 },
  { name: 'Memories',    x: 3.9,  y: 8.25 }
];

DATA.tree = [
  // The centre star
  { id: 'root', name: 'Muscle Memory', cost: 1, x: 0, y: 4,
    desc: 'Start every run with $25.', fx: [{ k: 'startCash', v: 2500 }] },

  // The Machine (top left)
  { id: 'carpetStart', name: 'Rolled-Up Carpet', cost: 2, x: -1.5, y: 3.1, req: ['root'],
    desc: 'Start every run with Carpet Catalog researched: the Comfy Carpet is already down (level 1).',
    fx: [{ k: 'startResearch', v: 'r_carpet' }] },
  { id: 'face', name: 'Familiar Face', cost: 3, x: -2.7, y: 2.3, req: ['carpetStart'],
    desc: '+10% appeal with walk-in customers.', fx: [{ k: 'appeal', v: 0.10 }] },
  { id: 'crate', name: 'I Know This Crate', cost: 3, x: -4.1, y: 2.0, req: ['face'],
    desc: 'Restocking costs 20% less.', fx: [{ k: 'restock', v: 0.20 }] },
  { id: 'signStart', name: 'Pocket LED', cost: 4, x: -2.2, y: 1.0, req: ['face'],
    desc: 'Start every run with LED Sign Plans researched: the LED Sign is already on (level 1).',
    fx: [{ k: 'startResearch', v: 'r_sign' }] },
  { id: 'autopilot', name: 'Autopilot', cost: 8, x: -3.6, y: 0.5, req: ['signStart'],
    desc: 'Start every run with Pneumatic Tubes researched (level 1): your machine refills itself.',
    fx: [{ k: 'startResearch', v: 'r_autorestock' }] },

  // The Lab (top right)
  { id: 'walletStart', name: 'Old Wallet', cost: 2, x: 1.5, y: 3.1, req: ['root'],
    desc: 'Start every run with SodaCoin Wallet researched: the Mining slider is there from the start (after Developer Mode).',
    fx: [{ k: 'startResearch', v: 'r_mining' }] },
  { id: 'notes', name: 'Lab Notes', cost: 4, x: 2.8, y: 2.4, req: ['walletStart'],
    desc: 'Start every run with 50 research points.', fx: [{ k: 'startRes', v: 50 }] },
  { id: 'notebook', name: 'Lab Notebook', cost: 8, x: 4.2, y: 1.6, req: ['notes'],
    desc: 'Start every run with 150 more research points.', fx: [{ k: 'startRes', v: 150 }] },
  { id: 'spare', name: 'Spare Parts', cost: 3, x: 1.9, y: 1.3, req: ['walletStart'],
    desc: 'Start every run with 1 Auto-Click Script and 1 RAM Stick.', fx: [{ k: 'startHardware', v: 1 }] },
  { id: 'refurb', name: 'Refurbished Parts', cost: 6, x: 3.0, y: 0.4, req: ['spare'],
    desc: 'Hardware costs 10% less.', fx: [{ k: 'hwDiscount', v: 0.10 }] },

  // The Crowd (bottom left)
  { id: 'viral', name: 'Viral Instinct', cost: 3, x: -1.5, y: 4.9, req: ['root'],
    desc: '+25% likes.', fx: [{ k: 'likes', v: 0.25 }] },
  { id: 'goldeye', name: 'Golden Eye', cost: 6, x: -3.0, y: 5.3, req: ['viral'],
    desc: 'Influencers stay twice as long, and their bonus lasts 50% longer.', fx: [{ k: 'goldEye', v: 1 }] },
  { id: 'fanMail', name: 'Fan Mail', cost: 5, x: -4.2, y: 6.4, req: ['goldeye'],
    desc: 'Start every run with Sipstagram Account researched (+100% likes).', fx: [{ k: 'startResearch', v: 'r_sipstagram' }] },
  { id: 'droneStart', name: 'Drone Hangar', cost: 6, x: -2.0, y: 6.6, req: ['viral'],
    desc: 'Start every run with Delivery Drones researched and 1 drone, ready for online orders.',
    fx: [{ k: 'startResearch', v: 'r_drones' }] },

  // Memories (bottom right)
  { id: 'reroll', name: 'Deep Breath', cost: 5, x: 1.5, y: 4.9, req: ['root'],
    desc: 'Once per review, you can reroll the card offer.', fx: [{ k: 'reroll', v: 1 }] },
  { id: 'second', name: 'Second Look', cost: 10, x: 3.1, y: 5.4, req: ['reroll'],
    desc: 'See 4 cards at every review instead of 3.', fx: [{ k: 'cardChoices', v: 1 }] },
  { id: 'keepsake', name: 'Keepsake', cost: 14, x: 2.3, y: 6.8, req: ['reroll'],
    desc: 'When you are reset, keep your best card.', fx: [{ k: 'keepCard', v: 1 }] }
];
