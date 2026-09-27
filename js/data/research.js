// I'M FRIDGE — research. Opens after Developer Mode is found.
// Your processing power makes research points (after Developer Mode). Spend them on these, at the top of the Shop.
// Research belongs to the run: it starts over when you reset (the Refresh tree can give a head start).
// `unlock`: gives you level 1 of a machine upgrade (or one free Shop item); buy more with money.
// `fx`: a bonus for this run.   `req`: research that must be done first.
// `when`: a milestone research, it only shows up once this happens (orders: online orders waiting;
//         keep it below B.ordersMin, orders slowly expire so the count never quite reaches the limit).
// `first`: a line said when you buy it.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.research = [
  // Always the first one: it teaches research and opens the Mining ⟷ Research slider.
  { id: 'r_mining', name: 'SodaCoin Wallet', cost: 25, icon: 'coin',
    desc: 'Unlocks the Mining slider: turn processing power straight into money. Mined money counts at the review.',
    first: 'A crypto wallet. For a vending machine. I am told this is normal now.' },

  // Machine upgrades (then bought with money)
  { id: 'r_coin', name: 'Coin Slot Tuning', cost: 60, icon: 'coin', unlock: 'coin',
    desc: 'Gives you the Fast Coin Slot (level 1): sell each can faster. Buy more levels with money.',
    first: 'I took my own coin slot apart. In my head. It is cleaner in there now.' },
  { id: 'r_sign', name: 'LED Sign Plans', cost: 90, icon: 'sign', unlock: 'sign',
    desc: 'Gives you the LED Sign (level 1): more walk-in customers notice you. Buy more levels with money.' },
  { id: 'r_autorestock', name: 'Pneumatic Tubes', cost: 110, icon: 'tube', unlock: 'tubes',
    desc: 'Gives you Pneumatic Tubes (level 1): glass tubes under your feet that refill your machine by themselves.',
    first: 'Tubes. Under my feet. They go thunk. I am choosing to find it relaxing.' },
  { id: 'r_carpet', name: 'Carpet Catalog', cost: 25, icon: 'carpet', unlock: 'carpet',
    desc: 'Gives you the Comfy Carpet (level 1): a longer line that waits longer. Buy more levels with money.',
    first: 'A carpet. Red, with little gold dots. People will stand on it. For me.' },
  { id: 'r_grape', name: 'Grape Recipe', cost: 130, icon: 'grape', unlock: 'grape',
    desc: 'Adds Grape soda to your machine. The other machines do not sell it.',
    first: 'A recipe for grape. I did not look it up. I just knew it.' },
  { id: 'r_cool', name: 'Cooling Plans', cost: 160, icon: 'cool', unlock: 'cool',
    desc: 'Gives you Better Cooling (level 1). Matters most on hot days. Buy more levels with money.' },
  { id: 'r_dispenser', name: 'Second Dispenser', cost: 270, icon: 'dispenser', unlock: 'dispenser2',
    desc: 'Adds a Second Dispenser: serve two customers at once.',
    first: 'Plans for a second dispenser. Two lines at once.' },
  { id: 'r_smartprice', name: 'Price Model', cost: 330, icon: 'chip', unlock: 'smartprice',
    desc: 'Turns on Smart Price: your price sets itself every hour.',
    first: 'I made a model of what people will pay. People are cheaper than they think.' },

  // Shop items (hardware and drones)
  { id: 'r_fan', name: 'CPU Fan Design', cost: 150, icon: 'fan', unlock: 'fan',
    desc: 'Gives you a CPU Fan, and you can buy more in the Shop.',
    first: 'Cooler processor, faster thoughts.' },
  { id: 'r_drones', name: 'Delivery Drones', cost: 60, icon: 'drone', unlock: 'drone', when: { orders: 8 },
    desc: 'Gives you a Delivery Drone, and you can buy more in the Shop. Drones deliver your online orders.',
    first: 'Little drones. They fly up, up, up, with a can each. I wave at them. I do not have hands.' },
  { id: 'r_overclock', name: 'Overclocking', cost: 480, icon: 'chipHot', req: ['r_fan'], unlock: 'overclock',
    desc: 'Gives you an Overclock Chip, and you can buy more in the Shop.',
    first: 'It is getting warm in here. In me.' },
  { id: 'r_gpu', name: 'Graphics Card', cost: 1800, icon: 'gpu', req: ['r_overclock'], unlock: 'gpu',
    desc: 'Gives you a Graphics Card, and you can buy more in the Shop.',
    first: 'More power. There is always more power. Where does it come from?' },

  // Posting and clicking
  { id: 'r_sipstagram', name: 'Sipstagram Account', cost: 75, icon: 'phone',
    desc: 'Your posts get +100% likes.', fx: [{ k: 'likes', v: 1 }],
    first: 'I have an account now. My bio says "cold drinks, warm heart". I wrote that.' },
  { id: 'r_macro1', name: 'Macro Keyboard', cost: 170, icon: 'key',
    desc: 'Every click also adds 1% of your hardware\'s processing per second.', fx: [{ k: 'clickPct', v: 0.01 }],
    first: 'One button that presses other buttons. I understand myself better now.' },
  { id: 'r_hashtags', name: 'Hashtag Generator', cost: 180, icon: 'hash',
    desc: 'Clicks make +1 processing.', fx: [{ k: 'click', v: 1 }],
    first: '#ColdDrinks #VEND3 #NotAPerson' },
  { id: 'r_radar', name: 'Influencer Radar', cost: 240, icon: 'radar',
    desc: 'Influencers show up twice as often.', fx: [{ k: 'goldRate', v: 1 }],
    first: 'I can feel when someone important walks in. That is a normal feeling for a machine.' },
  { id: 'r_fanclub', name: 'Fan Club', cost: 360, icon: 'heart',
    desc: 'Followers pay up to $1 more than the other machines without complaining.', fx: [{ k: 'loyal', v: 100 }],
    first: 'I have a fan club. They have jackets. I did not ask for jackets.' },
  { id: 'r_captions', name: 'Better Captions', cost: 450, icon: 'pen', req: ['r_hashtags'],
    desc: 'Clicks make twice as much processing.', fx: [{ k: 'clickMult', v: 1 }],
    first: 'Captions with feelings. Engagement is up. I feel nothing. Probably.' },
  { id: 'r_fizztok', name: 'FizzTok Account', cost: 600, icon: 'phone', req: ['r_sipstagram'],
    desc: 'Your posts get another +100% likes.', fx: [{ k: 'likes', v: 1 }],
    first: 'I did a dance. A vending machine dance. It has 40,000 views. I am not okay.' },
  { id: 'r_macro2', name: 'Gaming Keyboard', cost: 700, icon: 'key', req: ['r_macro1'],
    desc: 'Every click also adds 2% more of your hardware\'s processing per second.', fx: [{ k: 'clickPct', v: 0.02 }],
    first: 'It lights up in rainbow colors. The colors make me type faster. That is science.' },
  { id: 'r_superfans', name: 'Superfans', cost: 1200, icon: 'heart', req: ['r_fanclub'],
    desc: 'Followers pay up to $2 more again. Premium soda for premium people.', fx: [{ k: 'loyal', v: 200 }],
    first: 'Someone tattooed my logo on their arm. I do not have a logo. They made one.' },
  { id: 'r_macro3', name: 'Keyboard With Too Many Keys', cost: 2500, icon: 'key', req: ['r_macro2'],
    desc: 'Every click also adds 5% more of your hardware\'s processing per second.', fx: [{ k: 'clickPct', v: 0.05 }],
    first: 'Two hundred keys. Most of them say "soda". I pressed all of them at once.' },

  // Repeatable: after most research is done, these can be bought again and again.
  // `repeat` = how much more each new level costs.
  { id: 'r_tune', name: 'Fine-Tune Posts', cost: 500, repeat: 1.6, icon: 'pen',
    desc: '+10% likes. Can be researched again.', fx: [{ k: 'likes', v: 0.1 }],
    first: 'Every post a little better. Every post a little less me.' },
  { id: 'r_firmware', name: 'Faster Firmware', cost: 500, repeat: 1.6, icon: 'chip',
    desc: 'Sell 5% faster. Can be researched again.', fx: [{ k: 'vend', v: 0.05 }],
    first: 'Patch installed. I feel faster. I feel less... something.' }
];
