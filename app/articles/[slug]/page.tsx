import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ThemeProvider } from '@/app/contexts/ThemeContext'
import ArticleClient from './ArticleClient'

// Type definitions
interface ArticleData {
  slug: string
  headline: string
  subheadline: string
  author: {
    name: string
    url?: string
  }
  publishedDate: string
  modifiedDate?: string
  category: string
  tags: string[]
  heroImage: {
    url: string
    alt: string
    width: number
    height: number
  }
  sections: ArticleSection[]
  pullQuote?: {
    text: string
    attribution?: string
  }
  relatedArticles: RelatedArticle[]
}

interface ArticleSection {
  id: string
  heading?: string
  content: string
}

interface RelatedArticle {
  slug: string
  title: string
  image: string
  date: string
}

// Fetch article data (in production, this would call an API or database)
async function getArticle(slug: string): Promise<ArticleData | null> {
  // PLACEHOLDER: Replace with actual data fetching
  // Example: const res = await fetch(`${process.env.API_URL}/articles/${slug}`, { cache: 'no-store' })

  // Return null for non-existent articles
  // if (!res.ok) return null

  // Mock data for demonstration
  const mockArticle: ArticleData = {
    slug,
    headline: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor',
    subheadline: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    author: {
      name: 'Jane Doe',
      url: 'https://example.com/authors/jane-doe'
    },
    publishedDate: '2026-01-20T10:00:00Z',
    modifiedDate: '2026-01-25T14:30:00Z',
    category: 'World News',
    tags: ['Breaking News', 'International', 'Politics'],
    heroImage: {
      url: '/placeholder-hero.jpg',
      alt: 'Lorem ipsum dolor sit amet',
      width: 1200,
      height: 630
    },
    sections: [
      {
        id: 'intro',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      },
      {
        id: 'section-1',
        heading: 'Lorem Ipsum Dolor Sit Amet',
        content: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.'
      },
      {
        id: 'section-2',
        heading: 'Consectetur Adipiscing Elit',
        content: 'Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.'
      },
      {
        id: 'section-3',
        heading: 'Sed Do Eiusmod Tempor',
        content: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.'
      }
    ],
    pullQuote: {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      attribution: 'Expert Name, Organization'
    },
    relatedArticles: [
      {
        slug: 'related-article-1',
        title: 'Lorem ipsum dolor sit amet consectetur',
        image: '/placeholder-related-1.jpg',
        date: '2026-01-18T10:00:00Z'
      },
      {
        slug: 'related-article-2',
        title: 'Sed do eiusmod tempor incididunt',
        image: '/placeholder-related-2.jpg',
        date: '2026-01-15T10:00:00Z'
      },
      {
        slug: 'related-article-3',
        title: 'Ut labore et dolore magna aliqua',
        image: '/placeholder-related-3.jpg',
        date: '2026-01-12T10:00:00Z'
      }
    ]
  }

  return mockArticle
}

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.'
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  const articleUrl = `${baseUrl}/articles/${article.slug}`

  return {
    title: `${article.headline} | Your Publication Name`,
    description: article.subheadline,
    keywords: article.tags.join(', '),
    authors: [{ name: article.author.name, url: article.author.url }],
    creator: article.author.name,
    publisher: 'Your Publication Name',
    category: article.category,
    openGraph: {
      type: 'article',
      url: articleUrl,
      title: article.headline,
      description: article.subheadline,
      siteName: 'Your Publication Name',
      publishedTime: article.publishedDate,
      modifiedTime: article.modifiedDate || article.publishedDate,
      authors: [article.author.name],
      tags: article.tags,
      images: [
        {
          url: article.heroImage.url,
          width: article.heroImage.width,
          height: article.heroImage.height,
          alt: article.heroImage.alt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description: article.subheadline,
      creator: '@yourhandle',
      site: '@yourhandle',
      images: [article.heroImage.url]
    },
    alternates: {
      canonical: articleUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  }
}

// Server Component (main page)
export default async function ArticlePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  // Generate JSON-LD structured data for NewsArticle
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  const articleUrl = `${baseUrl}/articles/${article.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.subheadline,
    image: {
      '@type': 'ImageObject',
      url: article.heroImage.url,
      width: article.heroImage.width,
      height: article.heroImage.height
    },
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.url
    },
    publisher: {
      '@type': 'Organization',
      name: 'Your Publication Name',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    articleSection: article.category,
    keywords: article.tags.join(', ')
  }

  return (
    <ThemeProvider>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Article Content */}
      <ArticleClient article={article} />
    </ThemeProvider>
  )
}

// Generate static params for static generation (optional)
// export async function generateStaticParams() {
//   // Fetch all article slugs
//   // const articles = await fetch('https://api.example.com/articles').then(res => res.json())
//   // return articles.map((article: { slug: string }) => ({ slug: article.slug }))
//   return []
// }
