import { sampleIssue } from '../../_data/sampleIssue'
import { StructuredDataNewsArticle } from '../StructuredDataNewsArticle'

export function MinimalNewsletter() {
  const [lead, ...rest] = sampleIssue.articles

  return (
    <div className="text-neutral-900">
      <header className="rounded-2xl bg-neutral-950 p-6 text-white">
        <p className="text-xs uppercase tracking-widest text-neutral-200">{sampleIssue.edition}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{sampleIssue.paperName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-200">{sampleIssue.mastheadTagline}</p>
        <p className="mt-4 text-xs text-neutral-300">
          {new Date(sampleIssue.publishedAtISO).toLocaleDateString('en-US', { dateStyle: 'full' })}
        </p>
      </header>

      <main className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
        <article aria-labelledby={`headline-${lead.slug}`} className="rounded-2xl border border-neutral-200 p-6">
          <StructuredDataNewsArticle article={lead} organizationName={sampleIssue.paperName} />
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">{lead.section}</p>
          <h2 id={`headline-${lead.slug}`} className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
            {lead.headline}
          </h2>
          {lead.dek ? <p className="mt-3 text-base text-neutral-700">{lead.dek}</p> : null}
          <div className="mt-5 space-y-4 text-[15px] leading-7 text-neutral-800">
            {lead.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-5 text-xs text-neutral-500">{lead.byline}</p>
        </article>

        <aside className="rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-700">More stories</h3>
          <div className="mt-4 space-y-5">
            {rest.map((a) => (
              <article key={a.slug} className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0">
                <StructuredDataNewsArticle article={a} organizationName={sampleIssue.paperName} />
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-600">{a.section}</p>
                <h4 className="mt-1 text-base font-semibold leading-snug">{a.headline}</h4>
                <p className="mt-2 text-xs text-neutral-500">{a.byline}</p>
              </article>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

