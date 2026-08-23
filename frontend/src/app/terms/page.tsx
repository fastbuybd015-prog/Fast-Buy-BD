import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/ContentPage';

export const metadata: Metadata = {
  title: 'Terms & conditions',
  description: 'The terms that apply when using the Fast Buy BD demo marketplace.',
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms & conditions"
      intro="These terms describe how the Fast Buy BD demo works. Because this is a university project, no real contract, payment or delivery obligation exists."
      sections={[
        {
          heading: 'Using the service',
          paragraphs: [
            'You may browse, search and place demo orders freely. Accounts are created locally in your browser and can be removed at any time by clearing site data.',
          ],
        },
        {
          heading: 'Orders and pricing',
          paragraphs: [
            'Prices shown are illustrative and stored in local mock data. Discounts, delivery fees and totals are calculated in the browser for demonstration purposes only.',
            'Placing an order generates a demo order ID and summary. Nothing is dispatched.',
          ],
        },
        {
          id: 'refund',
          heading: 'Refund policy',
          paragraphs: [
            'In a live service, damaged or incorrect items would be refunded to the original payment method within five working days. In this demo no money changes hands, so no refunds are processed.',
          ],
        },
        {
          heading: 'Membership terms',
          paragraphs: [
            'The 1 day free trial starts when you register and expires automatically after 24 hours. The ৳50 per month membership shown after the trial is a simulated purchase — no payment method is stored or charged.',
          ],
        },
      ]}
    />
  );
}
