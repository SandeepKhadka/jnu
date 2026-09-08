/**
 * Emits JSON-LD. Kept as a server component so the structured data is present
 * in the static HTML — schema injected client-side is unreliable for crawlers.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data]

  return (
    <>
      {payload.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Content is authored by us from typed sources, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  )
}
