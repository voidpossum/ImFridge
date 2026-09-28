// I'M FRIDGE — talent chips: they go in the sockets on VEND-3's board (the inside of the machine).
// Like Gnorp's talents: they change how things work. They stay when you reset.
// Chips unlock in groups by the Refresh Points you ever earned (`at`). Each open group adds one socket and has one
// free chip that is always on (`free`). The other chips go in sockets: you choose.
// A chip you put in a socket warms up: it starts working at the next review (or when you reset).
// Effect keys (fx): the same as machine upgrades, plus chip-only rules:
//   hw        hardware makes +x% (with a condition: dayparts, week_ge)
//   hwRamp    hardware +x for every month of this run (up to chipRampMax)
//   free7     every 7th copy of any hardware is free
//   carry     every drone delivery sells 2 cans, but drones fly x slower
//   fanSoft   new fans come more easily (fanSoft × (1 + x))
//   lineMoney +x money per person in your line
//   noLeave   lost orders never make fans leave
//   extraMult soda extra prices × (1 + x)
//   reserve   when a soda runs out, x free cans drop in (once a minute per soda)
//   streak    +x money for each review in a row you are not last (up to chipStreakMax)
//   quirkSlow rival quirks come (1 + x) times less often
// Conditions (c): dayparts, weather, week_ge (week of the month), notFirst (you are not 1st right now).
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.chipGroups = [
  { id: 'board',  name: 'Board',  at: 25,   color: '#6cd48a', free: 'spare',
    open: 'There is a socket on my board. It was always there. I think it is for me.' },
  { id: 'crowd',  name: 'Crowd',  at: 150,  color: '#ff6b8a', free: 'regulars',
    open: 'A second socket. It is warm. Someone was here before me.' },
  { id: 'supply', name: 'Supply', at: 500,  color: '#6fc3ff', free: 'bulk',
    open: 'A third socket, next to the tubes. It smells like cold cans.' },
  { id: 'review', name: 'Review', at: 1500, color: '#ffd24a', free: 'impression',
    open: 'The last socket. It has a label: MANAGEMENT ONLY. I will use it anyway.' }
];

DATA.chips = [
  // Board
  { id: 'spare', group: 'board', name: 'Spare Parts', icon: 'chipSpare',
    desc: 'Every 7th copy of any hardware is free.', fx: [{ k: 'free7', v: 1 }] },
  { id: 'night', group: 'board', name: 'Night Shift', icon: 'chipNight',
    desc: 'Hardware makes 3 times as much at night.', fx: [{ k: 'hw', v: 2, c: { dayparts: ['night'] } }] },
  { id: 'burn', group: 'board', name: 'Slow Burn', icon: 'chipBurn',
    desc: 'Hardware makes +20% more for every month of this run (up to +200%).', fx: [{ k: 'hwRamp', v: 0.2 }] },
  { id: 'hands', group: 'board', name: 'Hot Hands', icon: 'chipHands',
    desc: 'Every click also adds 5% of your hardware\'s processing per second.', fx: [{ k: 'clickPct', v: 0.05 }] },
  { id: 'overheat', group: 'board', name: 'Overheat', icon: 'chipHeat',
    desc: 'Hardware makes twice as much, but your cans are 20% warmer.', fx: [{ k: 'hw', v: 1 }, { k: 'cold', v: -0.2 }] },

  // Crowd
  { id: 'regulars', group: 'crowd', name: 'Regulars', icon: 'chipRegulars',
    desc: 'Fans pay up to $0.50 more than the other machines without complaining.', fx: [{ k: 'loyal', v: 50 }] },
  { id: 'twocans', group: 'crowd', name: 'Two Cans', icon: 'chipTwo',
    desc: 'Every drone delivery sells 2 cans (if you have them), but drones fly 40% slower.', fx: [{ k: 'carry', v: 0.4 }] },
  { id: 'mouth', group: 'crowd', name: 'Word of Mouth', icon: 'chipMouth',
    desc: 'New fans come twice as easily.', fx: [{ k: 'fanSoft', v: 1 }] },
  { id: 'pleaser', group: 'crowd', name: 'Crowd Pleaser', icon: 'chipCrowd',
    desc: '+5% money for every person in your line.', fx: [{ k: 'lineMoney', v: 0.05 }] },
  { id: 'loyalfans', group: 'crowd', name: 'Loyal Fans', icon: 'chipLoyal',
    desc: 'Lost orders never make fans leave.', fx: [{ k: 'noLeave', v: 1 }] },

  // Supply
  { id: 'bulk', group: 'supply', name: 'Bulk Deal', icon: 'chipBulk',
    desc: 'Cans cost 40% less.', fx: [{ k: 'restock', v: 0.4 }] },
  { id: 'flavorlab', group: 'supply', name: 'Flavor Lab', icon: 'chipFlavor',
    desc: 'The extra price of every soda is doubled (Grape +$2 instead of +$1).', fx: [{ k: 'extraMult', v: 1 }] },
  { id: 'emergency', group: 'supply', name: 'Emergency Can', icon: 'chipEmergency',
    desc: 'When a soda runs out, 3 free cans drop in (once a minute for each soda).', fx: [{ k: 'reserve', v: 3 }] },
  { id: 'pressure', group: 'supply', name: 'Pressure Tubes', icon: 'chipPressure',
    desc: 'Your tubes work as if they had 2 more levels.', fx: [{ k: 'tubes', v: 2 }] },
  { id: 'happyhour', group: 'supply', name: 'Happy Hour', icon: 'chipHappy',
    desc: 'Twice as many people walk in during the evening.', fx: [{ k: 'traffic', v: 1, c: { dayparts: ['evening'] } }] },

  // Review
  { id: 'impression', group: 'review', name: 'Good Impression', icon: 'chipImpress',
    desc: 'The cash bonus after a review is 50% bigger.', fx: [{ k: 'review', v: 0.5 }] },
  { id: 'underdog', group: 'review', name: 'Underdog', icon: 'chipUnder',
    desc: 'While you are not 1st: +30% of all the money you earn.', fx: [{ k: 'boost', v: 0.3, c: { notFirst: true } }] },
  { id: 'momentum', group: 'review', name: 'Momentum', icon: 'chipMomentum',
    desc: '+5% of all money for every review in a row you are not last (up to +50%).', fx: [{ k: 'streak', v: 0.05 }] },
  { id: 'quiet', group: 'review', name: 'Quiet Month', icon: 'chipQuiet',
    desc: 'The other machines\' quirks happen half as often.', fx: [{ k: 'quirkSlow', v: 1 }] },
  { id: 'push', group: 'review', name: 'Last-Minute Push', icon: 'chipPush',
    desc: 'Hardware makes twice as much in the last week before a review.', fx: [{ k: 'hw', v: 1, c: { week_ge: 4 } }] }
];
