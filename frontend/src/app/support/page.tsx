import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/ContentPage';

export const metadata: Metadata = {
  title: 'Customer support',
  description: 'Delivery information, returns, FAQ and how to contact Fast Buy BD.',
};

export default function SupportPage() {
  return (
    <ContentPage
      title="Customer support"
      intro="Everything you need to know about delivery, returns and getting in touch. Our team is available every day from 9am to 10pm."
      sections={[
        {
          id: 'contact',
          heading: 'Contact us',
          paragraphs: [
            'Call 16247 for anything urgent — order changes, missing items or delivery delays.',
            'You can also email support@fastbuybd.com and we reply within one working day.',
          ],
          bullets: [
            'Hotline: 16247 (9am – 10pm, every day)',
            'Email: support@fastbuybd.com',
            'Office: House 14, Road 7, Dhanmondi, Dhaka 1205',
          ],
        },
        {
          id: 'delivery',
          heading: 'Delivery information',
          paragraphs: [
            'Orders placed before 8pm are delivered the same day. Standard delivery takes 45 to 70 minutes depending on your area and the stores in your basket.',
          ],
          bullets: [
            'Delivery fee ৳60, free on orders over ৳1,000',
            'Members get free delivery on every order',
            'Frozen and chilled items travel in insulated bags',
          ],
        },
        {
          id: 'returns',
          heading: 'Return policy',
          paragraphs: [
            'Check your items while the rider is still there. Anything damaged, expired or wrong can be handed straight back for an immediate refund on that item.',
            'For packaged goods, unopened items can be returned within 24 hours of delivery.',
          ],
        },
        {
          id: 'faq',
          heading: 'Frequently asked questions',
          paragraphs: [
            'Can I order from more than one store? Yes — mix products from any partner store in one basket and pay a single delivery fee.',
            'Is my payment safe? This build is a demo, so no payment details are collected at all. Cash on delivery, card and mobile payment are simulated.',
            'How do I cancel the membership? Open the subscription page and the state resets — there is no billing to cancel in this demo.',
          ],
        },
      ]}
    />
  );
}
