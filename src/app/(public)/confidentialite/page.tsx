import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

const PUBLISHED_AT = new Date(2026, 8, 21);
const PUBLISHED_AT_LABEL = formatDate(PUBLISHED_AT);

const EMAIL = "nousezonechretien@gmail.com";
const EMAIL_LINK = `[${EMAIL}](mailto:${EMAIL})`;

export const metadata = pageMetadata({
  title: "Politique de confidentialité",
  description:
    "Comment Zone-Chrétien collecte, utilise et protège vos informations personnelles : newsletter, cookies, contenus d'artistes, bénévolat, droits des utilisateurs.",
  path: "/confidentialite",
});

const CONTENT = `
## 1. Introduction

Bienvenue sur Zone-Chrétien (« nous », « notre », « la Plateforme »), accessible à l'adresse [https://zone-chretien.org](https://zone-chretien.org).

La présente Politique de confidentialité a pour objectif de vous informer, de façon claire et transparente, sur la manière dont nous collectons, utilisons, conservons et protégeons vos informations lorsque vous utilisez notre site, nos services et nos contenus.

En utilisant Zone-Chrétien, vous acceptez les pratiques décrites dans ce document. Si vous n'êtes pas d'accord avec cette politique, nous vous invitons à ne pas utiliser la Plateforme.

## 2. Qui sommes-nous ?

Zone-Chrétien est une plateforme numérique chrétienne dont la mission est de développer une communauté chrétienne en ligne et de partager des contenus tels que : méditations bibliques, prières, versets, musique chrétienne, vidéos, contenus d'artistes chrétiens, podcasts, messages d'encouragement, contenus éducatifs et spirituels, actualités et activités chrétiennes, avec une attention particulière portée à Haïti et à sa diaspora.

Le projet peut évoluer vers d'autres activités, notamment une chaîne TV chrétienne, une radio chrétienne, des événements et concerts, des programmes de formation, des activités communautaires, ou une organisation ou association liée à Zone-Chrétien. La présente politique s'applique à l'ensemble de ces activités, actuelles et futures, dans la mesure où elles impliquent le traitement d'informations personnelles.

**Contact :**
Zone-Chrétien
Site : [https://zone-chretien.org](https://zone-chretien.org)
E-mail : ${EMAIL_LINK}

## 3. Informations que nous collectons

### 3.1 Informations que vous nous fournissez volontairement

Lorsque vous interagissez avec Zone-Chrétien (formulaires, inscription à la newsletter, candidature de bénévolat, contact en tant qu'artiste, etc.), nous pouvons collecter :

- Nom et prénom
- Adresse e-mail
- Numéro de téléphone
- Pays et ville
- Le contenu de vos messages et demandes
- Les informations fournies dans le cadre d'une candidature de bénévolat
- Les informations fournies par les artistes et créateurs souhaitant publier ou autoriser la publication de leurs contenus
- Tout contenu (texte, audio, vidéo, image) que vous nous transmettez volontairement en vue d'une publication

### 3.2 Informations collectées automatiquement

Lorsque vous naviguez sur Zone-Chrétien, certaines informations techniques peuvent être collectées automatiquement, notamment :

- Adresse IP
- Type d'appareil, navigateur et système d'exploitation
- Pages consultées et parcours de navigation
- Date et heure de connexion
- Données statistiques et analytiques d'utilisation du site

## 4. Comment nous collectons les informations

Nous collectons ces informations :

- Directement, lorsque vous remplissez un formulaire, vous inscrivez à la newsletter, nous contactez ou nous soumettez du contenu ;
- Automatiquement, via des technologies telles que les cookies et des outils d'analyse de fréquentation, lors de votre navigation sur le site ;
- Par l'intermédiaire de prestataires techniques (hébergement, outils de formulaire, outils d'envoi d'e-mails) qui nous assistent dans le fonctionnement de la Plateforme.

## 5. Pourquoi nous utilisons vos informations

Nous utilisons les informations collectées pour :

- Faire fonctionner, exploiter et améliorer la Plateforme et ses contenus ;
- Répondre à vos messages, questions et demandes ;
- Vous envoyer, si vous y avez consenti, notre newsletter et des actualités ;
- Traiter les candidatures de bénévolat ;
- Traiter les demandes et autorisations liées à la publication de contenus d'artistes ;
- Assurer la sécurité, la maintenance et le bon fonctionnement technique du site ;
- Comprendre, de façon agrégée et statistique, l'utilisation du site afin de l'améliorer ;
- Respecter nos obligations légales lorsque celles-ci s'appliquent.

Nous n'utilisons pas vos informations personnelles à des fins incompatibles avec celles pour lesquelles elles ont été collectées.

## 6. Base juridique du traitement

Selon votre lieu de résidence et la législation qui vous est applicable, le traitement de vos données peut reposer notamment sur :

- Votre consentement (par exemple, lors de l'inscription à une newsletter) ;
- L'exécution d'une démarche que vous avez initiée (par exemple, répondre à une demande de contact ou de bénévolat) ;
- Notre intérêt légitime à faire fonctionner et améliorer la Plateforme, dans le respect de vos droits et libertés ;
- Le respect d'une obligation légale, lorsque celle-ci s'applique.

Zone-Chrétien n'affirme pas être systématiquement soumise à un cadre juridique particulier tel que le Règlement Général sur la Protection des Données (RGPD) de l'Union européenne. Certaines dispositions de ce règlement, ou d'autres législations applicables selon votre localisation, peuvent néanmoins s'appliquer en fonction de votre situation et des circonstances. En cas de doute sur vos droits, nous vous invitons à nous contacter ou à consulter un professionnel du droit compétent dans votre juridiction.

## 7. Newsletter et communications

Notre site propose une inscription volontaire à une newsletter afin de recevoir les dernières chansons, articles et actualités de Zone-Chrétien.

- Votre adresse e-mail n'est collectée que si vous choisissez de vous inscrire ;
- Elle est utilisée uniquement pour vous envoyer les communications auxquelles vous avez consenti ;
- Vous pouvez vous désabonner à tout moment, via le lien de désabonnement présent dans chaque communication, ou en nous contactant directement à l'adresse indiquée à la section Contact.

## 8. Cookies et technologies similaires

Zone-Chrétien peut utiliser des cookies et technologies similaires afin de :

- Assurer le bon fonctionnement technique du site (cookies nécessaires) ;
- Mesurer et analyser la fréquentation du site, de façon agrégée, afin d'en améliorer le contenu et l'expérience (cookies analytiques) ;
- Le cas échéant, mesurer l'efficacité de contenus partagés ou promus (cookies éventuellement publicitaires), si une telle fonctionnalité venait à être mise en place.

Vous pouvez configurer votre navigateur pour refuser les cookies ou être averti avant leur dépôt. Le refus de certains cookies peut toutefois affecter certaines fonctionnalités du site.

## 9. Services tiers

Afin de faire fonctionner Zone-Chrétien, nous pouvons faire appel à des prestataires et services tiers, notamment pour :

- L'hébergement et l'infrastructure technique du site ;
- Le stockage de données et de contenus ;
- Le traitement de formulaires ;
- L'envoi d'e-mails et de communications ;
- Les statistiques et l'analyse de fréquentation ;
- L'intégration de contenus vidéo, notamment via YouTube ;
- Le partage et la diffusion de contenus sur des réseaux sociaux tels que Facebook, Instagram, TikTok ou autres plateformes similaires ;
- La sécurité du site.

Ces prestataires peuvent avoir accès à certaines informations dans la stricte mesure nécessaire à l'exécution de leurs services, et sont tenus de les traiter conformément à leurs propres politiques de confidentialité. Nous vous invitons à consulter les politiques de confidentialité de ces services tiers pour en savoir davantage sur leurs propres pratiques.

## 10. Contenus et publications

Il est important de distinguer :

- **Vos informations personnelles** (nom, e-mail, téléphone, etc.), traitées conformément à la présente politique ;
- **Les contenus que vous nous transmettez volontairement en vue d'une publication** (chansons, vidéos, photos, textes, témoignages, etc.), qui sont soumis à des règles distinctes liées aux droits d'auteur et droits à l'image ;
- **Les autorisations de publication** que vous nous accordez, le cas échéant, lorsque vous nous soumettez un contenu destiné à être diffusé sur la Plateforme.

En nous transmettant un contenu en vue de sa publication, vous confirmez disposer des droits nécessaires sur ce contenu (droits d'auteur, droit à l'image des personnes y figurant, etc.) et vous nous autorisez à le publier et à le diffuser sur Zone-Chrétien et, le cas échéant, sur ses canaux associés (réseaux sociaux, chaîne vidéo, etc.).

## 11. Artistes et créateurs

Les artistes et créateurs souhaitant que leurs œuvres (chansons, vidéos, contenus visuels) soient présentées sur Zone-Chrétien peuvent être amenés à nous fournir des informations telles que leur nom, leurs coordonnées, des informations relatives à leurs œuvres, ainsi qu'une autorisation de publication et de diffusion.

Ces informations sont utilisées exclusivement dans le cadre de la relation avec l'artiste et de la gestion de la publication de ses contenus sur la Plateforme. Elles ne sont pas partagées à des fins autres que celles pour lesquelles elles ont été communiquées, sauf accord contraire de l'artiste ou obligation légale.

## 12. Bénévoles

Zone-Chrétien peut faire appel à des bénévoles, notamment de jeunes bénévoles, pour participer à certaines activités en ligne. Dans le cadre d'une candidature de bénévolat, nous pouvons collecter des informations telles que le nom, l'âge, les coordonnées et la motivation du candidat.

Ces informations sont utilisées uniquement dans le cadre du processus de candidature et, le cas échéant, de la coordination des activités bénévoles. Lorsque le candidat est mineur, une attention particulière est portée à la protection de ses informations, conformément à la section suivante.

## 13. Protection des mineurs

Zone-Chrétien accorde une attention particulière à la protection des enfants et adolescents.

- La Plateforme n'a pas pour vocation de collecter sciemment des informations personnelles auprès d'enfants sans l'accord approprié d'un parent ou tuteur légal, lorsque celui-ci est requis par la législation applicable ;
- Dans le cadre de candidatures de bénévolat impliquant des mineurs, nous pouvons demander une confirmation ou une autorisation parentale lorsque cela est approprié ;
- Si vous pensez qu'un mineur nous a communiqué des informations personnelles sans l'autorisation requise, nous vous invitons à nous contacter afin que nous puissions prendre les mesures appropriées, y compris la suppression de ces informations.

## 14. Partage des informations

Zone-Chrétien :

- Ne vend pas vos données personnelles à des tiers ;
- Peut partager certaines informations avec des prestataires techniques, dans la stricte mesure nécessaire au fonctionnement de la Plateforme (hébergement, envoi d'e-mails, statistiques, etc.) ;
- Peut divulguer certaines informations lorsque la loi l'exige, ou pour protéger nos droits, notre sécurité ou celle d'autrui ;
- S'efforce de limiter tout partage aux seules informations strictement nécessaires à la finalité concernée.

## 15. Transferts internationaux

Certains de nos prestataires techniques peuvent être situés dans des pays autres que celui où vous résidez. Vos informations peuvent donc être traitées ou stockées à l'étranger, dans le cadre de l'utilisation de ces services. Nous nous efforçons de sélectionner des prestataires appliquant des mesures de protection raisonnables des données qu'ils traitent pour notre compte.

## 16. Conservation des données

Nous conservons vos informations uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, sous réserve d'obligations légales de conservation plus longues ou de besoins légitimes justifiant une conservation prolongée (par exemple, la gestion d'un litige).

Aucune durée de conservation fixe et universelle n'est indiquée ici dans la mesure où celle-ci dépend de la nature de chaque information et de la finalité de son traitement.

## 17. Sécurité

Nous mettons en œuvre des mesures raisonnables, techniques et organisationnelles, destinées à protéger vos informations contre l'accès non autorisé, la perte, la destruction, la modification, la divulgation ou l'utilisation abusive.

Aucune méthode de transmission ou de stockage de données sur Internet n'étant totalement sécurisée, nous ne pouvons garantir une sécurité absolue de vos informations.

## 18. Droits des utilisateurs

Selon la législation qui vous est applicable, vous pouvez disposer des droits suivants concernant vos informations personnelles :

- **Droit d'accès** : obtenir la confirmation que nous traitons vos données et en obtenir une copie ;
- **Droit de rectification** : demander la correction d'informations inexactes ou incomplètes ;
- **Droit à l'effacement** : demander la suppression de vos informations, dans les limites permises par la loi ;
- **Droit à la limitation** : demander la limitation du traitement de vos informations dans certains cas ;
- **Droit d'opposition** : vous opposer à un traitement de vos informations pour des motifs légitimes ;
- **Droit de retirer votre consentement** : à tout moment, lorsque le traitement repose sur votre consentement (par exemple, la newsletter) ;
- **Droit à la portabilité**, lorsque applicable, pour recevoir vos informations dans un format structuré ;
- **Droit de déposer une réclamation** auprès d'une autorité de protection des données compétente, lorsque applicable dans votre juridiction.

## 19. Comment exercer vos droits

Pour exercer l'un de ces droits, ou pour toute question relative à cette politique, vous pouvez nous contacter à l'adresse suivante :

**E-mail :** ${EMAIL_LINK}

Nous nous efforcerons de répondre à votre demande dans un délai raisonnable, dans la mesure permise par les circonstances et la législation applicable.

## 20. Liens externes

Zone-Chrétien peut contenir des liens vers des sites, plateformes ou services externes (réseaux sociaux, YouTube, sites d'artistes partenaires, etc.). Ces sites disposent de leurs propres politiques de confidentialité, sur lesquelles nous n'avons aucun contrôle. Nous vous invitons à consulter ces politiques avant de leur communiquer des informations personnelles.

## 21. Modifications de la présente politique

Nous pouvons être amenés à mettre à jour cette Politique de confidentialité, notamment pour refléter l'évolution de nos activités, de nos outils techniques ou de la législation applicable. Toute modification sera publiée sur cette page, accompagnée d'une nouvelle date de mise à jour. Nous vous encourageons à consulter régulièrement cette page.

## 22. Contact

Pour toute question relative à cette Politique de confidentialité ou à la manière dont nous traitons vos informations, vous pouvez nous contacter :

**Zone-Chrétien**
Site : [https://zone-chretien.org](https://zone-chretien.org)
E-mail : ${EMAIL_LINK}

## 23. Date de dernière mise à jour

*${PUBLISHED_AT_LABEL}*
`;

export default function PrivacyPolicyPage() {
  return (
    <div>
      <div className="border-b border-white/[0.06] bg-brand-navy text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mt-3 font-body text-sm text-white/60">
            Dernière mise à jour : {PUBLISHED_AT_LABEL}
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div
          className="prose prose-neutral max-w-none leading-relaxed text-foreground/90 dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-a:text-navy dark:prose-a:text-gold-soft"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(CONTENT) }}
        />
      </article>
    </div>
  );
}
