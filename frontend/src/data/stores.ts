import type { Store } from '@/types';
import { banner, img } from '@/lib/images';

export const stores: Store[] = [
  {
    id: 'store-01',
    name: 'Shwapno Superstore',
    slug: 'shwapno-superstore',
    logo: img('1542838132-92c53300491e', 200, 200),
    cover: banner('1578916171728-46686eac8d58'),
    location: 'Dhanmondi Road 27, Dhaka',
    rating: 4.9,
    deliveryTime: '25–40 min',
    description:
      'Bangladesh’s leading grocery chain stocking fresh staples, authentic deshi brands, and kitchen essentials with strict quality checks.',
  },
  {
    id: 'store-02',
    name: 'Chaldal Express Hub',
    slug: 'chaldal-express-hub',
    logo: img('1601050690597-df0568f70950', 200, 200),
    cover: banner('1601050690597-df0568f70950'),
    location: 'Mirpur-10 Depot, Dhaka',
    rating: 4.8,
    deliveryTime: '20–35 min',
    description:
      'Fast doorstep grocery delivery hub servicing Mirpur, Uttara, and Cantonment with 1-hour guaranteed express dispatch.',
  },
  {
    id: 'store-03',
    name: 'Meena Bazar Outlet',
    slug: 'meena-bazar-outlet',
    logo: img('1553413077-190dd305871c', 200, 200),
    cover: banner('1684695749267-233af13276d0'),
    location: 'Gulshan-2 Circle, Dhaka',
    rating: 4.9,
    deliveryTime: '30–45 min',
    description:
      'Premium supermarket offering organic groceries, Aarong dairy, fresh cuts, and imported condiments at honest price points.',
  },
  {
    id: 'store-04',
    name: 'Agora Superstore',
    slug: 'agora-superstore',
    logo: img('1534723452862-4c874018d66d', 200, 200),
    cover: banner('1606824722920-4c652a70f348'),
    location: 'Uttara Sector 7, Dhaka',
    rating: 4.7,
    deliveryTime: '30–50 min',
    description:
      'Large format grocery chain with complete rice, oil, pulses, cleaning supplies, and baby food sections.',
  },
  {
    id: 'store-05',
    name: 'Unimart Hypermarket',
    slug: 'unimart-hypermarket',
    logo: img('1549382534-2876659bf203', 200, 200),
    cover: banner('1735204615600-9e959e90a019'),
    location: 'Chef’s Table Courtside, Madani Ave, Dhaka',
    rating: 4.9,
    deliveryTime: '35–55 min',
    description:
      'Mega-retail experience stocking authentic gourmet items, family wholesale bulk packages, and home appliances.',
  },
  {
    id: 'store-06',
    name: 'Daily Shopping (PRAN-RFL)',
    slug: 'daily-shopping-pran-rfl',
    logo: img('1765031092161-a9ebe556117e', 200, 200),
    cover: banner('1775217164479-60f937a4b0a4'),
    location: 'Banani Road 11, Dhaka',
    rating: 4.6,
    deliveryTime: '20–35 min',
    description:
      'Convenient neighborhood mart carrying fresh milk, eggs, bread, tea, and daily PRAN staples at official MRP discounts.',
  },
];

export function getStoreBySlug(slug: string): Store | undefined {
  return stores.find((store) => store.slug === slug);
}

export function getStoreById(id: string): Store | undefined {
  return stores.find((store) => store.id === id);
}
