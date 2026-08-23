import type { Category } from '@/types';
import { img } from '@/lib/images';

export const categories: Category[] = [
  {
    id: 'cat-01',
    name: 'Grocery & Staples',
    slug: 'grocery',
    image: img('1516684732162-798a0062be99'),
    tagline: 'Rice, oil, sugar and sealed spice packs for the whole month.',
  },
  {
    id: 'cat-02',
    name: 'Packaged Food',
    slug: 'packaged-food',
    image: img('1762926627741-be85594edbbc'),
    tagline: 'Noodles, pasta, cereal and canned items with a long shelf life.',
  },
  {
    id: 'cat-03',
    name: 'Snacks',
    slug: 'snacks',
    image: img('1566478989037-eec170784d0b'),
    tagline: 'Chips, biscuits, chocolates and everything for the evening.',
  },
  {
    id: 'cat-04',
    name: 'Beverages',
    slug: 'beverages',
    image: img('1600271886742-f049cd451bba'),
    tagline: 'Juice, tea, coffee and soft drinks in sealed packs.',
  },
  {
    id: 'cat-05',
    name: 'Frozen & Instant',
    slug: 'frozen-food',
    image: img('1562967914-608f82629710'),
    tagline: 'Nuggets, samosas and ice cream, straight from the freezer.',
  },
  {
    id: 'cat-06',
    name: 'Household',
    slug: 'household',
    image: img('1583947215259-38e31be8751f'),
    tagline: 'Cleaning, laundry and kitchen essentials for a tidy home.',
  },
  {
    id: 'cat-07',
    name: 'Personal Care',
    slug: 'personal-care',
    image: img('1556228720-195a672e8a03'),
    tagline: 'Skin, hair and daily care products from trusted brands.',
  },
  {
    id: 'cat-08',
    name: 'Baby Care',
    slug: 'baby-care',
    image: img('1734599397715-f030c6d206a0'),
    tagline: 'Diapers, wipes and gentle care for the little one.',
  },
  {
    id: 'cat-09',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    image: img('1549382534-2876659bf203'),
    tagline: 'Cookware, storage and everyday utensils that last.',
  },
  {
    id: 'cat-10',
    name: 'Electronics',
    slug: 'electronics',
    image: img('1573868388390-2739872961e6'),
    tagline: 'Cables, bulbs, batteries and chargers you reorder often.',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
