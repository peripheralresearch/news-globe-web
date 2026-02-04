import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://theperipheral.org'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',  // Publisher hub with live content
      priority: 1,
    },
    {
      url: `${baseUrl}/stories/venezuela`,
      lastModified: new Date(),
      changeFrequency: 'hourly',  // Live hub - frequent updates
      priority: 0.95,  // Highest priority for live coverage
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: new Date(),
      changeFrequency: 'hourly',  // Stories update constantly
      priority: 0.9,
    },
    {
      url: `${baseUrl}/globe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stories/iran`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stories/ice`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/newspaper`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/newsroom`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // Articles
    {
      url: `${baseUrl}/articles/venezuela`,
      lastModified: new Date('2025-01-26'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // TODO: Add dynamic article routes when article data is available
  // Example structure for articles:
  // const articles = await fetchArticles()
  // const articleRoutes = articles.map(article => ({
  //   url: `${baseUrl}/articles/${article.slug}`,
  //   lastModified: new Date(article.updatedAt),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }))

  return staticRoutes
}
