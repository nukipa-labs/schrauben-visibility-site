/**
 * Inline JSON-LD injector. Rendered inside the page body — works with
 * Next.js App Router server components and the supplier audit's
 * cheerio parser (which scans `script[type="application/ld+json"]`
 * anywhere in the document).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // The audit reads JSON-LD by parsing the inner text — escape only
      // the script-closing sequence so embedded `</script>` strings
      // can't break out (defensive; we control the inputs here).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c')
      }}
    />
  );
}
