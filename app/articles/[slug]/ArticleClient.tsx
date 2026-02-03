'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/app/contexts/ThemeContext'
import ArticleMap from './ArticleMap'

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

interface ArticleClientProps {
  article: ArticleData
}

export default function ArticleClient({ article }: ArticleClientProps) {
  const { theme, toggleTheme, mounted } = useTheme()
  const [copied, setCopied] = useState(false)

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const bgColor = theme === 'dark' ? '#0a0a0a' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a'
  const mutedTextColor = theme === 'dark' ? '#9ca3af' : '#6b7280'
  const borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  // Share functionality
  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = article.headline

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Article Container */}
      <article
        className="max-w-4xl mx-auto px-6 py-12"
        style={{ fontFamily: 'var(--font-source-serif-4), Georgia, serif' }}
      >
        {/* Article Header */}
        <header className="mb-12">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: theme === 'dark' ? '#fbbf24' : '#d97706'
              }}
            >
              {article.category}
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: mutedTextColor
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h1
            className="text-5xl font-bold leading-tight mb-6"
            style={{ color: textColor }}
          >
            {article.headline}
          </h1>

          {/* Subheadline */}
          <p
            className="text-xl leading-relaxed mb-8"
            style={{ color: mutedTextColor }}
          >
            {article.subheadline}
          </p>

          {/* Byline */}
          <div className="flex items-center justify-between border-t border-b py-4" style={{ borderColor }}>
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: textColor }}>
                    By{' '}
                    {article.author.url ? (
                      <a
                        href={article.author.url}
                        className="hover:underline"
                        style={{ color: theme === 'dark' ? '#60a5fa' : '#2563eb' }}
                      >
                        {article.author.name}
                      </a>
                    ) : (
                      article.author.name
                    )}
                  </span>
                </div>
                <time
                  dateTime={article.publishedDate}
                  className="text-sm"
                  style={{ color: mutedTextColor }}
                >
                  Published {formatDate(article.publishedDate)}
                </time>
                {article.modifiedDate && article.modifiedDate !== article.publishedDate && (
                  <span className="text-sm block" style={{ color: mutedTextColor }}>
                    Updated {formatDate(article.modifiedDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-full transition-colors hover:scale-110"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: mutedTextColor
                }}
                aria-label="Share on Twitter"
                title="Share on Twitter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 rounded-full transition-colors hover:scale-110"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: mutedTextColor
                }}
                aria-label="Share on Facebook"
                title="Share on Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 3.667h-3.533v7.98H9.101z" />
                </svg>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 rounded-full transition-colors hover:scale-110"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: mutedTextColor
                }}
                aria-label="Share on LinkedIn"
                title="Share on LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="p-2 rounded-full transition-colors hover:scale-110"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: mutedTextColor
                }}
                aria-label="Copy link"
                title={copied ? 'Copied!' : 'Copy link'}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <section className="mb-12">
          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              aspectRatio: '16/9',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6'
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: mutedTextColor }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            {/* In production, replace with actual image:
            <Image
              src={article.heroImage.url}
              alt={article.heroImage.alt}
              width={article.heroImage.width}
              height={article.heroImage.height}
              className="w-full h-full object-cover"
              priority
            />
            */}
          </div>
          <p className="text-sm mt-2" style={{ color: mutedTextColor }}>
            {article.heroImage.alt}
          </p>
        </section>

        {/* Article Body */}
        <section className="prose prose-lg max-w-none mb-12">
          {article.sections.map((section, index) => (
            <div key={section.id} className="mb-8">
              {section.heading && (
                <h2
                  className="text-3xl font-bold mb-4"
                  style={{ color: textColor }}
                >
                  {section.heading}
                </h2>
              )}
              <p
                className="text-lg leading-relaxed"
                style={{ color: textColor }}
              >
                {section.content}
              </p>

              {/* Insert pull quote after second section */}
              {index === 1 && article.pullQuote && (
                <blockquote
                  className="my-8 pl-6 border-l-4 italic"
                  style={{
                    borderColor: theme === 'dark' ? '#60a5fa' : '#2563eb',
                    color: textColor
                  }}
                >
                  <p className="text-2xl leading-relaxed mb-2">
                    &ldquo;{article.pullQuote.text}&rdquo;
                  </p>
                  {article.pullQuote.attribution && (
                    <footer className="text-base not-italic" style={{ color: mutedTextColor }}>
                      — {article.pullQuote.attribution}
                    </footer>
                  )}
                </blockquote>
              )}

              {/* Insert interactive map after third section */}
              {index === 2 && (
                <div className="my-12">
                  <ArticleMap />
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Article Footer */}
        <footer className="border-t pt-8" style={{ borderColor }}>
          {/* Tags */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: mutedTextColor }}>
              Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <a
                  key={tag}
                  href={`/topics/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1.5 text-sm rounded transition-colors"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: textColor
                  }}
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          <div>
            <h3 className="text-2xl font-bold mb-6" style={{ color: textColor }}>
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {article.relatedArticles.map((related) => (
                <a
                  key={related.slug}
                  href={`/articles/${related.slug}`}
                  className="group block rounded-lg overflow-hidden transition-transform hover:scale-105"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${borderColor}`
                  }}
                >
                  <div
                    className="relative w-full"
                    style={{
                      aspectRatio: '16/9',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6'
                    }}
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ color: mutedTextColor }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-base mb-2 group-hover:underline" style={{ color: textColor }}>
                      {related.title}
                    </h4>
                    <time
                      dateTime={related.date}
                      className="text-sm"
                      style={{ color: mutedTextColor }}
                    >
                      {formatDate(related.date)}
                    </time>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
