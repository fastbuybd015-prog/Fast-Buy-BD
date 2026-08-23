/**
 * Seed the database with the existing frontend mock data.
 *
 * Converts frontend/src/data/{categories,stores,products}.ts into real rows
 * across categories, stores, products, product_images, store_products, and
 * inventory tables.
 *
 * Run:  bun scripts/seed.ts
 *
 * Idempotent: uses ON CONFLICT DO NOTHING on slug-based unique indexes,
 * so re-running is safe.
 */

import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const isPooler = (() => {
  try {
    return new URL(databaseUrl).port === "6543";
  } catch {
    return false;
  }
})();

const client = postgres(databaseUrl, {
  prepare: !isPooler,
  max: 1,
  idle_timeout: 10,
  onnotice: () => {},
});

const db = drizzle(client, { schema, casing: "snake_case" });

// ---------------------------------------------------------------------------
// Unsplash URL helpers (mirroring frontend/src/lib/images.ts)
// ---------------------------------------------------------------------------

const UNSPLASH = "https://images.unsplash.com/photo-";

function img(id: string, w = 800, h = 800): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

function banner(id: string, w = 1400, h = 700): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

// ---------------------------------------------------------------------------
// Frontend data (verbatim from frontend/src/data/*)
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    slug: "grocery",
    name: "Grocery & Staples",
    image: "1516684732162-798a0062be99",
    desc: "Rice, oil, sugar and sealed spice packs for the whole month.",
  },
  {
    slug: "packaged-food",
    name: "Packaged Food",
    image: "1762926627741-be85594edbbc",
    desc: "Noodles, pasta, cereal and canned items with a long shelf life.",
  },
  {
    slug: "snacks",
    name: "Snacks",
    image: "1566478989037-eec170784d0b",
    desc: "Chips, biscuits, chocolates and everything for the evening.",
  },
  {
    slug: "beverages",
    name: "Beverages",
    image: "1600271886742-f049cd451bba",
    desc: "Juice, tea, coffee and soft drinks in sealed packs.",
  },
  {
    slug: "frozen-food",
    name: "Frozen & Instant",
    image: "1562967914-608f82629710",
    desc: "Nuggets, samosas and ice cream, straight from the freezer.",
  },
  {
    slug: "household",
    name: "Household",
    image: "1583947215259-38e31be8751f",
    desc: "Cleaning, laundry and kitchen essentials for a tidy home.",
  },
  {
    slug: "personal-care",
    name: "Personal Care",
    image: "1556228720-195a672e8a03",
    desc: "Skin, hair and daily care products from trusted brands.",
  },
  {
    slug: "baby-care",
    name: "Baby Care",
    image: "1734599397715-f030c6d206a0",
    desc: "Diapers, wipes and gentle care for the little one.",
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    image: "1549382534-2876659bf203",
    desc: "Cookware, storage and everyday utensils that last.",
  },
  {
    slug: "electronics",
    name: "Electronics",
    image: "1573868388390-2739872961e6",
    desc: "Cables, bulbs, batteries and chargers you reorder often.",
  },
] as const;

interface StoreSeed {
  slug: string;
  name: string;
  logo: string;
  cover: string;
  city: string;
  area: string;
  rating: number;
  deliveryMin: number;
  deliveryMax: number;
  description: string;
}

const STORES: StoreSeed[] = [
  {
    slug: "fast-mart-superstore",
    name: "Fast Mart Superstore",
    logo: "1542838132-92c53300491e",
    cover: "1578916171728-46686eac8d58",
    city: "Dhaka",
    area: "Dhanmondi",
    rating: 4.8,
    deliveryMin: 30,
    deliveryMax: 45,
    description:
      "A neighbourhood superstore stocking packaged staples, imported brands and daily essentials at fair prices.",
  },
  {
    slug: "daily-basket",
    name: "Daily Basket",
    logo: "1601050690597-df0568f70950",
    cover: "1601050690597-df0568f70950",
    city: "Dhaka",
    area: "Uttara",
    rating: 4.6,
    deliveryMin: 25,
    deliveryMax: 40,
    description:
      "Your everyday basket store — snacks, beverages and household items delivered within the hour.",
  },
  {
    slug: "pack-and-save-wholesale",
    name: "Pack & Save Wholesale",
    logo: "1553413077-190dd305871c",
    cover: "1684695749267-233af13276d0",
    city: "Dhaka",
    area: "Bashundhara R/A",
    rating: 4.9,
    deliveryMin: 35,
    deliveryMax: 50,
    description:
      "Bulk and multipack sizes of the brands you already buy, priced for families who shop once a month.",
  },
  {
    slug: "city-essentials",
    name: "City Essentials",
    logo: "1534723452862-4c874018d66d",
    cover: "1606824722920-4c652a70f348",
    city: "Dhaka",
    area: "Mirpur DOHS",
    rating: 4.5,
    deliveryMin: 40,
    deliveryMax: 60,
    description:
      "Large format store with the widest range of cleaning supplies, laundry care and paper goods.",
  },
  {
    slug: "home-and-living-depot",
    name: "Home & Living Depot",
    logo: "1549382534-2876659bf203",
    cover: "1735204615600-9e959e90a019",
    city: "Chattogram",
    area: "",
    rating: 4.7,
    deliveryMin: 30,
    deliveryMax: 45,
    description:
      "Cookware, storage and small appliances for the kitchen, with a two year warranty on electricals.",
  },
  {
    slug: "careline-daily-needs",
    name: "CareLine Daily Needs",
    logo: "1765031092161-a9ebe556117e",
    cover: "1775217164479-60f937a4b0a4",
    city: "Dhaka",
    area: "Gulshan",
    rating: 4.4,
    deliveryMin: 45,
    deliveryMax: 70,
    description:
      "Personal care, baby care and everyday electronics — all sealed, dated and checked before dispatch.",
  },
];

interface ProductSeed {
  name: string;
  categorySlug: string;
  storeSlug: string;
  photos: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  unit: string;
  description: string;
  tags: string[];
  available: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const PRODUCTS: ProductSeed[] = [
  {
    name: "Miniket Rice",
    categorySlug: "grocery",
    storeSlug: "fast-mart-superstore",
    photos: ["1516684732162-798a0062be99"],
    price: 420,
    originalPrice: 480,
    rating: 4.5,
    reviews: 402,
    unit: "5 kg bag",
    description:
      "Premium polished Miniket rice, sieved twice to remove broken grains. Cooks light and separate.",
    tags: ["staple", "grocery"],
    available: true,
  },
  {
    name: "Soybean Cooking Oil",
    categorySlug: "grocery",
    storeSlug: "pack-and-save-wholesale",
    photos: ["1474979266404-7eaacbcd87c5"],
    price: 810,
    originalPrice: 880,
    rating: 4.3,
    reviews: 267,
    unit: "5 litre bottle",
    description:
      "Fortified soybean oil in a sealed 5 litre bottle — the everyday frying and cooking oil for a full month.",
    tags: ["staple", "grocery"],
    available: true,
  },
  {
    name: "Whole Spice Combo Pack",
    categorySlug: "grocery",
    storeSlug: "fast-mart-superstore",
    photos: ["1596040033229-a9821ebd058d", "1532336414038-cf19250c5757"],
    price: 350,
    originalPrice: 450,
    rating: 4.6,
    reviews: 91,
    unit: "6 sealed jars",
    description:
      "Cardamom, cinnamon, clove, bay leaf, cumin and black pepper in resealable jars — everything a biryani needs.",
    tags: ["grocery", "combo", "spice"],
    available: true,
  },
  {
    name: "Refined Sugar 2kg",
    categorySlug: "grocery",
    storeSlug: "pack-and-save-wholesale",
    photos: ["1709651808265-977ed7ef78c6"],
    price: 240,
    originalPrice: 285,
    rating: 4.2,
    reviews: 178,
    unit: "2 kg pack",
    description:
      "Fine grain refined sugar in a sealed poly pack. Dissolves quickly in tea, batter and syrup.",
    tags: ["staple", "grocery", "daily"],
    available: true,
  },
  {
    name: "Wheat Flour (Atta) 2kg",
    categorySlug: "grocery",
    storeSlug: "fast-mart-superstore",
    photos: ["1761222191837-4448599c09fc"],
    price: 155,
    originalPrice: 180,
    rating: 4.4,
    reviews: 214,
    unit: "2 kg pack",
    description:
      "Stone ground whole wheat atta packed the week it is milled. Soft rutis without extra kneading.",
    tags: ["staple", "grocery"],
    available: true,
  },
  {
    name: "Iodised Salt 1kg",
    categorySlug: "grocery",
    storeSlug: "pack-and-save-wholesale",
    photos: ["1559477882-f1a7c5931735"],
    price: 42,
    originalPrice: 42,
    rating: 4.1,
    reviews: 96,
    unit: "1 kg pack",
    description:
      "Free flowing iodised table salt in a moisture sealed pack — the one item no kitchen runs out of.",
    tags: ["staple", "grocery", "essential"],
    available: true,
  },
  {
    name: "Instant Noodles Multipack",
    categorySlug: "packaged-food",
    storeSlug: "daily-basket",
    photos: ["1612929633738-8fe44f7ec841", "1585032226651-759b368d7246"],
    price: 168,
    originalPrice: 200,
    rating: 4.4,
    reviews: 245,
    unit: "8 packs",
    description:
      "Masala flavoured instant noodles in a value multipack. Two minutes from packet to plate.",
    tags: ["packaged", "quick", "combo"],
    available: true,
  },
  {
    name: "Pure Natural Honey",
    categorySlug: "packaged-food",
    storeSlug: "fast-mart-superstore",
    photos: ["1587049352851-8d4e89133924"],
    price: 620,
    originalPrice: 760,
    rating: 4.8,
    reviews: 118,
    unit: "500 g jar",
    description:
      "Unprocessed Sundarban honey bottled with no added sugar. Natural crystallisation in winter is normal.",
    tags: ["packaged", "premium"],
    available: true,
  },
  {
    name: "Pasta & Tomato Sauce Combo",
    categorySlug: "packaged-food",
    storeSlug: "daily-basket",
    photos: ["1497802492746-aa584aa6ea22", "1757844742481-6f3002b6218a"],
    price: 395,
    originalPrice: 470,
    rating: 4.5,
    reviews: 87,
    unit: "500 g + 400 g jar",
    description:
      "Durum wheat penne with a jar of herbed tomato sauce. A full dinner for four from two sealed packs.",
    tags: ["packaged", "combo", "quick"],
    available: true,
  },
  {
    name: "Corn Flakes 500g",
    categorySlug: "packaged-food",
    storeSlug: "fast-mart-superstore",
    photos: ["1610627145212-0c553d45405a", "1728448632974-82901b660cf2"],
    price: 430,
    originalPrice: 520,
    rating: 4.3,
    reviews: 134,
    unit: "500 g box",
    description:
      "Crisp toasted corn flakes with added vitamins, sealed in an inner foil bag to stay crunchy.",
    tags: ["packaged", "breakfast", "kids"],
    available: true,
  },
  {
    name: "Canned Tuna 3-Pack",
    categorySlug: "packaged-food",
    storeSlug: "pack-and-save-wholesale",
    photos: ["1561924018-4f213bdc7364", "1619995746608-bef3de4f075a"],
    price: 540,
    originalPrice: 660,
    rating: 4.4,
    reviews: 72,
    unit: "3 × 185 g tins",
    description:
      "Tuna chunks in sunflower oil, canned and sterilised. Two years of shelf life on an unopened tin.",
    tags: ["packaged", "combo", "imported"],
    available: true,
  },
  {
    name: "UHT Full Cream Milk 1L",
    categorySlug: "packaged-food",
    storeSlug: "fast-mart-superstore",
    photos: ["1563636619-e9143da7973b", "1550583724-b2692b85b150"],
    price: 95,
    originalPrice: 110,
    rating: 4.6,
    reviews: 276,
    unit: "1 litre pack",
    description:
      "Ultra heat treated full cream milk in a sealed carton. Keeps for months unopened, refrigerate after opening.",
    tags: ["packaged", "daily"],
    available: true,
  },
  {
    name: "Processed Cheese Block",
    categorySlug: "packaged-food",
    storeSlug: "fast-mart-superstore",
    photos: ["1486297678162-eb2a19b0a32d", "1559561853-08451507cbe7"],
    price: 540,
    originalPrice: 640,
    rating: 4.4,
    reviews: 58,
    unit: "400 g pack",
    description:
      "Vacuum sealed cheese block with a firm bite — slices and grates cleanly for pasta and sandwiches.",
    tags: ["packaged", "imported"],
    available: true,
  },
  {
    name: "Potato Chips Family Pack",
    categorySlug: "snacks",
    storeSlug: "daily-basket",
    photos: ["1613919113640-25732ec5e61f", "1566478989037-eec170784d0b"],
    price: 190,
    originalPrice: 250,
    rating: 4.3,
    reviews: 176,
    unit: "4 × 100 g",
    description:
      "Thin cut, lightly salted potato chips in a sharing size pack. Sealed with nitrogen to stay crisp.",
    tags: ["snack", "party"],
    available: true,
  },
  {
    name: "Chocolate Bar Combo",
    categorySlug: "snacks",
    storeSlug: "daily-basket",
    photos: ["1621939514649-280e2ee25f60"],
    price: 480,
    originalPrice: 600,
    rating: 4.7,
    reviews: 203,
    unit: "6 bars",
    description:
      "An assorted box of six imported chocolate bars — milk, dark and hazelnut, all well within date.",
    tags: ["snack", "gift", "combo"],
    available: true,
  },
  {
    name: "Butter Cookies Tin",
    categorySlug: "snacks",
    storeSlug: "daily-basket",
    photos: ["1499636136210-6f4ee915583e", "1558961363-fa8fdf82db35"],
    price: 340,
    originalPrice: 420,
    rating: 4.5,
    reviews: 87,
    unit: "340 g tin",
    description:
      "Danish style butter cookies in a sealed, reusable tin — the standard gift for an evening invitation.",
    tags: ["snack", "gift"],
    available: true,
  },
  {
    name: "Roasted Mixed Nuts",
    categorySlug: "snacks",
    storeSlug: "pack-and-save-wholesale",
    photos: ["1626697556426-8a55a8af4999", "1616252576862-bd9abd7467f9"],
    price: 620,
    originalPrice: 750,
    rating: 4.6,
    reviews: 109,
    unit: "500 g pack",
    description:
      "Almonds, cashews and pistachios roasted and lightly salted, packed in a resealable pouch.",
    tags: ["snack", "premium", "combo"],
    available: true,
  },
  {
    name: "Cream Wafer Multipack",
    categorySlug: "snacks",
    storeSlug: "daily-basket",
    photos: ["1585329678734-285d3adee73c", "1612739406198-71fc29b3c1c9"],
    price: 145,
    originalPrice: 180,
    rating: 4.2,
    reviews: 156,
    unit: "12 packs",
    description:
      "Crisp layered wafers with vanilla and chocolate cream, individually wrapped for lunch boxes.",
    tags: ["snack", "kids", "combo"],
    available: true,
  },
  {
    name: "Orange Juice 1L",
    categorySlug: "beverages",
    storeSlug: "daily-basket",
    photos: ["1600271886742-f049cd451bba"],
    price: 165,
    originalPrice: 195,
    rating: 4.4,
    reviews: 142,
    unit: "1 litre pack",
    description:
      "No added sugar orange juice with pulp, pasteurised and sealed. Shake well before serving.",
    tags: ["drink", "daily"],
    available: true,
  },
  {
    name: "Cola Soft Drink 2.25L",
    categorySlug: "beverages",
    storeSlug: "daily-basket",
    photos: ["1622483767028-3f66f32aef97", "1581006852262-e4307cf6283a"],
    price: 135,
    originalPrice: 160,
    rating: 4.2,
    reviews: 318,
    unit: "2.25 litre bottle",
    description:
      "Family size cola. Delivered chilled when your area is served by our refrigerated vans.",
    tags: ["drink", "party"],
    available: true,
  },
  {
    name: "Premium Tea Leaf",
    categorySlug: "beverages",
    storeSlug: "fast-mart-superstore",
    photos: ["1564890369478-c89ca6d9cde9", "1544787219-7f47ccb76574"],
    price: 295,
    originalPrice: 360,
    rating: 4.6,
    reviews: 129,
    unit: "400 g pack",
    description:
      "Strong Sylheti black tea leaves, blended for the deep colour and body that milk tea needs.",
    tags: ["drink", "daily", "local"],
    available: true,
  },
  {
    name: "Ground Coffee 250g",
    categorySlug: "beverages",
    storeSlug: "pack-and-save-wholesale",
    photos: ["1559056199-641a0ac8b55e", "1495474472287-4d71bcdd2085"],
    price: 690,
    originalPrice: 820,
    rating: 4.7,
    reviews: 64,
    unit: "250 g pack",
    description:
      "Medium roast arabica ground for filter and french press, packed in a one way valve bag.",
    tags: ["drink", "premium", "imported"],
    available: true,
  },
  {
    name: "Drinking Water 5L",
    categorySlug: "beverages",
    storeSlug: "city-essentials",
    photos: ["1523362628745-0c100150b504"],
    price: 90,
    originalPrice: 90,
    rating: 4.5,
    reviews: 421,
    unit: "5 litre jar",
    description:
      "Six stage purified drinking water in a sealed jar. We collect the empty jar on your next order.",
    tags: ["drink", "daily", "essential"],
    available: true,
  },
  {
    name: "Chicken Nuggets 1kg",
    categorySlug: "frozen-food",
    storeSlug: "city-essentials",
    photos: ["1562967914-608f82629710"],
    price: 520,
    originalPrice: 640,
    rating: 4.4,
    reviews: 158,
    unit: "1 kg pack",
    description:
      "Crumb coated nuggets, ready to fry straight from frozen in five minutes. Keep below −18°C.",
    tags: ["frozen", "quick", "kids"],
    available: true,
  },
  {
    name: "Frozen Samosa 20pcs",
    categorySlug: "frozen-food",
    storeSlug: "city-essentials",
    photos: ["1583258292688-d0213dc5a3a8"],
    price: 380,
    originalPrice: 450,
    rating: 4.6,
    reviews: 121,
    unit: "20 pieces",
    description:
      "Hand folded samosas, flash frozen raw and boxed. Fry from the freezer for iftar or tea time.",
    tags: ["frozen", "snack", "quick"],
    available: true,
  },
  {
    name: "Vanilla Ice Cream 1L",
    categorySlug: "frozen-food",
    storeSlug: "home-and-living-depot",
    photos: ["1560008581-09826d1de69e", "1497034825429-c343d7c6a68f"],
    price: 420,
    originalPrice: 520,
    rating: 4.7,
    reviews: 187,
    unit: "1 litre tub",
    description:
      "Creamy vanilla ice cream with real vanilla bean specks, delivered in an insulated bag.",
    tags: ["frozen", "dessert", "kids"],
    available: true,
  },
  {
    name: "Frozen French Fries 1kg",
    categorySlug: "frozen-food",
    storeSlug: "city-essentials",
    photos: ["1615485290836-4ebcebf44aaf", "1630431341973-02e1b662ec35"],
    price: 340,
    originalPrice: 420,
    rating: 4.3,
    reviews: 143,
    unit: "1 kg pack",
    description:
      "Straight cut fries, blanched and frozen so they crisp up in the fryer or air fryer without thawing.",
    tags: ["frozen", "quick", "kids"],
    available: true,
  },
  {
    name: "Dishwashing Liquid 1L",
    categorySlug: "household",
    storeSlug: "city-essentials",
    photos: ["1583947215259-38e31be8751f"],
    price: 210,
    originalPrice: 260,
    rating: 4.4,
    reviews: 163,
    unit: "1 litre bottle",
    description:
      "Concentrated lemon dishwashing liquid that cuts grease quickly and rinses off without residue.",
    tags: ["household", "cleaning"],
    available: true,
  },
  {
    name: "Laundry Detergent Powder",
    categorySlug: "household",
    storeSlug: "city-essentials",
    photos: ["1610557892470-55d9e80c0bce"],
    price: 480,
    originalPrice: 590,
    rating: 4.5,
    reviews: 221,
    unit: "3 kg pack",
    description: "Low foam detergent powder suitable for both bucket wash and front load machines.",
    tags: ["household", "cleaning"],
    available: true,
  },
  {
    name: "Kitchen Cleaning Gloves",
    categorySlug: "household",
    storeSlug: "city-essentials",
    photos: ["1585421514738-01798e348b17"],
    price: 150,
    originalPrice: 180,
    rating: 4.1,
    reviews: 47,
    unit: "2 pairs",
    description:
      "Textured grip rubber gloves with a long cuff, sized for everyday kitchen and bathroom cleaning.",
    tags: ["household", "cleaning"],
    available: false,
  },
  {
    name: "Toilet Tissue 6 Rolls",
    categorySlug: "household",
    storeSlug: "city-essentials",
    photos: ["1584556812952-905ffd0c611a"],
    price: 320,
    originalPrice: 380,
    rating: 4.5,
    reviews: 189,
    unit: "6 rolls",
    description: "Two ply soft tissue rolls, 200 sheets each, in a moisture protected outer wrap.",
    tags: ["household", "essential"],
    available: true,
  },
  {
    name: "Floor Cleaner 2L",
    categorySlug: "household",
    storeSlug: "city-essentials",
    photos: ["1639112389900-a858bf671be1", "1649005011845-ef225c89da86"],
    price: 285,
    originalPrice: 350,
    rating: 4.4,
    reviews: 132,
    unit: "2 litre bottle",
    description:
      "Disinfectant floor cleaner that leaves no sticky film. One capful per bucket is enough.",
    tags: ["household", "cleaning"],
    available: true,
  },
  {
    name: "Garbage Bags 60pcs",
    categorySlug: "household",
    storeSlug: "city-essentials",
    photos: ["1606037150583-fb842a55bae7", "1611830696076-462acd8aa9e9"],
    price: 260,
    originalPrice: 320,
    rating: 4.2,
    reviews: 88,
    unit: "60 bags (medium)",
    description:
      "Leak resistant bin liners on a perforated roll, sized for a standard kitchen bin.",
    tags: ["household", "essential"],
    available: true,
  },
  {
    name: "Moisturising Face Wash",
    categorySlug: "personal-care",
    storeSlug: "careline-daily-needs",
    photos: ["1556228720-195a672e8a03", "1608248543803-ba4f8c70ae0b"],
    price: 390,
    originalPrice: 480,
    rating: 4.6,
    reviews: 112,
    unit: "150 ml tube",
    description: "Gentle daily face wash with glycerine and aloe. Suitable for normal to dry skin.",
    tags: ["care", "skin"],
    available: true,
  },
  {
    name: "Handmade Soap Bars",
    categorySlug: "personal-care",
    storeSlug: "careline-daily-needs",
    photos: ["1600857544200-b2f666a9a2ec"],
    price: 340,
    originalPrice: 420,
    rating: 4.7,
    reviews: 68,
    unit: "3 bars",
    description:
      "Cold process soap made with coconut oil and lavender. No synthetic colour or hardener.",
    tags: ["care", "gift"],
    available: true,
  },
  {
    name: "Shampoo & Conditioner Set",
    categorySlug: "personal-care",
    storeSlug: "careline-daily-needs",
    photos: ["1631729371254-42c2892f0e6e"],
    price: 890,
    originalPrice: 1100,
    rating: 4.5,
    reviews: 94,
    unit: "2 × 300 ml",
    description:
      "Sulphate free shampoo with a matching conditioner for frizz control and everyday shine.",
    tags: ["care", "hair", "combo"],
    available: true,
  },
  {
    name: "Toothbrush Family Pack",
    categorySlug: "personal-care",
    storeSlug: "careline-daily-needs",
    photos: ["1607613009820-a29f7bb81c04"],
    price: 260,
    originalPrice: 320,
    rating: 4.3,
    reviews: 77,
    unit: "4 pieces",
    description:
      "Soft bristle toothbrushes in four colours with a tongue cleaner on the back of each head.",
    tags: ["care", "daily", "combo"],
    available: true,
  },
  {
    name: "Toothpaste Twin Pack",
    categorySlug: "personal-care",
    storeSlug: "careline-daily-needs",
    photos: ["1612705166160-97d3b2e8e212", "1588774583125-bac783343696"],
    price: 310,
    originalPrice: 380,
    rating: 4.5,
    reviews: 165,
    unit: "2 × 140 g",
    description:
      "Fluoride toothpaste with a mint finish, sold as a twin pack so the spare is already at home.",
    tags: ["care", "daily", "combo"],
    available: true,
  },
  {
    name: "Hand Sanitiser 500ml",
    categorySlug: "personal-care",
    storeSlug: "careline-daily-needs",
    photos: ["1608564348103-2b78891150cf", "1586992953119-9d5d3ebf1da0"],
    price: 220,
    originalPrice: 275,
    rating: 4.4,
    reviews: 143,
    unit: "500 ml pump",
    description:
      "70% alcohol gel with added glycerine so repeated use does not dry your hands out.",
    tags: ["care", "essential", "daily"],
    available: true,
  },
  {
    name: "Baby Diaper Pants (M)",
    categorySlug: "baby-care",
    storeSlug: "careline-daily-needs",
    photos: ["1716972065448-e08a46809530", "1585313727608-074a92cf3d33"],
    price: 1250,
    originalPrice: 1480,
    rating: 4.7,
    reviews: 231,
    unit: "48 pieces (7–12 kg)",
    description:
      "Pull up diaper pants with a breathable back sheet and a wetness indicator on every piece.",
    tags: ["baby", "essential"],
    available: true,
  },
  {
    name: "Baby Shampoo 200ml",
    categorySlug: "baby-care",
    storeSlug: "careline-daily-needs",
    photos: ["1750085894110-b2e2f11d5e8b"],
    price: 380,
    originalPrice: 450,
    rating: 4.6,
    reviews: 118,
    unit: "200 ml bottle",
    description:
      "No tears formula with a mild pH, tested for newborn skin and free of added colour.",
    tags: ["baby", "care"],
    available: true,
  },
  {
    name: "Baby Wipes 3-Pack",
    categorySlug: "baby-care",
    storeSlug: "careline-daily-needs",
    photos: ["1584743578805-d7991ca2d5d4", "1582452721681-c56a89a8280a"],
    price: 540,
    originalPrice: 660,
    rating: 4.5,
    reviews: 176,
    unit: "3 × 80 wipes",
    description:
      "Alcohol free wipes with an aloe finish in a resealable flip lid pack that will not dry out.",
    tags: ["baby", "combo", "essential"],
    available: true,
  },
  {
    name: "Baby Lotion 400ml",
    categorySlug: "baby-care",
    storeSlug: "careline-daily-needs",
    photos: ["1716372409156-b5d999f0b599"],
    price: 460,
    originalPrice: 560,
    rating: 4.4,
    reviews: 74,
    unit: "400 ml pump",
    description:
      "Light daily moisturiser that absorbs without a greasy film. Dermatologically tested.",
    tags: ["baby", "care"],
    available: true,
  },
  {
    name: "Electric Kettle 1.7L",
    categorySlug: "home-kitchen",
    storeSlug: "home-and-living-depot",
    photos: ["1594213114663-d94db9b17125", "1592417766326-088bf3da80c5"],
    price: 1650,
    originalPrice: 2100,
    rating: 4.6,
    reviews: 203,
    unit: "1.7 litre",
    description:
      "Stainless steel kettle with auto cut-off and boil dry protection. Two year replacement warranty.",
    tags: ["kitchen", "appliance"],
    available: true,
  },
  {
    name: "Airtight Storage Container Set",
    categorySlug: "home-kitchen",
    storeSlug: "home-and-living-depot",
    photos: ["1617510711388-6f88e078d698", "1606859191214-25806e8e2423"],
    price: 890,
    originalPrice: 1150,
    rating: 4.5,
    reviews: 141,
    unit: "5 containers",
    description:
      "Clip lock containers with silicone seals for rice, sugar, tea and spices. Stackable and dishwasher safe.",
    tags: ["kitchen", "combo", "storage"],
    available: true,
  },
  {
    name: "Non-stick Frying Pan 26cm",
    categorySlug: "home-kitchen",
    storeSlug: "home-and-living-depot",
    photos: ["1592156328697-079f6ee0cfa5", "1592156328757-ae2941276b2c"],
    price: 1290,
    originalPrice: 1600,
    rating: 4.4,
    reviews: 98,
    unit: "26 cm",
    description:
      "Three layer non-stick coating on a forged aluminium base with a heat resistant handle.",
    tags: ["kitchen", "cookware"],
    available: true,
  },
  {
    name: "Steel Water Bottle 1L",
    categorySlug: "home-kitchen",
    storeSlug: "home-and-living-depot",
    photos: ["1544003484-3cd181d17917", "1602143407151-7111542de6e8"],
    price: 720,
    originalPrice: 900,
    rating: 4.6,
    reviews: 167,
    unit: "1 litre",
    description:
      "Double walled stainless bottle that keeps water cold for 18 hours. Leak proof screw cap.",
    tags: ["kitchen", "daily"],
    available: true,
  },
  {
    name: "Dinner Plate Set",
    categorySlug: "home-kitchen",
    storeSlug: "home-and-living-depot",
    photos: ["1620818309896-df4306ec95d8", "1737681707230-04eebda96529"],
    price: 1450,
    originalPrice: 1850,
    rating: 4.5,
    reviews: 86,
    unit: "6 plates",
    description:
      "Chip resistant porcelain dinner plates with a plain rim. Microwave and dishwasher safe.",
    tags: ["kitchen", "combo"],
    available: true,
  },
  {
    name: "Fast Charging Cable",
    categorySlug: "electronics",
    storeSlug: "careline-daily-needs",
    photos: ["1587037542794-6ca5f4772330", "1603539444875-76e7684265f6"],
    price: 450,
    originalPrice: 600,
    rating: 4.3,
    reviews: 212,
    unit: "1.5 m",
    description:
      "Braided fast charge cable rated for 3A, with a reinforced collar at both ends. Six month warranty.",
    tags: ["gadget", "daily"],
    available: true,
  },
  {
    name: "LED Bulb 12W (3 Pack)",
    categorySlug: "electronics",
    storeSlug: "home-and-living-depot",
    photos: ["1532007271951-c487760934ae", "1674659719067-8735479ba10c"],
    price: 540,
    originalPrice: 690,
    rating: 4.5,
    reviews: 174,
    unit: "3 bulbs",
    description:
      "Daylight LED bulbs with a standard pin holder, rated for 25,000 hours and low voltage areas.",
    tags: ["gadget", "combo", "essential"],
    available: true,
  },
  {
    name: "AA Batteries 8-Pack",
    categorySlug: "electronics",
    storeSlug: "careline-daily-needs",
    photos: ["1576834975354-ee694be1f0d1", "1574494461093-20eb17efdd8d"],
    price: 320,
    originalPrice: 400,
    rating: 4.4,
    reviews: 128,
    unit: "8 batteries",
    description:
      "Long life alkaline AA cells in a blister pack, dated so you know exactly how new the stock is.",
    tags: ["gadget", "combo", "essential"],
    available: true,
  },
  {
    name: "USB Wall Charger 20W",
    categorySlug: "electronics",
    storeSlug: "careline-daily-needs",
    photos: ["1520287636485-66d0e25add79"],
    price: 890,
    originalPrice: 1150,
    rating: 4.6,
    reviews: 96,
    unit: "20 W adapter",
    description:
      "Compact 20W adapter with over-current protection, safe for overnight charging on a 220V line.",
    tags: ["gadget", "premium"],
    available: true,
  },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Seeding database...\n");

  // 1. Categories
  console.log("  Categories...");
  const categoryRows = CATEGORIES.map((c, i) => ({
    name: c.name,
    slug: c.slug,
    description: c.desc,
    imageUrl: img(c.image),
    isActive: true,
    sortOrder: i,
  }));

  await db
    .insert(schema.categories)
    .values(categoryRows)
    .onConflictDoNothing({ target: schema.categories.slug });

  const allCategories = await db.query.categories.findMany();
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]));
  console.log(`    ${allCategories.length} categories`);

  // 2. Stores
  console.log("  Stores...");
  const storeRows = STORES.map((s) => ({
    name: s.name,
    slug: s.slug,
    description: s.description,
    logoUrl: img(s.logo, 200, 200),
    coverUrl: banner(s.cover),
    city: s.city,
    area: s.area || null,
    deliveryMinMinutes: s.deliveryMin,
    deliveryMaxMinutes: s.deliveryMax,
    ratingAverage: s.rating.toFixed(2),
    isVerified: true,
    status: "ACTIVE" as const,
  }));

  await db
    .insert(schema.stores)
    .values(storeRows)
    .onConflictDoNothing({ target: schema.stores.slug });

  const allStores = await db.query.stores.findMany();
  const storeBySlug = new Map(allStores.map((s) => [s.slug, s]));
  console.log(`    ${allStores.length} stores`);

  // 3. Products + images + store listings + inventory
  console.log("  Products, images, listings, inventory...");
  let productCount = 0;
  let imageCount = 0;
  let listingCount = 0;
  let inventoryCount = 0;

  for (const p of PRODUCTS) {
    const category = categoryBySlug.get(p.categorySlug);
    const store = storeBySlug.get(p.storeSlug);
    if (!category || !store) {
      console.warn(
        `    SKIP ${p.name}: missing category=${p.categorySlug} or store=${p.storeSlug}`,
      );
      continue;
    }

    const productSlug = slugify(p.name);

    // Insert product (skip if slug exists)
    const [product] = await db
      .insert(schema.products)
      .values({
        categoryId: category.id,
        name: p.name,
        slug: productSlug,
        description: p.description,
        unit: p.unit,
        tags: p.tags,
        ratingAverage: p.rating.toFixed(2),
        reviewCount: p.reviews,
        isActive: true,
      })
      .onConflictDoNothing({ target: schema.products.slug })
      .returning({ id: schema.products.id });

    if (!product) continue;
    productCount++;

    // Insert images
    const imageRows = p.photos.map((photo, i) => ({
      productId: product.id,
      imageUrl: img(photo),
      sortOrder: i,
      isPrimary: i === 0,
    }));

    await db.insert(schema.productImages).values(imageRows);
    imageCount += imageRows.length;

    // Store product listing
    const [listing] = await db
      .insert(schema.storeProducts)
      .values({
        storeId: store.id,
        productId: product.id,
        price: p.price.toFixed(2),
        originalPrice: p.originalPrice.toFixed(2),
        isActive: p.available,
      })
      .returning({ id: schema.storeProducts.id });

    listingCount++;

    // Inventory
    const stock = p.available ? 50 + Math.floor(Math.random() * 150) : 0;
    await db.insert(schema.inventory).values({
      storeProductId: listing.id,
      quantity: stock,
      reservedQuantity: 0,
      lowStockThreshold: 5,
    });

    inventoryCount++;
  }

  console.log(`    ${productCount} products`);
  console.log(`    ${imageCount} product images`);
  console.log(`    ${listingCount} store listings`);
  console.log(`    ${inventoryCount} inventory rows`);

  // 4. Default subscription plan
  console.log("  Subscription plan...");
  await db
    .insert(schema.subscriptionPlans)
    .values({
      name: "FastShopBD Premium",
      slug: "premium-monthly",
      description: "Free delivery on every order, early access to deals, and priority support.",
      price: "50.00",
      durationDays: 30,
      trialHours: 24,
      isActive: true,
    })
    .onConflictDoNothing({ target: schema.subscriptionPlans.slug });

  console.log("    1 plan");

  // 5. System settings
  console.log("  System settings...");
  const settings = [
    {
      key: "delivery.default_fee",
      value: "60",
      valueType: "NUMBER" as const,
      group: "delivery",
      label: "Default Delivery Fee (৳)",
      isPublic: true,
    },
    {
      key: "delivery.free_threshold",
      value: "500",
      valueType: "NUMBER" as const,
      group: "delivery",
      label: "Free Delivery Threshold (৳)",
      isPublic: true,
    },
    {
      key: "payment.bkash_number",
      value: "01XXXXXXXXX",
      valueType: "STRING" as const,
      group: "payment",
      label: "bKash Receiver Number",
      isPublic: true,
    },
    {
      key: "payment.nagad_number",
      value: "01XXXXXXXXX",
      valueType: "STRING" as const,
      group: "payment",
      label: "Nagad Receiver Number",
      isPublic: true,
    },
    {
      key: "payment.rocket_number",
      value: "01XXXXXXXXX",
      valueType: "STRING" as const,
      group: "payment",
      label: "Rocket Receiver Number",
      isPublic: true,
    },
    {
      key: "platform.name",
      value: "FastShopBD",
      valueType: "STRING" as const,
      group: "general",
      label: "Platform Name",
      isPublic: true,
    },
    {
      key: "platform.support_email",
      value: "support@fastshopbd.com",
      valueType: "STRING" as const,
      group: "general",
      label: "Support Email",
      isPublic: true,
    },
  ];

  for (const s of settings) {
    await db.insert(schema.systemSettings).values(s).onConflictDoNothing();
  }

  console.log(`    ${settings.length} settings`);

  // 6. Demo accounts for FYP defense
  console.log("  Demo accounts...");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const demoAccounts = [
      {
        email: "admin@fastshopbd.com",
        password: "Admin@123",
        fullName: "Admin User",
        phone: "01700000001",
        role: "ADMIN" as const,
      },
      {
        email: "store@fastshopbd.com",
        password: "Store@123",
        fullName: "Store Manager",
        phone: "01700000002",
        role: "STORE_OWNER" as const,
      },
      {
        email: "customer@fastshopbd.com",
        password: "Customer@123",
        fullName: "Demo Customer",
        phone: "01700000003",
        role: "CUSTOMER" as const,
      },
    ];

    let created = 0;
    for (const account of demoAccounts) {
      const existing = await db.query.profiles.findFirst({
        where: eq(schema.profiles.phone, account.phone),
        columns: { id: true },
      });
      if (existing) continue;

      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          console.log(`    ⊘ ${account.email} already exists`);
          continue;
        }
        console.warn(`    ✗ Failed to create ${account.email}: ${error.message}`);
        continue;
      }

      if (data.user) {
        await db
          .insert(schema.profiles)
          .values({
            authUserId: data.user.id,
            fullName: account.fullName,
            phone: account.phone,
            role: account.role,
            status: "ACTIVE",
          })
          .onConflictDoNothing();

        if (account.role === "STORE_OWNER") {
          const firstStore = await db.query.stores.findFirst({
            columns: { id: true },
          });
          if (firstStore) {
            const profile = await db.query.profiles.findFirst({
              where: eq(schema.profiles.authUserId, data.user.id),
              columns: { id: true },
            });
            if (profile) {
              await db
                .insert(schema.storeMembers)
                .values({
                  storeId: firstStore.id,
                  userId: profile.id,
                  role: "OWNER",
                })
                .onConflictDoNothing();
            }
          }
        }
        created++;
        console.log(`    ✓ ${account.email} (${account.role})`);
      }
    }
    console.log(`    ${created} new demo accounts`);
  } else {
    console.log("    ⊘ Skipped (SUPABASE_URL/SUPABASE_SECRET_KEY not set)");
  }

  console.log("\nSeed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => client.end());
