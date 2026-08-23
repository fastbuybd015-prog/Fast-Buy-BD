import { BadgePercent, RefreshCcw, Truck, Headphones } from 'lucide-react';

const ITEMS = [
  {
    icon: Truck,
    title: 'Same day delivery',
    caption: 'Order before 8pm, get it today',
  },
  {
    icon: BadgePercent,
    title: 'Discounted every day',
    caption: 'Sealed packs at below-market prices',
  },
  {
    icon: RefreshCcw,
    title: 'Easy returns',
    caption: 'Not happy? Return on the spot',
  },
  {
    icon: Headphones,
    title: 'Support 9am–10pm',
    caption: 'Call 16247 any day of the week',
  },
];

export function ValueProps() {
  return (
    <section className="container-page mt-8">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <li
            key={item.title}
            className="flex items-center gap-3 rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-3.5 shadow-card dark:shadow-none sm:p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600">
              <item.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-900 dark:text-ink-50">{item.title}</span>
              <span className="block truncate text-xs text-ink-500 dark:text-ink-400">{item.caption}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
