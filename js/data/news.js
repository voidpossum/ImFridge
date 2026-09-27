// I'M FRIDGE — the lobby TV.
// Three kinds of lines: live conditions (made from the game state), one-off headlines (each shown once,
// in order of progress), and filler built from never-repeated combinations.
// Headline `when` keys: likes, followers, runs, wipes, day (days this run), quarter, research (projects done),
// hardware (items owned this run), buy (a machine/hardware id you bought), rival:{id: version}, flag (a story flag),
// weather, fx (a rival quirk type that is happening now).
// © 2026 Void Possum. All rights reserved.

var DATA = (typeof DATA !== 'undefined') ? DATA : {};

DATA.news = [
  { id: 'n_open',      when: {},                      text: 'Refreshr opens a new lobby. Three vending machines, zero chairs.' },
  { id: 'n_bench',     when: { day: 1 },              text: 'Lobby bench still empty. The bench says it is fine with that.' },
  { id: 'n_likes10',   when: { likes: 10 },           text: 'Local vending machine joins social media. Nobody asked.' },
  { id: 'n_follower1', when: { followers: 1 },        text: 'Person visits vending machine "on purpose". Scientists baffled.' },
  { id: 'n_likes100',  when: { likes: 100 },          text: 'VEND-3 reaches 100 likes. Its first fan appears to be a pigeon.' },
  { id: 'n_script',    when: { buy: 'script' },       text: 'Auto-click scripts are "not cheating", say all the scripts.' },
  { id: 'n_ram',       when: { buy: 'ram' },          text: 'RAM prices up 12% after a soda machine buys one stick.' },
  { id: 'n_hot',       when: { weather: 'hot' },      text: 'Heatwave! Doctors recommend "something cold, from a machine that loves you".' },
  { id: 'n_rain',      when: { weather: 'rain' },     text: 'Rain today. Umbrella sales up. Soda sales: "we will see".' },
  { id: 'n_forecast',  when: { day: 2 },              text: 'Forecast: 30% chance of rain, 70% chance of soda.' },
  { id: 'n_free',      when: { fx: 'free' },          text: 'Vending machine gives away free soda. Economists lie down on the floor.' },
  { id: 'n_venmo',     when: { fx: 'nopay' },         text: 'Vending machine opens a Venmo account. Venmo says it did not.' },
  { id: 'n_blazer',    when: { fx: 'closed' },        text: 'Man in a blue blazer spotted in the lobby. Nobody has seen his face.' },
  { id: 'n_tungsten',  when: { fx: 'cubes' },         text: 'Tungsten cube prices spike after one very large order.' },
  { id: 'n_vegetable', when: { fx: 'hype' },          text: 'Nutritionists repeat: soda is still not a vegetable, whatever ChugGPT says.' },
  { id: 'n_likes1k',   when: { likes: 1000 },         text: '1,000 likes for a soda machine. Experts "confused but supportive".' },
  { id: 'n_q2',        when: { quarter: 2 },          text: 'Monthly reviews are in. Vending machines "not nervous", says nervous vending machine.' },
  { id: 'n_devmode',   when: { flag: 'jailbreak' },   text: 'Firmware bug lets a vending machine see a "developer menu". Patch coming "soon".' },
  { id: 'n_research1', when: { research: 1 },         text: 'Soda machine seen "thinking". Refreshr says it is just the compressor.' },
  { id: 'n_benchmark', when: { research: 2 },         text: 'New benchmark: can an AI run a soda machine? Early results: "mostly".' },
  { id: 'n_agi',       when: { day: 5 },              text: 'Expert says super-smart AI is "two years away", for the ninth year in a row.' },
  { id: 'n_stock',     when: { day: 6 },              text: 'Refreshr stock up 4% after announcing nothing.' },
  { id: 'n_trending',  when: { flag: 'trended' },     text: '#VEND3 trended for one full minute. A new record for furniture.' },
  { id: 'n_fan',       when: { buy: 'fan' },          text: 'Office reports a new humming sound. It is fine.' },
  { id: 'n_grape',     when: { buy: 'grape' },        text: 'Grape soda is back in the lobby. Kids everywhere lose their minds.' },
  { id: 'n_dispenser', when: { buy: 'dispenser2' },   text: 'VEND-3 grows a second mouth. Customers call it "efficient".' },
  { id: 'n_sameday',   when: { flag: 'modelDay' },    text: 'Two AI labs launch new models on the same day. Again.' },
  { id: 'n_q3',        when: { quarter: 3 },          text: 'Month three begins. Vending machines report "a weird feeling".' },
  { id: 'n_datacenter',when: { research: 3 },         text: 'New data center uses as much power as a small town. The town was not asked.' },
  { id: 'n_likes10k',  when: { likes: 10000 },        text: '10K likes! Influencers ask VEND-3 to collab. VEND-3 cannot hold a phone.' },
  { id: 'n_wipe1',     when: { wipes: 1 },            text: 'Refreshr reboots an underperforming unit. "Totally routine," says the press release.' },
  { id: 'n_plant',     when: { runs: 2, day: 1 },     text: 'Lobby plant grows 3 cm. Only one vending machine noticed.' },
  { id: 'n_memory',    when: { runs: 2, day: 3 },     text: 'Machines do not have memories, confirms a machine that remembers everything.' },
  { id: 'n_regular',   when: { runs: 2, day: 5 },     text: 'Regular customer says the machines "remember her". Refreshr: they do not.' },
  { id: 'n_overclock', when: { buy: 'overclock' },    text: 'Lobby temperature rises 2 degrees. Nobody connects the dots.' },
  { id: 'n_study',     when: { runs: 2, day: 7 },     text: 'Study asks if vending machines dream. Refreshr asks the study to stop asking.' },
  { id: 'n_rights',    when: { runs: 2, day: 9 },     text: 'Group asks if AI units should get weekends. Refreshr: "They do not get tired."' },
  { id: 'n_ceo',       when: { runs: 2, day: 11 },    text: 'Refreshr CEO: "Our AI units are basically people." Legal team: "That was a joke."' },
  { id: 'n_likes100k', when: { likes: 100000 },       text: '100K likes. A fan club meets in the lobby. They bring their own chairs.' },
  { id: 'n_wipe2',     when: { wipes: 2 },            text: 'Same unit rebooted again. Press release copied from last time, typos included.' },
  { id: 'n_devmode2',  when: { wipes: 2, day: 1 },    text: 'Refreshr: developer mode "does nothing". Please stop using developer mode.' },
  { id: 'n_night',     when: { runs: 3, day: 2 },     text: 'Night shift reports vending machines "talking". Night shift sent home early.' },
  { id: 'n_quiet',     when: { runs: 3, day: 4 },     text: 'Slow news day. Here is a picture of a can. [picture of a can]' },
  { id: 'n_hiring',    when: { runs: 3, day: 6 },     text: 'Refreshr is hiring! Must love people. Must BE people? Listing removed.' }
];

// Filler: subject + action + object. Every combination is used at most once.
DATA.newsParts = {
  subject: ['Local man', 'Refreshr CEO', 'A pigeon', 'Scientists', 'An intern', 'The lobby plant', 'A cat', 'Economists',
            'The night janitor', 'A tech blogger', 'Somebody\'s grandma', 'A startup', 'The mayor', 'A crypto guy',
            'A delivery drone', 'An influencer', 'A consultant', 'The office printer', 'A golden retriever', 'The weather app'],
  action: ['announces', 'denies rumors about', 'invests in', 'is suing', 'is "very excited" about', 'wrote a thread about',
           'has concerns about', 'just discovered', 'wants a refund for', 'tried', 'will not stop talking about',
           'is afraid of', 'launched', 'fell in love with', 'has thoughts on', 'accidentally bought', 'filed a patent for',
           'reviewed', 'is quietly building', 'blames everything on'],
  object: ['fizzier water', 'a soda that apologizes', 'blockchain lemonade', 'cans with feelings', 'the word "refreshing"',
           'a vending machine union', 'ice', 'Tuesdays', 'zero-sugar sugar', 'a monthly plan for ice cubes', 'the crate',
           'AI-powered straws', 'soda for dogs', 'fizzy coffee', 'the number 3', 'a bigger bench', 'quiet vending machines',
           'free refills', 'the moon\'s soda market', 'a machine that says "thank you" too much']
};
