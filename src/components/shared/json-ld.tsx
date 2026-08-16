export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify échappe correctement les guillemets ; on échappe aussi
      // "<" pour empêcher toute évasion de balise (ex: "</script>" dans un texte).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
