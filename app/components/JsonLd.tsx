/**
 * Renders JSON-LD structured data as a <script> tag.
 * Accepts a single schema object or an array of schemas.
 * Safe for App Router server components.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
