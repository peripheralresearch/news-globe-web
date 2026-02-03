import { sampleIssue } from '../../_data/sampleIssue'
import { StructuredDataNewsArticle } from '../StructuredDataNewsArticle'

export function TabloidPunch() {
  const [lead, ...rest] = sampleIssue.articles

  return (
    <div className="text-neutral-950">
      <header className="border-b-4 border-neutral-950 pb-4">
        <div className="flex items-end justify-between gap-6">
          <h1 className="text-3xl font-black uppercase tracking-tight">{sampleIssue.paperName}</h1>
          <p className="text-xs font-semibold uppercase tracking-wider">
            {new Date(sampleIssue.publishedAtISO).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </p>
        </div>
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-neutral-700">
          {sampleIssue.mastheadTagline}
        </p>
      </header>

      <main className="mt-6">
        <article aria-labelledby={`headline-${lead.slug}`}>
          <StructuredDataNewsArticle article={lead} organizationName={sampleIssue.paperName} />
          <p className="inline-block bg-neutral-950 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
            {lead.section}
          </p>
          <h2 id={`headline-${lead.slug}`} className="mt-3 text-5xl font-black leading-[0.95] tracking-tight">
            {lead.headline}
          </h2>
          {lead.dek ? <p className="mt-3 text-lg font-semibold text-neutral-800">{lead.dek}</p> : null}
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-700">
            {lead.byline} • {lead.readingMinutes} min
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 text-[15px] leading-7">
              {lead.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <aside className="rounded-xl border-2 border-neutral-950 p-4">
              <h3 className="text-sm font-black uppercase tracking-widest">In This Issue</h3>
              <ul className="mt-3 space-y-3">
                {rest.map((a) => (
                  <li key={a.slug}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">{a.section}</p>
                    <p className="mt-1 text-base font-semibold leading-snug">{a.headline}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </article>
      </main>
    </div>
  )
}

