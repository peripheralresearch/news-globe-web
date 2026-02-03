# SEO-Optimized Article Page Template

Production-ready Next.js 14 App Router article page template with comprehensive SEO optimization, semantic HTML, and interactive elements.

## File Structure

```
app/articles/[slug]/
├── page.tsx              # Server component with metadata generation
├── ArticleClient.tsx     # Client component with interactive features
├── ArticleMap.tsx        # Client component for interactive map
└── README.md            # This file
```

## Features

### SEO Optimization

1. **Dynamic Metadata Generation** (`generateMetadata`)
   - Title, description, keywords
   - Open Graph tags for social sharing
   - Twitter Card metadata
   - Canonical URLs
   - Author and publisher information
   - Timestamps (published/modified dates)

2. **JSON-LD Structured Data**
   - NewsArticle schema
   - Complete with author, publisher, images
   - Enhances search engine understanding
   - Rich snippets eligibility

3. **Semantic HTML**
   - `<article>` wrapper for main content
   - `<header>` for article metadata
   - `<time>` for dates with datetime attributes
   - `<section>` for content divisions
   - `<footer>` for related content
   - Proper heading hierarchy (h1 → h2)

### Accessibility Features

- ARIA labels on interactive elements
- Semantic HTML structure
- Keyboard-navigable interface
- Theme toggle with proper labeling
- Descriptive alt text placeholders
- Focus management considerations

### Interactive Elements

1. **Theme Toggle**
   - Integrated with existing ThemeContext
   - Smooth transitions
   - Persistent across page loads
   - Icon changes based on current theme

2. **Social Sharing**
   - Twitter/X
   - Facebook
   - LinkedIn
   - Copy link to clipboard
   - Visual feedback on copy

3. **Interactive Map Component**
   - Expandable/collapsible
   - Placeholder for map integration
   - Theme-aware styling
   - Zoom controls
   - Map legend

### Typography

- Uses Source Serif 4 font (via CSS variable)
- Responsive text sizing
- Optimized line heights for readability
- Proper font weight hierarchy

## Data Flow

### Server Component (page.tsx)

1. Receives `slug` parameter from URL
2. Fetches article data (currently mocked)
3. Generates SEO metadata
4. Creates JSON-LD structured data
5. Passes data to client component

### Client Component (ArticleClient.tsx)

1. Receives article data as props
2. Uses ThemeContext for theming
3. Handles user interactions
4. Manages state (copy feedback, etc.)
5. Renders article content with styling

## Integration Points

### Replace Mock Data

In `page.tsx`, replace the `getArticle` function:

```typescript
async function getArticle(slug: string): Promise<ArticleData | null> {
  const res = await fetch(`${process.env.API_URL}/articles/${slug}`, {
    cache: 'no-store'
  })

  if (!res.ok) return null

  return res.json()
}
```

### Enable Static Generation

Uncomment and implement `generateStaticParams`:

```typescript
export async function generateStaticParams() {
  const articles = await fetch('https://api.example.com/articles')
    .then(res => res.json())

  return articles.map((article: { slug: string }) => ({
    slug: article.slug
  }))
}
```

### Add Real Hero Images

Replace placeholder in `ArticleClient.tsx`:

```typescript
import Image from 'next/image'

// Replace the placeholder div with:
<Image
  src={article.heroImage.url}
  alt={article.heroImage.alt}
  width={article.heroImage.width}
  height={article.heroImage.height}
  className="w-full h-full object-cover"
  priority
/>
```

### Integrate Real Map

Replace `ArticleMap.tsx` with actual map implementation:

```typescript
// Example with Mapbox
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Initialize map with coordinates from article data
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

Optional for map integration:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Usage Example

### Create an Article

Visit any URL matching the pattern:
```
/articles/your-article-slug
```

The page will:
1. Fetch data for `your-article-slug`
2. Generate appropriate metadata
3. Render the article with full SEO optimization
4. Support theme switching
5. Enable social sharing

### Customize Content

Modify the `ArticleData` interface to match your data structure:

```typescript
interface ArticleData {
  slug: string
  headline: string
  subheadline: string
  // Add your custom fields
  videoUrl?: string
  gallery?: string[]
  // etc.
}
```

## Performance Considerations

1. **Image Optimization**
   - Use Next.js Image component
   - Implement lazy loading for below-fold images
   - Serve appropriately sized images

2. **Code Splitting**
   - Client components automatically code-split
   - Map component loads only when needed
   - Theme context shared across routes

3. **Caching Strategy**
   - Server component data fetching uses `cache: 'no-store'`
   - Adjust based on your content update frequency
   - Consider ISR for semi-static content

## Testing Checklist

- [ ] Metadata appears correctly in browser tab
- [ ] Open Graph preview works (Facebook/LinkedIn debugger)
- [ ] Twitter Card preview works (Twitter Card Validator)
- [ ] JSON-LD validates (Google Rich Results Test)
- [ ] Theme toggle persists across navigation
- [ ] Social sharing buttons work correctly
- [ ] Copy link provides feedback
- [ ] Map expands/collapses smoothly
- [ ] Responsive design works on mobile
- [ ] Accessibility: keyboard navigation
- [ ] Accessibility: screen reader compatibility

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Related Files

- `/app/contexts/ThemeContext.tsx` - Theme provider
- `/app/layout.tsx` - Root layout with font configuration
- `/app/globals.css` - Global styles and utilities

## Future Enhancements

- Reading time estimation
- Table of contents generation
- Comment section integration
- Article recommendation algorithm
- Print-friendly styles
- AMP version support
- Multi-language support
- Author bio section
- Newsletter signup integration
