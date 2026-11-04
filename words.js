/* 단어 풀과 레벨 설정 */
(function (g) {
  const POOLS = {
    fruits: 'apple banana cherry grape lemon mango melon orange peach pear plum kiwi lime papaya berry apricot coconut guava lychee pineapple',
    animals: 'dog cat horse tiger lion zebra monkey rabbit turtle dolphin penguin giraffe elephant squirrel kangaroo panda koala camel eagle shark whale snake mouse sheep goat duck frog bear wolf deer owl cow pig hippo rhino parrot lizard spider donkey',
    food: 'bread butter cheese noodle pizza burger salad soup rice egg milk juice coffee sugar salt pepper cookie cake chocolate pasta sandwich pancake yogurt cereal honey candy popcorn steak chicken potato tomato carrot onion garlic cucumber broccoli sausage waffle muffin pudding biscuit',
    school: 'pencil eraser ruler notebook teacher student desk chair board chalk marker paper scissors glue backpack library homework lesson exam quiz class grade math science history english music art recess lunch bell calendar clock globe dictionary textbook folder stapler crayon highlighter classroom principal diploma campus',
    nature: 'mountain river forest ocean desert island valley lake waterfall rainbow thunder lightning snow rain cloud wind storm sunshine breeze fog frost hail flower tree grass leaf branch root seed bush meadow cliff canyon volcano glacier beach cave jungle swamp pond stream planet moon star comet sunset sunrise tornado hurricane earthquake autumn winter spring summer',
    travel: 'airport airplane ticket passport luggage suitcase hotel taxi train station subway bus bridge tunnel road street highway traffic crosswalk sidewalk building tower castle museum theater cinema market bakery pharmacy hospital police bank park garden fountain statue harbor ship ferry boat captain tourist guide camera journey adventure vacation resort camping tent compass map gate runway pilot cruise elevator escalator corner avenue plaza village',
    jobs: 'doctor nurse farmer pilot chef baker artist writer singer dancer actor lawyer judge fireman soldier driver mechanic engineer scientist dentist barber tailor plumber painter builder cashier waiter librarian journalist photographer musician',
    body: 'head hair face eyes nose mouth ears neck shoulder arm elbow wrist hand finger thumb chest stomach back hip leg knee ankle foot toe heel skin bone muscle heart brain lung',
    sports: 'soccer baseball basketball tennis golf swimming running skiing skating surfing boxing karate judo cycling rowing archery fencing bowling hockey rugby cricket volleyball badminton gymnastics wrestling climbing hiking fishing dancing painting drawing reading cooking baking gardening knitting sewing chess puzzle yoga marathon race team coach player referee goal score trophy medal stadium champion',
    feelings: 'happy sad angry proud brave calm shy kind funny lazy clever gentle honest curious excited nervous worried lonely cheerful grateful patient friendly polite jealous bored sleepy hungry thirsty tired',
    clothes: 'shirt dress pants jeans shorts skirt jacket sweater scarf gloves hat cap socks shoes boots sandals sneakers pajamas uniform necklace bracelet earrings umbrella belt tie vest coat',
    house: 'attic basement bathroom bathtub bed bedroom bench blanket blender book bookcase bowl broom brush cabinet candle carpet chair clock closet clothes coaster coat comb computer conditioner couch counter cup curtains cushion desk detergent dishwasher door drawer dresser dryer fan floor fork frame glass hanger hook iron keys kitchen knife knob lamp light mattress microwave mirror mop ottoman outlet oven pan pantry paper pen photo pillow plate pot purse refrigerator remote rug shampoo sheet shelf shoes shower sink slippers soap socks spatula sponge spoon stairs table teapot television tile tissues toaster toilet toothbrush toothpaste towel trash vacuum vent washcloth washer window',
  };
  for (const k in POOLS) POOLS[k] = POOLS[k].split(/\s+/);

  // dirs: 허용 방향 세트 (0: →↓, 1: +↘, 2: +↗, 3: 8방향 전부)
  const LEVELS = [
    { size: 25, count: 100, title: 'Fruits, Food & Animals', ko: '과일·음식·동물', pools: ['fruits', 'animals', 'food'], dirs: 1 },
    { size: 25, count: 100, title: 'School Days',            ko: '학교·옷·감정',   pools: ['school', 'clothes', 'feelings', 'body'], dirs: 1 },
    { size: 26, count: 100, title: 'Wild Nature',            ko: '자연·여행',      pools: ['nature', 'travel'], dirs: 1 },
    { size: 26, count: 100, title: 'People & Play',          ko: '직업·운동',      pools: ['jobs', 'sports', 'body'], dirs: 2 },
    { size: 27, count: 100, title: 'City Life',              ko: '도시·여행',      pools: ['travel', 'jobs', 'school'], dirs: 2 },
    { size: 28, count: 100, title: 'Everyday Mix',           ko: '일상 종합',      pools: ['food', 'animals', 'clothes', 'feelings', 'sports'], dirs: 3 },
    { size: 28, count: 100, title: 'Nature & Body',          ko: '자연·신체',      pools: ['nature', 'body', 'fruits', 'animals'], dirs: 3 },
    { size: 29, count: 100, title: 'Mixed Master',           ko: '종합',           pools: ['fruits', 'animals', 'food', 'school', 'nature', 'travel', 'jobs', 'body', 'sports', 'feelings', 'clothes'], dirs: 3 },
    { size: 30, count: 100, title: 'Grand Mix',              ko: '대종합',         pools: ['fruits', 'animals', 'food', 'school', 'nature', 'travel', 'jobs', 'body', 'sports', 'feelings', 'clothes', 'house'], dirs: 3 },
    { size: 30, count: 100, title: 'Around the House',       ko: '집 안의 모든 것', pools: ['house'], dirs: 3 },
  ];

  g.WS_DATA = { POOLS, LEVELS };
})(globalThis);
