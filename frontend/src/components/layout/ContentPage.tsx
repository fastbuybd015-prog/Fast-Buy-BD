import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export interface ContentSection {
  id?: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export function ContentPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: ContentSection[];
}) {
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: title }]} />

      <header className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300 sm:text-base">{intro}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.heading}
            id={section.id}
            className="surface-card scroll-mt-32 p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 space-y-1.5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
