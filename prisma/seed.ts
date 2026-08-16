/**
 * Données de démonstration — Zone-Chrétien Media
 * 20 chansons, 10 artistes, 20 inspirations, 20 dévotions, 20 prières,
 * 20 versets, 10 témoignages, 20 articles (+ catégories/tags de support).
 *
 * Idempotent : basé sur upsert(slug), peut être relancé sans dupliquer.
 * Usage : npm run db:seed
 */
import { prisma } from "../src/lib/db";
import { slugify } from "../src/lib/utils";
import type { PrayerCategory } from "@prisma/client";

function img(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const AUDIO_TRACKS = Array.from(
  { length: 20 },
  (_, i) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`,
);

// Extraits YouTube réels et stables (chaînes officielles de louange).
const YOUTUBE_SAMPLES = [
  "https://www.youtube.com/watch?v=nQWFzMvCfLE", // What A Beautiful Name — Hillsong Worship
  "https://www.youtube.com/watch?v=dy9nwe9_xzw", // Oceans (Where Feet May Fail) — Hillsong United
  "https://www.youtube.com/watch?v=QM8jQHE5AAk", // Way Maker — Sinach
  "https://www.youtube.com/watch?v=IvSuGyJQ6oM", // Goodness of God — Bethel Music
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

// ============================================================================
// ARTISTES
// ============================================================================

const ARTISTS = [
  { name: "Grâce Musanga", bio: "Chantre de louange et d'adoration, connue pour sa voix puissante et ses textes ancrés dans les Psaumes." },
  { name: "Emmanuel Ndoye", bio: "Auteur-compositeur gospel, mélange sonorités afrobeat et louange contemporaine depuis plus de dix ans." },
  { name: "Rachel Kiyimba", bio: "Voix soul du renouveau charismatique, portée par un ministère de réconciliation et d'espérance." },
  { name: "David Amissah", bio: "Chantre et pasteur de louange, ses chants d'adoration accompagnent des milliers de cultes chaque dimanche." },
  { name: "Joyce Uwimana", bio: "Artiste engagée pour la jeunesse chrétienne, connue pour ses refrains entraînants et fédérateurs." },
  { name: "Samuel Kponou", bio: "Guitariste et chantre, son style acoustique intimiste invite à la méditation et à la prière personnelle." },
  { name: "Esther Mbala", bio: "Voix de la nouvelle génération gospel francophone, entre cantiques traditionnels et sonorités actuelles." },
  { name: "Josué Tanoh", bio: "Chantre d'adoration originaire d'Abidjan, ses compositions puisent dans la tradition chorale africaine." },
  { name: "Naomi Adjei", bio: "Artiste et missionnaire, utilise la musique comme pont entre l'Évangile et les nations." },
  { name: "Paul Kabeya", bio: "Compositeur de cantiques modernes, cherche à rendre la théologie accessible à travers la mélodie." },
];

// ============================================================================
// VERSETS (pool partagé, réutilisé aussi par les dévotions)
// ============================================================================

const VERSES_POOL = [
  { reference: "Jean 3:16", text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.", explanation: "Ce verset résume le cœur de l'Évangile : l'amour de Dieu qui se donne pour racheter l'humanité." },
  { reference: "Philippiens 4:13", text: "Je puis tout par celui qui me fortifie.", explanation: "Notre force ne vient pas de nous-mêmes mais de notre communion avec Christ, à qui rien n'est impossible." },
  { reference: "Psaume 23:1", text: "L'Éternel est mon berger : je ne manquerai de rien.", explanation: "Dieu prend soin de chaque détail de notre vie, comme un berger attentif à son troupeau." },
  { reference: "Romains 8:28", text: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.", explanation: "Même dans les épreuves, Dieu œuvre en coulisse pour notre bien ultime." },
  { reference: "Jérémie 29:11", text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.", explanation: "Dieu a un plan bienveillant pour chacun, même quand le présent semble incertain." },
  { reference: "Ésaïe 41:10", text: "Ne crains rien, car je suis avec toi ; ne prends pas d'inquiétude, car je suis ton Dieu.", explanation: "La présence de Dieu est l'antidote à toutes nos peurs." },
  { reference: "Proverbes 3:5-6", text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", explanation: "La confiance en Dieu dépasse notre propre compréhension des situations." },
  { reference: "Matthieu 6:33", text: "Cherchez premièrement le royaume et la justice de Dieu, et toutes ces choses vous seront données par-dessus.", explanation: "Nos priorités spirituelles éclairent et ordonnent le reste de notre vie." },
  { reference: "Psaume 46:1", text: "Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.", explanation: "Dans la tempête, Dieu reste un abri stable et fiable." },
  { reference: "1 Corinthiens 13:4", text: "L'amour est patient, il est plein de bonté ; l'amour n'est point envieux.", explanation: "La description biblique de l'amour reste le modèle de toute relation authentique." },
  { reference: "Galates 5:22-23", text: "Le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance.", explanation: "Ce fruit grandit naturellement quand nous demeurons connectés à l'Esprit." },
  { reference: "Josué 1:9", text: "Fortifie-toi et prends courage, ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi.", explanation: "Le courage biblique s'enracine dans la certitude de la présence de Dieu." },
  { reference: "Psaume 91:1-2", text: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.", explanation: "La proximité constante avec Dieu est notre meilleure protection." },
  { reference: "2 Corinthiens 5:17", text: "Si quelqu'un est en Christ, il est une nouvelle création. Les choses anciennes sont passées ; voici, toutes choses sont devenues nouvelles.", explanation: "En Christ, notre passé ne définit plus notre identité." },
  { reference: "Éphésiens 2:8-9", text: "C'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu.", explanation: "Le salut est un cadeau reçu, jamais un salaire mérité." },
  { reference: "Psaume 34:18", text: "L'Éternel est près de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement.", explanation: "Dieu ne s'éloigne jamais autant que dans nos moments de souffrance." },
  { reference: "Romains 12:2", text: "Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence.", explanation: "La transformation chrétienne commence par le renouvellement de nos pensées." },
  { reference: "Hébreux 11:1", text: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.", explanation: "La foi voit au-delà des apparences présentes." },
  { reference: "1 Jean 4:19", text: "Pour nous, nous l'aimons, parce qu'il nous a aimés le premier.", explanation: "Notre amour pour Dieu est toujours une réponse à son amour premier." },
  { reference: "Nombres 6:24-26", text: "Que l'Éternel te bénisse, et qu'il te garde ! Que l'Éternel fasse luire sa face sur toi, et qu'il t'accorde sa grâce !", explanation: "Cette bénédiction sacerdotale reste l'une des plus belles prières de l'Ancien Testament." },
];

// ============================================================================
// CHANSONS (20 titres)
// ============================================================================

const SONG_TITLES = [
  "Sois exalté", "Ta grâce me suffit", "Refuge éternel", "Hosanna dans les hauteurs",
  "Je lève les yeux", "Ancre de mon âme", "Que ton nom soit béni", "Dans ta présence",
  "Tu es fidèle", "Louange nouvelle", "Le Dieu qui délivre", "Marche avec moi",
  "Vers toi mes mains", "La joie du salut", "Sur le rocher", "Ton amour me couvre",
  "Debout devant ton trône", "Esprit de vie", "Chant de victoire", "Reviens vers moi Seigneur",
];

// ============================================================================
// INSPIRATIONS (20)
// ============================================================================

const INSPIRATIONS = [
  { title: "La patience porte du fruit", content: "Dieu travaille rarement à la vitesse que nous souhaiterions. Mais chaque saison d'attente prépare une récolte plus abondante. Continuez à semer avec foi.", author: "Zone-Chrétien" },
  { title: "Un cœur reconnaissant", content: "La gratitude change notre regard sur les circonstances. Aujourd'hui, prenez un instant pour remercier Dieu pour trois choses simples — vous verrez votre journée transformée." },
  { title: "Petits pas, grande fidélité", content: "Dieu ne demande pas la perfection, il demande la fidélité dans les petites choses. Chaque pas d'obéissance compte, même invisible aux yeux des autres." },
  { title: "La paix qui dépasse l'intelligence", content: "Dans un monde agité, la paix de Dieu n'est pas l'absence de tempête mais une ancre au milieu d'elle. Demeurez en lui aujourd'hui." },
  { title: "Vous êtes une lettre vivante", content: "Votre vie prêche un message avant même que vous n'ouvriez la bouche. Que votre témoignage silencieux parle d'espérance et d'amour." },
  { title: "Le repos, un acte de foi", content: "S'arrêter n'est pas de la paresse, c'est reconnaître que Dieu porte ce que nous ne pouvons porter seuls. Osez vous reposer en lui." },
  { title: "Une nouvelle page", content: "Peu importe hier, Dieu vous propose une page blanche ce matin. Sa miséricorde se renouvelle chaque jour, sans exception." },
  { title: "La force dans la faiblesse", content: "C'est souvent dans nos moments les plus fragiles que la puissance de Dieu se manifeste le plus clairement. Ne méprisez pas votre faiblesse." },
  { title: "Semer la paix autour de soi", content: "Un mot doux, un geste de pardon, une écoute patiente : la paix se construit dans les détails du quotidien. Soyez aujourd'hui un artisan de paix." },
  { title: "Dieu voit ce que les hommes ignorent", content: "Votre fidélité dans le secret n'échappe pas à Dieu, même si personne ne l'applaudit. Il récompense ce qui est fait dans l'ombre." },
  { title: "L'espérance ne déçoit jamais", content: "Même quand les circonstances semblent immobiles, l'espérance chrétienne reste ancrée dans une promesse plus solide que nos sentiments." },
  { title: "Aimer sans attendre en retour", content: "L'amour biblique donne sans calculer. Aujourd'hui, cherchez une occasion de bénir quelqu'un sans rien attendre en retour." },
  { title: "La joie, un choix quotidien", content: "La joie n'attend pas des circonstances parfaites. Elle se cultive, jour après jour, par le regard que nous posons sur la fidélité de Dieu." },
  { title: "Marcher par la foi", content: "La foi n'exige pas de tout comprendre, seulement de faire le prochain pas avec confiance. Dieu éclaire le chemin au fur et à mesure." },
  { title: "Le pardon libère", content: "Pardonner ne minimise pas la blessure, mais elle refuse de laisser l'amertume gouverner votre cœur. C'est un cadeau que vous vous offrez." },
  { title: "Une identité en Christ", content: "Vous n'êtes pas défini par vos échecs ni par les opinions des autres, mais par ce que Dieu dit de vous : aimé, choisi, racheté." },
  { title: "La prière, un dialogue", content: "Prier n'est pas un monologue vers le ciel, mais une conversation vivante avec un Dieu qui écoute et qui répond." },
  { title: "Servir avec humilité", content: "Les plus grandes œuvres commencent souvent dans le silence d'un service humble, loin des projecteurs." },
  { title: "La Parole, une lampe", content: "Dans l'obscurité des incertitudes, la Parole de Dieu éclaire suffisamment le prochain pas, même sans révéler tout le chemin." },
  { title: "Persévérer jusqu'au bout", content: "La course de la foi se gagne par l'endurance, pas par la vitesse. Ne renoncez pas à quelques mètres de la percée." },
];

// ============================================================================
// DÉVOTIONS (20)
// ============================================================================

const DEVOTIONS = [
  { title: "Marcher par la foi, pas par la vue", reflection: "La foi nous appelle à avancer même quand le chemin entier n'est pas visible. Dieu éclaire un pas à la fois, rarement toute la route.", application: "Identifiez une décision où vous attendez d'avoir toutes les réponses avant d'agir. Demandez à Dieu la grâce de faire le prochain pas dès aujourd'hui.", prayer: "Seigneur, augmente ma foi. Apprends-moi à te faire confiance même sans voir la suite. Amen." },
  { title: "Le repos de Dieu", reflection: "Dans un monde qui glorifie l'agitation permanente, Dieu nous invite à un rythme de repos, à l'image du septième jour de la création.", application: "Bloquez un moment cette semaine, sans écran ni obligation, simplement pour vous reposer en Dieu.", prayer: "Père, apprends-moi à cesser mes efforts et à me reposer dans ta suffisance. Amen." },
  { title: "La puissance de la reconnaissance", reflection: "Rendre grâce n'est pas ignorer les difficultés, c'est choisir de voir la fidélité de Dieu au milieu d'elles.", application: "Notez trois raisons d'être reconnaissant aujourd'hui, même petites.", prayer: "Merci Seigneur pour ta bonté que je ne remarque pas toujours. Ouvre mes yeux à ta grâce quotidienne. Amen." },
  { title: "Vaincre l'anxiété par la prière", reflection: "Paul nous exhorte à ne nous inquiéter de rien, mais à tout présenter à Dieu par la prière et la supplication, avec des actions de grâces.", application: "La prochaine fois que l'anxiété monte, arrêtez-vous et transformez-la immédiatement en prière.", prayer: "Seigneur, je te confie mes soucis de ce jour. Garde mon cœur dans ta paix. Amen." },
  { title: "La grâce suffit", reflection: "Paul a demandé trois fois que son épreuve soit ôtée ; Dieu a répondu que sa grâce suffisait, que sa puissance s'accomplit dans la faiblesse.", application: "Nommez une faiblesse que vous cachez. Demandez à Dieu de manifester sa force précisément là.", prayer: "Seigneur, que ta grâce me suffise aujourd'hui, dans mes forces comme dans mes limites. Amen." },
  { title: "Aimer son prochain concrètement", reflection: "L'amour biblique ne reste pas une idée abstraite : il se traduit en gestes concrets envers ceux qui nous entourent.", application: "Posez aujourd'hui un geste d'amour concret envers une personne précise.", prayer: "Seigneur, rends-moi attentif aux besoins de ceux que tu places sur ma route aujourd'hui. Amen." },
  { title: "La discipline spirituelle", reflection: "Comme un athlète s'entraîne, la vie spirituelle demande une discipline régulière : prière, lecture de la Parole, communion fraternelle.", application: "Choisissez une discipline spirituelle à pratiquer chaque jour cette semaine, même brièvement.", prayer: "Seigneur, donne-moi la persévérance dans les disciplines qui me rapprochent de toi. Amen." },
  { title: "Le pardon reçu et donné", reflection: "Ayant reçu un pardon que nous ne méritions pas, nous sommes appelés à l'étendre à ceux qui nous ont blessés.", application: "Pensez à une personne à pardonner. Priez pour elle aujourd'hui, même si le sentiment ne suit pas encore.", prayer: "Seigneur, aide-moi à pardonner comme j'ai été pardonné. Guéris les blessures de mon cœur. Amen." },
  { title: "Chercher Dieu de tout son cœur", reflection: "Dieu promet de se laisser trouver par ceux qui le cherchent de tout leur cœur, pas de manière distraite ou occasionnelle.", application: "Réservez un temps sans distraction aujourd'hui pour rechercher intentionnellement la présence de Dieu.", prayer: "Seigneur, que mon cœur te cherche sincèrement, au-delà des habitudes religieuses. Amen." },
  { title: "La lumière dans les ténèbres", reflection: "Même la plus petite lumière dissipe l'obscurité. Notre témoignage, aussi modeste soit-il, a un impact réel autour de nous.", application: "Identifiez un endroit sombre de votre entourage où vous pouvez être une lumière cette semaine.", prayer: "Seigneur, fais de moi une lumière fidèle là où tu m'as placé. Amen." },
  { title: "La fidélité dans les petites choses", reflection: "Jésus enseigne que celui qui est fidèle dans les petites choses le sera aussi dans les grandes.", application: "Accomplissez avec excellence une tâche que vous jugez insignifiante aujourd'hui.", prayer: "Seigneur, rends-moi fidèle même quand personne ne regarde. Amen." },
  { title: "L'espérance au-delà des circonstances", reflection: "L'espérance chrétienne ne dépend pas de nos circonstances mais du caractère immuable de Dieu.", application: "Écrivez une promesse biblique à laquelle vous vous accrochez aujourd'hui.", prayer: "Seigneur, ancre mon espérance en toi, au-delà de ce que je vois. Amen." },
  { title: "La communauté, un don de Dieu", reflection: "Nous ne sommes pas appelés à marcher seuls. L'Église est un don pour nous porter dans les saisons difficiles.", application: "Contactez un frère ou une sœur en Christ aujourd'hui simplement pour prendre des nouvelles.", prayer: "Seigneur, merci pour ceux que tu as placés autour de moi. Apprends-moi à les aimer davantage. Amen." },
  { title: "Servir comme Christ a servi", reflection: "Jésus, bien que Seigneur, a lavé les pieds de ses disciples. Le service humble est au cœur de la vie chrétienne.", application: "Trouvez un acte de service discret à accomplir aujourd'hui, sans en attendre de reconnaissance.", prayer: "Seigneur, donne-moi un cœur de serviteur à ton image. Amen." },
  { title: "La joie du Seigneur est ma force", reflection: "La joie biblique ne dépend pas des circonstances mais de la relation avec Dieu ; elle devient une source de force.", application: "Choisissez de louer Dieu aujourd'hui, même au milieu des difficultés.", prayer: "Seigneur, que ta joie devienne ma force dans les moments difficiles. Amen." },
  { title: "La vérité qui libère", reflection: "Connaître la vérité de la Parole nous libère des mensonges que nous croyons sur nous-mêmes et sur Dieu.", application: "Identifiez un mensonge que vous croyez sur vous-même et remplacez-le par une vérité biblique.", prayer: "Seigneur, que ta vérité renouvelle mon regard sur moi-même et sur ma vie. Amen." },
  { title: "Attendre le temps de Dieu", reflection: "Le temps de Dieu n'est pas toujours le nôtre, mais il est toujours parfait.", application: "Confiez à Dieu une situation où vous êtes tenté de forcer les choses avant l'heure.", prayer: "Seigneur, apprends-moi la patience et la confiance dans ton timing parfait. Amen." },
  { title: "Un culte de tous les jours", reflection: "L'adoration ne se limite pas au dimanche ; chaque acte offert à Dieu avec un cœur sincère devient un culte.", application: "Offrez consciemment une tâche ordinaire d'aujourd'hui comme un acte d'adoration.", prayer: "Seigneur, que toute ma vie devienne une offrande vivante qui te plaît. Amen." },
  { title: "La générosité qui multiplie", reflection: "Le jeune garçon qui a donné ses cinq pains a vu Dieu multiplier le peu qu'il avait offert.", application: "Donnez quelque chose aujourd'hui — temps, ressource ou encouragement — en confiance.", prayer: "Seigneur, multiplie ce que je t'offre, même si cela semble insuffisant. Amen." },
  { title: "Renouvelés chaque matin", reflection: "Les compassions de Dieu se renouvellent chaque matin ; hier n'a pas le dernier mot sur aujourd'hui.", application: "Commencez cette journée en remettant à Dieu les échecs d'hier.", prayer: "Seigneur, merci pour ta fidélité nouvelle chaque matin. Aide-moi à avancer sans regarder en arrière. Amen." },
];

// ============================================================================
// PRIÈRES (20, réparties sur les 6 catégories)
// ============================================================================

const PRAYER_CATEGORIES: PrayerCategory[] = ["MORNING", "MIDDAY", "EVENING", "FAMILY", "HEALING", "PROTECTION"];

const PRAYERS = [
  { title: "Prière pour commencer la journée", category: "MORNING", content: "Seigneur, merci pour ce nouveau jour que tu m'accordes. Guide mes pas, éclaire mes décisions et remplis mon cœur de ta paix. Que tout ce que je ferai aujourd'hui te glorifie. Amen." },
  { title: "Prière de consécration matinale", category: "MORNING", content: "Père céleste, avant que le monde ne réclame mon attention, je viens te chercher. Renouvelle mon esprit et prépare mon cœur pour cette journée. Amen." },
  { title: "Prière pour la sagesse du jour", category: "MORNING", content: "Seigneur, donne-moi la sagesse pour naviguer les défis d'aujourd'hui. Que ta Parole guide chacune de mes paroles et de mes actions. Amen." },
  { title: "Prière de pause au milieu du jour", category: "MIDDAY", content: "Seigneur, au milieu de cette journée chargée, je m'arrête un instant pour me recentrer sur toi. Renouvelle mes forces et ma concentration. Amen." },
  { title: "Prière pour le travail", category: "MIDDAY", content: "Père, bénis le travail de mes mains cet après-midi. Donne-moi l'intégrité et l'excellence dans chaque tâche que j'accomplis. Amen." },
  { title: "Prière de recentrage", category: "MIDDAY", content: "Seigneur, ramène mon cœur vers toi au cœur de cette journée. Que ta paix garde mon esprit occupé et dispersé. Amen." },
  { title: "Prière de fin de journée", category: "EVENING", content: "Seigneur, je te remets cette journée écoulée, ses joies comme ses difficultés. Merci pour ta fidélité constante. Donne-moi un sommeil paisible. Amen." },
  { title: "Prière d'action de grâce du soir", category: "EVENING", content: "Père, merci pour les grâces reçues aujourd'hui, visibles et invisibles. Je me repose ce soir dans ta protection. Amen." },
  { title: "Prière pour lâcher les soucis du jour", category: "EVENING", content: "Seigneur, je dépose devant toi les tensions de cette journée. Libère mon esprit avant le repos et garde mon cœur en paix. Amen." },
  { title: "Prière pour la famille", category: "FAMILY", content: "Seigneur, veille sur ma famille. Renforce nos liens, protège notre unité et remplis notre foyer de ton amour et de ta paix. Amen." },
  { title: "Prière pour les enfants", category: "FAMILY", content: "Père céleste, protège nos enfants, guide leurs pas et forme leur cœur à te connaître et à t'aimer dès leur jeunesse. Amen." },
  { title: "Prière pour l'unité familiale", category: "FAMILY", content: "Seigneur, apprends-nous à nous pardonner et à nous soutenir mutuellement. Que notre foyer reflète ton amour. Amen." },
  { title: "Prière pour un couple", category: "FAMILY", content: "Seigneur, bénis notre union. Donne-nous la patience, la communication et l'amour nécessaires pour grandir ensemble à ton image. Amen." },
  { title: "Prière pour la guérison physique", category: "HEALING", content: "Seigneur, tu es le Dieu qui guérit. Je te confie ce corps fatigué et je te demande ta guérison, selon ta volonté parfaite. Amen." },
  { title: "Prière pour la guérison intérieure", category: "HEALING", content: "Père, guéris les blessures cachées de mon cœur. Restaure ce qui a été brisé et remplis-moi de ta paix. Amen." },
  { title: "Prière pour un proche malade", category: "HEALING", content: "Seigneur, je te présente [prénom] qui traverse la maladie. Touche son corps, réconforte son cœur et entoure-le de ta présence. Amen." },
  { title: "Prière pour la restauration", category: "HEALING", content: "Seigneur, restaure ce que les années difficiles ont abîmé en moi. Que ta grâce guérisse chaque zone de ma vie. Amen." },
  { title: "Prière de protection quotidienne", category: "PROTECTION", content: "Seigneur, couvre-moi de ta protection aujourd'hui. Garde-moi du mal, visible et invisible, et place tes anges autour de moi. Amen." },
  { title: "Prière pour un voyage", category: "PROTECTION", content: "Père céleste, protège ce déplacement. Garde le chemin sûr et ramène-moi en sécurité. Amen." },
  { title: "Prière contre la peur", category: "PROTECTION", content: "Seigneur, tu n'as pas donné un esprit de peur, mais de force, d'amour et de sagesse. Je me réfugie sous ta protection aujourd'hui. Amen." },
];

// ============================================================================
// TÉMOIGNAGES (10)
// ============================================================================

const TESTIMONIES = [
  { title: "Une guérison inattendue", authorName: "Marie K.", content: "Après des mois de maladie sans amélioration, notre église s'est réunie en prière pour moi. Deux semaines plus tard, les médecins constataient une amélioration qu'ils qualifiaient eux-mêmes d'inexpliquée. Je rends gloire à Dieu pour sa fidélité." },
  { title: "Retrouver l'espérance", authorName: "Jean-Paul M.", content: "J'ai traversé une période de dépression profonde. À travers la prière, le soutien de ma communauté et la Parole de Dieu, j'ai peu à peu retrouvé la joie de vivre. Dieu ne m'a jamais abandonné." },
  { title: "Un mariage restauré", authorName: "Sarah et David", content: "Notre couple était au bord de la rupture. Un accompagnement pastoral et beaucoup de prière ont transformé notre relation. Sept ans plus tard, nous témoignons de la fidélité de Dieu dans notre foyer." },
  { title: "Libéré de la dépendance", authorName: "Thomas B.", content: "Pendant des années, j'étais esclave de mes addictions. Le jour où j'ai vraiment rencontré Christ, quelque chose a changé en profondeur. Aujourd'hui, je suis libre et je marche avec Dieu." },
  { title: "Une porte professionnelle ouverte", authorName: "Aïcha D.", content: "Après un an de chômage et beaucoup de prière, une opportunité inespérée s'est présentée, dépassant tout ce que j'aurais pu imaginer. Dieu pourvoit toujours au bon moment." },
  { title: "La paix au milieu du deuil", authorName: "Christelle N.", content: "La perte de mon père a été le moment le plus douloureux de ma vie. Pourtant, j'ai expérimenté une paix que je ne peux expliquer que par la présence de Dieu à mes côtés." },
  { title: "Une famille réconciliée", authorName: "Michel T.", content: "Après quinze ans de brouille avec mon frère, Dieu a ouvert un chemin de réconciliation lors d'un simple appel téléphonique. Le pardon a restauré ce que je croyais perdu à jamais." },
  { title: "Appelé au ministère", authorName: "Ruth A.", content: "Je ne me sentais pas qualifiée, mais Dieu a confirmé son appel sur ma vie à travers des circonstances multiples. Aujourd'hui, je sers avec joie dans mon église locale." },
  { title: "Sauvée d'un accident", authorName: "Grace O.", content: "Un accident de la route aurait dû m'être fatal. Les secours eux-mêmes ont été surpris de me voir sortir indemne. Je sais que la main de Dieu m'a protégée ce jour-là." },
  { title: "Une nouvelle direction de vie", authorName: "Emmanuel K.", content: "Je vivais loin de Dieu, centré sur mes propres ambitions. Une rencontre avec un ami chrétien a bouleversé ma trajectoire. Aujourd'hui, ma vie entière a changé de direction." },
];

// ============================================================================
// ARTICLES (20)
// ============================================================================

const ARTICLES = [
  { title: "Comprendre la grâce de Dieu", excerpt: "Une étude sur ce que signifie vraiment être sauvé par grâce.", content: "<p>La grâce est au cœur de l'Évangile : un don gratuit que nous ne pouvons mériter. Comprendre la grâce transforme notre rapport à Dieu, le faisant passer de la performance à la relation.</p><p>Éphésiens 2:8-9 nous rappelle que le salut ne vient pas de nos œuvres, afin que personne ne puisse se glorifier. Cette vérité libère de la spirale de la performance religieuse.</p>" },
  { title: "Les Psaumes, une école de prière", excerpt: "Comment le livre des Psaumes nous enseigne à prier avec authenticité.", content: "<p>Les Psaumes couvrent toute la palette des émotions humaines : joie, lamentation, colère, espérance. Ils nous enseignent qu'aucune émotion n'est interdite devant Dieu.</p><p>Prier avec les Psaumes, c'est apprendre à être honnête devant Dieu tout en gardant confiance en sa fidélité.</p>" },
  { title: "Le sens biblique du sabbat", excerpt: "Redécouvrir le repos comme un commandement de grâce, pas de contrainte.", content: "<p>Le sabbat n'est pas une règle légaliste mais un cadeau : Dieu invite son peuple à cesser régulièrement pour se souvenir qu'il n'est pas le centre de l'univers.</p><p>Dans une culture de productivité permanente, retrouver un rythme de repos est un acte de foi contre-culturel.</p>" },
  { title: "Qui était réellement l'apôtre Paul ?", excerpt: "Portrait biographique de l'auteur de la majorité du Nouveau Testament.", content: "<p>Ancien persécuteur de l'Église devenu son plus grand missionnaire, Paul incarne la puissance transformatrice de la rencontre avec Christ sur le chemin de Damas.</p><p>Ses lettres, écrites depuis des prisons ou en plein voyage missionnaire, restent une source théologique inépuisable.</p>" },
  { title: "La prière selon le Notre Père", excerpt: "Une lecture verset par verset du modèle de prière enseigné par Jésus.", content: "<p>Jésus n'a pas donné une formule magique mais une structure : adoration, soumission, provision, pardon, protection. Chaque phrase du Notre Père façonne notre manière de prier.</p><p>Prier ce modèle régulièrement recentre le cœur sur les priorités du Royaume.</p>" },
  { title: "Foi et raison : faux dilemme ?", excerpt: "Pourquoi la foi chrétienne n'exige pas d'abandonner l'intelligence.", content: "<p>Contrairement à une idée reçue, la tradition chrétienne a toujours valorisé la réflexion rigoureuse aux côtés de la foi. Croire n'est pas renoncer à penser.</p><p>La foi biblique invite à un abandon confiant qui n'exclut jamais le questionnement honnête.</p>" },
  { title: "Le pardon, un choix pas un sentiment", excerpt: "Comment la Bible distingue le pardon de la simple émotion.", content: "<p>Pardonner n'est pas oublier ni excuser, c'est une décision de libérer l'autre de la dette qu'il nous doit, à l'image du pardon reçu de Dieu.</p><p>Ce choix peut précéder la guérison émotionnelle plutôt que d'en dépendre.</p>" },
  { title: "L'Église primitive et le partage", excerpt: "Ce que le livre des Actes nous enseigne sur la vie communautaire.", content: "<p>Les premiers chrétiens partageaient leurs biens, leurs repas et leur temps. Cette générosité radicale reste un modèle inspirant pour l'Église contemporaine.</p><p>La communion fraternelle n'était pas une option mais une expression naturelle de la nouvelle naissance.</p>" },
  { title: "Comprendre les paraboles de Jésus", excerpt: "Pourquoi Jésus enseignait-il en histoires plutôt qu'en discours ?", content: "<p>Les paraboles révèlent des vérités profondes tout en restant accessibles, invitant l'auditeur à un engagement personnel plutôt qu'à une simple réception passive.</p><p>Chaque parabole mérite d'être relue à plusieurs niveaux de lecture.</p>" },
  { title: "La femme vertueuse de Proverbes 31", excerpt: "Une relecture actuelle de ce portrait souvent mal compris.", content: "<p>Loin d'un cahier des charges impossible, Proverbes 31 dresse le portrait d'une femme de caractère, sage, généreuse et respectée — un idéal, non une liste de tâches.</p><p>Ce texte valorise la compétence et la force autant que la douceur.</p>" },
  { title: "Le Saint-Esprit, notre consolateur", excerpt: "Redécouvrir le rôle du Saint-Esprit dans la vie chrétienne quotidienne.", content: "<p>Jésus a promis un consolateur qui demeurerait avec ses disciples pour toujours. Le Saint-Esprit guide, convainc et fortifie le croyant au quotidien.</p><p>Vivre selon l'Esprit change notre manière d'affronter les difficultés.</p>" },
  { title: "Les dix commandements, toujours actuels ?", excerpt: "Une lecture contemporaine du Décalogue.", content: "<p>Loin d'être une liste d'interdits dépassés, les dix commandements dessinent un chemin de vie protégeant la relation avec Dieu et avec autrui.</p><p>Jésus les résume en deux commandements d'amour, sans les abolir.</p>" },
  { title: "La souffrance et la souveraineté de Dieu", excerpt: "Aborder une des questions théologiques les plus difficiles avec honnêteté.", content: "<p>La Bible ne minimise jamais la souffrance ; le livre de Job la confronte de face sans donner de réponse simpliste, mais en révélant un Dieu présent au milieu d'elle.</p><p>La foi n'exige pas de comprendre toutes les raisons, mais de faire confiance au caractère de Dieu.</p>" },
  { title: "Marie, un modèle de disponibilité", excerpt: "Ce que la réponse de Marie à l'ange nous enseigne sur l'obéissance.", content: "<p>« Qu'il me soit fait selon ta parole » : cette réponse simple de Marie reste un modèle de disponibilité à la volonté de Dieu, malgré l'incertitude des conséquences.</p><p>Sa foi tranquille au milieu du bouleversement inspire toujours.</p>" },
  { title: "L'importance de la communauté chrétienne", excerpt: "Pourquoi la foi chrétienne ne se vit pas en solitaire.", content: "<p>Le Nouveau Testament ne connaît pas de chrétien isolé : la foi se vit, se teste et grandit en communauté, à travers l'encouragement mutuel.</p><p>S'engager dans une église locale reste un pilier essentiel de la croissance spirituelle.</p>" },
  { title: "Le jeûne, une discipline oubliée", excerpt: "Redécouvrir le sens spirituel du jeûne biblique.", content: "<p>Le jeûne n'est pas une performance spirituelle mais un moyen de recentrer son cœur sur Dieu en mettant de côté ce qui occupe habituellement notre attention.</p><p>Pratiqué avec sincérité, il approfondit la sensibilité spirituelle.</p>" },
  { title: "Ruth, une histoire de fidélité", excerpt: "Les leçons intemporelles du livre de Ruth.", content: "<p>L'histoire de Ruth illustre la fidélité, la rédemption et la providence divine à travers des choix ordinaires posés avec un cœur extraordinaire.</p><p>Ce court livre reste l'un des plus beaux récits de loyauté de toute la Bible.</p>" },
  { title: "Comprendre le baptême chrétien", excerpt: "Signification et symbolique de cet acte fondateur de la foi.", content: "<p>Le baptême symbolise la mort à l'ancienne vie et la résurrection à une vie nouvelle en Christ, un témoignage public de la transformation intérieure.</p><p>Ce n'est pas ce qui sauve, mais ce qui déclare publiquement le salut déjà reçu.</p>" },
  { title: "La justice sociale dans la Bible", excerpt: "Ce que les prophètes enseignent sur le soin des plus vulnérables.", content: "<p>Les prophètes de l'Ancien Testament dénoncent avec force l'injustice envers les pauvres, les veuves et les étrangers, rappelant le cœur de Dieu pour les vulnérables.</p><p>Cette préoccupation traverse toute l'Écriture jusqu'au ministère de Jésus.</p>" },
  { title: "Se préparer à Noël autrement", excerpt: "Redonner du sens spirituel à la période de l'Avent.", content: "<p>Au-delà des préparatifs matériels, l'Avent est un temps d'attente et de préparation du cœur pour célébrer la venue d'Emmanuel, Dieu avec nous.</p><p>Ralentir pour méditer cette période peut transformer notre manière de vivre les fêtes.</p>" },
];

// ============================================================================
// SEED PRINCIPAL
// ============================================================================

async function main() {
  console.log("Seed — Zone-Chrétien Media");

  // --- Utilisateur auteur pour les articles -------------------------------
  let author = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!author) {
    author = await prisma.user.upsert({
      where: { email: "contenu@zone-chretien.media" },
      update: {},
      // Pas de mot de passe : ce compte ne peut pas se connecter, il sert
      // uniquement de référence "auteur" pour les articles de démonstration.
      create: { email: "contenu@zone-chretien.media", name: "Rédaction Zone-Chrétien", role: "EDITOR" },
    });
  }
  console.log(`Auteur des articles : ${author.email}`);

  // --- Catégories -----------------------------------------------------------
  const categoryDefs = [
    { name: "Louange", type: "SONG" as const },
    { name: "Adoration", type: "SONG" as const },
    { name: "Gospel", type: "SONG" as const },
    { name: "Cantiques", type: "SONG" as const },
    { name: "Enseignement", type: "ARTICLE" as const },
    { name: "Étude biblique", type: "ARTICLE" as const },
    { name: "Actualité chrétienne", type: "ARTICLE" as const },
    { name: "Culte", type: "VIDEO" as const },
    { name: "Clip", type: "VIDEO" as const },
    { name: "Pensée du jour", type: "INSPIRATION" as const },
    { name: "Encouragement", type: "INSPIRATION" as const },
  ];
  const categories: Record<string, string> = {};
  for (const c of categoryDefs) {
    const slug = slugify(c.name);
    const row = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: c.name, slug, type: c.type },
    });
    categories[c.name] = row.id;
  }
  const songCategoryNames = ["Louange", "Adoration", "Gospel", "Cantiques"];
  const articleCategoryNames = ["Enseignement", "Étude biblique", "Actualité chrétienne"];
  const inspirationCategoryNames = ["Pensée du jour", "Encouragement"];
  console.log(`Catégories : ${categoryDefs.length}`);

  // --- Tags -------------------------------------------------------------
  const tagNames = ["louange", "adoration", "gospel", "prière", "espoir", "guérison", "famille", "jeunesse", "worship", "foi"];
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    const row = await prisma.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    tagIds.push(row.id);
  }
  console.log(`Tags : ${tagNames.length}`);

  // --- Artistes -----------------------------------------------------------
  const artistIds: string[] = [];
  for (let i = 0; i < ARTISTS.length; i++) {
    const a = ARTISTS[i];
    const slug = slugify(a.name);
    const row = await prisma.artist.upsert({
      where: { slug },
      update: {},
      create: {
        name: a.name,
        slug,
        bio: a.bio,
        photoUrl: img(`artist-${i}`, 400, 400),
        isSponsored: i === 0,
      },
    });
    artistIds.push(row.id);
  }
  console.log(`Artistes : ${ARTISTS.length}`);

  // --- Chansons (20) --------------------------------------------------------
  for (let i = 0; i < SONG_TITLES.length; i++) {
    const title = SONG_TITLES[i];
    const slug = slugify(title);
    const artistId = artistIds[i % artistIds.length];
    const categoryId = categories[songCategoryNames[i % songCategoryNames.length]];
    await prisma.song.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        description: `Un chant d'adoration qui invite à se tourner vers Dieu avec un cœur sincère et reconnaissant.`,
        imageUrl: img(`song-${i}`, 800, 800),
        audioUrl: AUDIO_TRACKS[i % AUDIO_TRACKS.length],
        youtubeUrl: i % 3 === 0 ? YOUTUBE_SAMPLES[i % YOUTUBE_SAMPLES.length] : null,
        artistId,
        categoryId,
        featured: i === 0,
        published: true,
        views: (i + 1) * 37,
        tags: { connect: [{ id: tagIds[i % tagIds.length] }, { id: tagIds[(i + 3) % tagIds.length] }] },
      },
    });
  }
  console.log(`Chansons : ${SONG_TITLES.length}`);

  // --- Inspirations (20) -----------------------------------------------------
  for (let i = 0; i < INSPIRATIONS.length; i++) {
    const insp = INSPIRATIONS[i];
    const slug = slugify(insp.title);
    await prisma.inspiration.upsert({
      where: { slug },
      update: {},
      create: {
        title: insp.title,
        slug,
        content: insp.content,
        author: insp.author,
        imageUrl: img(`inspiration-${i}`, 800, 600),
        categoryId: categories[inspirationCategoryNames[i % inspirationCategoryNames.length]],
        published: true,
        views: (i + 1) * 12,
      },
    });
  }
  console.log(`Inspirations : ${INSPIRATIONS.length}`);

  // --- Dévotions (20, une par jour sur les 20 derniers jours) ----------------
  for (let i = 0; i < DEVOTIONS.length; i++) {
    const dev = DEVOTIONS[i];
    const verse = VERSES_POOL[i % VERSES_POOL.length];
    const slug = slugify(dev.title);
    await prisma.devotion.upsert({
      where: { slug },
      update: {},
      create: {
        title: dev.title,
        slug,
        mainVerseRef: verse.reference,
        mainVerseText: verse.text,
        reflection: dev.reflection,
        application: dev.application,
        prayer: dev.prayer,
        imageUrl: img(`devotion-${i}`, 800, 600),
        date: daysAgo(DEVOTIONS.length - 1 - i),
        published: true,
        views: (i + 1) * 8,
      },
    });
  }
  console.log(`Dévotions : ${DEVOTIONS.length}`);

  // --- Prières (20) -----------------------------------------------------
  for (let i = 0; i < PRAYERS.length; i++) {
    const p = PRAYERS[i];
    const slug = slugify(p.title);
    await prisma.prayer.upsert({
      where: { slug },
      update: {},
      create: {
        title: p.title,
        slug,
        content: p.content,
        category: p.category as PrayerCategory,
        published: true,
        views: (i + 1) * 6,
      },
    });
  }
  console.log(`Prières : ${PRAYERS.length}`);

  // --- Versets (20, un par jour sur les 20 derniers jours, dont aujourd'hui) -
  for (let i = 0; i < VERSES_POOL.length; i++) {
    const v = VERSES_POOL[i];
    const date = daysAgo(VERSES_POOL.length - 1 - i);
    await prisma.verse.upsert({
      where: { date },
      update: {},
      create: {
        reference: v.reference,
        text: v.text,
        explanation: v.explanation,
        date,
        published: true,
        views: (i + 1) * 15,
      },
    });
  }
  console.log(`Versets : ${VERSES_POOL.length}`);

  // --- Témoignages (10) ----------------------------------------------------
  for (let i = 0; i < TESTIMONIES.length; i++) {
    const t = TESTIMONIES[i];
    const slug = slugify(t.title);
    await prisma.testimony.upsert({
      where: { slug },
      update: {},
      create: {
        title: t.title,
        slug,
        content: t.content,
        authorName: t.authorName,
        imageUrl: img(`testimony-${i}`, 400, 400),
        published: true,
        views: (i + 1) * 20,
      },
    });
  }
  console.log(`Témoignages : ${TESTIMONIES.length}`);

  // --- Articles (20) ----------------------------------------------------
  for (let i = 0; i < ARTICLES.length; i++) {
    const a = ARTICLES[i];
    const slug = slugify(a.title);
    const publishedAt = daysAgo(ARTICLES.length - 1 - i);
    await prisma.article.upsert({
      where: { slug },
      update: {},
      create: {
        title: a.title,
        slug,
        excerpt: a.excerpt,
        content: a.content,
        coverImageUrl: img(`article-${i}`, 900, 500),
        categoryId: categories[articleCategoryNames[i % articleCategoryNames.length]],
        authorId: author.id,
        featured: i === 0,
        published: true,
        publishedAt,
        views: (i + 1) * 24,
        tags: { connect: [{ id: tagIds[(i + 1) % tagIds.length] }] },
      },
    });
  }
  console.log(`Articles : ${ARTICLES.length}`);

  console.log("Seed terminé avec succès.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
