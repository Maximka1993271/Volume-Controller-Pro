/*
 * Shared automatic-genre catalogue for the MV3 service worker and offscreen document.
 * This file is a classic script (no ESM exports) so it can be loaded by importScripts()
 * and by a regular <script> tag. The catalogue is the single source of truth for IDs.
 */
var VCPGenres = (() => {
  const catalog = [
  {
    "id": "hiphop",
    "label": "autoGenreHipHop",
    "family": "hiphop",
    "aliases": [
      "hip hop",
      "hip-hop",
      "hiphop",
      "rap",
      "boom bap",
      "рэп",
      "хип хоп",
      "хип-хоп",
      "hip-hop music",
      "hip hop beats",
      "uk hip hop",
      "хіп хоп",
      "хіпхоп",
      "український реп",
      "український хіп-хоп",
      "український хіпхоп"
    ]
  },
  {
    "id": "trap",
    "label": "autoGenreTrap",
    "family": "bassHeavy",
    "aliases": [
      "trap music",
      "trap mix",
      "trap",
      "трэп",
      "трап",
      "trap beats",
      "trap playlist",
      "треп музика",
      "трап музика"
    ]
  },
  {
    "id": "drill",
    "label": "autoGenreDrill",
    "family": "bassHeavy",
    "aliases": [
      "drill rap",
      "uk drill",
      "drill music",
      "drill",
      "дрилл",
      "drill beats",
      "drill playlist",
      "дріл",
      "дрілл",
      "дрил"
    ]
  },
  {
    "id": "grime",
    "label": "autoGenreGrime",
    "family": "hiphop",
    "aliases": [
      "grime music",
      "grime",
      "uk grime",
      "uk grime music",
      "ґрайм",
      "грайм"
    ]
  },
  {
    "id": "phonk",
    "label": "autoGenrePhonk",
    "family": "bassHeavy",
    "aliases": [
      "drift phonk",
      "memphis phonk",
      "cowbell phonk",
      "phonk",
      "фонк",
      "фонк микс",
      "phonk music",
      "phonk playlist",
      "phonk beats",
      "фонк музика",
      "фонк плейлист"
    ]
  },
  {
    "id": "wave",
    "label": "autoGenreWave",
    "family": "atmosphere",
    "aliases": [
      "hardwave",
      "chillwave",
      "wave phonk",
      "wave music",
      "wave mix",
      "wave",
      "вейв",
      "wave playlist",
      "wave mix music",
      "вейв музика",
      "хардвейв",
      "чилвейв"
    ]
  },
  {
    "id": "lofi",
    "label": "autoGenreLofi",
    "family": "atmosphere",
    "aliases": [
      "lo fi hip hop",
      "lo fi",
      "lofi hip hop",
      "lofi beats",
      "lofi",
      "лоу фай",
      "лоуфай",
      "lo-fi music",
      "lo-fi beats",
      "low fidelity music",
      "лоуфай музыка",
      "лоу-фай музика",
      "лоуфай музика"
    ]
  },
  {
    "id": "ambient",
    "label": "autoGenreAmbient",
    "family": "atmosphere",
    "aliases": [
      "dark ambient",
      "ambient music",
      "ambient",
      "эмбиент",
      "ambient soundtrack",
      "ambient instrumental",
      "ембієнт",
      "атмосферна музика",
      "атмосферная музыка",
      "дарк эмбиент"
    ]
  },
  {
    "id": "newAge",
    "label": "autoGenreNewAge",
    "family": "atmosphere",
    "aliases": [
      "new age music",
      "new age",
      "нью эйдж",
      "релакс музыка",
      "релакс музика",
      "музыка нью эйдж",
      "музика нью-ейдж"
    ]
  },
  {
    "id": "chillout",
    "label": "autoGenreChillout",
    "family": "atmosphere",
    "aliases": [
      "chill out",
      "chillout",
      "chill mix",
      "relaxing music",
      "chill-out music",
      "chillout music",
      "чиллаут",
      "чил-аут",
      "чиллаут музика"
    ]
  },
  {
    "id": "pop",
    "label": "autoGenrePop",
    "family": "pop",
    "aliases": [
      "pop music",
      "pop mix",
      "pop song",
      "pop",
      "поп музыка",
      "поп",
      "pop playlist",
      "pop hits",
      "pop hits mix",
      "city pop",
      "synth-pop",
      "electropop",
      "поп-музика",
      "поп-хиты",
      "поп хіти"
    ]
  },
  {
    "id": "dancePop",
    "label": "autoGenreDancePop",
    "family": "pop",
    "aliases": [
      "dance pop",
      "dance-pop",
      "dance-pop music",
      "денс-поп"
    ]
  },
  {
    "id": "kpop",
    "label": "autoGenreKpop",
    "family": "pop",
    "aliases": [
      "k pop",
      "kpop",
      "korean pop",
      "кей поп",
      "k-pop music",
      "к-поп",
      "корейская поп-музыка",
      "корейський поп"
    ]
  },
  {
    "id": "jpop",
    "label": "autoGenreJpop",
    "family": "pop",
    "aliases": [
      "j pop",
      "jpop",
      "japanese pop",
      "j-pop music",
      "джей-поп",
      "японская поп-музыка",
      "японський поп"
    ]
  },
  {
    "id": "indiePop",
    "label": "autoGenreIndiePop",
    "family": "pop",
    "aliases": [
      "indie pop",
      "indie pop music",
      "інді-поп",
      "инди-поп"
    ]
  },
  {
    "id": "hyperpop",
    "label": "autoGenreHyperpop",
    "family": "pop",
    "aliases": [
      "hyperpop",
      "хайперпоп",
      "hyper-pop",
      "hyperpop music",
      "хайпер-поп",
      "хайперпоп музика"
    ]
  },
  {
    "id": "rock",
    "label": "autoGenreRock",
    "family": "rock",
    "aliases": [
      "classic rock",
      "rock music",
      "rock mix",
      "rock",
      "рок музыка",
      "рок",
      "rock playlist",
      "rock and roll",
      "rock n roll",
      "rock & roll",
      "garage rock",
      "post-punk",
      "рок-музика",
      "рок-н-ролл",
      "рок-н-рол"
    ]
  },
  {
    "id": "altRock",
    "label": "autoGenreAltRock",
    "family": "rock",
    "aliases": [
      "alternative rock",
      "alt rock",
      "альтернативный рок",
      "alternative rock music",
      "альт-рок",
      "альтернативний рок"
    ]
  },
  {
    "id": "hardRock",
    "label": "autoGenreHardRock",
    "family": "rock",
    "aliases": [
      "hard rock",
      "хард рок",
      "hard rock music"
    ]
  },
  {
    "id": "postRock",
    "label": "autoGenrePostRock",
    "family": "rock",
    "aliases": [
      "post rock",
      "post-rock",
      "post-rock music",
      "пост-рок"
    ]
  },
  {
    "id": "metal",
    "label": "autoGenreMetal",
    "family": "rock",
    "aliases": [
      "heavy metal",
      "death metal",
      "black metal",
      "metal music",
      "metal",
      "метал",
      "металл",
      "metal playlist",
      "heavy metal music",
      "metal music mix",
      "метал-музика",
      "металева музика"
    ]
  },
  {
    "id": "metalcore",
    "label": "autoGenreMetalcore",
    "family": "rock",
    "aliases": [
      "metalcore",
      "metal-core",
      "metalcore music",
      "металкор",
      "металкор музика"
    ]
  },
  {
    "id": "punk",
    "label": "autoGenrePunk",
    "family": "rock",
    "aliases": [
      "punk rock",
      "punk",
      "панк",
      "punk music",
      "punk playlist",
      "post-hardcore",
      "панк-рок"
    ]
  },
  {
    "id": "indie",
    "label": "autoGenreIndie",
    "family": "rock",
    "aliases": [
      "indie rock",
      "indie music",
      "indie",
      "indie music playlist",
      "інді",
      "інді-рок",
      "инди-рок"
    ]
  },
  {
    "id": "grunge",
    "label": "autoGenreGrunge",
    "family": "rock",
    "aliases": [
      "grunge",
      "гранж",
      "grunge rock",
      "гранж-рок"
    ]
  },
  {
    "id": "emo",
    "label": "autoGenreEmo",
    "family": "rock",
    "aliases": [
      "emo rock",
      "emo",
      "эмо",
      "emo rock music",
      "емо-рок"
    ]
  },
  {
    "id": "shoegaze",
    "label": "autoGenreShoegaze",
    "family": "rock",
    "aliases": [
      "shoegaze",
      "shoe gaze",
      "shoegaze music",
      "шугейз",
      "шугейз музика"
    ]
  },
  {
    "id": "jazz",
    "label": "autoGenreJazz",
    "family": "jazz",
    "aliases": [
      "smooth jazz",
      "jazz music",
      "jazz",
      "джаз",
      "jazz playlist",
      "jazz fusion",
      "джазова музика",
      "джаз музика",
      "джаз-фьюжн"
    ]
  },
  {
    "id": "blues",
    "label": "autoGenreBlues",
    "family": "vocal",
    "aliases": [
      "blues rock",
      "blues music",
      "blues",
      "блюз",
      "delta blues",
      "electric blues",
      "blues playlist",
      "блюзова музика",
      "блюз музика"
    ]
  },
  {
    "id": "funk",
    "label": "autoGenreFunk",
    "family": "vocal",
    "aliases": [
      "funk music",
      "funk",
      "фанк",
      "funk playlist",
      "фанк музика",
      "фанкова музика"
    ]
  },
  {
    "id": "soul",
    "label": "autoGenreSoul",
    "family": "vocal",
    "aliases": [
      "neo soul",
      "soul music",
      "soul",
      "соул",
      "soul music playlist",
      "нео-соул",
      "соул музика"
    ]
  },
  {
    "id": "rnb",
    "label": "autoGenreRnb",
    "family": "vocal",
    "aliases": [
      "rhythm and blues",
      "r and b",
      "rnb",
      "r&b",
      "r&b music",
      "r and b music",
      "contemporary r&b",
      "alternative r&b",
      "uk r&b",
      "ритм-н-блюз",
      "ритм энд блюз",
      "ритм-енд-блюз"
    ]
  },
  {
    "id": "disco",
    "label": "autoGenreDisco",
    "family": "pop",
    "aliases": [
      "disco music",
      "disco",
      "диско",
      "nu-disco",
      "disco playlist",
      "диско музыка",
      "диско музика",
      "ню-диско"
    ]
  },
  {
    "id": "country",
    "label": "autoGenreCountry",
    "family": "acoustic",
    "aliases": [
      "country music",
      "country",
      "кантри",
      "country playlist",
      "alt-country",
      "alternative country",
      "country folk",
      "country rock",
      "кантрі музика",
      "кантри музыка"
    ]
  },
  {
    "id": "folk",
    "label": "autoGenreFolk",
    "family": "acoustic",
    "aliases": [
      "folk music",
      "folk",
      "фолк",
      "folk playlist",
      "indie folk",
      "современный фолк",
      "сучасний фолк"
    ]
  },
  {
    "id": "bluegrass",
    "label": "autoGenreBluegrass",
    "family": "acoustic",
    "aliases": [
      "bluegrass",
      "bluegrass music",
      "блуграс",
      "блюграсс"
    ]
  },
  {
    "id": "acoustic",
    "label": "autoGenreAcoustic",
    "family": "acoustic",
    "aliases": [
      "acoustic music",
      "acoustic guitar",
      "acoustic",
      "acoustic playlist",
      "acoustic guitar music",
      "акустична музика",
      "акустическая музыка"
    ]
  },
  {
    "id": "classical",
    "label": "autoGenreClassical",
    "family": "classical",
    "aliases": [
      "classical music",
      "classic music",
      "classical",
      "классическая музыка",
      "классика",
      "classical piano",
      "classical orchestra",
      "класична музика",
      "класика музика"
    ]
  },
  {
    "id": "orchestral",
    "label": "autoGenreOrchestral",
    "family": "classical",
    "aliases": [
      "orchestral music",
      "orchestra",
      "orchestral",
      "orchestral soundtrack",
      "orchestral score",
      "оркестрова музика",
      "оркестровая музыка"
    ]
  },
  {
    "id": "soundtrack",
    "label": "autoGenreSoundtrack",
    "family": "classical",
    "aliases": [
      "film soundtrack",
      "movie soundtrack",
      "original soundtrack",
      "soundtrack",
      "ost",
      "саундтрек",
      "film score",
      "movie score",
      "original score",
      "motion picture soundtrack",
      "ost music",
      "музыка из фильма",
      "музика з фільму",
      "саундтрек до фільму",
      "саундтрек к фильму"
    ]
  },
  {
    "id": "gameMusic",
    "label": "autoGenreGameMusic",
    "family": "classical",
    "aliases": [
      "video game music",
      "game soundtrack",
      "gaming soundtrack",
      "video game ost",
      "game ost",
      "game music soundtrack",
      "игровая музыка",
      "музика з гри",
      "ігрова музика",
      "музыка из игры"
    ]
  },
  {
    "id": "animeMusic",
    "label": "autoGenreAnimeMusic",
    "family": "pop",
    "aliases": [
      "anime music",
      "anime soundtrack",
      "anime opening",
      "anime ost",
      "anime song",
      "anime songs",
      "music from anime",
      "музыка из аниме",
      "музика з аніме",
      "аниме опенинг",
      "аніме опенінг"
    ]
  },
  {
    "id": "opera",
    "label": "autoGenreOpera",
    "family": "classical",
    "aliases": [
      "opera music",
      "opera",
      "опера",
      "оперная музыка",
      "оперна музика"
    ]
  },
  {
    "id": "electronic",
    "label": "autoGenreElectronic",
    "family": "electronic",
    "aliases": [
      "electronic music",
      "electronica",
      "электронная музыка",
      "электроника",
      "edm",
      "edm music",
      "edm mix",
      "electronic dance music",
      "electronic music playlist",
      "електронна музика"
    ]
  },
  {
    "id": "house",
    "label": "autoGenreHouse",
    "family": "electronic",
    "aliases": [
      "house music",
      "house mix",
      "house",
      "house playlist",
      "house beats",
      "bass house",
      "tech house",
      "electro house",
      "future house",
      "afro house",
      "хавс музика",
      "хаус музика"
    ]
  },
  {
    "id": "deepHouse",
    "label": "autoGenreDeepHouse",
    "family": "electronic",
    "aliases": [
      "deep house",
      "deep-house",
      "deep house music",
      "дип-хаус"
    ]
  },
  {
    "id": "progressiveHouse",
    "label": "autoGenreProgressiveHouse",
    "family": "electronic",
    "aliases": [
      "progressive house",
      "prog house",
      "progressive house music",
      "прогрессив-хаус",
      "прогресив-хаус"
    ]
  },
  {
    "id": "techno",
    "label": "autoGenreTechno",
    "family": "electronic",
    "aliases": [
      "techno music",
      "techno",
      "техно",
      "melodic techno",
      "minimal techno",
      "industrial techno",
      "techno playlist",
      "техно музыка",
      "техно музика",
      "мелодік техно",
      "мелодик техно"
    ]
  },
  {
    "id": "trance",
    "label": "autoGenreTrance",
    "family": "electronic",
    "aliases": [
      "psytrance",
      "psy trance",
      "uplifting trance",
      "trance music",
      "trance",
      "транс",
      "psy-trance music",
      "goa trance",
      "uplifting trance music",
      "транс музика",
      "транс музыка"
    ]
  },
  {
    "id": "dubstep",
    "label": "autoGenreDubstep",
    "family": "electronic",
    "aliases": [
      "dubstep",
      "дабстеп",
      "melodic dubstep",
      "brostep",
      "dubstep music",
      "дабстеп музика"
    ]
  },
  {
    "id": "drumBass",
    "label": "autoGenreDrumBass",
    "family": "electronic",
    "aliases": [
      "drum and bass",
      "drum n bass",
      "drum bass",
      "dnb",
      "джангл днб",
      "drum n bass music",
      "dnb music",
      "джангл-н-бейс",
      "драм-н-бейс",
      "драм-енд-бейс"
    ]
  },
  {
    "id": "jungle",
    "label": "autoGenreJungle",
    "family": "electronic",
    "aliases": [
      "jungle music",
      "jungle",
      "jungle playlist",
      "jungle dnb",
      "джангл музика"
    ]
  },
  {
    "id": "breakbeat",
    "label": "autoGenreBreakbeat",
    "family": "electronic",
    "aliases": [
      "breakbeat",
      "break beat",
      "breakbeat music",
      "брейкбит музика"
    ]
  },
  {
    "id": "electro",
    "label": "autoGenreElectro",
    "family": "electronic",
    "aliases": [
      "electro music",
      "electro",
      "electro music playlist",
      "электро музыка",
      "електро музика"
    ]
  },
  {
    "id": "hardstyle",
    "label": "autoGenreHardstyle",
    "family": "electronic",
    "aliases": [
      "hardstyle",
      "hard style",
      "hardstyle music",
      "хардстайл музика"
    ]
  },
  {
    "id": "synthwave",
    "label": "autoGenreSynthwave",
    "family": "electronic",
    "aliases": [
      "synthwave",
      "ретровейв",
      "синтвейв",
      "retro wave",
      "retrowave",
      "outrun music",
      "ретро-вейв",
      "ретровейв музыка",
      "синтвейв музыка"
    ]
  },
  {
    "id": "vaporwave",
    "label": "autoGenreVaporwave",
    "family": "atmosphere",
    "aliases": [
      "vaporwave",
      "vapor wave",
      "вейпорвейв",
      "вейпорвейв музика"
    ]
  },
  {
    "id": "tripHop",
    "label": "autoGenreTripHop",
    "family": "hiphop",
    "aliases": [
      "trip hop",
      "triphop"
    ]
  },
  {
    "id": "garage",
    "label": "autoGenreGarage",
    "family": "electronic",
    "aliases": [
      "uk garage",
      "garage music",
      "garage",
      "ukg",
      "uk garage music",
      "garage music playlist",
      "гараж музика"
    ]
  },
  {
    "id": "reggae",
    "label": "autoGenreReggae",
    "family": "world",
    "aliases": [
      "reggae",
      "регги",
      "roots reggae",
      "dub reggae",
      "reggae music",
      "регги музыка",
      "реггі музика"
    ]
  },
  {
    "id": "dancehall",
    "label": "autoGenreDancehall",
    "family": "world",
    "aliases": [
      "dancehall",
      "dance hall",
      "денсхолл",
      "dancehall music",
      "денс-холл",
      "денсхол музика"
    ]
  },
  {
    "id": "ska",
    "label": "autoGenreSka",
    "family": "world",
    "aliases": [
      "ska",
      "ска",
      "ska punk",
      "ska music",
      "ска-панк",
      "ска музика"
    ]
  },
  {
    "id": "reggaeton",
    "label": "autoGenreReggaeton",
    "family": "world",
    "aliases": [
      "reggaeton",
      "реггетон",
      "reggaeton music",
      "реггетон музыка",
      "регетон музика"
    ]
  },
  {
    "id": "salsa",
    "label": "autoGenreSalsa",
    "family": "world",
    "aliases": [
      "salsa music",
      "salsa",
      "сальса",
      "salsa music playlist",
      "сальса музика"
    ]
  },
  {
    "id": "bachata",
    "label": "autoGenreBachata",
    "family": "world",
    "aliases": [
      "bachata",
      "бачата",
      "bachata music",
      "бачата музика"
    ]
  },
  {
    "id": "cumbia",
    "label": "autoGenreCumbia",
    "family": "world",
    "aliases": [
      "cumbia",
      "кумбия",
      "cumbia music",
      "кумбия музыка",
      "кумбія музика"
    ]
  },
  {
    "id": "afrobeats",
    "label": "autoGenreAfrobeats",
    "family": "world",
    "aliases": [
      "afrobeats",
      "afro beats",
      "afrobeat",
      "афробит",
      "afrobeat music",
      "afrobeats music",
      "afrobeats playlist",
      "афробитс",
      "афробітс",
      "афробіт музика"
    ]
  },
  {
    "id": "amapiano",
    "label": "autoGenreAmapiano",
    "family": "world",
    "aliases": [
      "amapiano",
      "amapiano music",
      "amapiano mix"
    ]
  },
  {
    "id": "gospel",
    "label": "autoGenreGospel",
    "family": "vocal",
    "aliases": [
      "gospel music",
      "gospel",
      "госпел",
      "gospel choir",
      "gospel music playlist",
      "євангельська музика",
      "госпел музика"
    ]
  },
  {
    "id": "latin",
    "label": "autoGenreLatin",
    "family": "world",
    "aliases": [
      "latin music",
      "latin pop",
      "latin mix",
      "латино",
      "latin playlist",
      "latin dance music",
      "латино музика",
      "латино музыка",
      "латинська музика"
    ]
  },
  {
    "id": "bossaNova",
    "label": "autoGenreBossaNova",
    "family": "world",
    "aliases": [
      "bossa nova",
      "bossanova",
      "bossa nova music",
      "босанова",
      "боса-нова"
    ]
  },
  {
    "id": "samba",
    "label": "autoGenreSamba",
    "family": "world",
    "aliases": [
      "samba",
      "самба",
      "samba music",
      "самба музика"
    ]
  },
  {
    "id": "tango",
    "label": "autoGenreTango",
    "family": "world",
    "aliases": [
      "tango",
      "танго",
      "tango music",
      "танго музыка",
      "танго музика"
    ]
  },
  {
    "id": "flamenco",
    "label": "autoGenreFlamenco",
    "family": "world",
    "aliases": [
      "flamenco",
      "фламенко",
      "flamenco music",
      "фламенко музика"
    ]
  },
  {
    "id": "bollywood",
    "label": "autoGenreBollywood",
    "family": "world",
    "aliases": [
      "bollywood music",
      "bollywood",
      "bollywood songs",
      "bollywood soundtrack",
      "болливудская музыка",
      "боллівудська музика"
    ]
  },
  {
    "id": "experimental",
    "label": "autoGenreExperimental",
    "family": "neutral",
    "aliases": [
      "experimental music",
      "experimental",
      "avant garde",
      "avant-garde",
      "experimental electronica",
      "experimental hip hop",
      "avant-garde music",
      "авангардная музыка",
      "авангардна музика"
    ]
  },
  {
    "id": "audioBassHeavy",
    "label": "autoGenreAudioBassHeavy",
    "family": "bassHeavy",
    "aliases": []
  },
  {
    "id": "audioElectronic",
    "label": "autoGenreAudioElectronic",
    "family": "electronic",
    "aliases": []
  },
  {
    "id": "audioAtmospheric",
    "label": "autoGenreAudioAtmospheric",
    "family": "atmosphere",
    "aliases": []
  },
  {
    "id": "audioVocal",
    "label": "autoGenreAudioVocal",
    "family": "vocal",
    "aliases": []
  },
  {
    "id": "audioOther",
    "label": "autoGenreAudioOther",
    "family": "neutral",
    "aliases": []
  }
];
  // Normalized weak genre words: a bare word inside a song title is not enough
  // evidence unless the title itself is that genre or has music context nearby.
  const normalizeGenreAlias = (value) => String(value || '').toLowerCase()
    .replace(/й/g, 'и').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const ambiguousAliases = Object.freeze(Array.from(new Set(([
    "pop",
    "rock",
    "rap",
    "metal",
    "house",
    "garage",
    "jungle",
    "indie",
    "folk",
    "country",
    "acoustic",
    "soul",
    "funk",
    "disco",
    "opera",
    "ska",
    "latin",
    "salsa",
    "samba",
    "tango",
    "reggae",
    "trance",
    "techno",
    "electronic",
    "wave",
    "ambient",
    "jazz",
    "blues",
    "classical",
    "gospel",
    "electro",
    "chillout",
    "experimental",
    "punk",
    "trap",
    "drill",
    "grime",
    "emo",
    "поп",
    "рок",
    "рэп",
    "реп",
    "метал",
    "хаус",
    "гараж",
    "джангл",
    "инди",
    "инди",
    "фолк",
    "кантри",
    "акустика",
    "соул",
    "фанк",
    "диско",
    "опера",
    "ска",
    "сальса",
    "самба",
    "танго",
    "регги",
    "транс",
    "техно",
    "электроника",
    "волна",
    "эмбиент",
    "джаз",
    "блюз",
    "классика",
    "госпел",
    "электро",
    "чиллаут",
    "экспериментальный",
    "панк",
    "трэп",
    "дрилл",
    "грайм",
    "эмо",
    "рок",
    "реп",
    "поп",
    "метал",
    "хаус",
    "диско",
    "опера",
    "транc",
    "джаз",
    "блюз"
]).map(normalizeGenreAlias))));

  const frozenCatalog = Object.freeze(catalog.map((item) => Object.freeze({
    ...item,
    aliases: Object.freeze([...item.aliases])
  })));
  const allowedGenreIds = Object.freeze(frozenCatalog.map((item) => item.id));
  const allowedStates = Object.freeze([
    'disabled',
    'waiting-capture',
    'detected',
    'detecting'
  ]);
  // The popup uses these localization keys instead of maintaining a second genre map.
  const labelKeys = Object.freeze(Object.fromEntries(
    frozenCatalog.map((item) => [item.id, item.label])
  ));
  return Object.freeze({ catalog: frozenCatalog, allowedGenreIds, allowedStates, ambiguousAliases, labelKeys });
})();
