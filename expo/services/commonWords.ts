/**
 * Common words per supported locale, used by the gibberish detector.
 * Includes pronouns, articles, prepositions, conjunctions, common verbs,
 * and dream-related vocabulary for each language.
 *
 * Japanese and Korean use romanized (romaji / romanization) forms so the
 * detector can catch mixed-script input. Pure kana/hangul input is handled
 * separately via the CJK bypass.
 */

// ─── English ────────────────────────────────────────────────────────────────
const EN = [
  // Pronouns & determiners
  'i', 'a', 'the', 'my', 'me', 'we', 'he', 'she', 'it', 'you', 'they',
  'his', 'her', 'its', 'our', 'your', 'their', 'this', 'that', 'these',
  'those', 'some', 'any', 'all', 'every', 'each', 'own', 'other', 'another',
  // Verbs
  'is', 'was', 'am', 'are', 'were', 'be', 'been', 'being',
  'had', 'has', 'have', 'having', 'do', 'did', 'does', 'done',
  'will', 'would', 'could', 'can', 'should', 'may', 'might', 'must',
  'see', 'saw', 'seen', 'go', 'went', 'gone', 'come', 'came',
  'get', 'got', 'know', 'knew', 'think', 'thought',
  'felt', 'feel', 'feeling', 'look', 'looked', 'looking',
  'run', 'ran', 'running', 'walk', 'walked', 'walking',
  'say', 'said', 'tell', 'told', 'take', 'took', 'make', 'made',
  'find', 'found', 'give', 'gave', 'try', 'tried', 'want', 'wanted',
  'need', 'needed', 'seem', 'seemed', 'keep', 'kept', 'let', 'left',
  'begin', 'began', 'show', 'turn', 'turned', 'move', 'moved',
  'live', 'lived', 'remember', 'remembered',
  // Prepositions & conjunctions
  'in', 'on', 'at', 'to', 'of', 'and', 'or', 'but', 'not', 'no', 'so',
  'an', 'if', 'up', 'out', 'off', 'by', 'as', 'into', 'very',
  'then', 'when', 'where', 'there', 'here', 'what',
  'who', 'how', 'why', 'which', 'with', 'from', 'for', 'about', 'like',
  'just', 'also', 'too', 'more', 'much', 'still', 'even', 'back',
  'after', 'before', 'again', 'away', 'around', 'down', 'through',
  'over', 'under', 'between', 'behind', 'beside', 'near',
  // Dream-related
  'dream', 'dreamed', 'dreamt', 'dreaming',
  'sleep', 'slept', 'sleeping', 'woke', 'wake', 'awake',
  'night', 'fly', 'flying', 'flew', 'fell', 'fall', 'falling',
  'dark', 'darkness', 'light', 'bright',
  'room', 'house', 'door', 'window', 'stairs',
  'water', 'ocean', 'river', 'sky', 'cloud',
  'people', 'person', 'friend', 'family', 'someone', 'nobody',
  'afraid', 'scared', 'happy', 'strange', 'weird', 'lost',
  'chase', 'chased', 'chasing', 'hide', 'hiding', 'hidden',
];

// ─── French ─────────────────────────────────────────────────────────────────
const FR = [
  // Pronouns & determiners
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'leurs',
  'me', 'te', 'se', 'moi', 'toi', 'lui', 'eux',
  // Verbs
  'suis', 'es', 'est', 'sommes', 'êtes', 'sont',
  'ai', 'as', 'avons', 'avez', 'ont',
  'était', 'étais', 'étaient', 'avait', 'avais', 'avaient',
  'fait', 'faire', 'dit', 'dire', 'voir', 'vu', 'vois',
  'aller', 'vais', 'allé', 'venir', 'venu', 'viens',
  'prendre', 'pris', 'mettre', 'mis', 'pouvoir', 'peux', 'peut',
  'vouloir', 'veux', 'veut', 'savoir', 'sais', 'sait',
  'devoir', 'dois', 'doit', 'falloir', 'faut',
  'croire', 'crois', 'sentir', 'sens', 'penser', 'pense',
  'chercher', 'trouver', 'trouvé', 'donner', 'donné',
  'parler', 'parlé', 'regarder', 'regardé', 'marcher',
  // Prepositions & conjunctions
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui',
  'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'entre',
  'vers', 'chez', 'après', 'avant', 'depuis', 'pendant',
  'pas', 'ne', 'plus', 'jamais', 'rien', 'tout', 'très', 'bien',
  'aussi', 'encore', 'toujours', 'déjà', 'là', 'ici',
  'comme', 'quand', 'où', 'comment', 'pourquoi',
  // Dream-related
  'rêve', 'rêvé', 'rêver', 'cauchemar',
  'nuit', 'dormir', 'dormi', 'sommeil', 'réveillé', 'réveiller',
  'voler', 'volé', 'tomber', 'tombé', 'courir', 'couru',
  'noir', 'sombre', 'lumière', 'clair',
  'maison', 'chambre', 'porte', 'fenêtre', 'escalier',
  'eau', 'mer', 'ciel', 'nuage',
  'gens', 'personne', 'ami', 'famille', 'quelqu',
  'peur', 'perdu', 'bizarre', 'étrange',
];

// ─── German ─────────────────────────────────────────────────────────────────
const DE = [
  // Pronouns & determiners
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'mein', 'meine', 'meinem', 'meinen', 'dein', 'deine',
  'sein', 'seine', 'seinem', 'seinen', 'unser', 'unsere',
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einem', 'einen', 'einer',
  'dieser', 'diese', 'dieses', 'jeder', 'jede', 'jedes',
  'mich', 'mir', 'dich', 'dir', 'sich', 'uns', 'euch', 'ihnen',
  // Verbs
  'ist', 'war', 'bin', 'bist', 'sind', 'seid', 'waren', 'gewesen',
  'hat', 'hatte', 'haben', 'hatten', 'gehabt',
  'wird', 'wurde', 'werden', 'geworden',
  'kann', 'konnte', 'können', 'muss', 'musste', 'müssen',
  'will', 'wollte', 'wollen', 'soll', 'sollte', 'sollen',
  'darf', 'durfte', 'dürfen', 'mag', 'mochte', 'mögen',
  'sehen', 'sah', 'gesehen', 'gehen', 'ging', 'gegangen',
  'kommen', 'kam', 'gekommen', 'nehmen', 'nahm', 'genommen',
  'geben', 'gab', 'gegeben', 'machen', 'gemacht',
  'sagen', 'gesagt', 'wissen', 'wusste', 'gewusst',
  'denken', 'dachte', 'gedacht', 'fühlen', 'gefühlt',
  'finden', 'fand', 'gefunden', 'stehen', 'stand',
  'laufen', 'lief', 'gelaufen',
  // Prepositions & conjunctions
  'und', 'oder', 'aber', 'denn', 'weil', 'dass', 'wenn', 'als',
  'nicht', 'kein', 'keine', 'keinem', 'keinen',
  'in', 'an', 'auf', 'aus', 'bei', 'mit', 'nach', 'von', 'zu',
  'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen',
  'auch', 'noch', 'schon', 'sehr', 'nur', 'immer', 'wieder',
  'dann', 'da', 'dort', 'hier', 'wo', 'wie', 'was', 'wer', 'warum',
  // Dream-related
  'traum', 'träume', 'geträumt', 'träumen', 'albtraum',
  'nacht', 'schlafen', 'geschlafen', 'schlaf', 'aufgewacht', 'aufwachen',
  'fliegen', 'geflogen', 'fallen', 'gefallen',
  'dunkel', 'dunkelheit', 'licht', 'hell',
  'haus', 'zimmer', 'tür', 'fenster', 'treppe',
  'wasser', 'meer', 'himmel', 'wolke',
  'leute', 'mensch', 'menschen', 'freund', 'familie', 'jemand',
  'angst', 'verloren', 'seltsam', 'merkwürdig',
];

// ─── Spanish ────────────────────────────────────────────────────────────────
const ES = [
  // Pronouns & determiners
  'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'ellos', 'ellas', 'ustedes',
  'el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas',
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'me', 'te', 'se', 'nos', 'le', 'les',
  'del', 'al',
  // Verbs
  'soy', 'eres', 'es', 'somos', 'son',
  'estoy', 'estás', 'está', 'estamos', 'están',
  'fue', 'era', 'fui', 'eran', 'fueron',
  'tengo', 'tienes', 'tiene', 'tenemos', 'tienen', 'tenía',
  'hay', 'había', 'hubo',
  'hacer', 'hice', 'hizo', 'hecho',
  'decir', 'dijo', 'dicho', 'ver', 'vi', 'vio', 'visto',
  'ir', 'voy', 'vas', 'va', 'vamos', 'van', 'iba', 'fui',
  'poder', 'puedo', 'puede', 'pueden', 'podía', 'pude',
  'querer', 'quiero', 'quiere', 'quería',
  'saber', 'sé', 'sabe', 'sabía',
  'dar', 'dio', 'dado', 'tomar', 'tomé',
  'sentir', 'sentí', 'siento', 'pensar', 'pienso', 'pensé',
  'buscar', 'encontrar', 'encontré',
  'correr', 'corrí', 'caminar', 'caminé',
  // Prepositions & conjunctions
  'y', 'o', 'pero', 'sino', 'porque', 'que', 'quien',
  'en', 'con', 'por', 'para', 'de', 'desde', 'hasta', 'entre',
  'sin', 'sobre', 'bajo', 'hacia', 'según', 'contra',
  'no', 'ni', 'muy', 'más', 'menos', 'tan', 'bien', 'mal',
  'también', 'todavía', 'ya', 'siempre', 'nunca', 'aquí', 'allí',
  'cuando', 'donde', 'como', 'qué', 'quién', 'por qué',
  // Dream-related
  'sueño', 'soñé', 'soñar', 'soñando', 'pesadilla',
  'noche', 'dormir', 'dormí', 'dormido', 'despertar', 'desperté',
  'volar', 'volé', 'volando', 'caer', 'caí', 'cayendo',
  'oscuro', 'oscuridad', 'luz', 'brillante',
  'casa', 'habitación', 'cuarto', 'puerta', 'ventana', 'escalera',
  'agua', 'mar', 'océano', 'cielo', 'nube',
  'gente', 'persona', 'amigo', 'familia', 'alguien', 'nadie',
  'miedo', 'perdido', 'extraño', 'raro',
];

// ─── Portuguese (BR) ────────────────────────────────────────────────────────
const PT_BR = [
  // Pronouns & determiners
  'eu', 'tu', 'ele', 'ela', 'você', 'nós', 'vocês', 'eles', 'elas',
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'meu', 'minha', 'meus', 'minhas', 'seu', 'sua', 'seus', 'suas',
  'nosso', 'nossa', 'este', 'esta', 'esse', 'essa',
  'me', 'te', 'se', 'nos', 'lhe', 'lhes',
  'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'ao', 'à',
  // Verbs
  'sou', 'é', 'somos', 'são',
  'estou', 'está', 'estamos', 'estão',
  'foi', 'era', 'eram', 'foram',
  'tenho', 'tem', 'temos', 'têm', 'tinha', 'tinham',
  'há', 'havia',
  'fazer', 'fiz', 'fez', 'feito',
  'dizer', 'disse', 'dito', 'ver', 'vi', 'viu', 'visto',
  'ir', 'vou', 'vai', 'vamos', 'vão', 'ia', 'fui',
  'poder', 'posso', 'pode', 'podem', 'podia', 'pude',
  'querer', 'quero', 'quer', 'queria',
  'saber', 'sei', 'sabe', 'sabia',
  'dar', 'deu', 'dado', 'pegar', 'peguei',
  'sentir', 'senti', 'sinto', 'pensar', 'penso', 'pensei',
  'procurar', 'encontrar', 'encontrei',
  'correr', 'corri', 'andar', 'andei',
  // Prepositions & conjunctions
  'e', 'ou', 'mas', 'porém', 'porque', 'que', 'quem',
  'em', 'com', 'por', 'para', 'de', 'desde', 'até', 'entre',
  'sem', 'sobre', 'sob',
  'não', 'nem', 'muito', 'mais', 'menos', 'tão', 'bem', 'mal',
  'também', 'ainda', 'já', 'sempre', 'nunca', 'aqui', 'ali', 'lá',
  'quando', 'onde', 'como', 'quanto',
  // Dream-related
  'sonho', 'sonhei', 'sonhar', 'sonhando', 'pesadelo',
  'noite', 'dormir', 'dormi', 'dormindo', 'acordar', 'acordei',
  'voar', 'voei', 'voando', 'cair', 'caí', 'caindo',
  'escuro', 'escuridão', 'luz', 'brilhante',
  'casa', 'quarto', 'porta', 'janela', 'escada',
  'água', 'mar', 'oceano', 'céu', 'nuvem',
  'gente', 'pessoa', 'amigo', 'família', 'alguém', 'ninguém',
  'medo', 'perdido', 'estranho', 'esquisito',
];

// ─── Japanese (romaji) ──────────────────────────────────────────────────────
const JA = [
  // Particles & grammar
  'wa', 'ga', 'wo', 'ni', 'he', 'de', 'to', 'no', 'ka', 'mo',
  'ya', 'ne', 'yo', 'na', 'kara', 'made', 'demo', 'dake', 'shika',
  'nado', 'bakari', 'hodo', 'yori', 'tame',
  // Pronouns
  'watashi', 'boku', 'ore', 'atashi', 'anata', 'kimi', 'kare', 'kanojo',
  'watashitachi', 'bokutachi', 'karera', 'dare', 'doko', 'nani', 'naze',
  'dou', 'itsu', 'kore', 'sore', 'are', 'kono', 'sono', 'ano',
  // Common verbs
  'desu', 'da', 'deshita', 'datta', 'masu', 'mashita', 'nai', 'nakatta',
  'iru', 'aru', 'ita', 'atta', 'suru', 'shita', 'shimasu', 'shimashita',
  'iku', 'itta', 'ikimasu', 'kuru', 'kita', 'kimasu',
  'miru', 'mita', 'mimasu', 'taberu', 'tabeta', 'tabemasu',
  'nomu', 'nonda', 'nomimasu', 'kaku', 'kaita', 'kakimasu',
  'hanasu', 'hanashita', 'hanashimasu',
  'omou', 'omotta', 'omoimasu', 'kangaeru', 'kangaeta',
  'wakaru', 'wakatta', 'wakarimasu', 'shiru', 'shitta', 'shirimasu',
  'dekiru', 'dekita', 'dekimasu',
  'hashiru', 'hashitta', 'aruku', 'aruita',
  'neru', 'neta', 'nemasu', 'okiru', 'okita', 'okimasu',
  'tobu', 'tonda', 'tobimasu', 'ochiru', 'ochita', 'ochimasu',
  // Adjectives & adverbs
  'ii', 'yoi', 'warui', 'ookii', 'chiisai', 'nagai', 'mijikai',
  'takai', 'hikui', 'atarashii', 'furui', 'hayai', 'osoi',
  'kowai', 'tanoshii', 'kanashii', 'ureshii', 'samishii', 'fushigi',
  'totemo', 'sugoku', 'chotto', 'motto', 'mada', 'mou',
  'itsumo', 'tokidoki', 'zenzen', 'taihen',
  // Dream-related
  'yume', 'akumu', 'nemuri', 'suimin',
  'yoru', 'yonaka', 'mayonaka',
  'sora', 'kumo', 'umi', 'kawa', 'mizu',
  'ie', 'heya', 'tobira', 'mado', 'kaidan',
  'hito', 'tomodachi', 'kazoku', 'dareka',
  'kurai', 'akarui', 'hikari', 'yami',
  'kowai', 'nigeru', 'nigeta', 'kakureru', 'kakureta',
  'oikakeru', 'oikaketa',
];

// ─── Korean (romanization) ──────────────────────────────────────────────────
const KO = [
  // Particles & grammar
  'eun', 'neun', 'i', 'ga', 'eul', 'reul', 'e', 'eseo', 'ui',
  'do', 'man', 'buteo', 'kkaji', 'hago', 'wa', 'gwa',
  'ro', 'euro', 'eulo', 'rang', 'irang',
  // Pronouns
  'na', 'nae', 'neo', 'ne', 'geu', 'geunyeo', 'uri', 'uridul',
  'geudeul', 'nugu', 'eodi', 'mwo', 'wae', 'eotteon',
  'igeo', 'geugeo', 'jeogeo', 'yeogi', 'geogi', 'jeogi',
  // Common verbs
  'ida', 'imnida', 'ieyo', 'animnida', 'anieyo',
  'issda', 'isseo', 'isseosseo', 'eopsda', 'eopseo',
  'hada', 'hae', 'haesseo', 'hamnida', 'haeyo', 'haesseayo',
  'gada', 'ga', 'gasseo', 'gamnida', 'gayo', 'gasseayo',
  'oda', 'wa', 'wasseo', 'omnida', 'wayo', 'wasseayo',
  'boda', 'bwa', 'bwasseo', 'bomnida', 'bwayo',
  'meokda', 'meogeo', 'meogeosseo',
  'mashida', 'masyeo', 'masyeosseo',
  'malda', 'malhae', 'malhaesseo', 'malhaemnida',
  'saenggakhada', 'saenggakhae', 'saenggakhaesseo',
  'alda', 'ara', 'arasseo', 'amnida', 'arayo',
  'dweda', 'dwae', 'dwaesseo',
  'jada', 'ja', 'jasseo', 'jamnida',
  'ireonada', 'ireonasseo',
  'ttwida', 'ttwi', 'ttwieo', 'geotda', 'georeo',
  'nalda', 'nara', 'narasseo',
  'tteoreojida', 'tteoreojyeosseo',
  // Adjectives & adverbs
  'jota', 'joayo', 'nappeuda', 'nappayo',
  'keuda', 'keun', 'jakda', 'jageun',
  'manta', 'maneun', 'jeokda', 'jeogeun',
  'mueobda', 'museowoyo', 'jeulgeopda', 'jeulgeowo',
  'seulpeuda', 'seulpeoyo', 'haengbokhada', 'haengbokhaeyo',
  'isanghada', 'isanghae', 'singiha',
  'aju', 'neomu', 'jom', 'deo', 'ajik', 'imi', 'beolsseo',
  'hangsang', 'gakkeum', 'jeoldae',
  // Dream-related
  'kkum', 'kkumkwosseo', 'kkumkuda', 'angmong',
  'bam', 'hanbabjung', 'jaryeong',
  'jam', 'jamdeulda', 'jamdeureo', 'kkaeeonada', 'kkaeeosseo',
  'haneul', 'gureum', 'bada', 'gang', 'mul',
  'jib', 'bang', 'mun', 'changmun', 'gyedan',
  'saram', 'chingu', 'gajog', 'nugunga',
  'eodun', 'balgeun', 'bit', 'eodum',
  'museoun', 'domangchida', 'domangchyeosseo',
  'sumda', 'sumeosseo', 'jjotda', 'jjotgida',
];

/** All common words merged into a single lookup set. */
export const COMMON_WORDS = new Set([
  ...EN, ...FR, ...DE, ...ES, ...PT_BR, ...JA, ...KO,
]);
