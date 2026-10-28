/*
 * EN: Offscreen audio engine. Builds the Web Audio graph, applies volume/EQ/protection,
 *     analyzes track metadata/spectrum, and streams compact visualization data to the popup.
 * RU: Offscreen-аудиодвижок. Создаёт Web Audio-граф, применяет громкость/EQ/защиту,
 *     анализирует метаданные и спектр трека, отправляет данные визуализации в popup.
 * UK: Offscreen-аудіорушій. Створює Web Audio-граф, застосовує гучність/EQ/захист,
 *     аналізує метадані й спектр треку та надсилає дані візуалізації до popup.
 */
let audioContext = null;
let audioContextCleanupPromise = Promise.resolve();
let sourceNode = null;
let rumbleFilter = null;
let bassBoostFilter = null;
let voiceBodyFilter = null;
let voicePresenceFilter = null;
let eqHeadroomGain = null;
let gainNode = null;
let compressor = null;
let limiter = null;
let safetyCeilingShaper = null;
let nightMakeupGain = null;
let analyserNode = null;
let frequencyBuffer = null;
let spectrumTimer = null;
let spectrumSampleIntervalMs = 66;
let protectionTimer = null;
let timeDomainBuffer = null;
let clippingHoldUntil = 0;
let lastProtectionSignature = '';
let visualizerEnabled = false;
let spectrumBandCount = 48;
let currentStream = null;
let currentTabId = null;
let autoGenreEnabled = false;
let autoGenreBassManualOverride = false;
let autoGenreVoiceManualOverride = false;
let autoGenreTimer = null;
let currentSourceTitle = '';
let currentSourceTrackId = '';
let currentAutoGenreProfile = null;
let genreAnalyserNode = null;
let genreFrequencyBuffer = null;
let genreTimeDomainBuffer = null;
let currentAutoGenre = null;
let currentAutoGenreConfidence = 0;
let currentAutoGenreSource = null;
let autoGenreSamples = [];
let autoGenreLastCandidate = null;
let autoGenreCandidateStreak = 0;
let lastAutoGenreStatusSignature = '';
// EN: Genres map to a small set of conservative EQ families; audio-only classification uses broad families only.
// RU: Жанры сопоставляются с набором умеренных EQ-профилей; анализ только звука выбирает лишь широкую категорию.
// UK: Жанри зіставляються з набором помірних EQ-профілів; аналіз лише звуку вибирає тільки широку категорію.
const AUTO_GENRE_PROFILE_FAMILIES = {
  hiphop:     { bassBoostEnabled: true, bassBoostDb: 5, voiceBoostEnabled: true, voiceBoostDb: 1, volumeTrimDb: -0.4 },
  bassHeavy:  { bassBoostEnabled: true, bassBoostDb: 6, voiceBoostEnabled: false, voiceBoostDb: 0, volumeTrimDb: -1.2 },
  pop:        { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true, voiceBoostDb: 2, volumeTrimDb: -0.2 },
  rock:       { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true, voiceBoostDb: 2, volumeTrimDb: -0.4 },
  electronic: { bassBoostEnabled: true, bassBoostDb: 4, voiceBoostEnabled: false, voiceBoostDb: 0, volumeTrimDb: -0.6 },
  atmosphere: { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true, voiceBoostDb: 1, volumeTrimDb: 0.3 },
  jazz:       { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true, voiceBoostDb: 2, volumeTrimDb: 0.2 },
  vocal:      { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true, voiceBoostDb: 3, volumeTrimDb: 0.1 },
  acoustic:   { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true, voiceBoostDb: 2, volumeTrimDb: 0.2 },
  classical:  { bassBoostEnabled: false, bassBoostDb: 0, voiceBoostEnabled: true, voiceBoostDb: 1, volumeTrimDb: 0.4 },
  world:      { bassBoostEnabled: true, bassBoostDb: 3, voiceBoostEnabled: true, voiceBoostDb: 2, volumeTrimDb: 0 },
  neutral:    { bassBoostEnabled: true, bassBoostDb: 2, voiceBoostEnabled: true, voiceBoostDb: 1, volumeTrimDb: 0 }
};
const AUTO_GENRE_CATALOG = [
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
    "aliases": [

    ]
  },
  {
    "id": "audioElectronic",
    "label": "autoGenreAudioElectronic",
    "family": "electronic",
    "aliases": [

    ]
  },
  {
    "id": "audioAtmospheric",
    "label": "autoGenreAudioAtmospheric",
    "family": "atmosphere",
    "aliases": [

    ]
  },
  {
    "id": "audioVocal",
    "label": "autoGenreAudioVocal",
    "family": "vocal",
    "aliases": [

    ]
  },
  {
    "id": "audioOther",
    "label": "autoGenreAudioOther",
    "family": "neutral",
    "aliases": [

    ]
  }
];
const AUTO_GENRE_PROFILES = Object.fromEntries(AUTO_GENRE_CATALOG.map((item) => [item.id, AUTO_GENRE_PROFILE_FAMILIES[item.family] || AUTO_GENRE_PROFILE_FAMILIES.neutral]));

// Common words are weak genre evidence when they appear inside an ordinary song or artist title.
const AUTO_GENRE_AMBIGUOUS_WORDS = new Set([
  'pop', 'rock', 'rap', 'metal', 'house', 'garage', 'jungle', 'indie', 'folk', 'country',
  'acoustic', 'soul', 'funk', 'disco', 'opera', 'ska', 'latin', 'salsa', 'samba', 'tango',
  'reggae', 'trance', 'techno', 'electronic', 'wave', 'ambient', 'jazz', 'blues', 'classical',
  'gospel', 'electro', 'chillout', 'experimental'
]);
const AUTO_GENRE_CONTEXT_WORDS = new Set([
  'music', 'mix', 'remix', 'playlist', 'beats', 'beat', 'radio', 'genre', 'soundtrack', 'song', 'songs',
  'style', 'version', 'type', 'session', 'set', 'compilation', 'hits', 'hit', 'album', 'track',
  'музыка', 'музика', 'микс', 'мікс', 'плейлист', 'жанр', 'трек', 'песня', 'песни', 'пісня', 'пісні',
  'збірка', 'сборник', 'саундтрек', 'хиты', 'хіти', 'музичний', 'музыкальный'
]);
const AUTO_GENRE_MATCHERS = AUTO_GENRE_CATALOG.flatMap((item) =>
  item.aliases.map((sourceAlias) => [item, sourceAlias, normalizeGenreText(sourceAlias)])
).map(([item, sourceAlias, alias]) => ({
  item,
  sourceAlias,
  alias,
  tokenCount: alias ? alias.split(' ').length : 0,
  score: alias ? alias.length + alias.split(' ').length * 10 : 0
})).filter((entry) => entry.alias).sort((a, b) => b.score - a.score);

// Balanced defaults: moderate low-shelf boost and restrained vocal-presence EQ.
let currentVolume = 1;
let currentMuted = false;
let bassBoostEnabled = true;
let bassBoostDb = 4;
let voiceBoostEnabled = true;
let voiceBoostDb = 2;
let peakLimiterEnabled = true;
let nightModeEnabled = false;

// EN: This listener accepts control messages only from the extension service worker, never from a page.
// RU: Обработчик принимает управляющие сообщения только от фонового процесса расширения, не от веб-страницы.
// UK: Обробник приймає керувальні повідомлення лише від фонового процесу розширення, а не від вебсторінки.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Accept audio-graph commands only from this extension's service worker.
  // A page/content script must not be able to stop capture or manipulate gain.
  if (!sender || sender.id !== chrome.runtime.id ||
      sender.url !== chrome.runtime.getURL('background.js')) return;
  if (!message || message.target !== 'offscreen') return;

  if (message.type === 'START_CAPTURE') {
    if (typeof message.streamId !== 'string' || message.streamId.length === 0 || message.streamId.length > 1024 || !Number.isInteger(message.tabId) || message.tabId < 0 ||
        (message.autoGenreEnabled !== undefined && typeof message.autoGenreEnabled !== 'boolean') ||
        (message.sourceTitle !== undefined && typeof message.sourceTitle !== 'string') ||
        (message.sourceTrackId !== undefined && (typeof message.sourceTrackId !== 'string' || message.sourceTrackId.length > 280)) ||
        (message.bassManualOverride !== undefined && typeof message.bassManualOverride !== 'boolean') ||
        (message.voiceManualOverride !== undefined && typeof message.voiceManualOverride !== 'boolean')) {
      sendResponse({ success: false, error: 'Invalid capture request.' });
      return false;
    }
    startCapture(
      message.streamId,
      message.tabId,
      typeof message.sourceTitle === 'string' ? message.sourceTitle.slice(0, 500) : '',
      message.autoGenreEnabled !== false,
      typeof message.sourceTrackId === 'string' ? message.sourceTrackId.slice(0, 280) : '',
      message.bassManualOverride === true,
      message.voiceManualOverride === true
    ).then(
      (result) => sendResponse(result),
      (error) => sendResponse({ success: false, error: errorMessage(error) })
    );
    return true;
  }

  if (message.type === 'UPDATE_VOLUME') {
    const validSettings =
      typeof message.volume === 'number' && Number.isFinite(message.volume) && message.volume >= 0 && message.volume <= 6 &&
      typeof message.muted === 'boolean' &&
      typeof message.bassBoostEnabled === 'boolean' &&
      Number.isInteger(message.bassBoostDb) && message.bassBoostDb >= 0 && message.bassBoostDb <= 12 &&
      typeof message.voiceBoostEnabled === 'boolean' &&
      Number.isInteger(message.voiceBoostDb) && message.voiceBoostDb >= 0 && message.voiceBoostDb <= 8 &&
      typeof message.peakLimiterEnabled === 'boolean' &&
      typeof message.nightModeEnabled === 'boolean' &&
      (message.bassManualOverride === undefined || typeof message.bassManualOverride === 'boolean') &&
      (message.voiceManualOverride === undefined || typeof message.voiceManualOverride === 'boolean');
    if (!validSettings) {
      sendResponse({ success: false, error: 'Invalid audio settings.' });
      return false;
    }
    updateAudioSettings(
      message.volume,
      message.muted,
      message.bassBoostEnabled,
      message.bassBoostDb,
      message.voiceBoostEnabled,
      message.voiceBoostDb,
      message.peakLimiterEnabled,
      message.nightModeEnabled,
      message.bassManualOverride,
      message.voiceManualOverride
    );
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'STOP_CAPTURE') {
    stopCapture();
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'AUTO_GENRE_SETTINGS') {
    if (typeof message.enabled !== 'boolean' || (message.title !== undefined && (typeof message.title !== 'string' || message.title.length > 500)) || (message.trackId !== undefined && (typeof message.trackId !== 'string' || message.trackId.length > 280))) {
      sendResponse({ success: false, error: 'Invalid auto genre setting.' });
      return false;
    }
    const nextTitle = typeof message.title === 'string' && message.title.length <= 500
      ? message.title : currentSourceTitle;
    const nextTrackId = typeof message.trackId === 'string' && message.trackId.length <= 280
      ? message.trackId : undefined;
    const trackIdChanged = typeof nextTrackId === 'string' && nextTrackId.length > 0 && nextTrackId !== currentSourceTrackId;
    if (nextTitle !== currentSourceTitle || trackIdChanged) {
      updateAutoGenreSourceMetadata(nextTitle, nextTrackId);
    }
    setAutoGenreEnabled(message.enabled);
    sendResponse({ success: true, enabled: autoGenreEnabled, genre: currentAutoGenre });
    return false;
  }

  if (message.type === 'SET_SOURCE_METADATA') {
    if (typeof message.title !== 'string' || message.title.length > 500 ||
        (message.trackId !== undefined && (typeof message.trackId !== 'string' || message.trackId.length > 280))) {
      sendResponse({ success: false, error: 'Invalid source metadata.' });
      return false;
    }
    updateAutoGenreSourceMetadata(message.title, typeof message.trackId === 'string' ? message.trackId : undefined);
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'GET_CAPTURE_STATUS') {
    const audioTracks = currentStream ? currentStream.getAudioTracks() : [];
    const hasLiveAudio = audioTracks.some((track) => track.readyState === 'live');
    sendResponse({
      success: true,
      active: Boolean(currentStream && hasLiveAudio && Number.isInteger(currentTabId)),
      tabId: currentStream && hasLiveAudio && Number.isInteger(currentTabId) ? currentTabId : null
    });
    return false;
  }

  if (message.type === 'VISUALIZER_SETTINGS') {
    const sampleIntervalMs = message.sampleIntervalMs === undefined ? 66 : message.sampleIntervalMs;
    if (![24, 36, 48, 64, 96].includes(message.bandCount) || ![33, 66, 200].includes(sampleIntervalMs)) {
      sendResponse({ success: false, error: 'Invalid visualizer settings.' });
      return false;
    }
    spectrumBandCount = message.bandCount;
    if (spectrumSampleIntervalMs !== sampleIntervalMs) {
      spectrumSampleIntervalMs = sampleIntervalMs;
      const wasEnabled = visualizerEnabled;
      stopSpectrumLoop();
      if (wasEnabled) startSpectrumLoop();
    }
    sendResponse({ success: true, bandCount: spectrumBandCount, sampleIntervalMs: spectrumSampleIntervalMs });
    return false;
  }

  if (message.type === 'VISUALIZER_CONTROL') {
    if (typeof message.enabled !== 'boolean') {
      sendResponse({ success: false, error: 'Invalid visualizer state.' });
      return false;
    }
    visualizerEnabled = message.enabled;
    if (visualizerEnabled) startSpectrumLoop();
    else stopSpectrumLoop();
    sendResponse({ success: true, active: Boolean(currentStream && analyserNode) });
    return false;
  }
});

// EN: Disconnect every node/timer and suspend the reusable AudioContext; retain the user's AUTO/MANUAL choices.
// RU: Отключает узлы и таймеры, приостанавливает AudioContext и сохраняет пользовательские режимы AUTO/РУЧНОЙ.
// UK: Від'єднує вузли й таймери, призупиняє AudioContext і зберігає режими користувача AUTO/РУЧНИЙ.
function stopCapture() {
  stopSpectrumLoop();
  stopAutoGenreLoop();
  if (protectionTimer) {
    clearInterval(protectionTimer);
    protectionTimer = null;
  }
  clippingHoldUntil = 0;
  timeDomainBuffer = null;
  visualizerEnabled = false;
  [sourceNode, rumbleFilter, bassBoostFilter, voiceBodyFilter, voicePresenceFilter, eqHeadroomGain, gainNode, compressor, limiter, safetyCeilingShaper, nightMakeupGain, analyserNode, genreAnalyserNode].forEach((node) => {
    if (node) {
      try { node.disconnect(); } catch (_) {}
    }
  });
  sourceNode = null;
  rumbleFilter = null;
  bassBoostFilter = null;
  voiceBodyFilter = null;
  voicePresenceFilter = null;
  eqHeadroomGain = null;
  gainNode = null;
  compressor = null;
  limiter = null;
  safetyCeilingShaper = null;
  nightMakeupGain = null;
  analyserNode = null;
  frequencyBuffer = null;
  genreAnalyserNode = null;
  genreFrequencyBuffer = null;
  genreTimeDomainBuffer = null;

  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
  }
  // EN: Close the old context after disconnecting the graph so audio-device and DSP resources are released.
  //     startCapture awaits the close promise before creating a fresh context for the next stream.
  // RU: Закрываем старый AudioContext после отключения графа, чтобы освободить ресурсы аудио-устройства и DSP.
  //     startCapture ждёт завершения закрытия и только потом создаёт новый контекст для следующего потока.
  // UK: Закриваємо старий AudioContext після від'єднання графа, щоб звільнити ресурси аудіопристрою та DSP.
  //     startCapture очікує завершення закриття й лише потім створює новий контекст для наступного потоку.
  const contextToClose = audioContext;
  audioContext = null;
  if (contextToClose && contextToClose.state !== 'closed' && typeof contextToClose.close === 'function') {
    try {
      audioContextCleanupPromise = Promise.resolve(contextToClose.close()).catch((error) => {
        console.warn('Could not close audio context cleanly:', errorMessage(error));
      });
    } catch (error) {
      // EN: A synchronous close failure is logged; disconnected nodes and stopped tracks still allow cleanup.
      // RU: Синхронная ошибка close записывается в журнал; отсоединённые узлы и остановленные треки всё равно очищены.
      // UK: Синхронну помилку close записуємо в журнал; від'єднані вузли й зупинені треки все одно очищені.
      console.warn('Could not close audio context cleanly:', errorMessage(error));
      audioContextCleanupPromise = Promise.resolve();
    }
  } else {
    audioContextCleanupPromise = Promise.resolve();
  }
  currentTabId = null;
  currentSourceTitle = '';
  currentSourceTrackId = '';
  currentAutoGenreProfile = null;
  // Keep the user's AUTO/MANUAL preference across capture stop/start transitions.
  lastProtectionSignature = '';
  currentAutoGenre = null;
  currentAutoGenreConfidence = 0;
  currentAutoGenreSource = null;
  autoGenreSamples = [];
  autoGenreLastCandidate = null;
  autoGenreCandidateStreak = 0;
  publishProtectionStatus(true);
  publishAutoGenreStatus(true);
}

// EN: Consume the single-use tab stream ID immediately, build one audible graph plus a silent source-analysis tap.
// RU: Сразу использует одноразовый stream ID, создаёт один слышимый аудиограф и отдельную беззвучную ветку анализа.
// UK: Одразу використовує одноразовий stream ID, створює один чутний аудіограф і окрему беззвучну гілку аналізу.
async function startCapture(streamId, tabId, sourceTitle = '', enableAutoGenre = false, sourceTrackId = '', bassManualOverride = false, voiceManualOverride = false) {
  stopCapture();
  currentSourceTitle = typeof sourceTitle === 'string' ? sourceTitle.slice(0, 500) : '';
  currentSourceTrackId = typeof sourceTrackId === 'string' ? sourceTrackId.slice(0, 280) : '';
  currentAutoGenreProfile = null;
  autoGenreEnabled = enableAutoGenre === true;
  autoGenreBassManualOverride = bassManualOverride === true;
  autoGenreVoiceManualOverride = voiceManualOverride === true;
  await audioContextCleanupPromise;

  if (typeof streamId !== 'string' || streamId.length === 0) {
    const error = new Error('Не получен streamId. Запрос захвата не был адресован offscreen-документу правильно.');
    console.error('Offscreen capture failed:', error.message);
    return { success: false, error: error.message };
  }

  try {
    // Stream IDs are single-use and short-lived, so consume them immediately.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    currentStream = stream;
    currentTabId = Number.isInteger(tabId) ? tabId : null;

    // If the tab closes or Chrome ends the captured track outside our control,
    // release the graph and timers even when the service worker has restarted.
    for (const track of stream.getTracks()) {
      track.addEventListener?.('ended', () => {
        if (currentStream === stream) stopCapture();
      }, { once: true });
    }

    if (!stream.getAudioTracks().length) {
      throw new Error('Браузер создал медиапоток без аудиодорожки.');
    }

    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContext({ latencyHint: 'interactive' });
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    sourceNode = audioContext.createMediaStreamSource(stream);

    // Analyze a silent parallel tap of the unprocessed source so track adaptation
    // measures the original music, not the EQ that the extension has already applied.
    genreAnalyserNode = audioContext.createAnalyser();
    genreAnalyserNode.fftSize = 2048;
    genreAnalyserNode.smoothingTimeConstant = 0.65;
    genreAnalyserNode.minDecibels = -90;
    genreAnalyserNode.maxDecibels = -12;
    genreFrequencyBuffer = new Uint8Array(genreAnalyserNode.frequencyBinCount);
    genreTimeDomainBuffer = new Float32Array(genreAnalyserNode.fftSize);
    sourceNode.connect(genreAnalyserNode);
    // The analyser is a terminal side-branch; do not route this analysis tap to the audible destination.

    // Remove subsonic rumble while preserving audible deep bass.
    rumbleFilter = audioContext.createBiquadFilter();
    rumbleFilter.type = 'highpass';
    rumbleFilter.frequency.setValueAtTime(25, audioContext.currentTime);
    rumbleFilter.Q.setValueAtTime(0.707, audioContext.currentTime);

    // A low-shelf filter boosts bass without muddying the mids/highs.
    bassBoostFilter = audioContext.createBiquadFilter();
    bassBoostFilter.type = 'lowshelf';
    bassBoostFilter.frequency.setValueAtTime(105, audioContext.currentTime);
    bassBoostFilter.gain.setValueAtTime(0, audioContext.currentTime);

    // Voice clarity EQ: a gentle lower-mid body boost plus a presence peak.
    // +3 dB is a restrained default; larger boosts can sound nasal/harsh.
    voiceBodyFilter = audioContext.createBiquadFilter();
    voiceBodyFilter.type = 'peaking';
    voiceBodyFilter.frequency.setValueAtTime(1250, audioContext.currentTime);
    voiceBodyFilter.Q.setValueAtTime(0.85, audioContext.currentTime);
    voiceBodyFilter.gain.setValueAtTime(0, audioContext.currentTime);

    voicePresenceFilter = audioContext.createBiquadFilter();
    voicePresenceFilter.type = 'peaking';
    voicePresenceFilter.frequency.setValueAtTime(2800, audioContext.currentTime);
    voicePresenceFilter.Q.setValueAtTime(0.95, audioContext.currentTime);
    voicePresenceFilter.gain.setValueAtTime(0, audioContext.currentTime);

    // A small automatic EQ pre-attenuation preserves headroom without changing EQ controls.
    // This is deliberately conservative; the final dynamics stages handle remaining peaks.
    eqHeadroomGain = audioContext.createGain();
    eqHeadroomGain.gain.setValueAtTime(1, audioContext.currentTime);

    gainNode = audioContext.createGain();

    // Gentle level control handles the added low-frequency energy.
    compressor = audioContext.createDynamicsCompressor();
    // Gentle default compression preserves transients; night mode applies stronger leveling.
    compressor.threshold.setValueAtTime(-12, audioContext.currentTime);
    compressor.knee.setValueAtTime(12, audioContext.currentTime);
    compressor.ratio.setValueAtTime(2.2, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.012, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    // Night mode uses moderate post-compressor makeup gain to make quiet dialogue easier to hear.
    // The optional peak limiter remains the final stage when enabled.
    nightMakeupGain = audioContext.createGain();
    nightMakeupGain.gain.setValueAtTime(1, audioContext.currentTime);

    // A final fast limiter stage catches peaks from large volume/bass settings.
    limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-2.5, audioContext.currentTime);
    limiter.knee.setValueAtTime(0, audioContext.currentTime);
    limiter.ratio.setValueAtTime(20, audioContext.currentTime);
    limiter.attack.setValueAtTime(0.003, audioContext.currentTime);
    limiter.release.setValueAtTime(0.12, audioContext.currentTime);

    // EN: Add a smooth, bounded safety ceiling after the compressor limiter to catch residual sample peaks.
    //     This is a soft clip/ceiling stage, not a claim of mathematically perfect true-peak limiting.
    // RU: Добавляем мягкий ограничитель после компрессорного лимитера, чтобы сгладить остаточные пики сэмплов.
    //     Это мягкий потолок амплитуды, а не гарантия идеального true-peak limiting.
    // UK: Додаємо м'який обмежувач після компресорного лімітера, щоб згладити залишкові піки семплів.
    //     Це м'яка стеля амплітуди, а не гарантія ідеального true-peak limiting.
    safetyCeilingShaper = audioContext.createWaveShaper();
    safetyCeilingShaper.curve = createSafetyCeilingCurve();
    safetyCeilingShaper.oversample = '4x';

    // Inline analyzer tap exposes the post-volume signal to the visualizer and
    // measures pre-limiter peaks without creating a parallel audible path.
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.78;
    analyserNode.minDecibels = -90;
    analyserNode.maxDecibels = -18;
    frequencyBuffer = new Uint8Array(analyserNode.frequencyBinCount);
    timeDomainBuffer = new Float32Array(analyserNode.fftSize);

    sourceNode.connect(rumbleFilter);
    rumbleFilter.connect(bassBoostFilter);
    bassBoostFilter.connect(voiceBodyFilter);
    voiceBodyFilter.connect(voicePresenceFilter);
    voicePresenceFilter.connect(eqHeadroomGain);
    // Compress the EQ-shaped source before master volume so the volume slider does not
    // change the compressor's behaviour. The master gain remains before the final limiter.
    eqHeadroomGain.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(nightMakeupGain);
    // Analyser is inline after output gain but before the limiter: this lets it display
    // the heard level and warn about peaks that the optional limiter will catch.
    nightMakeupGain.connect(analyserNode);
    applyLimiterRouting();

    applyAudioSettings();
    startProtectionMonitor();
    if (autoGenreEnabled) startAutoGenreLoop();
    publishProtectionStatus(true);
    publishAutoGenreStatus(true);
    console.info('Tab audio capture started', {
      tabId: currentTabId,
      bassBoostEnabled,
      bassBoostDb,
      voiceBoostEnabled,
      voiceBoostDb
    });
    return { success: true, tabId: currentTabId };
  } catch (error) {
    stopCapture();
    const detail = errorMessage(error);
    console.error('Offscreen capture failed:', detail, error);
    return {
      success: false,
      tabId: Number.isInteger(tabId) ? tabId : null,
      error: detail
    };
  }
}

// EN: Stores validated values and applies them to the current Web Audio nodes.
// RU: Сохраняет проверенные значения и применяет их к текущим узлам Web Audio.
// UK: Зберігає перевірені значення та застосовує їх до поточних вузлів Web Audio.
function updateAudioSettings(volume, muted, enabled, boostDb, voiceEnabled, voiceDb, limiterEnabled, nightEnabled, bassManualOverride, voiceManualOverride) {
  if (volume !== undefined) {
    const parsedVolume = Number(volume);
    currentVolume = Number.isFinite(parsedVolume)
      ? Math.min(6, Math.max(0, parsedVolume))
      : 1;
  }
  if (muted !== undefined) currentMuted = muted === true;
  if (enabled !== undefined) bassBoostEnabled = enabled === true;
  if (boostDb !== undefined) {
    const parsedDb = Number(boostDb);
    bassBoostDb = Number.isFinite(parsedDb)
      ? Math.min(12, Math.max(0, parsedDb))
      : 4;
  }
  if (voiceEnabled !== undefined) voiceBoostEnabled = voiceEnabled === true;
  if (voiceDb !== undefined) {
    const parsedVoiceDb = Number(voiceDb);
    voiceBoostDb = Number.isFinite(parsedVoiceDb)
      ? Math.min(8, Math.max(0, parsedVoiceDb))
      : 2;
  }
  if (limiterEnabled !== undefined) {
    const nextLimiterState = limiterEnabled === true;
    if (nextLimiterState !== peakLimiterEnabled) {
      peakLimiterEnabled = nextLimiterState;
      applyLimiterRouting();
    }
  }
  if (nightEnabled !== undefined) nightModeEnabled = nightEnabled === true;
  if (bassManualOverride !== undefined) autoGenreBassManualOverride = bassManualOverride === true;
  if (voiceManualOverride !== undefined) autoGenreVoiceManualOverride = voiceManualOverride === true;
  applyAudioSettings();
  publishProtectionStatus(true);
  publishAutoGenreStatus(true);
}

// EN: Builds a symmetric soft ceiling: linear below -1.1 dBFS and smoothly compressed near full scale.
//     The output remains below full scale for input samples in [-1, 1]; the main compressor does most limiting work.
// RU: Создаёт симметричный мягкий потолок: линейный ниже -1,1 dBFS и плавно сжимающий сигнал возле полной шкалы.
//     Для входных сэмплов [-1, 1] выход ниже полной шкалы; основную работу выполняет компрессорный лимитер.
// UK: Створює симетричну м'яку стелю: лінійну нижче -1,1 dBFS і плавно стискає сигнал біля повної шкали.
//     Для вхідних семплів [-1, 1] вихід нижче повної шкали; основну роботу виконує компресорний лімітер.
function createSafetyCeilingCurve(sampleCount = 32768) {
  const curve = new Float32Array(sampleCount);
  const knee = 0.88;
  const softRange = 0.10;
  for (let index = 0; index < sampleCount; index += 1) {
    const x = (index * 2) / (sampleCount - 1) - 1;
    const magnitude = Math.abs(x);
    const shaped = magnitude <= knee
      ? magnitude
      : knee + softRange * Math.tanh((magnitude - knee) / softRange);
    curve[index] = Math.sign(x) * Math.min(0.985, shaped);
  }
  return curve;
}

// EN: Routes the analyser through compressor + soft ceiling while protection is on; disabling the limiter deliberately bypasses both.
// RU: При включённой защите направляет сигнал через компрессор и мягкий потолок; при выключении лимитера оба узла обходятся намеренно.
// UK: Коли захист увімкнено, спрямовує сигнал через компресор і м'яку стелю; вимкнення лімітера навмисно обходить обидва вузли.
function applyLimiterRouting() {
  if (!audioContext || !analyserNode || !limiter) return;
  // Disconnect previous output edges before reconnecting to prevent accidental parallel paths.
  try { analyserNode.disconnect(); } catch (_) {}
  try { limiter.disconnect(); } catch (_) {}
  if (safetyCeilingShaper) {
    try { safetyCeilingShaper.disconnect(); } catch (_) {}
  }

  if (!peakLimiterEnabled) {
    analyserNode.connect(audioContext.destination);
    return;
  }

  analyserNode.connect(limiter);
  if (safetyCeilingShaper) {
    limiter.connect(safetyCeilingShaper);
    safetyCeilingShaper.connect(audioContext.destination);
  } else {
    // Fallback if a browser does not provide WaveShaperNode: keep the compressor limiter active.
    limiter.connect(audioContext.destination);
  }
}

// EN: Estimates whether current gain/EQ settings could create excessive output peaks.
// RU: Оценивает риск чрезмерных пиков при текущей громкости и настройках EQ.
// UK: Оцінює ризик надмірних піків за поточної гучності та налаштувань EQ.
function isExcessiveGainRisk() {
  if (currentMuted || currentVolume <= 0) return false;
  const automaticPreset = autoGenreEnabled ? getSelectedAutoGenreProfile() : null;
  // The master switches own power; a genre profile only changes risk when its effective recommendation adds EQ.
  const effectiveBassEnabled = bassBoostEnabled && (!automaticPreset || autoGenreBassManualOverride || automaticPreset.bassBoostEnabled);
  const effectiveBassDb = automaticPreset && !autoGenreBassManualOverride ? automaticPreset.bassBoostDb : bassBoostDb;
  const effectiveVoiceEnabled = voiceBoostEnabled && (!automaticPreset || autoGenreVoiceManualOverride || automaticPreset.voiceBoostEnabled);
  const effectiveVoiceDb = automaticPreset && !autoGenreVoiceManualOverride ? automaticPreset.voiceBoostDb : voiceBoostDb;
  const effectiveVolumeTrimDb = automaticPreset ? automaticPreset.volumeTrimDb : 0;
  const effectiveVolume = Math.min(6, currentVolume * Math.pow(10, effectiveVolumeTrimDb / 20));
  return effectiveVolume >= 5 ||
    (effectiveVolume >= 3 && effectiveBassEnabled && effectiveBassDb >= 3) ||
    (effectiveVolume >= 4 && effectiveVoiceEnabled && effectiveVoiceDb >= 5);
}

// EN: Publishes current limiter, peak, and high-gain status to the extension UI.
// RU: Передаёт интерфейсу состояние ограничителя, пиков и чрезмерного усиления.
// UK: Передає інтерфейсу стан обмежувача, піків і надмірного підсилення.
function publishProtectionStatus(force = false, peak = 0) {
  const active = Boolean(currentStream && analyserNode && timeDomainBuffer);
  const clipping = active && Date.now() < clippingHoldUntil;
  const highGain = isExcessiveGainRisk();
  const signature = `${active}:${peakLimiterEnabled}:${clipping}:${highGain}`;
  if (!force && signature === lastProtectionSignature) return;
  lastProtectionSignature = signature;
  chrome.runtime.sendMessage({
    type: 'AUDIO_PROTECTION_STATUS',
    target: 'popup',
    active,
    peakLimiterEnabled,
    clipping,
    highGain,
    peak: Number.isFinite(peak) ? Math.round(peak * 1000) / 1000 : 0
  }).catch(() => {});
}

// EN: Chooses a bounded sampling interval for peak monitoring.
// RU: Выбирает ограниченный интервал измерения звуковых пиков.
// UK: Вибирає обмежений інтервал вимірювання звукових піків.
function getProtectionSampleIntervalMs() {
  // Read overlapping time-domain windows so short peaks are less likely to fall
  // between polls. The interval adapts to the active context's sample rate and
  // is bounded to avoid excessive background work on unusual audio devices.
  if (!audioContext || !analyserNode || !Number.isFinite(audioContext.sampleRate) || audioContext.sampleRate <= 0) return 40;
  const windowDurationMs = (analyserNode.fftSize / audioContext.sampleRate) * 1000;
  return Math.max(10, Math.min(100, Math.floor(windowDurationMs * 0.75)));
}

// EN: Starts monitoring the active output signal for clipping-risk peaks.
// RU: Запускает наблюдение за выходным сигналом для обнаружения опасных пиков.
// UK: Запускає спостереження за вихідним сигналом для виявлення небезпечних піків.
function startProtectionMonitor() {
  if (protectionTimer) clearInterval(protectionTimer);
  protectionTimer = setInterval(() => {
    if (!currentStream || !analyserNode || !timeDomainBuffer) {
      publishProtectionStatus();
      return;
    }
    let peak = 0;
    try {
      analyserNode.getFloatTimeDomainData(timeDomainBuffer);
      for (let index = 0; index < timeDomainBuffer.length; index += 1) {
        peak = Math.max(peak, Math.abs(timeDomainBuffer[index]));
      }
    } catch (error) {
      console.warn('Could not read audio peak level:', errorMessage(error));
    }
    // Treat samples close to full scale as a warning; keep the indicator visible
    // briefly so short transients are not missed by the user.
    if (peak >= 0.985) clippingHoldUntil = Date.now() + 1200;
    publishProtectionStatus(false, peak);
  }, getProtectionSampleIntervalMs());
}

// EN: Apply the selected global/site level, adaptive genre dB values, master switches and protection settings to Web Audio.
// RU: Применяет к Web Audio общую/сайт-громкость, адаптивные значения жанра, главные переключатели и защиту.
// UK: Застосовує до Web Audio загальну/сайт-гучність, адаптивні значення жанру, головні перемикачі та захист.
function applyAudioSettings() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const automaticPreset = autoGenreEnabled ? getSelectedAutoGenreProfile() : null;
  const effectiveBassEnabled = bassBoostEnabled;
  const effectiveBassDb = automaticPreset && !autoGenreBassManualOverride ? automaticPreset.bassBoostDb : bassBoostDb;
  const effectiveVoiceEnabled = voiceBoostEnabled;
  const effectiveVoiceDb = automaticPreset && !autoGenreVoiceManualOverride ? automaticPreset.voiceBoostDb : voiceBoostDb;
  const effectiveVolumeTrimDb = automaticPreset ? automaticPreset.volumeTrimDb : 0;
  const effectiveOutputVolume = currentMuted ? 0 : Math.min(6, currentVolume * Math.pow(10, effectiveVolumeTrimDb / 20));
  if (compressor) {
    // Night mode narrows the dynamic range gently so quiet speech is less masked by peaks.
    compressor.threshold.setTargetAtTime(nightModeEnabled ? -24 : -12, now, 0.06);
    compressor.knee.setTargetAtTime(nightModeEnabled ? 12 : 12, now, 0.06);
    compressor.ratio.setTargetAtTime(nightModeEnabled ? 3.5 : 2.2, now, 0.06);
    compressor.attack.setTargetAtTime(nightModeEnabled ? 0.008 : 0.012, now, 0.06);
    compressor.release.setTargetAtTime(nightModeEnabled ? 0.30 : 0.25, now, 0.06);
  }
  if (nightMakeupGain) {
    nightMakeupGain.gain.setTargetAtTime(nightModeEnabled ? 1.188502 : 1, now, 0.10); // +1.5 dB in night mode
  }
  if (eqHeadroomGain) {
    // Conservative level matching: reduce only a fraction of combined EQ boost,
    // capped at 4 dB, so boosted bands keep headroom without a large loudness drop.
    const bassCompDb = effectiveBassEnabled ? effectiveBassDb * 0.25 : 0;
    const voiceCompDb = effectiveVoiceEnabled ? effectiveVoiceDb * 0.15 : 0;
    const compensationDb = Math.min(4, bassCompDb + voiceCompDb);
    const compensationGain = Math.pow(10, -compensationDb / 20);
    eqHeadroomGain.gain.setTargetAtTime(compensationGain, now, 0.08);
  }
  if (gainNode) {
    gainNode.gain.setTargetAtTime(effectiveOutputVolume, now, automaticPreset ? 0.18 : 0.025);
  }
  if (bassBoostFilter) {
    bassBoostFilter.gain.setTargetAtTime(effectiveBassEnabled ? effectiveBassDb : 0, now, 0.08);
  }
  if (voiceBodyFilter) {
    // Keep the lower-mid reinforcement subtle to preserve natural timbre.
    voiceBodyFilter.gain.setTargetAtTime(effectiveVoiceEnabled ? effectiveVoiceDb * 0.35 : 0, now, 0.08);
  }
  if (voicePresenceFilter) {
    voicePresenceFilter.gain.setTargetAtTime(effectiveVoiceEnabled ? effectiveVoiceDb : 0, now, 0.08);
  }
}

// EN: Persists genre-analysis mode and resets individual EQ overrides to AUTO.
// RU: Сохраняет режим определения жанра и возвращает индивидуальные регуляторы EQ в AUTO.
// UK: Зберігає режим визначення жанру та повертає індивідуальні регулятори EQ в AUTO.
function setAutoGenreEnabled(enabled) {
  const next = enabled === true;
  if (autoGenreEnabled === next) {
    if (next && currentStream && analyserNode && !autoGenreTimer) startAutoGenreLoop();
    if (!next && autoGenreTimer) stopAutoGenreLoop();
    publishAutoGenreStatus(true);
    return;
  }
  autoGenreEnabled = next;
  // A deliberate global AUTO-enable/disable change resets per-effect mode to AUTO.
  autoGenreBassManualOverride = false;
  autoGenreVoiceManualOverride = false;
  autoGenreSamples = [];
  autoGenreLastCandidate = null;
  autoGenreCandidateStreak = 0;
  if (!next) {
    stopAutoGenreLoop();
    currentAutoGenre = null;
    currentAutoGenreConfidence = 0;
    currentAutoGenreSource = null;
    currentAutoGenreProfile = null;
    applyAudioSettings(); // Return immediately to the user's saved/manual EQ values.
    publishAutoGenreStatus(true);
    return;
  }
  currentAutoGenre = null;
  currentAutoGenreConfidence = 0;
  currentAutoGenreSource = null;
  currentAutoGenreProfile = null;
  if (currentStream && analyserNode) startAutoGenreLoop();
  applyAudioSettings();
  publishAutoGenreStatus(true);
}

// EN: Starts periodic audio analysis while capture and auto genre mode are active.
// RU: Запускает периодический анализ звука, пока активны захват и автоопределение жанра.
// UK: Запускає періодичний аналіз звуку, доки активні захоплення й автовизначення жанру.
function startAutoGenreLoop() {
  if (autoGenreTimer) clearInterval(autoGenreTimer);
  if (!autoGenreEnabled || !currentStream || !analyserNode) return;
  autoGenreTimer = setInterval(runAutoGenreAnalysis, 1000);
  runAutoGenreAnalysis();
}

// EN: Stops genre-analysis polling and releases its timer.
// RU: Останавливает периодический анализ жанра и освобождает таймер.
// UK: Зупиняє періодичний аналіз жанру та звільняє таймер.
function stopAutoGenreLoop() {
  if (autoGenreTimer) clearInterval(autoGenreTimer);
  autoGenreTimer = null;
}

// EN: Reset genre samples/profile when track identity changes; preserve the user's independent AUTO/MANUAL choices.
// RU: Сбрасывает анализ и профиль при смене трека, сохраняя независимый выбор AUTO/РУЧНОЙ пользователя.
// UK: Скидає аналіз і профіль при зміні треку, зберігаючи незалежний вибір AUTO/РУЧНИЙ користувача.
function updateAutoGenreSourceMetadata(title, trackId) {
  const nextTitle = String(title || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  const nextTrackId = typeof trackId === 'string' && trackId.trim() ? trackId.trim().slice(0, 280) : currentSourceTrackId;
  const trackChanged = Boolean(nextTrackId && nextTrackId !== currentSourceTrackId &&
    (currentSourceTrackId || currentSourceTitle || currentAutoGenre || currentAutoGenreSource));
  const titleChanged = nextTitle !== currentSourceTitle;
  if (!trackChanged && !titleChanged) return;

  currentSourceTitle = nextTitle;
  if (nextTrackId) currentSourceTrackId = nextTrackId;
  if (trackChanged) {
    // Do not carry analysis or a manual override from the previous video/track.
    // Each track gets a fresh genre decision and its own adaptive tuning.
    autoGenreSamples = [];
    autoGenreLastCandidate = null;
    autoGenreCandidateStreak = 0;
    currentAutoGenre = null;
    currentAutoGenreConfidence = 0;
    currentAutoGenreSource = null;
    currentAutoGenreProfile = null;
    // A track change resets analysis, not the user's selected AUTO/MANUAL modes.
    applyAudioSettings();
  } else if (titleChanged) {
    autoGenreSamples = [];
    autoGenreLastCandidate = null;
    autoGenreCandidateStreak = 0;
    const titleResult = classifyGenreFromTitle(currentSourceTitle);
    if (!titleResult && currentAutoGenreSource === 'title') {
      currentAutoGenre = null;
      currentAutoGenreConfidence = 0;
      currentAutoGenreSource = null;
      currentAutoGenreProfile = null;
      applyAudioSettings();
    }
  }
  if (autoGenreEnabled && currentStream) runAutoGenreAnalysis();
  else publishAutoGenreStatus(true);
}

// EN: Normalizes text for reliable genre matching across case and punctuation.
// RU: Нормализует текст для сопоставления жанров независимо от регистра и пунктуации.
// UK: Нормалізує текст для зіставлення жанрів незалежно від регістру та пунктуації.
function normalizeGenreText(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// EN: Match bounded, normalized aliases and prefer the most specific known subgenre; ambiguous titles fall back to audio.
// RU: Сопоставляет нормализованные слова/фразы и выбирает самый конкретный поджанр; неоднозначные названия передаются анализу звука.
// UK: Зіставляє нормалізовані слова/фрази й обирає найконкретніший піджанр; неоднозначні назви передаються аналізу звуку.
function classifyGenreFromTitle(title) {
  const rawTitle = String(title || '');
  const normalized = normalizeGenreText(rawTitle);
  if (!normalized) return null;
  const titleTokens = normalized.split(' ');
  const padded = ` ${normalized} `;
  const bestByGenre = new Map();
  for (const matcher of AUTO_GENRE_MATCHERS) {
    if (!padded.includes(` ${matcher.alias} `)) continue;
    // Preserve the meaning of literal ampersands: "R&B" must not match "R B".
    // Other catalog spellings such as "rock and roll" remain available without "&".
    if (matcher.sourceAlias.includes('&')) {
      const ampersandPair = matcher.sourceAlias.match(/([a-z]+)[ \\t]*&[ \\t]*([a-z]+)/i);
      if (ampersandPair) {
        const leftWord = ampersandPair[1].toLowerCase();
        const rightWord = ampersandPair[2].toLowerCase();
        const hasLiteralAmpersandPair = Array.from(
          rawTitle.matchAll(/([a-z]+)[ \\t]*&[ \\t]*([a-z]+)/gi)
        ).some((pair) => pair[1].toLowerCase() === leftWord && pair[2].toLowerCase() === rightWord);
        if (!hasLiteralAmpersandPair) continue;
      }
    }
    if (matcher.tokenCount === 1 && AUTO_GENRE_AMBIGUOUS_WORDS.has(matcher.alias) && normalized !== matcher.alias) {
      const index = titleTokens.indexOf(matcher.alias);
      const previous = index > 0 ? titleTokens[index - 1] : '';
      const next = index >= 0 ? titleTokens[index + 1] || '' : '';
      if (!AUTO_GENRE_CONTEXT_WORDS.has(previous) && !AUTO_GENRE_CONTEXT_WORDS.has(next)) continue;
    }
    const previous = bestByGenre.get(matcher.item.id);
    if (!previous || matcher.score > previous.score) bestByGenre.set(matcher.item.id, matcher);
  }
  const candidates = Array.from(bestByGenre.values()).sort((a, b) => b.score - a.score);
  if (!candidates.length) return null;
  if (candidates.length > 1 && candidates[0].score === candidates[1].score) return null;
  const best = candidates[0];
  const isExactGenreTitle = normalized === best.alias;
  const contextualGeneric = best.tokenCount === 1 && AUTO_GENRE_AMBIGUOUS_WORDS.has(best.alias);
  const confidence = best.tokenCount > 1
    ? Math.min(0.97, 0.86 + Math.min(20, best.score - 20) * 0.004)
    : (contextualGeneric && !isExactGenreTitle ? 0.80 : (isExactGenreTitle ? 0.84 : 0.88));
  return { genre: best.item.id, confidence, source: 'title' };
}

// EN: Measures coarse frequency-band energies used by the heuristic genre classifier.
// RU: Измеряет энергию широких частотных диапазонов для эвристического определения жанра.
// UK: Вимірює енергію широких частотних діапазонів для евристичного визначення жанру.
function readGenreAudioFeatures() {
  if (!audioContext || !genreAnalyserNode || !genreFrequencyBuffer || !genreTimeDomainBuffer) return null;
  genreAnalyserNode.getByteFrequencyData(genreFrequencyBuffer);
  genreAnalyserNode.getFloatTimeDomainData(genreTimeDomainBuffer);
  let squares = 0;
  for (let i = 0; i < genreTimeDomainBuffer.length; i += 1) squares += genreTimeDomainBuffer[i] * genreTimeDomainBuffer[i];
  const rms = Math.sqrt(squares / Math.max(1, genreTimeDomainBuffer.length));
  const rmsDb = 20 * Math.log10(Math.max(rms, 0.00001));
  const binWidth = audioContext.sampleRate / genreAnalyserNode.fftSize;
  const ranges = {
    sub: [30, 80], bass: [80, 250], lowMid: [250, 500], mid: [500, 2000], highMid: [2000, 6000], treble: [6000, 12000]
  };
  const energies = {};
  for (const [name, [lowHz, highHz]] of Object.entries(ranges)) {
    const start = Math.max(0, Math.floor(lowHz / binWidth));
    const end = Math.min(genreFrequencyBuffer.length, Math.ceil(highHz / binWidth));
    let sum = 0;
    let count = 0;
    for (let i = start; i < end; i += 1) { sum += genreFrequencyBuffer[i]; count += 1; }
    energies[name] = count ? sum / count : 0;
  }
  const total = Object.values(energies).reduce((sum, value) => sum + value, 0);
  if (total < 1) return { ...energies, total, bassShare: 0, midShare: 0, highShare: 0, rmsDb };
  return {
    ...energies,
    total,
    bassShare: (energies.sub + energies.bass) / total,
    midShare: (energies.lowMid + energies.mid) / total,
    highShare: (energies.highMid + energies.treble) / total,
    rmsDb
  };
}

// EN: Audio-only classification is heuristic, requires multiple windows and returns broad sound families, not guaranteed genre labels.
// RU: Классификация только по аудио эвристическая, использует несколько окон и определяет широкое звучание, а не гарантированный жанр.
// UK: Класифікація лише за аудіо евристична, використовує кілька вікон і визначає широкий тип звучання, а не гарантований жанр.
function classifyGenreFromAudio(samples) {
  if (samples.length < 6) return null;
  const average = (key) => samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
  const meanTotal = average('total');
  const meanRmsDb = average('rmsDb');
  if (meanTotal < 8 || meanRmsDb < -58) return null; // Wait while muted, silent, or close to the capture noise floor.
  const bassShare = average('bassShare');
  const midShare = average('midShare');
  const highShare = average('highShare');
  const bassPulse = samples.slice(1).reduce((sum, sample, index) => sum + Math.abs(sample.bass - samples[index].bass), 0) / Math.max(1, samples.length - 1);
  const pulseRatio = bassPulse / Math.max(1, average('bass'));

  // A spectrum cannot reliably distinguish every genre. When track metadata does not
  // name a style, choose only a broad sound-profile family and keep the EQ conservative.
  if (bassShare > 0.37 && highShare > 0.20 && pulseRatio > 0.075) {
    return { genre: 'audioBassHeavy', confidence: Math.min(0.76, 0.60 + bassShare * 0.18 + pulseRatio * 0.12), source: 'audio' };
  }
  if (bassShare > 0.27 && highShare > 0.27 && pulseRatio > 0.055) {
    return { genre: 'audioElectronic', confidence: Math.min(0.70, 0.57 + bassShare * 0.12 + pulseRatio * 0.12), source: 'audio' };
  }
  if (pulseRatio < 0.04 && bassShare < 0.30 && highShare < 0.34) {
    return { genre: 'audioAtmospheric', confidence: Math.min(0.68, 0.60 + Math.max(0, (0.04 - pulseRatio) * 1.5)), source: 'audio' };
  }
  if (midShare > 0.32 && bassShare < 0.36 && highShare > 0.18) {
    return { genre: 'audioVocal', confidence: 0.60, source: 'audio' };
  }
  // The neutral fallback is intentionally allowed after the multi-window streak; it avoids
  // leaving the UI in 'detecting' forever when the spectrum does not fit a specific family.
  return { genre: 'audioOther', confidence: 0.60, source: 'audio' };
}

// EN: Make small per-track corrections from raw spectrum/RMS data while keeping each genre family within safe bounds.
// RU: Незначительно корректирует профиль под конкретный трек по исходному спектру/RMS, удерживая значения в заданных пределах.
// UK: Незначно коригує профіль під конкретний трек за вихідним спектром/RMS, утримуючи значення в заданих межах.
function buildAdaptiveGenreProfile(genre) {
  const base = AUTO_GENRE_PROFILES[genre];
  if (!base) return null;
  const profile = { ...base };
  if (autoGenreSamples.length < 6) return profile;
  const average = (key) => autoGenreSamples.reduce((sum, sample) => sum + (Number.isFinite(sample[key]) ? sample[key] : 0), 0) / autoGenreSamples.length;
  const bassShare = average('bassShare');
  const midShare = average('midShare');
  const highShare = average('highShare');
  const rmsDb = average('rmsDb');

  // Track-specific correction is deliberately small and based on raw-source
  // analysis. It refines, rather than replaces, the broad genre family profile.
  if (bassShare >= 0.44) profile.bassBoostDb -= 2;
  else if (bassShare >= 0.38) profile.bassBoostDb -= 1;
  else if (bassShare < 0.22) profile.bassBoostDb += 1;
  profile.bassBoostDb = Math.max(0, Math.min(12, Math.round(profile.bassBoostDb)));
  profile.bassBoostEnabled = profile.bassBoostEnabled && profile.bassBoostDb > 0;

  if (profile.voiceBoostEnabled) {
    if (midShare > 0.41 && highShare > 0.29) profile.voiceBoostDb -= 1;
    else if (midShare < 0.22 && ['hiphop', 'trap', 'drill', 'grime', 'pop', 'rnb', 'audioVocal'].includes(genre)) profile.voiceBoostDb += 1;
  }
  profile.voiceBoostDb = Math.max(0, Math.min(8, Math.round(profile.voiceBoostDb)));
  profile.voiceBoostEnabled = profile.voiceBoostEnabled && profile.voiceBoostDb > 0;

  if (rmsDb > -5.5) profile.volumeTrimDb -= 0.8;
  else if (rmsDb > -8) profile.volumeTrimDb -= 0.4;
  else if (rmsDb < -20) profile.volumeTrimDb += 0.6;
  else if (rmsDb < -15) profile.volumeTrimDb += 0.3;
  profile.volumeTrimDb = Math.max(-2, Math.min(1, Math.round(profile.volumeTrimDb * 4) / 4));
  return profile;
}

// EN: Resolves a stable genre result to the corresponding EQ and loudness profile.
// RU: Преобразует устойчиво определённый жанр в профиль EQ и поправки громкости.
// UK: Перетворює стабільно визначений жанр на профіль EQ і поправки гучності.
function getSelectedAutoGenreProfile() {
  if (!currentAutoGenre) return null;
  return currentAutoGenreProfile || AUTO_GENRE_PROFILES[currentAutoGenre] || null;
}

// EN: Applies the accepted genre profile and publishes its effective values.
// RU: Применяет подтверждённый профиль жанра и публикует реально используемые значения.
// UK: Застосовує підтверджений профіль жанру та публікує фактично використані значення.
function setDetectedAutoGenre(result) {
  if (!result || !AUTO_GENRE_PROFILES[result.genre]) return;
  const nextProfile = result.profile || buildAdaptiveGenreProfile(result.genre);
  const profileChanged = JSON.stringify(currentAutoGenreProfile) !== JSON.stringify(nextProfile);
  const changed = currentAutoGenre !== result.genre || currentAutoGenreSource !== result.source || profileChanged;
  currentAutoGenre = result.genre;
  currentAutoGenreConfidence = result.confidence;
  currentAutoGenreSource = result.source;
  currentAutoGenreProfile = nextProfile ? { ...nextProfile } : { ...AUTO_GENRE_PROFILES[result.genre] };
  if (changed) applyAudioSettings();
  publishAutoGenreStatus(changed);
}

// EN: Combines track metadata and recent audio features to update the genre estimate.
// RU: Объединяет метаданные трека и недавние характеристики звука для оценки жанра.
// UK: Поєднує метадані треку й недавні характеристики звуку для оцінювання жанру.
function runAutoGenreAnalysis() {
  if (!autoGenreEnabled || !currentStream || !analyserNode || !frequencyBuffer) {
    publishAutoGenreStatus();
    return;
  }
  try {
    const features = readGenreAudioFeatures();
    if (features) {
      autoGenreSamples.push(features);
      if (autoGenreSamples.length > 10) autoGenreSamples.shift();
    }

    const titleResult = classifyGenreFromTitle(currentSourceTitle);
    if (titleResult) {
      setDetectedAutoGenre({ ...titleResult, profile: buildAdaptiveGenreProfile(titleResult.genre) });
      return;
    }
    if (!features) return;
    const audioResult = classifyGenreFromAudio(autoGenreSamples);
    if (!audioResult) {
      autoGenreLastCandidate = null;
      autoGenreCandidateStreak = 0;
      // Do not jump between profiles in ambiguous passages; hold a previous confident choice.
      publishAutoGenreStatus();
      return;
    }
    if (audioResult.genre === autoGenreLastCandidate) autoGenreCandidateStreak += 1;
    else {
      autoGenreLastCandidate = audioResult.genre;
      autoGenreCandidateStreak = 1;
    }
    if (autoGenreCandidateStreak >= 3 && audioResult.confidence >= 0.60) setDetectedAutoGenre({ ...audioResult, profile: buildAdaptiveGenreProfile(audioResult.genre) });
    else publishAutoGenreStatus();
  } catch (error) {
    console.warn('Automatic genre analysis failed:', errorMessage(error));
  }
}

// EN: Send status to the service worker; it persists the status because storage may be unavailable in this context.
// RU: Передаёт статус фоновому процессу; именно он сохраняет состояние, поскольку storage может быть недоступен здесь.
// UK: Передає статус фоновому процесу; саме він зберігає стан, оскільки storage може бути недоступним у цьому контексті.
function publishAutoGenreStatus(force = false) {
  const active = Boolean(currentStream && analyserNode);
  const state = !autoGenreEnabled ? 'disabled' : (!active ? 'waiting-capture' : (currentAutoGenre ? 'detected' : 'detecting'));
  const selectedProfile = getSelectedAutoGenreProfile();
  const status = {
    type: 'AUTO_GENRE_STATUS',
    target: 'popup',
    enabled: autoGenreEnabled,
    active,
    genre: currentAutoGenre,
    confidence: currentAutoGenreConfidence,
    source: currentAutoGenreSource,
    trackId: currentSourceTrackId,
    trackTitle: currentSourceTitle,
    // Report the user's independent power toggles; report adaptive or manual dB
    // separately so popup cards never infer power-off from a genre profile.
    bassBoostEnabled: selectedProfile ? bassBoostEnabled : null,
    bassBoostDb: selectedProfile && !autoGenreBassManualOverride ? selectedProfile.bassBoostDb : (selectedProfile ? bassBoostDb : null),
    voiceBoostEnabled: selectedProfile ? voiceBoostEnabled : null,
    voiceBoostDb: selectedProfile && !autoGenreVoiceManualOverride ? selectedProfile.voiceBoostDb : (selectedProfile ? voiceBoostDb : null),
    bassManualOverride: autoGenreBassManualOverride,
    voiceManualOverride: autoGenreVoiceManualOverride,
    volumeTrimDb: selectedProfile ? selectedProfile.volumeTrimDb : null,
    state,
    updatedAt: Date.now()
  };
  const signature = `${status.enabled}:${status.active}:${status.trackId || ''}:${status.trackTitle || ''}:${status.genre || ''}:${status.source || ''}:${status.state}:${Math.round(status.confidence * 100)}:${status.bassBoostEnabled}:${status.bassBoostDb}:${status.voiceBoostEnabled}:${status.voiceBoostDb}:${status.volumeTrimDb}:${status.bassManualOverride}:${status.voiceManualOverride}`;
  if (!force && signature === lastAutoGenreStatusSignature) return;
  lastAutoGenreStatusSignature = signature;
  // The offscreen audio document may not expose chrome.storage in every Edge
  // build/context. Send status to the service worker, which owns persistence.
  // Runtime messaging also broadcasts the status to an open popup.
  chrome.runtime.sendMessage(status).catch(() => {
    // The popup may be closed; the background service worker persists the latest status.
  });
}

// EN: Returns a useful, safe text representation of an unknown error value.
// RU: Преобразует ошибку в понятное и безопасное текстовое сообщение.
// UK: Перетворює помилку на зрозуміле й безпечне текстове повідомлення.
function errorMessage(error) {
  if (error && typeof error.message === 'string' && error.message.trim()) {
    const name = typeof error.name === 'string' ? error.name : '';
    return name && name !== 'Error' ? `${name}: ${error.message}` : error.message;
  }
  return String(error || 'Неизвестная ошибка');
}


// EN: Sample compact logarithmic bands only while visualization is enabled to limit messaging/CPU work.
// RU: Считывает логарифмические полосы только при включённой визуализации, сокращая сообщения и нагрузку CPU.
// UK: Зчитує логарифмічні смуги лише за ввімкненої візуалізації, зменшуючи кількість повідомлень і навантаження CPU.
function startSpectrumLoop() {
  if (spectrumTimer) return;
  // Roughly 15 frames/s keeps extension messaging light; the popup animates locally at 60 FPS.
  spectrumTimer = setInterval(() => {
    if (!visualizerEnabled) return;
    const active = Boolean(currentStream && analyserNode && frequencyBuffer);
    let bins = [];
    if (active) {
      try {
        analyserNode.getByteFrequencyData(frequencyBuffer);
        bins = toLogarithmicBands(frequencyBuffer, audioContext.sampleRate, spectrumBandCount);
      } catch (error) {
        console.warn('Could not read frequency spectrum:', errorMessage(error));
      }
    }
    chrome.runtime.sendMessage({
      type: 'SPECTRUM_DATA',
      target: 'popup',
      active,
      bins
    }).catch(() => {
      // The popup may have closed between ticks; sampling is disabled by pagehide.
    });
  }, spectrumSampleIntervalMs);
}

// EN: Stops sending analyser spectrum samples to the popup.
// RU: Останавливает отправку спектральных данных анализатора в popup.
// UK: Зупиняє надсилання спектральних даних аналізатора до popup.
function stopSpectrumLoop() {
  if (spectrumTimer) {
    clearInterval(spectrumTimer);
    spectrumTimer = null;
  }
}

// EN: Converts FFT bins into log-spaced bands suitable for the visualizer.
// RU: Преобразует FFT-бинs в логарифмические полосы для визуализатора.
// UK: Перетворює FFT-біни на логарифмічні смуги для візуалізатора.
function toLogarithmicBands(data, sampleRate, bandCount) {
  const nyquist = sampleRate / 2;
  const minFrequency = 35;
  const maxFrequency = Math.max(minFrequency + 1, Math.min(17000, nyquist * 0.96));
  const binWidth = sampleRate / (data.length * 2);
  const bands = new Array(bandCount).fill(0);

  for (let band = 0; band < bandCount; band += 1) {
    const startFrequency = minFrequency * Math.pow(maxFrequency / minFrequency, band / bandCount);
    const endFrequency = minFrequency * Math.pow(maxFrequency / minFrequency, (band + 1) / bandCount);
    const start = Math.min(data.length - 1, Math.max(0, Math.floor(startFrequency / binWidth)));
    const end = Math.min(data.length, Math.max(start + 1, Math.ceil(endFrequency / binWidth)));
    let sum = 0;
    let peak = 0;
    let count = 0;
    for (let index = start; index < end; index += 1) {
      const value = data[index] / 255;
      sum += value;
      peak = Math.max(peak, value);
      count += 1;
    }
    // Average gives a stable band; a little peak weighting keeps transients visible.
    bands[band] = count ? Math.min(1, (sum / count) * 0.72 + peak * 0.28) : 0;
  }
  return bands;
}
