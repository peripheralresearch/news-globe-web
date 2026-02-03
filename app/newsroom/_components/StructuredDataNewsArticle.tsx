import type { SampleArticle } from '../_data/sampleIssue'

export function StructuredDataNewsArticle({
  article,
  organizationName,
}: {
  article: SampleArticle
  organizationName: string
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    datePublished: article.publishedAtISO,
    author: {
      '@type': 'Person',
      name: article.byline.replace(/^By\s+/i, ''),
    },
    publisher: {
      '@type': 'Organization',
      name: organizationName,
    },
    ...(article.image?.src
      ? {
          image: [article.image.src],
        }
      : null),
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

