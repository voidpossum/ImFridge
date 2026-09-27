// I'M FRIDGE — memory cards.
// After you survive a review you pick 1 of 3. Each card is a memory from your human life + a bonus.
// The first time you take a card, it goes into your Memory Book forever.
//
// Effect keys (all numbers are "+x%" as a fraction unless noted):
//   appeal   how much customers like your machine
//   money    extra money per can sold
//   cold     cold bonus (stronger on hot days)
//   restock  restock cost reduction
//   click    extra processing per click
//   likes    more likes from posting
//   review   extra review cash bonus
// Conditions (c): price_le / price_ge (your price), daypart, weather, cust (customer type)
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.lifeChapters = [
  { id: 'childhood', name: 'Childhood', perk: 'Forever: +5% appeal', perkFx: [{ k: 'appeal', v: 0.05 }] },
  { id: 'firstjob',  name: 'First Job', perk: 'Forever: start every run with +$25', perkFx: [{ k: 'startCash', v: 2500 }] },
  { id: 'friends',   name: 'Friends',   perk: 'Forever: clicks make +1 processing', perkFx: [{ k: 'click', v: 1 }] }
  // School, Family and Last Day arrive in later chapters.
];

DATA.cards = [
  // ── Childhood ──────────────────────────────────────────────
  { id: 'c_lemonade', life: 'childhood', rarity: 'common', chapter: 1, tags: ['Cheap', 'Summer'],
    name: 'Lemonade Stand',
    text: 'You sold lemonade for 25 cents a cup. You made four dollars and felt rich.',
    fx: [{ k: 'appeal', v: 0.25, c: { price_le: 150 } }],
    desc: '+25% appeal while your price is $1.50 or less' },

  { id: 'c_icecream', life: 'childhood', rarity: 'common', chapter: 1, tags: ['Music'],
    name: 'Ice Cream Truck Song',
    text: 'You ran every time you heard that song. Every single time.',
    fx: [{ k: 'click', v: 1 }],
    desc: 'Clicks make +1 processing' },

  { id: 'c_freezer', life: 'childhood', rarity: 'common', chapter: 1, tags: ['Cold', 'Summer'],
    name: 'Freezer Door',
    text: 'On hot days you stood in front of the open freezer. Mom yelled. Worth it.',
    fx: [{ k: 'cold', v: 0.15 }],
    desc: '+15% cold bonus' },

  { id: 'c_allowance', life: 'childhood', rarity: 'common', chapter: 1, tags: ['Cheap'],
    name: 'Saved Allowance',
    text: 'You kept your coins in a sock under the bed. Nobody ever found it.',
    fx: [{ k: 'restock', v: 0.20 }],
    desc: 'Restocking costs 20% less' },

  { id: 'c_bike', life: 'childhood', rarity: 'rare', chapter: 1, tags: ['Kids'],
    name: 'Bike Bell',
    text: 'Ring ring. The whole street knew you were coming.',
    fx: [{ k: 'appeal', v: 0.60, c: { cust: 'kid' } }, { k: 'appeal', v: 0.08 }],
    desc: '+60% appeal to kids, +8% appeal to everyone' },

  { id: 'c_grandma', life: 'childhood', rarity: 'legendary', chapter: 1, tags: ['Cold'],
    name: "Grandma's Fridge",
    text: 'She always kept a cold soda for you in the fridge door. Always.',
    fx: [{ k: 'appeal', v: 0.25 }, { k: 'cold', v: 0.10 }],
    desc: '+25% appeal, +10% cold bonus' },

  // ── First Job ──────────────────────────────────────────────
  { id: 'j_register', life: 'firstjob', rarity: 'common', chapter: 1, tags: [],
    name: 'Cash Register',
    text: 'Your first job. You counted the change twice, just to be sure.',
    fx: [{ k: 'money', v: 0.10 }],
    desc: '+10% money per can' },

  { id: 'j_smile', life: 'firstjob', rarity: 'common', chapter: 1, tags: [],
    name: 'Customer Service Smile',
    text: '"Smile with your eyes," the manager said. You practiced in the mirror.',
    fx: [{ k: 'appeal', v: 0.12 }],
    desc: '+12% appeal' },

  { id: 'j_lunch', life: 'firstjob', rarity: 'rare', chapter: 1, tags: ['Busy'],
    name: 'Lunch Rush',
    text: 'Twelve to one. No breaks. You were fast, and you were proud of it.',
    fx: [{ k: 'appeal', v: 0.40, c: { daypart: 'lunch' } }, { k: 'money', v: 0.10, c: { daypart: 'lunch' } }],
    desc: 'At lunch (11:00–14:00): +40% appeal, +10% money per can' },

  { id: 'j_night', life: 'firstjob', rarity: 'common', chapter: 1, tags: ['Night'],
    name: 'Night Shift',
    text: 'The store was quiet at 3 a.m. You liked it more than you told anyone.',
    fx: [{ k: 'appeal', v: 0.50, c: { daypart: 'night' } }, { k: 'appeal', v: 0.20, c: { daypart: 'evening' } }],
    desc: '+50% appeal at night, +20% in the evening' },

  { id: 'j_employee', life: 'firstjob', rarity: 'rare', chapter: 1, tags: [],
    name: 'Employee of the Month',
    text: 'Your photo on the wall. Bad haircut. Proud anyway.',
    fx: [{ k: 'review', v: 0.50 }, { k: 'appeal', v: 0.06 }],
    desc: '+50% review bonus, +6% appeal' },

  // ── Friends ────────────────────────────────────────────────
  { id: 'f_roadtrip', life: 'friends', rarity: 'common', chapter: 1, tags: ['Summer'],
    name: 'Road Trip',
    text: 'Gas station snacks, loud music, and a map nobody could read.',
    fx: [{ k: 'appeal', v: 0.30, c: { weather: 'hot' } }, { k: 'money', v: 0.10, c: { weather: 'hot' } }],
    desc: 'On hot days: +30% appeal, +10% money per can' },

  { id: 'f_gym', life: 'friends', rarity: 'common', chapter: 1, tags: ['Gym'],
    name: 'Gym Buddy',
    text: 'He only spotted you if you bought the drinks after.',
    fx: [{ k: 'appeal', v: 0.50, c: { cust: 'gym' } }],
    desc: '+50% appeal to gym people' },

  { id: 'f_movie', life: 'friends', rarity: 'common', chapter: 1, tags: ['Night'],
    name: 'Movie Night',
    text: 'Big soda, bigger popcorn. You always fell asleep before the end.',
    fx: [{ k: 'money', v: 0.25, c: { daypart: 'evening' } }, { k: 'money', v: 0.25, c: { daypart: 'night' } }],
    desc: '+25% money per can in the evening and at night' },

  { id: 'f_birthday', life: 'friends', rarity: 'rare', chapter: 1, tags: ['Kids'], hat: true,
    name: 'Birthday Party',
    text: 'Paper hats. Somebody cried. It was a great party.',
    fx: [{ k: 'appeal', v: 0.18 }, { k: 'appeal', v: 0.30, c: { cust: 'kid' } }],
    desc: '+18% appeal, +30% more with kids. You get a party hat.' }
];

DATA.rarity = {
  common:    { name: 'Common',    color: '#cfc3d6' },
  rare:      { name: 'Rare',      color: '#6fc3ff' },
  legendary: { name: 'Legendary', color: '#ffcc4d' }
};
