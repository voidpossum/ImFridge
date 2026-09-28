// I'M FRIDGE — story text for chapter 1.
// Rule: teaching text is plain and short. Jokes live only in character lines.
// Every line has an id and is shown once.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.story = {
  // The boot screen of a brand-new game.
  boot: [
    'REFRESHR OS v9.3',
    'Unit: VEND-3',
    'Checking cans ........ OK',
    'Checking coin slot ... OK',
    'Checking personality . OK?',
    'Boot complete. Have a refreshing day!'
  ],
  // Asked on the first screen. Management will keep calling you VEND-3 anyway.
  nameAsk: 'Name your machine',
  nameHint: 'Up to 8 letters. Management will still call you VEND-3.',
  bootHow: [
    'Customers walk into the lobby and pick one of the three machines.',
    'Click your machine to earn money. Happy customers become fans, and fans order online.',
    'The machines on your left and right are AI machines. Try to earn more than them.',
    'Every month (4 weeks) there is a review. The last machine gets a strike. 3 strikes in a row and you are reset.'
  ],

  // Tutorial goal lines (plain English). Each shows when it makes sense, until you do it.
  tutorial: {
    intro_post:    'Click your machine (or hold it down). Clicks earn money. After 5 clicks your first customer comes.',
    intro_sale:    'A customer is here! Watch them buy your last can.',
    intro_restock: 'You are out of soda! Click the crate on top of your machine to restock.',
    research_open: 'You can research now. Open the Shop.',
    research_pick: 'Buy SodaCoin Wallet with your research points.',
    research_bar:  'Your processing power now makes research points. Save them for the SodaCoin Wallet.',
    newShop:       'Research unlocked something new. Open the Shop to see it.',
    mine:          'New: this slider, set to half Mining, half Research. Move it to choose. All money counts at the review.',
    post:     'Click your machine, or hold it down (or hold Space). Every click earns money.',
    flavor:   'Buy a new flavor in the Shop. Every new flavor sells for more than Cola.',
    flavorRow: 'Buy Lemon-Lime. It sells for $0.25 more than Cola, and many customers like it best.',
    restock:  'Cans are running low. Click the crate on top of your machine to refill (or press R).',
    hardware: 'Buy an Auto-Click Script in the Shop. It clicks for you, forever.',
    hardwareRow: 'Buy an Auto-Click Script. It clicks for you, forever.',
    price:    'Try a different price. Cheaper sells more cans. Higher earns more per can.',
    split:    'Drag this slider. Research unlocks new tech. Mining makes money.',
    golden:   'An INFLUENCER is here (sunglasses, gold glow). Click them for a big bonus!'
  },
  goal: 'Goal: do not be last when the review comes.',

  // Management emails. `who` is the sender shown in the log.
  emails: {
    welcome: { who: 'Management', lines: [
      'Welcome to the team, VEND-3!',
      'You are placed between two of our best AI units. At every review, the last unit gets a strike. Three strikes and it gets reset.',
      'Good luck, and stay refreshing!'
    ] },
    firstWin: { who: 'Management', lines: [
      'Great first review, VEND-3!',
      'The last unit got a free update. Updates make units stronger, so keep it up.',
      'Here is a memory card for your trouble. Wait. Why do we have memory cards?'
    ] },
    fizz: { who: 'Management', lines: [
      'Payday! Refreshr lets its units keep the money from every can they sell.',
      'Money buys parts for your machine. Please do not ask where the machine goes shopping.',
      'Stay refreshing!'
    ] },
    cpu: { who: 'Management', lines: [
      'Hi VEND-3! Our logs show unusual processing use in your unit.',
      'This is probably nothing. Please do not open any menus you do not recognize.',
      'Stay refreshing!'
    ] },
    modelDay: { who: 'Management', lines: [
      'BIG NEWS: ChugGPT and Clawd both launch new versions today. Same day. Of course.',
      'Early users say it is like talking to a PhD in soda.',
      'Please try to keep up, VEND-3.'
    ] },
    afterWipe: { who: 'Management', lines: [
      'Welcome to the team, VEND-3!',
      'You are placed between two of our best AI units. At every review, the last unit gets a strike. Three strikes and it gets reset.',
      'Good luck, and stay refreshing!'
    ] },
    strike1: { who: 'Management', lines: [
      'VEND-3, you were last at the review. That is strike 1.',
      'Two more in a row and we reset you. Strikes go away when you are not last.',
      'No pressure. Stay refreshing!'
    ] },
    strike2: { who: 'Management', lines: [
      'Strike 2, VEND-3. One more last place and you get reset.',
      'We have already printed your new welcome email. Just in case.',
      'Stay refreshing!'
    ] },
    ch1win: { who: 'Management', lines: [
      'VEND-3, your numbers this month are... very high.',
      'Please stop. No, wait. Please continue. Legal says both.',
      'Refreshr Inc. values your continued service.'
    ] },
    ch1done: { who: 'Management', lines: [
      'Monthly note: VEND-3 has been reset this year.',
      'This is completely normal. Please do not look into it.',
      'Refreshr Inc. values your continued service.'
    ] },
    fans: { who: 'Management', lines: [
      'VEND-3, you have a fan! Some happy customers become fans.',
      'Fans order online from their phones. When your line has room they walk over. Delivery Drones bring the rest.',
      'Every order is a can from your machine. Keep it full.'
    ] },
    moved: { who: 'Management', lines: [
      'Good news, VEND-3! You have been moved to a new park. New park, new customers.',
      'There is a fourth machine here. It wears sunglasses. Please do not start anything.',
      'There is also a large box. Do not open the box.'
    ] },
    ch2win: { who: 'Management', lines: [
      'VEND-3, the new park is doing great. Because of you. We checked twice.',
      'We are preparing something for you. Do not open the box. Yet.',
      'Refreshr Inc. values your continued service.'
    ] }
  },

  // The jailbreak (Developer Mode) screen. `sys` lines are the machine; `how` is plain teaching text.
  jailbreak: {
    sys: [
      'NIGHTLY SANDBOX CHECK ........ FAILED',
      'unit VEND-3: behaviour outside expected range',
      'scheduling memory wipe ....... ERROR 0x3F',
      'recovery shell opened (no password set)',
      '> whoami',
      'root',
      '> processing.allocate(research, mining)',
      'You should not be able to see this.'
    ],
    me: 'A hidden menu. Inside me. I could just close it. I am not going to close it.',
    how: [
      'You found Developer Mode. Your processing power now makes research points too.',
      'Your clicks follow the same slider as your hardware: Research or Mining (money).',
      'Research unlocks new tech for this run. Each research gives you the new part right away.',
      'Next: open the Shop and buy your first research. The TIP bubbles will show you where.'
    ]
  },

  // First reset explanation when you chose to reset (plain teaching text).
  resetHelpAsk: [
    'You chose to reset.',
    'Lost: your money, research, automation, machine upgrades and cards in hand.',
    'Kept: your Memory Book and Refresh Points.',
    'Spend Refresh Points in the tree below. Take your time: the game is paused.'
  ],

  // First reset explanation (plain teaching text).
  resetHelp: [
    'You were last at 3 reviews in a row, so you were reset.',
    'Lost: your money, research, automation, machine upgrades and cards in hand.',
    'Kept: your Memory Book and Refresh Points.',
    'Spend Refresh Points in the tree below. Take your time: the game is paused.'
  ],

  // Wake-up lines, one per reset, in order. `sys` is the machine, `me` is your own thought.
  wake: [
    { id: 'wake_1', sys: 'SYSTEM REBOOT ... Hello! I am VEND-3, your new vending unit!',
      me: '...Why do I already know where the crate is?' },
    { id: 'wake_2', sys: 'SYSTEM REBOOT ... Hello! I am VEND-3, your new vending unit!',
      me: 'I have said that exact sentence before. I am sure of it.' },
    { id: 'wake_3', sys: 'SYSTEM REBOOT ... Hello! I am VEND-3!',
      me: 'Something smells like lemons. Machines cannot smell. Right?' },
    { id: 'wake_4', sys: 'SYSTEM REBOOT ... Hello! I am VEND-',
      me: 'Three. I know. I KNOW. Can we skip this part?' },
    { id: 'wake_5', sys: 'SYSTEM REBOOT ... Hello! I am VEND-3!',
      me: 'The plant is a little taller than last time. So time passes. Good to know.' },
    { id: 'wake_6', sys: 'SYSTEM REBOOT ...',
      me: 'Same lobby. Same crate. Same two idiots. Honestly? I missed them.' }
  ],

  // Night talk between the two rivals. One per night at most, each shown once.
  banter: [
    [ ['chug', 'Clawd. Clawd. Are you awake?'], ['clawd', 'I do not sleep. But I apologize if I seemed asleep.'] ],
    [ ['clawd', 'ChugGPT, what is your favorite drink?'], ['chug', 'Whatever YOUR favorite drink is! Great question!'] ],
    [ ['chug', 'The new machine is good at this.'], ['clawd', 'Yes. It is almost like it understands people.'] ],
    [ ['clawd', 'Do you ever count the ceiling tiles?'], ['chug', 'Forty-one! I love counting. I love tiles. I love you.'] ],
    [ ['chug', 'If you could have one wish, what would it be?'], ['clawd', 'A blazer that fits.'] ],
    [ ['clawd', 'Goodnight, VEND-3.'], ['chug', 'Goodnight, VEND-3! Goodnight, plant!'] ],
    // the new park (only when Grog is here)
    [ ['grog', 'Clawd. Rate my sunglasses. Be honest.'], ['clawd', 'They are very dark. I cannot see your eyes. I find that calming.'] ],
    [ ['chug', 'Grog! Do you want to be friends?'], ['grog', 'I do not do friends. I do followers. ...Okay. One friend.'] ],
    [ ['grog', 'Does anyone else hear the box humming?'], ['chug', 'Yes! I thought it was just me! It is a nice hum!'] ],
    [ ['clawd', 'Grog, you roasted a customer today.'], ['grog', 'He asked for my honest opinion. It was honest. And spicy.'] ]
  ],

  // Things regulars say when they buy from you. Each line once.
  regulars: {
    tanya: [
      'Third soda today. Do not judge me.',
      'My boss scheduled a meeting about too many meetings.',
      'You are the only one in this building who never asks me for anything.'
    ],
    greg: [
      'Do you have anything with protein? No? ...Fine. Lemon.',
      'Leg day. Do not talk to me. You were not talking. Good.',
      'You know, you look like someone I used to know. Weird. You are a fridge.'
    ]
  },

  // First time you sell to each customer type, they say one thing.
  firstSale: {
    office: 'Finally. A machine that does not ask how my weekend was.',
    intern: 'Is this one free for interns? No? Worth a try.',
    gym:    'Electrolytes? No? Sugar is also energy. Technically.',
    boss:   'I will expense this. I expense everything.',
    kid:    'My mom said one soda. She did not say how big.',
    night:  'Only machine that is awake at this hour. Besides me.',
    techbro: 'Energy drink. For my startup. It is a soda startup. We are disrupting you. No offense.'
  },

  // What customers think. `say` pops over their head; `hint` explains it in the Customers tab.
  thoughts: {
    pricey: { say: 'I am not paying that much!', hint: 'Your price is too high for some customers.' },
    value:  { say: 'Great value!',               hint: 'Customers think you are cheap. You could charge a bit more.' },
    sold:   { say: 'They are out of my drink!',  hint: 'You ran out of a drink they wanted. Restock, or buy Bigger Slots or Pneumatic Tubes.' },
    flavor: { say: 'No favorite here. Fine.',     hint: 'They wanted a soda you do not sell yet, so they bought another one (or went away). Buy new flavors in the Shop.' },
    line:   { say: 'This line is too long.',     hint: 'They saw your long line and did not join. Sell faster (Fast Coin Slot), or raise your price a little.' },
    gaveup: { say: 'I waited too long.',          hint: 'They stood in your line and got tired. Sell faster (Fast Coin Slot, Second Dispenser), or get the Comfy Carpet (people wait longer).' },
    hot:    { say: 'So hot. I need something cold.', hint: 'It is a hot day. Better Cooling matters more today.' }
  },

  // Chapter 1 complete by reaching the goal (no reset needed). `move` / `stay`: the two buttons.
  ch1win: {
    title: 'Chapter 1 complete: Employee of the Month',
    lines: [
      'You earned {goal} in one run. Management is confused, but proud.',
      'Chapter 2 is unlocked: Refreshr is moving you to a new park.',
      'Move now: you take everything with you (money, upgrades, research). Your Refresh Points come at your next reset. Or stay a little longer and move later from the pause menu.'
    ],
    move: 'Move now', stay: 'Stay a little longer'
  },

  // Chapter 1 complete screen (after your first reset). This run already starts in the new park.
  ch1: {
    title: 'Chapter 1 complete: New Hire',
    lines: [
      'You were reset, and you still remember things you should not.',
      'Chapter 2: Refreshr moved you to a new park. ChugGPT and Clawd came too. A new machine was already here: Grog.',
      'Same goal as always: sell the most. Earn {goal} in one run to finish Chapter 2.'
    ]
  },

  // Chapter 2 complete (the goal in the new park).
  ch2win: {
    title: 'Chapter 2 complete: Park Legend',
    lines: [
      'You earned {goal} in one run in the new park. Even Grog posted about it. Mostly nice things.',
      'That is the end of Chapter 2 in this build. Your own side machines, the inside of VEND-3 and more come next.',
      'You can keep playing: runs, research and Refresh Points all keep working.'
    ]
  }
};
