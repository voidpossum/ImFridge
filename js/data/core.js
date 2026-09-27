// I'M FRIDGE — core balance numbers and world data.
// Everything here is plain data. Change a number, reload the page, and the game uses it.
// Money is in cents: 200 = $2.00 (one can at the start). The screen shows dollars.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

// The game version, shown in the pause menu. Raise it with every build you share.
DATA.version = '0.2.4';

DATA.balance = {
  tick: 0.1,              // seconds per engine step
  dayLength: 60,          // real seconds per in-game day (at 1x speed)
  daysPerQuarter: 4,      // a review happens after this many days
  dayStartHour: 6,        // the day runs 06:00 → 24:00
  dayHours: 18,

  baseTraffic: 0.26,      // walk-in customers per second, before time of day and weather
  walkSpeed: 38,          // pixels per second (the world is 480×270)
  lookTime: 0.9,          // seconds a walk-in stands and compares machines
  patience: 14,           // seconds a customer waits in a line before leaving
  maxQueue: 5,

  canCost: 40,            // what one can costs you when you restock (40 = $0.40)
  startCash: 0,
  startPrice: 200,        // $2.00
  priceMin: 50,           // $0.50
  priceMax: 600,          // $6.00
  priceStep: 25,          // the − / + buttons move the price by $0.25
  startCap: 6,            // cans per drink at the start of a run
  vendTime: 2.2,          // seconds to sell one can
  tubeEvery: [3, 2, 1.2, 0.7, 0.4],   // Pneumatic Tubes: seconds per can at level 1, 2, 3, 4, 5

  // Clicks: every click earns money right away AND makes processing power.
  // Processing power always brings likes (likes bring followers); after Developer Mode it also makes
  // research or mined money (one slider: Research ⟷ Mining).
  clickPower: 1,          // processing per click
  clickCash: 10,          // cents earned per point of click power (1 click = $0.10 at the start)
  resRate: 0.3,           // research points per point of processing put into Research
  likesPerFollower: 5,    // this many likes → one follower walks in
  followerPatience: 40,   // followers waiting outside give up over about this many seconds
  followerBudget: 1.4,    // followers are willing to pay more than walk-ins
  followerEvery: 0.6,     // at most one follower comes through the door every this many seconds
  // Followers are loyal, but they still compare your price with the other machines.
  loyalMargin: 50,       // they always pay up to this much more than the cheapest rival (cents)
  lineTolerance: 40,     // ...plus this much for every customer in the shortest rival line
  loyalFade: 150,         // above that, the chance to buy falls over this many cents...
  loyalFloor: 0.05,       // ...down to this chance
  startMine: 0.2,         // Mining share at the start of a run, once SodaCoin Wallet is researched
  mineRate: 10,           // cents per point of processing put into Mining (after the SodaCoin Wallet research)
  mineHalf: 15000,          // mining difficulty: after $150 mined this run, each point pays half; after 45,000, a quarter

  reviewBonus: 0.25,      // cash bonus = this × your quarter earnings (only if you are not last)
  strikesMax: 3,          // last at this many reviews in a row = you are reset
  ch1Goal: 2000000,       // earn this much in one run ($20,000) and Chapter 1 is complete, no reset needed

  // Rivals grow by multiplying, you grow by adding and by capacity: that is what ends every run.
  rivalBump: 1.15,        // strength × this each time a rival loses a review and gets "updated"
  rivalQuarter: 1.16,     // strength × this every quarter (the labs ship updates constantly)
  modelDayQuarter: 5,     // first run only: both rivals launch new versions at the start of this quarter...
  modelDayBumps: 4,       // ...this many versions at once (it makes the first reset land at 30–45 min)
  rivalCopy: 0,           // rubber-banding, OFF in the cozy standard mode. (Hard mode idea: 0.35 = out-earn a rival 2× in a quarter and it grows ×1.35 more)
  rivalPerWipe: 0.1,      // rivals start this much stronger for every reset you have had
  rivalProcessing: 0.9,   // rival processing per second, per point of strength
  rivalOnline: 0.25,      // rival online orders per second, per point of strength above 1 (their delivery drones)
  ordersMin: 15,          // online orders that can wait (at least this many)...
  ordersSeconds: 30,      // ...or this many seconds of what your drones deliver, if that is more
  adCash: 5,              // cents per follower who could not even order online (your ads earn a little instead)
  followerQueue: 8,       // followers will join a line up to this long (walk-ins give up at maxQueue)

  // Refresh Points on a reset = floor(rpK × cube root of run sales) + reviews survived
  rpProd: 0.1,            // every Refresh Point ever earned: +10% to all processing
  rpK: 0.28008,          // (was 1.3 when money was counted in whole dollars; cents → ÷ cube root of 100)

  // Influencers (the golden cookie of this game): click them for a bonus
  goldFirst: 150,         // seconds into the very first run
  goldEvery: [300, 540],  // seconds between trending customers
  goldStay: 13,           // seconds they stay on screen
  hardwareGrow: 1.15,     // each copy of a hardware item costs this much more

  // Your line: it starts short, and the Comfy Carpet makes it longer (up to the full size).
  lineStart: 0.5,         // share of maxQueue / followerQueue you start with

  // Rival features (installed after a rival loses a review)
  rivalSpend: 0.4,        // share of each rival sale saved for its machine upgrades
  rivalShopEvery: 6,      // seconds between a rival's shopping checks
  cryptoRate: 35,       // cents per second added to its score, × square root of its strength
  hackLead: 1.5,          // it hacks you only when your quarter sales are this many times its own
  hackWarn: 5,            // seconds of warning before the lock
  hackClicks: 20,         // clicks to reboot
  hackMax: 20,            // the lock ends by itself after this many seconds
  pricewarCut: 100,       // it sells for this much less than you ($1)
  lineGap: 40             // seconds between two talking lines from the same rival
};

// Drinks. `color` is the can colour in the pixel scene.
DATA.drinks = {
  cola:   { name: 'Cola',       color: '#8a3b2a', light: '#c0604a' },
  lemon:  { name: 'Lemon-Lime', color: '#8fc43a', light: '#d6f28a' },
  orange: { name: 'Orange',     color: '#f08a2a', light: '#ffc070' },
  grape:  { name: 'Grape',      color: '#8a4ad0', light: '#c090f0' }
};
DATA.startDrinks = ['cola', 'lemon', 'orange'];

// Parts of the day. `mult` scales walk-in traffic. Hours are 6..24.
DATA.dayparts = [
  { id: 'morning', name: 'Morning rush', from: 6,  to: 9,  mult: 1.4 },
  { id: 'day',     name: 'Daytime',      from: 9,  to: 11, mult: 0.9 },
  { id: 'lunch',   name: 'Lunch rush',   from: 11, to: 14, mult: 1.6 },
  { id: 'day',     name: 'Daytime',      from: 14, to: 17, mult: 0.9 },
  { id: 'evening', name: 'Evening',      from: 17, to: 21, mult: 0.8 },
  { id: 'night',   name: 'Night',        from: 21, to: 24, mult: 0.35 }
];

DATA.weather = {
  normal: { name: 'Mild',  chance: 0.5, traffic: 1.0 },
  hot:    { name: 'Hot',   chance: 0.3, traffic: 1.1 },
  rain:   { name: 'Rainy', chance: 0.2, traffic: 0.75 }
};

// Customer types. Every type always wears its signature, so you can read them at a glance.
// `w` = how common they are in each part of the day. `budget` = [min, max] in cents.
DATA.customers = {
  office: { name: 'Office worker', look: 'Always a white shirt', budget: [180, 300],
            wants: { cola: 3, lemon: 2, orange: 2, grape: 1 }, speed: 1.0,
            w: { morning: 6, day: 5, lunch: 5, evening: 3, night: 0 } },
  intern: { name: 'Intern', look: 'Round glasses and a coffee cup', budget: [110, 200],
            wants: { cola: 2, lemon: 2, orange: 2, grape: 2 }, speed: 1.08,
            w: { morning: 3, day: 3, lunch: 3, evening: 2, night: 0 } },
  gym:    { name: 'Gym person', look: 'Big shoulders, a headband, sweating', budget: [220, 340],
            wants: { lemon: 3, orange: 3, cola: 1 }, speed: 1.15,
            w: { morning: 2, day: 1, lunch: 2, evening: 3, night: 0 } },
  boss:   { name: 'Boss', look: 'Suit, tie and a briefcase', budget: [320, 550],
            wants: { cola: 4, lemon: 1 }, speed: 0.9,
            w: { morning: 1, day: 1, lunch: 1, evening: 1, night: 0 } },
  kid:    { name: 'Kid', look: 'Small, with a cap and a lollipop', budget: [80, 160],
            wants: { grape: 4, orange: 3, cola: 1 }, speed: 1.2,
            w: { morning: 0, day: 1, lunch: 1, evening: 1, night: 0 } },
  night:  { name: 'Night shift', look: 'Safety vest and a hard hat', budget: [180, 280],
            wants: { cola: 3, lemon: 1, orange: 1 }, speed: 0.95,
            w: { morning: 0, day: 0, lunch: 0, evening: 1, night: 6 } }
};

// Named regulars. They show up sometimes and say one line when they buy from you.
DATA.regulars = {
  tanya: { name: 'Tired Tanya', type: 'office', budget: 260, want: 'cola',  shirt: '#6a8fd0', hair: '#3a2418', skin: '#e8b48a' },
  greg:  { name: 'Gym Greg',    type: 'gym',    budget: 300, want: 'lemon', shirt: '#e05050', hair: '#d8a040', skin: '#c88a60' }
};

// World layout (engine coordinates). The screen shows more or less around this, depending on window size.
DATA.world = {
  width: 480, height: 270,
  machineX: [170, 240, 310],   // left rival, you, right rival
  floorTop: 196,
  doors: [{ x: -24, y: 212 }, { x: 504, y: 212 }],   // customers walk in along the park path, from the left and right edges
  queueY: 213, queueGap: 10,
  lookMin: 120, lookMax: 360,
  laneMin: 224, laneMax: 262
};
