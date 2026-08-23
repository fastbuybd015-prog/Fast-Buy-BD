import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/ContentPage';

export const metadata: Metadata = {
  title: 'About us',
  description: 'What Fast Buy BD is and how the marketplace works.',
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About Fast Buy BD"
      intro="Fast Buy BD is an online marketplace for your daily needs in discounted price. This site is a university project built to demonstrate a complete e-commerce experience."
      sections={[
        {
          heading: 'What we do',
          paragraphs: [
            'Instead of running one warehouse, Fast Buy BD partners with local superstores, wholesalers and specialist shops. You shop across all of them in a single order and one rider brings everything to your door.',
            'We stock sealed and packaged goods only — packaged food, household and cleaning supplies, personal and baby care, kitchen items and everyday electronics. No loose or perishable items are sold.',
          ],
          bullets: [
            '6 partner stores across Dhaka and Chattogram',
            '52 products across 10 everyday categories',
            'Same day delivery between 9am and 10pm',
          ],
        },
        {
          heading: 'How pricing works',
          paragraphs: [
            'Stores set their own prices and run their own campaigns. Discounted items show both the original and the offer price so you always know exactly what you are saving.',
            'Members get free delivery and additional member-only prices for ৳50 per month, after a 1 day free trial.',
          ],
        },
        {
          heading: 'Quality and returns',
          paragraphs: [
            'Every pack is checked for seal and expiry date before it leaves the store. If anything arrives damaged, opened or close to expiry, hand it back to the rider and the item is refunded immediately.',
          ],
        },
        {
          heading: 'About this build',
          paragraphs: [
            'This is a frontend-first demonstration built with Next.js, React, TypeScript and Tailwind CSS. Products, stores, accounts, orders and subscriptions are simulated in the browser — no backend, no database and no payment gateway is involved.',
          ],
        },
      ]}
    />
  );
}
