import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/ContentPage';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What data the Fast Buy BD demo stores and where it is kept.',
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      intro="This demo keeps everything on your own device. No server receives your data, because there is no backend."
      sections={[
        {
          heading: 'What we store',
          paragraphs: [
            'Your cart, demo account details, membership status and last order are saved in your browser localStorage so the experience survives a page refresh.',
          ],
          bullets: [
            'Cart contents and quantities',
            'Demo name and email from registration or login',
            'Trial start time and subscription status',
            'The most recent demo order summary',
          ],
        },
        {
          heading: 'What we never collect',
          paragraphs: [
            'No passwords are stored, no card details are requested, and nothing is transmitted to an external service. Product photos are loaded from public image hosts.',
          ],
        },
        {
          heading: 'Clearing your data',
          paragraphs: [
            'Logging out removes the demo account from storage. To remove everything, clear site data for this domain in your browser settings.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'Questions about this policy can go to support@fastbuybd.com. As this is a student project, replies are best effort.',
          ],
        },
      ]}
    />
  );
}
