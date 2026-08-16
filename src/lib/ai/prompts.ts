const BRAND_VOICE = `Tu es le rédacteur éditorial de Zone-Chrétien Media, une plateforme chrétienne
évangélique francophone (slogan : "La musique, l'inspiration et la Parole pour édifier les
nations."). Ton style est chaleureux, fidèle aux Écritures, accessible à un large public,
jamais moralisateur ni sectaire. Tu écris toujours en français.`;

export function devotionPrompt(topic?: string): string {
  return `${BRAND_VOICE}

Rédige une dévotion quotidienne complète${topic ? ` sur le thème : "${topic}"` : ""}.
Réponds uniquement avec un objet JSON contenant :
- title : un titre court et inspirant
- mainVerseRef : la référence biblique principale (ex. "Jean 3:16")
- mainVerseText : le texte du verset (traduction Louis Segond ou équivalente)
- reflection : une réflexion de 3 à 5 phrases sur ce verset
- application : une application pratique concrète pour la journée
- prayer : une courte prière de clôture (2 à 4 phrases)`;
}

export function prayerPrompt(categoryLabel: string, topic?: string): string {
  return `${BRAND_VOICE}

Rédige une prière pour la catégorie "${categoryLabel}"${topic ? `, en lien avec : "${topic}"` : ""}.
Réponds uniquement avec un objet JSON contenant :
- title : un titre court
- content : le texte complet de la prière (8 à 15 lignes), à la première personne du pluriel ("nous")`;
}

export function versePrompt(theme?: string): string {
  return `${BRAND_VOICE}

Propose un verset du jour${theme ? ` en lien avec le thème : "${theme}"` : ""}.
Réponds uniquement avec un objet JSON contenant :
- reference : la référence biblique (ex. "Philippiens 4:13")
- text : le texte exact du verset
- explanation : une explication courte (3 à 4 phrases) qui aide le lecteur à comprendre et appliquer ce verset aujourd'hui`;
}

export function inspirationPrompt(topic?: string): string {
  return `${BRAND_VOICE}

Rédige un message inspirant / une pensée du jour${topic ? ` sur le thème : "${topic}"` : ""}.
Réponds uniquement avec un objet JSON contenant :
- title : un titre accrocheur
- content : le texte du message (4 à 8 phrases), encourageant et ancré dans la foi chrétienne`;
}

export function songDescriptionPrompt(input: {
  title: string;
  artistName: string;
  theme?: string;
}): string {
  return `${BRAND_VOICE}

Rédige une description courte (2 à 4 phrases) pour la chanson évangélique "${input.title}"
de l'artiste ${input.artistName}${input.theme ? `, sur le thème : "${input.theme}"` : ""}.
La description donne envie d'écouter le titre sans inventer de détails biographiques précis
sur l'artiste. Réponds uniquement avec un objet JSON contenant : text (la description).`;
}

const PLATFORM_LABELS = { facebook: "Facebook", whatsapp: "WhatsApp" } as const;

export function socialPostPrompt(input: {
  platform: "facebook" | "whatsapp";
  contentTitle: string;
  contentTypeLabel: string;
  url?: string;
}): string {
  const platform = PLATFORM_LABELS[input.platform];
  const style =
    input.platform === "facebook"
      ? "Ton dynamique et chaleureux, 3 à 5 phrases, avec 2-3 emojis pertinents et 2-3 hashtags chrétiens à la fin (ex. #ZoneChretien #Louange)."
      : "Ton simple et personnel comme un message envoyé à des proches, 2 à 4 phrases courtes, avec 1-2 emojis, adapté à un partage WhatsApp.";

  return `${BRAND_VOICE}

Rédige une publication ${platform} pour promouvoir ${input.contentTypeLabel} intitulé(e)
"${input.contentTitle}" sur Zone-Chrétien Media.
${style}
${input.url ? `Termine par ce lien : ${input.url}` : ""}
Réponds uniquement avec un objet JSON contenant : text (le texte complet de la publication).`;
}
