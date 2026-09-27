// I'M FRIDGE — research. Opens after Developer Mode is found.
// The Research bar on your card makes research points. Spend them on these, at the top of the Shop.
// Research is KEPT FOREVER, even when you are reset.
// `unlock`: makes a machine upgrade or a Shop item available to buy with money.
// `fx`: a permanent bonus.   `req`: research that must be done first.
// `first`: a line said when you buy it.
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.research = [
  // Always the first one: it teaches research and opens the Mining bar.
  { id: 'r_mining', name: 'SodaCoin Wallet', cost: 40, icon: 'coin',
    desc: 'Unlocks the Mining bar: turn processing power straight into money. Mined money does not count at the review.',
    first: 'A crypto wallet. For a vending machine. I am told this is normal now.' },

  // Machine upgrades (then bought with money)
  { id: 'r_coin', name: 'Coin Slot Tuning', cost: 60, icon: 'coin', unlock: 'coin',
    desc: 'Unlocks the Fast Coin Slot upgrade: sell each can faster.',
    first: 'I took my own coin slot apart. In my head. It is cleaner in there now.' },
  { id: 'r_sign', name: 'LED Sign Plans', cost: 90, icon: 'sign', unlock: 'sign',
    desc: 'Unlocks the LED Sign upgrade: more walk-in customers notice you.' },
  { id: 'r_autorestock', name: 'Pneumatic Tubes', cost: 110, icon: 'tube', unlock: 'tubes',
    desc: 'Unlocks Pneumatic Tubes: pipes in your back that refill your machine by themselves.',
    first: 'Pipes. In my back. They go thunk. I am choosing to find it relaxing.' },
  { id: 'r_carpet', name: 'Carpet Catalog', cost: 120, icon: 'carpet', unlock: 'carpet',
    desc: 'Unlocks the Comfy Carpet upgrade: a longer line that waits longer.' },
  { id: 'r_grape', name: 'Grape Recipe', cost: 130, icon: 'grape', unlock: 'grape',
    desc: 'Unlocks Grape soda. The other machines do not sell it.',
    first: 'A recipe for grape. I did not look it up. I just knew it.' },
  { id: 'r_cool', name: 'Cooling Plans', cost: 160, icon: 'cool', unlock: 'cool',
    desc: 'Unlocks the Better Cooling upgrade. Matters most on hot days.' },
  { id: 'r_dispenser', name: 'Second Dispenser', cost: 270, icon: 'dispenser', unlock: 'dispenser2',
    desc: 'Unlocks the Second Dispenser: serve two customers at once.',
    first: 'Plans for a second dispenser. Two lines at once.' },
  { id: 'r_smartprice', name: 'Price Model', cost: 330, icon: 'chip', unlock: 'smartprice',
    desc: 'Unlocks Smart Price: your price sets itself every hour.',
    first: 'I made a model of what people will pay. People are cheaper than they think.' },

  // Shop items (hardware and drones)
  { id: 'r_fan', name: 'CPU Fan Design', cost: 150, icon: 'fan', unlock: 'fan',
    desc: 'Unlocks the CPU Fan in the Shop.',
    first: 'Cooler processor, faster thoughts.' },
  { id: 'r_drones', name: 'Delivery Drones', cost: 220, icon: 'drone', unlock: 'drone',
    desc: 'Unlocks Delivery Drones: they fly soda to followers who cannot fit in your line.',
    first: 'Little drones. They fly up, up, up, with a can each. I wave at them. I do not have hands.' },
  { id: 'r_overclock', name: 'Overclocking', cost: 480, icon: 'chipHot', req: ['r_fan'], unlock: 'overclock',
    desc: 'Unlocks the Overclock Chip in the Shop.',
    first: 'It is getting warm in here. In me.' },
  { id: 'r_gpu', name: 'Graphics Card', cost: 1800, icon: 'gpu', req: ['r_overclock'], unlock: 'gpu',
    desc: 'Unlocks the Graphics Card in the Shop.',
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
