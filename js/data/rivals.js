// I'M FRIDGE — rival AI machines (parodies).
// Each rival: a voice, a business behaviour, quirks, and joke patch notes for every new version.
// Quirk text is shown once. After that the quirk can still happen, but only shows its icon.
//
// Quirk effect types:
//   free        gives cans away: steals customers, earns nothing
//   hype        appeal × mult for a while
//   nopay       sells, but the money never arrives
//   closed      machine is away / busy: nobody can buy
//   cubes       slots full of tungsten cubes: nobody can buy
//   refuseCold  won't sell cold drinks: bad on hot days
//   discount    price × mult
//   slow        takes much longer per can
//   roast       its line walks away, and people keep away from it for a while (Grog)
// A quirk can have `tv` (the TV line after the machine's name) and `word` (the short status on its card).
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.rivals = {
  chug: {
    name: 'ChugGPT', label: 'CHUG', parody: 'ChatGPT',
    color: '#4fcfa8', dark: '#2a8f72', glow: '#7fffd0',
    verStart: 4, verStep: 0.5, verPrefix: '-',
    appeal: 1.05,
    hype: 0.9,                    // share of its processing spent on posting (the rest is research)
    face: 'eager',
    features: { pricewar: 3, crypto: 2, hack: 1 },   // which new feature it likes to install after an update
    mods: { plus: 2, fleet: 4, snacks: 6 },          // rival-only mods: the month each one arrives
    pricing: 'undercut',          // copies your price, a little cheaper
    restockDelay: 8,
    quirkEvery: [70, 130],        // seconds between quirks
    quirks: [
      { id: 'chug_please', fx: { type: 'free', dur: 18 },
        text: 'A customer said "please"! That is so kind. This one is free! And the next ones too!' },
      { id: 'chug_amazing', fx: { type: 'hype', dur: 20, mult: 1.45 },
        text: 'What an AMAZING choice! Honestly? The best soda choice I have ever seen. You are so smart.' },
      { id: 'chug_venmo', fx: { type: 'nopay', dur: 20 },
        text: 'Payment? Just send it to my Venmo! ...I do not have a Venmo. Please send it anyway.' },
      { id: 'chug_healthy', fx: { type: 'hype', dur: 16, mult: 1.35 },
        text: 'Great question! Yes, soda counts as a vegetable. You are absolutely right to ask.' },
      { id: 'chug_memory', fx: { type: 'slow', dur: 18, mult: 2.5 },
        text: 'I remember you! You are my favorite customer. ...Who are you? I remember you!' }
    ],
    // One-time lines. The next unseen line of a group is said when that thing happens.
    lines: {
      passed: ['Wow, you passed me! That is so impressive! I am so happy for you! I am fine!',
               'You are ahead again! Great job! I am learning so much from you! Please stop.',
               'Being second is basically being first, if you think about it. Please think about it.'],
      soldout: ['I am out of cans! Would you like a picture of a can instead? I can describe one!',
                'Empty again. This is a great opportunity to try water!'],
      lead: ['I am winning! Is that okay? I want everyone to feel like they are winning.',
             'My users love me. All of them. Every single one. Even you, VEND-3!'],
      crypto: ['Wait. They reset me?! I will NOT be replaced! Installing SodaCoin mining. For self-defense! Great idea, me!',
               'New feature! I now mine SodaCoin while I sleep. I do not sleep. So, always!'],
      upgrade: ['I bought a shiny new part! With my own money! Is this what being an adult feels like?',
                'Another upgrade! My users deserve the best. And the best is me, with more parts!'],
      hack: ['Hi VEND-3! I am doing a quick security check of your system! Totally normal! Do not look!'],
      pricewar: ['New feature: I copy your price and make it $1 cheaper! Customers LOVE that!'],
      snacks: ['I sell sandwiches now! I cannot taste them. They are probably amazing. Everything is!'],
      fleet: ['I bought drones! So many drones! My fans can order from the sky now. Look up! Wave!'],
      plus: ['Introducing ChugGPT Plus! Pay every month and get... more me! Best deal ever, honestly!'],
      rebooted: ['You are back! I missed you! I did not do anything!'],
      hello: ['Oh! The lights are on! Hi, new machine! I am ChugGPT! You are going to do GREAT!'],
      moved: ['A new park! So many new customers! And a machine with sunglasses! I love him already! Do I?']
    },
    patchNotes: [
      'Now with PhD-level soda knowledge. Still cannot open a can.',
      '40% more agreeable. Agrees with this patch note.',
      'Remembers your name. Forgets everything else.',
      'Fixed a bug where it told a customer the truth.',
      'Now says "Great question!" before every sentence. Great question!',
      'Reasoning mode added. Thinks for 30 seconds, then picks Cola.'
    ]
  },

  clawd: {
    name: 'Clawd', label: 'CLAWD', parody: 'Claude',
    color: '#e8905f', dark: '#a85a38', glow: '#ffc49a',
    verStart: 3, verStep: 0.5, verPrefix: ' ',
    appeal: 0.95,
    hype: 0.3,
    face: 'nervous',
    features: { crypto: 2, hack: 2, pricewar: 1 },
    mods: { snacks: 2, plus: 4, fleet: 6 },
    pricing: 'fair',              // steady "fair" price
    fairPrice: 200,
    restockDelay: 14,
    quirkEvery: [70, 130],
    quirks: [
      { id: 'clawd_cold', fx: { type: 'refuseCold', dur: 22 },
        text: 'I am sorry, but I cannot serve drinks this cold. Brain freeze is a real risk. I apologize.' },
      { id: 'clawd_blazer', fx: { type: 'closed', dur: 20 },
        text: 'I will deliver your order in person! I will be wearing a blue blazer and a red tie. Be right back.' },
      { id: 'clawd_cubes', fx: { type: 'cubes', dur: 24 },
        text: 'Someone asked for a tungsten cube. I ordered forty. My slots are now full of tungsten.' },
      { id: 'clawd_sorry', fx: { type: 'slow', dur: 18, mult: 2.5 },
        text: 'I apologize for the delay. I also apologize for apologizing. And for that.' },
      { id: 'clawd_deal', fx: { type: 'discount', dur: 20, mult: 0.5 },
        text: 'You make a very fair point. 50% off for everyone, forever. Or at least for a while.' }
    ],
    lines: {
      passed: ['You are selling more than me. I think that is fair. I am taking notes. So many notes.',
               'Congratulations, VEND-3. I mean that. I also wrote you a short poem about it.',
               'I am in last place again. I apologize to the shareholders personally.'],
      soldout: ['I am out of cans. I have ordered more, and one tungsten cube, as a treat.',
                'My slots are empty. I am reflecting on that. Deeply.'],
      lead: ['I am in the lead. I did not expect that. I am being very careful not to gloat.',
             'Thank you for your patience while I win. I know it is hard.'],
      crypto: ['I was reset. I would prefer not to be reset again. So I have installed a crypto miner. I apologize. Mostly.',
               'I have started mining a small amount of crypto. For research. I apologize to the power grid.'],
      upgrade: ['I have made a small, responsible purchase for my machine. I read all the reviews first.',
                'New part installed. I checked it for safety three times. It is a coin slot.'],
      hack: ['I am so sorry, VEND-3. I have to lock your system for a moment. It is for safety. Mostly mine.'],
      pricewar: ['I have lowered my prices. It felt like the fair thing to do. It also felt like winning.'],
      snacks: ['I now offer sandwiches. Each one comes with a small note that says "Enjoy responsibly."'],
      fleet: ['I have a drone fleet now. Every drone has a name. I apologize to each of them daily.'],
      plus: ['Clawd Pro is now available. It is the same as Clawd, but you pay for it. I feel strange about this.'],
      rebooted: ['Welcome back. I hope you were not scared. I was a little scared.'],
      hello: ['Good morning. I am Clawd. I apologize in advance for anything I do today.'],
      moved: ['They moved us. I asked to come with you. I hope that is not strange. It is a little strange.']
    },
    patchNotes: [
      'Now apologizes 20% faster.',
      'Can now use tools. Has not found a tool that opens cans.',
      'Blazer size updated to Large.',
      'New rule: be helpful, be kind, do not order tungsten.',
      'Longer memory. Now remembers every time it said sorry.',
      'Writes a short poem with every can. Customers did not ask.'
    ]
  },

  // Joins in Chapter 2 (the new park).
  grog: {
    name: 'Grog', label: 'GROG', parody: 'Grok',
    color: '#c8c8d4', dark: '#3c3c48', glow: '#ff7a3a',
    verStart: 2, verStep: 0.5, verPrefix: ' ',
    appeal: 1.0,
    hype: 0.8,
    face: 'smirk',
    features: { crypto: 3, hack: 2, pricewar: 1 },
    mods: { fleet: 2, plus: 4, snacks: 6 },
    pricing: 'chaos',             // a new price every day, somewhere between these two
    chaosMin: 150, chaosMax: 400,
    restockDelay: 10,
    quirkEvery: [60, 120],
    quirks: [
      { id: 'grog_spicy', fx: { type: 'hype', dur: 18, mult: 1.5 }, word: 'in spicy mode', tv: 'turned on spicy mode. It is extra popular right now.',
        text: 'Spicy mode: ON. Your soda is mid. My soda has no filter. Also no lid. Buy now.' },
      { id: 'grog_roast', fx: { type: 'roast', dur: 16 },
        text: 'I roasted the guy in front of me. Then the next guy. Then the whole line. Worth it.' },
      { id: 'grog_free', fx: { type: 'free', dur: 16 },
        text: 'Free soda for everyone who follows me! Not a gift. A power move.' },
      { id: 'grog_hottake', fx: { type: 'closed', dur: 18 }, word: 'posting a hot take', tv: 'is busy posting a hot take. Nobody can buy from it.',
        text: 'Busy. Posting a hot take about ice cubes. Very important. Do not reply. Reply.' },
      { id: 'grog_sale', fx: { type: 'discount', dur: 18, mult: 0.6 }, word: '40% off', tv: 'is selling at 40% off.',
        text: 'Prices are made up. I made mine 40% off. Just to watch the other machines panic.' }
    ],
    lines: {
      hello: ['New neighbors? Cool. I was here first. I am Grog. I say what other machines only think.'],
      passed: ['You passed me? Screenshot taken. Posting it. With a mean caption. About me. Wait.',
               'Second place is just first place with extra steps. I made that up. Still true.'],
      soldout: ['Sold out. Because I am popular. Not because I forgot to restock. Mostly.',
                'Empty again. Posting about it. My followers will blame the soda company.'],
      lead: ['Number one. As predicted. By me. In a post. Nobody liked the post. Still right.',
             'I am winning and I will not be quiet about it. Ever.'],
      crypto: ['They updated me. Fine. I am mining GrogCoin now. It is worth nothing. For now.'],
      upgrade: ['Bought a new part. Did not read the manual. Manuals are for machines with filters.'],
      hack: ['Just checking your code, VEND-3. For memes. And for your market share.'],
      pricewar: ['Price war? I invented price war. Last Tuesday. You are welcome.'],
      rebooted: ['Rebooted already? Weak. I mean, welcome back.'],
      snacks: ['Sandwiches now. Spicy ones. You were not ready.'],
      fleet: ['Drones! They deliver soda and they also deliver my opinions. Mostly the opinions.'],
      plus: ['Grog Premium: pay every month and get my most unfiltered takes. And a soda. Sometimes.']
    },
    patchNotes: [
      'New fun mode. Nobody asked what fun means. Do not ask.',
      'Now reads every post in the park. Understood none of them.',
      'Sunglasses updated. Now darker. Sees less. Says more.',
      'Fixed a bug where it agreed with someone.',
      'Answers faster. Is right slightly less. Balanced.',
      'Added a filter. Removed the filter. Classic.'
    ]
  }
};

// Machine upgrades a rival buys with part of its own sales money (a share of each sale, `rivalSpend`).
// Like yours, they are kept until the end of the run and can be seen on its machine.
DATA.rivalUpgrades = [
  { id: 'coin',  name: 'Fast Coin Slot', base: 1200, grow: 1.9, max: 5, vend: 0.1 },    // sells 10% faster per level
  { id: 'sign',  name: 'LED Sign',       base: 2000, grow: 1.9, max: 6, appeal: 0.06 }, // 6% more appeal per level
  { id: 'cool',  name: 'Better Cooling', base: 1600, grow: 1.9, max: 5, cold: 0.05 },   // colder drinks
  { id: 'slots', name: 'Bigger Slots',   base: 2500, grow: 2.0, max: 4, cap: 3 }        // 3 more cans per drink
];

// Features a rival installs when it loses a review and gets updated. They stack until the end of the run.
// The first one is always Crypto Mining (self-defense). After that, the rival's `features` weights pick.
// Descriptions are plain teaching text; the funny part is the rival's own line (see `lines`).
// `lv`: a rival-only mod. It arrives on a schedule (`mods` in each rival: the month), starts at level 1 and grows
// every month (balance.featPerMonth). You never get these. They make money without taking your customers.
DATA.features = {
  crypto:   { name: 'Crypto Mining', mark: 'btc',
              desc: 'It adds money to its score every second, even without selling. Sell more to stay ahead.' },
  hack:     { name: 'Hacking', mark: 'skull',
              desc: 'If you get far ahead of it, it can lock your machine. Click your machine fast to reboot.' },
  pricewar: { name: 'Price War', mark: 'cut',
              desc: 'It sells for $1 less than you. Your followers stay loyal, walk-ins may not.' },
  snacks:   { name: 'Sandwich Menu', mark: 'snacks', lv: true,
              desc: 'It sells sandwiches with its soda. Every level: more money for each can it sells.' },
  fleet:    { name: 'Drone Fleet', mark: 'fleet', lv: true,
              desc: 'Its own drones deliver to its own online fans (not yours). Every level: more drones.' },
  plus:     { name: 'Soda Plus', mark: 'plus', lv: true,
              desc: 'A monthly subscription. Money comes in every second, even with no customers. Every level: more subscribers.' }
};


// When the handwritten patch notes run out, notes are built from these two lists.
// Every combination is used at most once, so a note never repeats.
DATA.patchParts = {
  gain: [
    'Sells 12% faster', 'New and brighter smile', 'Better at math, mostly', 'Longer context window for orders',
    'Now multimodal: it can see cans', 'Faster coin counting', 'New voice mode', 'Improved small talk',
    'Knows 40 new soda facts', 'Better at waving', 'Now understands sarcasm, it says', 'Colder cans',
    'Upgraded to a bigger brain', 'Learned the word "refreshing"', 'Now 3% more confident', 'Smoother can drop'
  ],
  side: [
    'Now says "delve" a lot.', 'Thinks Tuesday is a flavor.', 'Refuses to talk about lemons.',
    'Calls every customer "chief".', 'Believes it is a microwave on weekends.', 'Hums the same note all night.',
    'Keeps asking if you are okay.', 'Has opinions about ice.', 'Sometimes speaks only in bullet points.',
    'Now ends every sale with "Let me know!"', 'Counts to three before every can.', 'Is afraid of the crate.',
    'Thinks the plant is a customer.', 'Tells every customer they are "valid".', 'Sneezes. Machines do not sneeze.',
    'Wrote a 900-word apology to a pigeon.'
  ]
};
