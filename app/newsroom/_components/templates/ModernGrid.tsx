import { sampleIssue } from '../../_data/sampleIssue'
import { StructuredDataNewsArticle } from '../StructuredDataNewsArticle'

export function ModernGrid() {
  const [lead, second, ...rest] = sampleIssue.articles

  return (
    <div className="text-neutral-900">
      <header className="flex flex-col gap-3 border-b border-neutral-200 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{sampleIssue.paperName}</h1>
          <p className="text-xs text-neutral-600">
            {new Date(sampleIssue.publishedAtISO).toLocaleDateString('en-US', { dateStyle: 'medium' })} •{' '}
            {sampleIssue.edition}
          </p>
        </div>
        <nav aria-label="Sections" className="flex flex-wrap gap-2">
          {sampleIssue.sections.map((s) => (
            <a
              key={s}
              href={`#section-${s.toLowerCase()}`}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
            >
              {s}
            </a>
          ))}
        </nav>
      </header>

      <main className="mt-6 grid gap-6 lg:grid-cols-12">
        <article className="lg:col-span-7" aria-labelledby={`headline-${lead.slug}`}>
          <StructuredDataNewsArticle article={lead} organizationName={sampleIssue.paperName} />
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">{lead.section}</p>
          <h2 id={`headline-${lead.slug}`} className="mt-2 text-4xl font-semibold leading-tight tracking-tight">
            {lead.headline}
          </h2>
          {lead.dek ? <p className="mt-3 text-base text-neutral-700">{lead.dek}</p> : null}
          <div className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-800">
            {lead.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">{lead.byline}</span> • {lead.readingMinutes} min read
          </p>
        </article>

        <aside className="lg:col-span-5">
          <div className="rounded-xl border border-neutral-200 p-4">
            <article aria-labelledby={`headline-${second.slug}`}>
              <StructuredDataNewsArticle article={second} organizationName={sampleIssue.paperName} />
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">{second.section}</p>
              <h3 id={`headline-${second.slug}`} className="mt-2 text-xl font-semibold leading-snug">
                {second.headline}
              </h3>
              {second.dek ? <p className="mt-2 text-sm text-neutral-700">{second.dek}</p> : null}
              <p className="mt-3 text-xs text-neutral-500">{second.byline}</p>
            </article>
          </div>

          <div className="mt-6 grid gap-4">
            {rest.slice(0, 4).map((a) => (
              <article
                key={a.slug}
                id={`section-${a.section.toLowerCase()}`}
                className="rounded-xl border border-neutral-200 p-4"
              >
                <StructuredDataNewsArticle article={a} organizationName={sampleIssue.paperName} />
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-600">{a.section}</p>
                <h4 className="mt-2 text-base font-semibold leading-snug">{a.headline}</h4>
                <p className="mt-2 text-xs text-neutral-500">{a.byline}</p>
              </article>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

