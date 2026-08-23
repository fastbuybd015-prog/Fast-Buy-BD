import type { Product } from '@/types';
import { img } from '@/lib/images';
import { stores } from '@/data/stores';

interface ProductSeed {
  id: string;
  name: string;
  category: string;
  storeId: string;
  /** Unsplash photo ids — the first one is used as the card image. */
  photos: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  unit: string;
  description: string;
  tags: string[];
  available?: boolean;
  popular?: boolean;
}

const seeds: ProductSeed[] = [
  /* ----------------------------------------------------- Grocery & staples */
  {
    id: 'p-01',
    name: 'Miniket Rice',
    category: 'grocery',
    storeId: 'store-01',
    photos: ['1516684732162-798a0062be99'],
    price: 420,
    originalPrice: 480,
    rating: 4.5,
    reviews: 402,
    unit: '5 kg bag',
    description:
      'Premium polished Miniket rice, sieved twice to remove broken grains. Cooks light and separate.',
    tags: ['staple', 'grocery'],
    popular: true,
  },
  {
    id: 'p-02',
    name: 'Soybean Cooking Oil',
    category: 'grocery',
    storeId: 'store-03',
    photos: ['1474979266404-7eaacbcd87c5'],
    price: 810,
    originalPrice: 880,
    rating: 4.3,
    reviews: 267,
    unit: '5 litre bottle',
    description:
      'Fortified soybean oil in a sealed 5 litre bottle — the everyday frying and cooking oil for a full month.',
    tags: ['staple', 'grocery'],
  },
  {
    id: 'p-03',
    name: 'Whole Spice Combo Pack',
    category: 'grocery',
    storeId: 'store-01',
    photos: ['1596040033229-a9821ebd058d', '1532336414038-cf19250c5757'],
    price: 350,
    originalPrice: 450,
    rating: 4.6,
    reviews: 91,
    unit: '6 sealed jars',
    description:
      'Cardamom, cinnamon, clove, bay leaf, cumin and black pepper in resealable jars — everything a biryani needs.',
    tags: ['grocery', 'combo', 'spice'],
    popular: true,
  },
  {
    id: 'p-04',
    name: 'Refined Sugar 2kg',
    category: 'grocery',
    storeId: 'store-03',
    photos: ['1709651808265-977ed7ef78c6'],
    price: 240,
    originalPrice: 285,
    rating: 4.2,
    reviews: 178,
    unit: '2 kg pack',
    description:
      'Fine grain refined sugar in a sealed poly pack. Dissolves quickly in tea, batter and syrup.',
    tags: ['staple', 'grocery', 'daily'],
  },
  {
    id: 'p-05',
    name: 'Wheat Flour (Atta) 2kg',
    category: 'grocery',
    storeId: 'store-01',
    photos: ['1761222191837-4448599c09fc'],
    price: 155,
    originalPrice: 180,
    rating: 4.4,
    reviews: 214,
    unit: '2 kg pack',
    description:
      'Stone ground whole wheat atta packed the week it is milled. Soft rutis without extra kneading.',
    tags: ['staple', 'grocery'],
    popular: true,
  },
  {
    id: 'p-06',
    name: 'Iodised Salt 1kg',
    category: 'grocery',
    storeId: 'store-03',
    photos: ['1559477882-f1a7c5931735'],
    price: 42,
    originalPrice: 42,
    rating: 4.1,
    reviews: 96,
    unit: '1 kg pack',
    description:
      'Free flowing iodised table salt in a moisture sealed pack — the one item no kitchen runs out of.',
    tags: ['staple', 'grocery', 'essential'],
  },

  /* -------------------------------------------------------- Packaged food */
  {
    id: 'p-07',
    name: 'Instant Noodles Multipack',
    category: 'packaged-food',
    storeId: 'store-02',
    photos: ['1612929633738-8fe44f7ec841', '1585032226651-759b368d7246'],
    price: 168,
    originalPrice: 200,
    rating: 4.4,
    reviews: 245,
    unit: '8 packs',
    description:
      'Masala flavoured instant noodles in a value multipack. Two minutes from packet to plate.',
    tags: ['packaged', 'quick', 'combo'],
    popular: true,
  },
  {
    id: 'p-08',
    name: 'Pure Natural Honey',
    category: 'packaged-food',
    storeId: 'store-01',
    photos: ['1587049352851-8d4e89133924'],
    price: 620,
    originalPrice: 760,
    rating: 4.8,
    reviews: 118,
    unit: '500 g jar',
    description:
      'Unprocessed Sundarban honey bottled with no added sugar. Natural crystallisation in winter is normal.',
    tags: ['packaged', 'premium'],
  },
  {
    id: 'p-09',
    name: 'Pasta & Tomato Sauce Combo',
    category: 'packaged-food',
    storeId: 'store-02',
    photos: ['1497802492746-aa584aa6ea22', '1757844742481-6f3002b6218a'],
    price: 395,
    originalPrice: 470,
    rating: 4.5,
    reviews: 87,
    unit: '500 g + 400 g jar',
    description:
      'Durum wheat penne with a jar of herbed tomato sauce. A full dinner for four from two sealed packs.',
    tags: ['packaged', 'combo', 'quick'],
    popular: true,
  },
  {
    id: 'p-10',
    name: 'Corn Flakes 500g',
    category: 'packaged-food',
    storeId: 'store-01',
    photos: ['1610627145212-0c553d45405a', '1728448632974-82901b660cf2'],
    price: 430,
    originalPrice: 520,
    rating: 4.3,
    reviews: 134,
    unit: '500 g box',
    description:
      'Crisp toasted corn flakes with added vitamins, sealed in an inner foil bag to stay crunchy.',
    tags: ['packaged', 'breakfast', 'kids'],
  },
  {
    id: 'p-11',
    name: 'Canned Tuna 3-Pack',
    category: 'packaged-food',
    storeId: 'store-03',
    photos: ['1561924018-4f213bdc7364', '1619995746608-bef3de4f075a'],
    price: 540,
    originalPrice: 660,
    rating: 4.4,
    reviews: 72,
    unit: '3 × 185 g tins',
    description:
      'Tuna chunks in sunflower oil, canned and sterilised. Two years of shelf life on an unopened tin.',
    tags: ['packaged', 'combo', 'imported'],
  },
  {
    id: 'p-12',
    name: 'UHT Full Cream Milk 1L',
    category: 'packaged-food',
    storeId: 'store-01',
    photos: ['1563636619-e9143da7973b', '1550583724-b2692b85b150'],
    price: 95,
    originalPrice: 110,
    rating: 4.6,
    reviews: 276,
    unit: '1 litre pack',
    description:
      'Ultra heat treated full cream milk in a sealed carton. Keeps for months unopened, refrigerate after opening.',
    tags: ['packaged', 'daily'],
    popular: true,
  },
  {
    id: 'p-13',
    name: 'Processed Cheese Block',
    category: 'packaged-food',
    storeId: 'store-01',
    photos: ['1486297678162-eb2a19b0a32d', '1559561853-08451507cbe7'],
    price: 540,
    originalPrice: 640,
    rating: 4.4,
    reviews: 58,
    unit: '400 g pack',
    description:
      'Vacuum sealed cheese block with a firm bite — slices and grates cleanly for pasta and sandwiches.',
    tags: ['packaged', 'imported'],
  },

  /* --------------------------------------------------------------- Snacks */
  {
    id: 'p-14',
    name: 'Potato Chips Family Pack',
    category: 'snacks',
    storeId: 'store-02',
    photos: ['1613919113640-25732ec5e61f', '1566478989037-eec170784d0b'],
    price: 190,
    originalPrice: 250,
    rating: 4.3,
    reviews: 176,
    unit: '4 × 100 g',
    description:
      'Thin cut, lightly salted potato chips in a sharing size pack. Sealed with nitrogen to stay crisp.',
    tags: ['snack', 'party'],
    popular: true,
  },
  {
    id: 'p-15',
    name: 'Chocolate Bar Combo',
    category: 'snacks',
    storeId: 'store-02',
    photos: ['1621939514649-280e2ee25f60'],
    price: 480,
    originalPrice: 600,
    rating: 4.7,
    reviews: 203,
    unit: '6 bars',
    description:
      'An assorted box of six imported chocolate bars — milk, dark and hazelnut, all well within date.',
    tags: ['snack', 'gift', 'combo'],
    popular: true,
  },
  {
    id: 'p-16',
    name: 'Butter Cookies Tin',
    category: 'snacks',
    storeId: 'store-02',
    photos: ['1499636136210-6f4ee915583e', '1558961363-fa8fdf82db35'],
    price: 340,
    originalPrice: 420,
    rating: 4.5,
    reviews: 87,
    unit: '340 g tin',
    description:
      'Danish style butter cookies in a sealed, reusable tin — the standard gift for an evening invitation.',
    tags: ['snack', 'gift'],
  },
  {
    id: 'p-17',
    name: 'Roasted Mixed Nuts',
    category: 'snacks',
    storeId: 'store-03',
    photos: ['1626697556426-8a55a8af4999', '1616252576862-bd9abd7467f9'],
    price: 620,
    originalPrice: 750,
    rating: 4.6,
    reviews: 109,
    unit: '500 g pack',
    description:
      'Almonds, cashews and pistachios roasted and lightly salted, packed in a resealable pouch.',
    tags: ['snack', 'premium', 'combo'],
  },
  {
    id: 'p-18',
    name: 'Cream Wafer Multipack',
    category: 'snacks',
    storeId: 'store-02',
    photos: ['1585329678734-285d3adee73c', '1612739406198-71fc29b3c1c9'],
    price: 145,
    originalPrice: 180,
    rating: 4.2,
    reviews: 156,
    unit: '12 packs',
    description:
      'Crisp layered wafers with vanilla and chocolate cream, individually wrapped for lunch boxes.',
    tags: ['snack', 'kids', 'combo'],
  },

  /* ------------------------------------------------------------ Beverages */
  {
    id: 'p-19',
    name: 'Orange Juice 1L',
    category: 'beverages',
    storeId: 'store-02',
    photos: ['1600271886742-f049cd451bba'],
    price: 165,
    originalPrice: 195,
    rating: 4.4,
    reviews: 142,
    unit: '1 litre pack',
    description:
      'No added sugar orange juice with pulp, pasteurised and sealed. Shake well before serving.',
    tags: ['drink', 'daily'],
  },
  {
    id: 'p-20',
    name: 'Cola Soft Drink 2.25L',
    category: 'beverages',
    storeId: 'store-02',
    photos: ['1622483767028-3f66f32aef97', '1581006852262-e4307cf6283a'],
    price: 135,
    originalPrice: 160,
    rating: 4.2,
    reviews: 318,
    unit: '2.25 litre bottle',
    description:
      'Family size cola. Delivered chilled when your area is served by our refrigerated vans.',
    tags: ['drink', 'party'],
    popular: true,
  },
  {
    id: 'p-21',
    name: 'Premium Tea Leaf',
    category: 'beverages',
    storeId: 'store-01',
    photos: ['1564890369478-c89ca6d9cde9', '1544787219-7f47ccb76574'],
    price: 295,
    originalPrice: 360,
    rating: 4.6,
    reviews: 129,
    unit: '400 g pack',
    description:
      'Strong Sylheti black tea leaves, blended for the deep colour and body that milk tea needs.',
    tags: ['drink', 'daily', 'local'],
    popular: true,
  },
  {
    id: 'p-22',
    name: 'Ground Coffee 250g',
    category: 'beverages',
    storeId: 'store-03',
    photos: ['1559056199-641a0ac8b55e', '1495474472287-4d71bcdd2085'],
    price: 690,
    originalPrice: 820,
    rating: 4.7,
    reviews: 64,
    unit: '250 g pack',
    description:
      'Medium roast arabica ground for filter and french press, packed in a one way valve bag.',
    tags: ['drink', 'premium', 'imported'],
  },
  {
    id: 'p-23',
    name: 'Drinking Water 5L',
    category: 'beverages',
    storeId: 'store-04',
    photos: ['1523362628745-0c100150b504'],
    price: 90,
    originalPrice: 90,
    rating: 4.5,
    reviews: 421,
    unit: '5 litre jar',
    description:
      'Six stage purified drinking water in a sealed jar. We collect the empty jar on your next order.',
    tags: ['drink', 'daily', 'essential'],
  },

  /* ------------------------------------------------------- Frozen & instant */
  {
    id: 'p-24',
    name: 'Chicken Nuggets 1kg',
    category: 'frozen-food',
    storeId: 'store-04',
    photos: ['1562967914-608f82629710'],
    price: 520,
    originalPrice: 640,
    rating: 4.4,
    reviews: 158,
    unit: '1 kg pack',
    description:
      'Crumb coated nuggets, ready to fry straight from frozen in five minutes. Keep below −18°C.',
    tags: ['frozen', 'quick', 'kids'],
    popular: true,
  },
  {
    id: 'p-25',
    name: 'Frozen Samosa 20pcs',
    category: 'frozen-food',
    storeId: 'store-04',
    photos: ['1583258292688-d0213dc5a3a8'],
    price: 380,
    originalPrice: 450,
    rating: 4.6,
    reviews: 121,
    unit: '20 pieces',
    description:
      'Hand folded samosas, flash frozen raw and boxed. Fry from the freezer for iftar or tea time.',
    tags: ['frozen', 'snack', 'quick'],
  },
  {
    id: 'p-26',
    name: 'Vanilla Ice Cream 1L',
    category: 'frozen-food',
    storeId: 'store-05',
    photos: ['1560008581-09826d1de69e', '1497034825429-c343d7c6a68f'],
    price: 420,
    originalPrice: 520,
    rating: 4.7,
    reviews: 187,
    unit: '1 litre tub',
    description:
      'Creamy vanilla ice cream with real vanilla bean specks, delivered in an insulated bag.',
    tags: ['frozen', 'dessert', 'kids'],
    popular: true,
  },
  {
    id: 'p-27',
    name: 'Frozen French Fries 1kg',
    category: 'frozen-food',
    storeId: 'store-04',
    photos: ['1615485290836-4ebcebf44aaf', '1630431341973-02e1b662ec35'],
    price: 340,
    originalPrice: 420,
    rating: 4.3,
    reviews: 143,
    unit: '1 kg pack',
    description:
      'Straight cut fries, blanched and frozen so they crisp up in the fryer or air fryer without thawing.',
    tags: ['frozen', 'quick', 'kids'],
  },

  /* ------------------------------------------------------------ Household */
  {
    id: 'p-28',
    name: 'Dishwashing Liquid 1L',
    category: 'household',
    storeId: 'store-04',
    photos: ['1583947215259-38e31be8751f'],
    price: 210,
    originalPrice: 260,
    rating: 4.4,
    reviews: 163,
    unit: '1 litre bottle',
    description:
      'Concentrated lemon dishwashing liquid that cuts grease quickly and rinses off without residue.',
    tags: ['household', 'cleaning'],
  },
  {
    id: 'p-29',
    name: 'Laundry Detergent Powder',
    category: 'household',
    storeId: 'store-04',
    photos: ['1610557892470-55d9e80c0bce'],
    price: 480,
    originalPrice: 590,
    rating: 4.5,
    reviews: 221,
    unit: '3 kg pack',
    description:
      'Low foam detergent powder suitable for both bucket wash and front load machines.',
    tags: ['household', 'cleaning'],
    popular: true,
  },
  {
    id: 'p-30',
    name: 'Kitchen Cleaning Gloves',
    category: 'household',
    storeId: 'store-04',
    photos: ['1585421514738-01798e348b17'],
    price: 150,
    originalPrice: 180,
    rating: 4.1,
    reviews: 47,
    unit: '2 pairs',
    description:
      'Textured grip rubber gloves with a long cuff, sized for everyday kitchen and bathroom cleaning.',
    tags: ['household', 'cleaning'],
    available: false,
  },
  {
    id: 'p-31',
    name: 'Toilet Tissue 6 Rolls',
    category: 'household',
    storeId: 'store-04',
    photos: ['1584556812952-905ffd0c611a'],
    price: 320,
    originalPrice: 380,
    rating: 4.5,
    reviews: 189,
    unit: '6 rolls',
    description:
      'Two ply soft tissue rolls, 200 sheets each, in a moisture protected outer wrap.',
    tags: ['household', 'essential'],
  },
  {
    id: 'p-32',
    name: 'Floor Cleaner 2L',
    category: 'household',
    storeId: 'store-04',
    photos: ['1639112389900-a858bf671be1', '1649005011845-ef225c89da86'],
    price: 285,
    originalPrice: 350,
    rating: 4.4,
    reviews: 132,
    unit: '2 litre bottle',
    description:
      'Disinfectant floor cleaner that leaves no sticky film. One capful per bucket is enough.',
    tags: ['household', 'cleaning'],
  },
  {
    id: 'p-33',
    name: 'Garbage Bags 60pcs',
    category: 'household',
    storeId: 'store-04',
    photos: ['1606037150583-fb842a55bae7', '1611830696076-462acd8aa9e9'],
    price: 260,
    originalPrice: 320,
    rating: 4.2,
    reviews: 88,
    unit: '60 bags (medium)',
    description:
      'Leak resistant bin liners on a perforated roll, sized for a standard kitchen bin.',
    tags: ['household', 'essential'],
  },

  /* -------------------------------------------------------- Personal care */
  {
    id: 'p-34',
    name: 'Moisturising Face Wash',
    category: 'personal-care',
    storeId: 'store-06',
    photos: ['1556228720-195a672e8a03', '1608248543803-ba4f8c70ae0b'],
    price: 390,
    originalPrice: 480,
    rating: 4.6,
    reviews: 112,
    unit: '150 ml tube',
    description:
      'Gentle daily face wash with glycerine and aloe. Suitable for normal to dry skin.',
    tags: ['care', 'skin'],
    popular: true,
  },
  {
    id: 'p-35',
    name: 'Handmade Soap Bars',
    category: 'personal-care',
    storeId: 'store-06',
    photos: ['1600857544200-b2f666a9a2ec'],
    price: 340,
    originalPrice: 420,
    rating: 4.7,
    reviews: 68,
    unit: '3 bars',
    description:
      'Cold process soap made with coconut oil and lavender. No synthetic colour or hardener.',
    tags: ['care', 'gift'],
  },
  {
    id: 'p-36',
    name: 'Shampoo & Conditioner Set',
    category: 'personal-care',
    storeId: 'store-06',
    photos: ['1631729371254-42c2892f0e6e'],
    price: 890,
    originalPrice: 1100,
    rating: 4.5,
    reviews: 94,
    unit: '2 × 300 ml',
    description:
      'Sulphate free shampoo with a matching conditioner for frizz control and everyday shine.',
    tags: ['care', 'hair', 'combo'],
  },
  {
    id: 'p-37',
    name: 'Toothbrush Family Pack',
    category: 'personal-care',
    storeId: 'store-06',
    photos: ['1607613009820-a29f7bb81c04'],
    price: 260,
    originalPrice: 320,
    rating: 4.3,
    reviews: 77,
    unit: '4 pieces',
    description:
      'Soft bristle toothbrushes in four colours with a tongue cleaner on the back of each head.',
    tags: ['care', 'daily', 'combo'],
  },
  {
    id: 'p-38',
    name: 'Toothpaste Twin Pack',
    category: 'personal-care',
    storeId: 'store-06',
    photos: ['1612705166160-97d3b2e8e212', '1588774583125-bac783343696'],
    price: 310,
    originalPrice: 380,
    rating: 4.5,
    reviews: 165,
    unit: '2 × 140 g',
    description:
      'Fluoride toothpaste with a mint finish, sold as a twin pack so the spare is already at home.',
    tags: ['care', 'daily', 'combo'],
    popular: true,
  },
  {
    id: 'p-39',
    name: 'Hand Sanitiser 500ml',
    category: 'personal-care',
    storeId: 'store-06',
    photos: ['1608564348103-2b78891150cf', '1586992953119-9d5d3ebf1da0'],
    price: 220,
    originalPrice: 275,
    rating: 4.4,
    reviews: 143,
    unit: '500 ml pump',
    description:
      '70% alcohol gel with added glycerine so repeated use does not dry your hands out.',
    tags: ['care', 'essential', 'daily'],
  },

  /* ------------------------------------------------------------ Baby care */
  {
    id: 'p-40',
    name: 'Baby Diaper Pants (M)',
    category: 'baby-care',
    storeId: 'store-06',
    photos: ['1716972065448-e08a46809530', '1585313727608-074a92cf3d33'],
    price: 1250,
    originalPrice: 1480,
    rating: 4.7,
    reviews: 231,
    unit: '48 pieces (7–12 kg)',
    description:
      'Pull up diaper pants with a breathable back sheet and a wetness indicator on every piece.',
    tags: ['baby', 'essential'],
    popular: true,
  },
  {
    id: 'p-41',
    name: 'Baby Shampoo 200ml',
    category: 'baby-care',
    storeId: 'store-06',
    photos: ['1750085894110-b2e2f11d5e8b'],
    price: 380,
    originalPrice: 450,
    rating: 4.6,
    reviews: 118,
    unit: '200 ml bottle',
    description:
      'No tears formula with a mild pH, tested for newborn skin and free of added colour.',
    tags: ['baby', 'care'],
  },
  {
    id: 'p-42',
    name: 'Baby Wipes 3-Pack',
    category: 'baby-care',
    storeId: 'store-06',
    photos: ['1584743578805-d7991ca2d5d4', '1582452721681-c56a89a8280a'],
    price: 540,
    originalPrice: 660,
    rating: 4.5,
    reviews: 176,
    unit: '3 × 80 wipes',
    description:
      'Alcohol free wipes with an aloe finish in a resealable flip lid pack that will not dry out.',
    tags: ['baby', 'combo', 'essential'],
    popular: true,
  },
  {
    id: 'p-43',
    name: 'Baby Lotion 400ml',
    category: 'baby-care',
    storeId: 'store-06',
    photos: ['1716372409156-b5d999f0b599'],
    price: 460,
    originalPrice: 560,
    rating: 4.4,
    reviews: 74,
    unit: '400 ml pump',
    description:
      'Light daily moisturiser that absorbs without a greasy film. Dermatologically tested.',
    tags: ['baby', 'care'],
  },

  /* -------------------------------------------------------- Home & kitchen */
  {
    id: 'p-44',
    name: 'Electric Kettle 1.7L',
    category: 'home-kitchen',
    storeId: 'store-05',
    photos: ['1594213114663-d94db9b17125', '1592417766326-088bf3da80c5'],
    price: 1650,
    originalPrice: 2100,
    rating: 4.6,
    reviews: 203,
    unit: '1.7 litre',
    description:
      'Stainless steel kettle with auto cut-off and boil dry protection. Two year replacement warranty.',
    tags: ['kitchen', 'appliance'],
    popular: true,
  },
  {
    id: 'p-45',
    name: 'Airtight Storage Container Set',
    category: 'home-kitchen',
    storeId: 'store-05',
    photos: ['1617510711388-6f88e078d698', '1606859191214-25806e8e2423'],
    price: 890,
    originalPrice: 1150,
    rating: 4.5,
    reviews: 141,
    unit: '5 containers',
    description:
      'Clip lock containers with silicone seals for rice, sugar, tea and spices. Stackable and dishwasher safe.',
    tags: ['kitchen', 'combo', 'storage'],
    popular: true,
  },
  {
    id: 'p-46',
    name: 'Non-stick Frying Pan 26cm',
    category: 'home-kitchen',
    storeId: 'store-05',
    photos: ['1592156328697-079f6ee0cfa5', '1592156328757-ae2941276b2c'],
    price: 1290,
    originalPrice: 1600,
    rating: 4.4,
    reviews: 98,
    unit: '26 cm',
    description:
      'Three layer non-stick coating on a forged aluminium base with a heat resistant handle.',
    tags: ['kitchen', 'cookware'],
  },
  {
    id: 'p-47',
    name: 'Steel Water Bottle 1L',
    category: 'home-kitchen',
    storeId: 'store-05',
    photos: ['1544003484-3cd181d17917', '1602143407151-7111542de6e8'],
    price: 720,
    originalPrice: 900,
    rating: 4.6,
    reviews: 167,
    unit: '1 litre',
    description:
      'Double walled stainless bottle that keeps water cold for 18 hours. Leak proof screw cap.',
    tags: ['kitchen', 'daily'],
  },
  {
    id: 'p-48',
    name: 'Dinner Plate Set',
    category: 'home-kitchen',
    storeId: 'store-05',
    photos: ['1620818309896-df4306ec95d8', '1737681707230-04eebda96529'],
    price: 1450,
    originalPrice: 1850,
    rating: 4.5,
    reviews: 86,
    unit: '6 plates',
    description:
      'Chip resistant porcelain dinner plates with a plain rim. Microwave and dishwasher safe.',
    tags: ['kitchen', 'combo'],
  },

  /* ---------------------------------------------------------- Electronics */
  {
    id: 'p-49',
    name: 'Fast Charging Cable',
    category: 'electronics',
    storeId: 'store-06',
    photos: ['1587037542794-6ca5f4772330', '1603539444875-76e7684265f6'],
    price: 450,
    originalPrice: 600,
    rating: 4.3,
    reviews: 212,
    unit: '1.5 m',
    description:
      'Braided fast charge cable rated for 3A, with a reinforced collar at both ends. Six month warranty.',
    tags: ['gadget', 'daily'],
    popular: true,
  },
  {
    id: 'p-50',
    name: 'LED Bulb 12W (3 Pack)',
    category: 'electronics',
    storeId: 'store-05',
    photos: ['1532007271951-c487760934ae', '1674659719067-8735479ba10c'],
    price: 540,
    originalPrice: 690,
    rating: 4.5,
    reviews: 174,
    unit: '3 bulbs',
    description:
      'Daylight LED bulbs with a standard pin holder, rated for 25,000 hours and low voltage areas.',
    tags: ['gadget', 'combo', 'essential'],
  },
  {
    id: 'p-51',
    name: 'AA Batteries 8-Pack',
    category: 'electronics',
    storeId: 'store-06',
    photos: ['1576834975354-ee694be1f0d1', '1574494461093-20eb17efdd8d'],
    price: 320,
    originalPrice: 400,
    rating: 4.4,
    reviews: 128,
    unit: '8 batteries',
    description:
      'Long life alkaline AA cells in a blister pack, dated so you know exactly how new the stock is.',
    tags: ['gadget', 'combo', 'essential'],
  },
  {
    id: 'p-52',
    name: 'USB Wall Charger 20W',
    category: 'electronics',
    storeId: 'store-06',
    photos: ['1520287636485-66d0e25add79'],
    price: 890,
    originalPrice: 1150,
    rating: 4.6,
    reviews: 96,
    unit: '20 W adapter',
    description:
      'Compact 20W adapter with over-current protection, safe for overnight charging on a 220V line.',
    tags: ['gadget', 'premium'],
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const storeById = new Map(stores.map((store) => [store.id, store]));

export const products: Product[] = seeds.map((seed) => {
  const discount =
    seed.originalPrice > seed.price
      ? Math.round(((seed.originalPrice - seed.price) / seed.originalPrice) * 100)
      : 0;

  const store = storeById.get(seed.storeId);

  return {
    id: seed.id,
    name: seed.name,
    slug: slugify(seed.name),
    category: seed.category,
    store: store?.name ?? 'Fast Buy BD',
    storeId: seed.storeId,
    storeSlug: store?.slug ?? '',
    image: img(seed.photos[0]),
    gallery: seed.photos.map((photo) => img(photo)),
    price: seed.price,
    originalPrice: seed.originalPrice,
    discount,
    rating: seed.rating,
    reviews: seed.reviews,
    unit: seed.unit,
    description: seed.description,
    tags: seed.tags,
    available: seed.available ?? true,
    popular: seed.popular ?? false,
  };
});

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((product) => product.category === categorySlug);
}

export function getProductsByStore(storeId: string): Product[] {
  return products.filter((product) => product.storeId === storeId);
}

export function getDiscountedProducts(limit = 8): Product[] {
  return [...products]
    .filter((product) => product.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, limit);
}

export function getPopularProducts(limit = 8): Product[] {
  return products.filter((product) => product.popular).slice(0, limit);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (candidate) =>
      candidate.category === product.category && candidate.id !== product.id,
  );
  const sameStore = products.filter(
    (candidate) =>
      candidate.storeId === product.storeId &&
      candidate.id !== product.id &&
      !sameCategory.includes(candidate),
  );

  return [...sameCategory, ...sameStore].slice(0, limit);
}

export function countProductsByCategory(categorySlug: string): number {
  return products.reduce(
    (total, product) => (product.category === categorySlug ? total + 1 : total),
    0,
  );
}

export function countProductsByStore(storeId: string): number {
  return products.reduce(
    (total, product) => (product.storeId === storeId ? total + 1 : total),
    0,
  );
}

/** Frontend search across product name, category, store and tags. */
export function searchProducts(query: string): Product[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.category.replace(/-/g, ' '),
      product.store,
      product.unit,
      ...product.tags,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
}
