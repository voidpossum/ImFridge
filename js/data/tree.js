// OUT OF ORDER — the Refresh tree. Bought with Refresh Points on the reset screen. Kept forever.
// x, y = position in the tree picture (grid units). `req` = nodes you need first.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.tree = [
  { id: 'root', name: 'Muscle Memory', cost: 1, x: 0, y: 0,
    desc: 'Start every run with 2,500 fizz.', fx: [{ k: 'startCash', v: 2500 }] },

  // Machine branch (left)
  { id: 'face', name: 'Familiar Face', cost: 3, x: -3, y: 1, req: ['root'],
    desc: '+10% appeal with walk-in customers.', fx: [{ k: 'appeal', v: 0.10 }] },
  { id: 'crate', name: 'I Know This Crate', cost: 3, x: -3.6, y: 2, req: ['face'],
    desc: 'Restocking costs 20% less.', fx: [{ k: 'restock', v: 0.20 }] },
  { id: 'autopilot', name: 'Autopilot', cost: 8, x: -2.4, y: 2, req: ['face'],
    desc: 'Start every run with Pneumatic Tubes level 1 (after you research them).', fx: [{ k: 'freeUpgrade', v: 'tubes' }] },

  // Hype branch
  { id: 'viral', name: 'Viral Instinct', cost: 3, x: -1, y: 1, req: ['root'],
    desc: '+25% likes.', fx: [{ k: 'likes', v: 0.25 }] },
  { id: 'goldeye', name: 'Golden Eye', cost: 6, x: -1, y: 2, req: ['viral'],
    desc: 'Influencers stay twice as long, and their bonus lasts 50% longer.', fx: [{ k: 'goldEye', v: 1 }] },

  // Hardware branch
  { id: 'spare', name: 'Spare Parts', cost: 3, x: 1, y: 1, req: ['root'],
    desc: 'Start every run with 1 Auto-Click Script and 1 RAM Stick.', fx: [{ k: 'startHardware', v: 1 }] },
  { id: 'refurb', name: 'Refurbished Parts', cost: 6, x: 1, y: 2, req: ['spare'],
    desc: 'Hardware costs 10% less.', fx: [{ k: 'hwDiscount', v: 0.10 }] },

  // Memory branch (right)
  { id: 'reroll', name: 'Deep Breath', cost: 5, x: 3, y: 1, req: ['root'],
    desc: 'Once per review, you can reroll the card offer.', fx: [{ k: 'reroll', v: 1 }] },
  { id: 'second', name: 'Second Look', cost: 10, x: 2.4, y: 2, req: ['reroll'],
    desc: 'See 4 cards at every review instead of 3.', fx: [{ k: 'cardChoices', v: 1 }] },
  { id: 'keepsake', name: 'Keepsake', cost: 14, x: 3.6, y: 2, req: ['reroll'],
    desc: 'When you are reset, keep your best card.', fx: [{ k: 'keepCard', v: 1 }] }
];
