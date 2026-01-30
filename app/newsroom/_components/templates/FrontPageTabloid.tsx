import Image from 'next/image'
import { sampleIssue } from '../../_data/sampleIssue'
import { StructuredDataNewsArticle } from '../StructuredDataNewsArticle'

function Rule() {
  return <div className="h-px w-full bg-neutral-900" />
}

function SmallCaps({ children }: { children: React.ReactNode }) {
  return <span className="uppercase tracking-[0.22em]">{children}</span>
}

function StoryColumns({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div
      className="text-[12.5px] leading-5"
      style={{
        columnCount: 3,
        columnGap: '1.25rem',
        columnRule: '1px solid rgb(23 23 23 / 0.25)',
      }}
    >
      {paragraphs.map((p, idx) => (
        <p key={`${idx}-${p}`} className="mb-3 break-inside-avoid text-neutral-900">
          {p}
        </p>
      ))}
    </div>
  )
}

export function FrontPageTabloid() {
  const issueDate = new Date(sampleIssue.publishedAtISO)
  const [lead, second, third, ...rest] = sampleIssue.articles
  const heroImage = lead.image?.src ?? '/images/newspaper/sample-market.svg'

  return (
    <div className="text-neutral-950">
      <header>
        <div className="flex items-end justify-between gap-6 border-y-2 border-neutral-950 py-3">
          <div className="text-xs font-semibold">
            <SmallCaps>{sampleIssue.edition}</SmallCaps>
            <span className="mx-2 text-neutral-400">•</span>
            <span className="text-neutral-700">
              {issueDate.toLocaleDateString('en-US', { dateStyle: 'full' })}
            </span>
          </div>
          <div className="text-xs font-semibold text-neutral-700">
            <SmallCaps>Issue</SmallCaps> <span className="tabular-nums">0001</span>
          </div>
        </div>

        <div className="relative py-5">
          <h1 className="text-center text-5xl font-black tracking-tight">
            {sampleIssue.paperName}
          </h1>
          <p className="mt-2 text-center text-xs font-semibold text-neutral-700">
            <SmallCaps>{sampleIssue.mastheadTagline}</SmallCaps>
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold text-neutral-800">
            <span className="rounded-sm border border-neutral-950 px-2 py-1">
              <SmallCaps>Exclusive</SmallCaps>
            </span>
            <span className="rounded-sm border border-neutral-950 px-2 py-1">
              <SmallCaps>National</SmallCaps>
            </span>
            <span className="rounded-sm border border-neutral-950 px-2 py-1">
              <SmallCaps>Markets</SmallCaps>
            </span>
            <span className="rounded-sm border border-neutral-950 px-2 py-1">
              <SmallCaps>Culture</SmallCaps>
            </span>
          </div>
        </div>
      </header>

      <main className="mt-2">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr_260px]">
          <aside className="space-y-4">
            <div className="border-2 border-neutral-950 p-3">
              <p className="text-[11px] font-black">
                <SmallCaps>Special</SmallCaps>
              </p>
              <Rule />
              <h2 className="mt-2 text-2xl font-black leading-none tracking-tight">
                {second.headline}
              </h2>
              {second.dek ? (
                <p className="mt-2 text-xs font-semibold text-neutral-800">{second.dek}</p>
              ) : null}
              <div className="mt-3">
                <StoryColumns paragraphs={second.body} />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-neutral-700">{second.byline}</p>
            </div>

            <div className="border border-neutral-950 p-3">
              <p className="text-[11px] font-black">
                <SmallCaps>Inside</SmallCaps>
              </p>
              <Rule />
              <ul className="mt-3 space-y-2 text-xs">
                {[third, ...rest.slice(0, 3)].map((a) => (
                  <li key={a.slug} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black text-neutral-700">
                        <SmallCaps>{a.section}</SmallCaps>
                      </p>
                      <p className="mt-1 font-semibold leading-snug">{a.headline}</p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-semibold text-neutral-700">
                      p. {Math.max(2, 2 + rest.findIndex((x) => x.slug === a.slug))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <article aria-labelledby={`headline-${lead.slug}`}>
            <StructuredDataNewsArticle article={lead} organizationName={sampleIssue.paperName} />
            <div className="border-y-2 border-neutral-950 py-4">
              <p className="text-center text-xs font-black text-neutral-700">
                <SmallCaps>{lead.section}</SmallCaps>
              </p>
              <h2
                id={`headline-${lead.slug}`}
                className="mt-3 text-center text-6xl font-black leading-[0.9] tracking-tight"
              >
                {lead.headline}
              </h2>
              {lead.dek ? (
                <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-semibold text-neutral-800">
                  {lead.dek}
                </p>
              ) : null}
              <p className="mt-3 text-center text-[11px] font-semibold text-neutral-700">
                {lead.byline} • {lead.readingMinutes} min read
              </p>
            </div>

            <div className="mt-4 border border-neutral-950">
              <div className="relative aspect-[16/9] w-full bg-neutral-100">
                <Image
                  src={heroImage}
                  alt={lead.image?.alt ?? 'Front page hero image'}
                  fill
                  className="object-cover grayscale"
                  sizes="(max-width: 1024px) 100vw, 680px"
                  priority
                />
              </div>
              <div className="border-t border-neutral-950 px-3 py-2 text-[11px] text-neutral-700">
                {lead.image?.caption ?? 'Photo: Staff'}
              </div>
            </div>

            <div className="mt-4">
              <StoryColumns paragraphs={lead.body} />
            </div>
          </article>

          <aside className="space-y-4">
            <div className="border-2 border-neutral-950 p-3">
              <p className="text-[11px] font-black">
                <SmallCaps>Update</SmallCaps>
              </p>
              <Rule />
              <h3 className="mt-2 text-xl font-black leading-tight tracking-tight">{third.headline}</h3>
              {third.dek ? (
                <p className="mt-2 text-xs font-semibold text-neutral-800">{third.dek}</p>
              ) : null}
              <div className="mt-3">
                <StoryColumns paragraphs={third.body} />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-neutral-700">{third.byline}</p>
            </div>

            <div className="border border-neutral-950 p-3">
              <p className="text-[11px] font-black">
                <SmallCaps>Markets</SmallCaps>
              </p>
              <Rule />
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="border border-neutral-950 p-2">
                  <p className="text-[10px] font-black text-neutral-700">
                    <SmallCaps>Rates</SmallCaps>
                  </p>
                  <p className="mt-1 text-lg font-black tabular-nums">4.25%</p>
                  <p className="mt-1 text-[11px] font-semibold text-neutral-700">10Y yield</p>
                </div>
                <div className="border border-neutral-950 p-2">
                  <p className="text-[10px] font-black text-neutral-700">
                    <SmallCaps>FX</SmallCaps>
                  </p>
                  <p className="mt-1 text-lg font-black tabular-nums">1.08</p>
                  <p className="mt-1 text-[11px] font-semibold text-neutral-700">EUR/USD</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-6 border-t-2 border-neutral-950 pt-3 text-[11px] font-semibold text-neutral-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{sampleIssue.cityline}</span>
            <span>
              <SmallCaps>Newsroom Preview</SmallCaps> • Not for indexing
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
