import { sampleIssue } from '../../_data/sampleIssue'
import { StructuredDataNewsArticle } from '../StructuredDataNewsArticle'

export function ClassicBroadsheet() {
  const [lead, ...rest] = sampleIssue.articles

  return (
    <div className="font-[var(--font-source-serif-4)] text-neutral-900">
      <header className="border-b-2 border-neutral-900 pb-4">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-700">
              {sampleIssue.edition}
            </p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight">
              {sampleIssue.paperName}
            </h1>
            <p className="mt-1 text-sm text-neutral-700">{sampleIssue.mastheadTagline}</p>
          </div>
          <div className="text-right text-xs text-neutral-700">
            <p>{new Date(sampleIssue.publishedAtISO).toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
            <p className="mt-1">{sampleIssue.cityline}</p>
          </div>
        </div>

        <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {sampleIssue.sections.map((s) => (
            <a
              key={s}
              href={`#section-${s.toLowerCase()}`}
              className="uppercase tracking-[0.18em] text-neutral-700 hover:text-neutral-900"
            >
              {s}
            </a>
          ))}
        </nav>
      </header>

      <main className="mt-6">
        <article aria-labelledby={`headline-${lead.slug}`}>
          <StructuredDataNewsArticle article={lead} organizationName={sampleIssue.paperName} />
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-600">{lead.kicker}</p>
          <h2 id={`headline-${lead.slug}`} className="mt-1 text-3xl font-semibold leading-tight">
            {lead.headline}
          </h2>
          {lead.dek ? <p className="mt-2 text-base text-neutral-800">{lead.dek}</p> : null}
          <p className="mt-2 text-xs text-neutral-600">
            <span className="font-medium text-neutral-800">{lead.byline}</span> •{' '}
            {new Date(lead.publishedAtISO).toLocaleTimeString('en-US', { timeStyle: 'short' })} •{' '}
            {lead.readingMinutes} min read
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div
              className="text-[15px] leading-7"
              style={{
                columnCount: 2,
                columnGap: '2rem',
                columnRule: '1px solid rgb(229 229 229)',
              }}
            >
              {lead.body.map((p) => (
                <p key={p} className="mb-4 break-inside-avoid">
                  {p}
                </p>
              ))}
            </div>
            <aside className="border-l border-neutral-200 pl-4 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700">
                Today’s Brief
              </h3>
              <ul className="mt-3 space-y-3">
                {rest.slice(0, 4).map((a) => (
                  <li key={a.slug}>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                      {a.section}
                    </p>
                    <p className="mt-1 text-sm leading-snug">{a.headline}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </article>

        <section className="mt-10 grid gap-8 lg:grid-cols-3">
          {rest.map((a) => (
            <article key={a.slug} id={`section-${a.section.toLowerCase()}`} className="border-t border-neutral-200 pt-4">
              <StructuredDataNewsArticle article={a} organizationName={sampleIssue.paperName} />
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-600">{a.section}</p>
              <h3 className="mt-1 text-lg font-semibold leading-snug">{a.headline}</h3>
              {a.dek ? <p className="mt-2 text-sm text-neutral-800">{a.dek}</p> : null}
              <p className="mt-2 text-xs text-neutral-600">{a.byline}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="mt-10 border-t-2 border-neutral-900 pt-4 text-xs text-neutral-600">
        <p>© {new Date(sampleIssue.publishedAtISO).getFullYear()} {sampleIssue.paperName}. All rights reserved.</p>
      </footer>
    </div>
  )
}

