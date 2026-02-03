export type SampleArticle = {
  slug: string
  section: 'World' | 'Politics' | 'Business' | 'Culture' | 'Opinion' | 'Sports'
  kicker?: string
  headline: string
  dek?: string
  byline: string
  publishedAtISO: string
  readingMinutes: number
  image?: {
    src: string
    alt: string
    caption?: string
  }
  body: string[]
}

export const sampleIssue = {
  paperName: 'Peripheral Times',
  edition: 'International Edition',
  publishedAtISO: '2026-01-29T12:00:00.000Z',
  cityline: 'New York • London • Singapore',
  mastheadTagline: 'Independent reporting on complex systems',
  sections: ['World', 'Politics', 'Business', 'Culture', 'Opinion', 'Sports'] as const,
  articles: [
    {
      slug: 'markets-reprice-risk',
      section: 'Business',
      kicker: 'Macro',
      headline: 'Markets reprice risk as policy signals sharpen',
      dek: 'Volatility returns, but long-duration names find support as investors rotate.',
      byline: 'By A. Reporter',
      publishedAtISO: '2026-01-29T09:15:00.000Z',
      readingMinutes: 6,
      image: {
        src: '/images/newspaper/sample-market.svg',
        alt: 'Ticker board showing mixed market moves',
        caption: 'Traders weigh fresh policy guidance against earnings revisions.',
      },
      body: [
        'Risk assets opened higher before giving back gains as new guidance shifted expectations.',
        'Analysts noted that the repricing was concentrated in rate-sensitive sectors, while defensives held steady.',
        'In credit markets, spreads remained contained despite increased intraday swings.',
      ],
    },
    {
      slug: 'diplomacy-backchannel',
      section: 'World',
      kicker: 'Diplomacy',
      headline: 'Backchannel talks resume amid pressure to de-escalate',
      dek: 'Officials signal a narrow path to a monitored ceasefire, contingent on verification.',
      byline: 'By J. Correspondent',
      publishedAtISO: '2026-01-29T07:40:00.000Z',
      readingMinutes: 5,
      body: [
        'Negotiators returned to a familiar formula: incremental confidence-building measures tied to timelines.',
        'Regional partners pushed for independent monitoring, citing prior breakdowns in enforcement.',
        'Public messaging remains cautious, but aides described talks as “constructive” in private.',
      ],
    },
    {
      slug: 'local-investigation',
      section: 'Politics',
      kicker: 'Accountability',
      headline: 'Investigators focus on procurement trail after audit flags anomalies',
      dek: 'A review identifies mismatched invoices and tight bidder pools across multiple contracts.',
      byline: 'By S. Desk',
      publishedAtISO: '2026-01-29T05:10:00.000Z',
      readingMinutes: 7,
      body: [
        'An internal audit documented irregularities in pricing and documentation across a set of related projects.',
        'Officials said the findings would be referred for further review, while contractors disputed the characterization.',
        'Oversight groups called for stronger disclosure and competitive bidding rules.',
      ],
    },
    {
      slug: 'culture-review',
      section: 'Culture',
      kicker: 'Review',
      headline: 'A quiet exhibition turns archives into a living conversation',
      dek: 'Artists remix ephemera into rooms that feel more like essays than installations.',
      byline: 'By C. Critic',
      publishedAtISO: '2026-01-28T23:20:00.000Z',
      readingMinutes: 4,
      body: [
        'The show’s restraint is its power: labels are sparse, and the work asks viewers to supply context.',
        'Fragments of letters and photographs are treated as primary sources rather than decoration.',
        'It is a reminder that curation can be an argument, not just an arrangement.',
      ],
    },
    {
      slug: 'opinion-structure',
      section: 'Opinion',
      kicker: 'Essay',
      headline: 'The web still rewards structure—when we actually provide it',
      dek: 'Headings, summaries, and clear metadata aren’t bureaucracy; they are user experience.',
      byline: 'By Editorial Board',
      publishedAtISO: '2026-01-29T03:00:00.000Z',
      readingMinutes: 3,
      body: [
        'Search and social surfaces compress information. Structure is what survives that compression.',
        'Strong information architecture improves accessibility and makes pages easier to index.',
        'Treat the document outline as a product requirement, not an afterthought.',
      ],
    },
    {
      slug: 'sports-comeback',
      section: 'Sports',
      kicker: 'Match Report',
      headline: 'Late comeback seals a narrow win after a tense second half',
      dek: 'A tactical switch unlocks space down the left as the clock winds down.',
      byline: 'By P. Analyst',
      publishedAtISO: '2026-01-29T01:35:00.000Z',
      readingMinutes: 4,
      body: [
        'The first half was cagey, with both sides reluctant to overcommit in transition.',
        'Momentum swung after the interval, when pressure forced a pair of errors in quick succession.',
        'The winner arrived late, but the build-up reflected a deliberate, rehearsed pattern.',
      ],
    },
  ] satisfies SampleArticle[],
}

