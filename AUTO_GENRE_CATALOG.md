# Полный каталог автоопределения жанров (`AUTO_GENRE_CATALOG`)

Каталог синхронизирован с `offscreen.js`. В нём 81 запись: 76 жанровых/поджанровых меток и 5 широких аудиопрофилей без алиасов.

## Профильные семейства EQ

| family | Bass | Voice | Volume Trim |
|---|---:|---:|---:|
| `hiphop` | +5 dB | +1 dB | −0.4 dB |
| `bassHeavy` | +6 dB | выкл | −1.2 dB |
| `pop` | +3 dB | +2 dB | −0.2 dB |
| `rock` | +3 dB | +2 dB | −0.4 dB |
| `electronic` | +4 dB | выкл | −0.6 dB |
| `atmosphere` | +2 dB | +1 dB | +0.3 dB |
| `jazz` | +2 dB | +2 dB | +0.2 dB |
| `vocal` | +2 dB | +3 dB | +0.1 dB |
| `acoustic` | +2 dB | +2 dB | +0.2 dB |
| `classical` | выкл | +1 dB | +0.4 dB |
| `world` | +3 dB | +2 dB | 0 dB |
| `neutral` | +2 dB | +1 dB | 0 dB |

## Каталог и алиасы

Для сопоставления названия нормализуются без учёта регистра, дефисов и пунктуации. Короткие неоднозначные слова (например, `house`, `rock`, `pop`) не срабатывают внутри обычного названия песни без музыкального контекста; точное название жанра распознаётся.

### 1. Hip-Hop / Rap и производные

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `hiphop` | `autoGenreHipHop` | `hiphop` | `hip hop`, `hip-hop`, `hiphop`, `rap`, `boom bap`, `рэп`, `хип хоп`, `хип-хоп`, `hip-hop music`, `hip hop beats`, `uk hip hop`, `хіп хоп`, `хіпхоп`, `український реп`, `український хіп-хоп`, `український хіпхоп` |
| `trap` | `autoGenreTrap` | `bassHeavy` | `trap music`, `trap mix`, `trap`, `трэп`, `трап`, `trap beats`, `trap playlist`, `треп музика`, `трап музика` |
| `drill` | `autoGenreDrill` | `bassHeavy` | `drill rap`, `uk drill`, `drill music`, `drill`, `дрилл`, `drill beats`, `drill playlist`, `дріл`, `дрілл`, `дрил` |
| `grime` | `autoGenreGrime` | `hiphop` | `grime music`, `grime`, `uk grime`, `uk grime music`, `ґрайм`, `грайм` |
| `phonk` | `autoGenrePhonk` | `bassHeavy` | `drift phonk`, `memphis phonk`, `cowbell phonk`, `phonk`, `фонк`, `фонк микс`, `phonk music`, `phonk playlist`, `phonk beats`, `фонк музика`, `фонк плейлист` |
| `tripHop` | `autoGenreTripHop` | `hiphop` | `trip hop`, `triphop` |

### 2. Wave / Lo-fi / атмосфера

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `wave` | `autoGenreWave` | `atmosphere` | `hardwave`, `chillwave`, `wave phonk`, `wave music`, `wave mix`, `wave`, `вейв`, `wave playlist`, `wave mix music`, `вейв музика`, `хардвейв`, `чилвейв` |
| `lofi` | `autoGenreLofi` | `atmosphere` | `lo fi hip hop`, `lo fi`, `lofi hip hop`, `lofi beats`, `lofi`, `лоу фай`, `лоуфай`, `lo-fi music`, `lo-fi beats`, `low fidelity music`, `лоуфай музыка`, `лоу-фай музика`, `лоуфай музика` |
| `ambient` | `autoGenreAmbient` | `atmosphere` | `dark ambient`, `ambient music`, `ambient`, `эмбиент`, `ambient soundtrack`, `ambient instrumental`, `ембієнт`, `атмосферна музика`, `атмосферная музыка`, `дарк эмбиент` |
| `newAge` | `autoGenreNewAge` | `atmosphere` | `new age music`, `new age`, `нью эйдж`, `релакс музыка`, `релакс музика`, `музыка нью эйдж`, `музика нью-ейдж` |
| `chillout` | `autoGenreChillout` | `atmosphere` | `chill out`, `chillout`, `chill mix`, `relaxing music`, `chill-out music`, `chillout music`, `чиллаут`, `чил-аут`, `чиллаут музика` |
| `vaporwave` | `autoGenreVaporwave` | `atmosphere` | `vaporwave`, `vapor wave`, `вейпорвейв`, `вейпорвейв музика` |

### 3. Pop

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `pop` | `autoGenrePop` | `pop` | `pop music`, `pop mix`, `pop song`, `pop`, `поп музыка`, `поп`, `pop playlist`, `pop hits`, `pop hits mix`, `city pop`, `synth-pop`, `electropop`, `поп-музика`, `поп-хиты`, `поп хіти` |
| `dancePop` | `autoGenreDancePop` | `pop` | `dance pop`, `dance-pop`, `dance-pop music`, `денс-поп` |
| `kpop` | `autoGenreKpop` | `pop` | `k pop`, `kpop`, `korean pop`, `кей поп`, `k-pop music`, `к-поп`, `корейская поп-музыка`, `корейський поп` |
| `jpop` | `autoGenreJpop` | `pop` | `j pop`, `jpop`, `japanese pop`, `j-pop music`, `джей-поп`, `японская поп-музыка`, `японський поп` |
| `indiePop` | `autoGenreIndiePop` | `pop` | `indie pop`, `indie pop music`, `інді-поп`, `инди-поп` |
| `hyperpop` | `autoGenreHyperpop` | `pop` | `hyperpop`, `хайперпоп`, `hyper-pop`, `hyperpop music`, `хайпер-поп`, `хайперпоп музика` |
| `disco` | `autoGenreDisco` | `pop` | `disco music`, `disco`, `диско`, `nu-disco`, `disco playlist`, `диско музыка`, `диско музика`, `ню-диско` |
| `animeMusic` | `autoGenreAnimeMusic` | `pop` | `anime music`, `anime soundtrack`, `anime opening`, `anime op`, `anime ost`, `anime song`, `anime songs`, `music from anime`, `музыка из аниме`, `музика з аніме`, `аниме опенинг`, `аніме опенінг` |

### 4. Rock / Metal

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `rock` | `autoGenreRock` | `rock` | `classic rock`, `rock music`, `rock mix`, `rock`, `рок музыка`, `рок`, `rock playlist`, `rock and roll`, `rock n roll`, `rock & roll`, `garage rock`, `post-punk`, `рок-музика`, `рок-н-ролл`, `рок-н-рол` |
| `altRock` | `autoGenreAltRock` | `rock` | `alternative rock`, `alt rock`, `альтернативный рок`, `alternative rock music`, `альт-рок`, `альтернативний рок` |
| `hardRock` | `autoGenreHardRock` | `rock` | `hard rock`, `хард рок`, `hard rock music` |
| `postRock` | `autoGenrePostRock` | `rock` | `post rock`, `post-rock`, `post-rock music`, `пост-рок` |
| `metal` | `autoGenreMetal` | `rock` | `heavy metal`, `death metal`, `black metal`, `metal music`, `metal`, `метал`, `металл`, `metal playlist`, `heavy metal music`, `metal music mix`, `метал-музика`, `металева музика` |
| `metalcore` | `autoGenreMetalcore` | `rock` | `metalcore`, `metal-core`, `metalcore music`, `металкор`, `металкор музика` |
| `punk` | `autoGenrePunk` | `rock` | `punk rock`, `punk`, `панк`, `punk music`, `punk playlist`, `post-hardcore`, `панк-рок` |
| `indie` | `autoGenreIndie` | `rock` | `indie rock`, `indie music`, `indie`, `indie music playlist`, `інді`, `інді-рок`, `инди-рок` |
| `grunge` | `autoGenreGrunge` | `rock` | `grunge`, `гранж`, `grunge rock`, `гранж-рок` |
| `emo` | `autoGenreEmo` | `rock` | `emo rock`, `emo`, `эмо`, `emo rock music`, `емо-рок` |
| `shoegaze` | `autoGenreShoegaze` | `rock` | `shoegaze`, `shoe gaze`, `shoegaze music`, `шугейз`, `шугейз музика` |

### 5. Jazz / Blues / Soul / Funk

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `jazz` | `autoGenreJazz` | `jazz` | `smooth jazz`, `jazz music`, `jazz`, `джаз`, `jazz playlist`, `jazz fusion`, `джазова музика`, `джаз музика`, `джаз-фьюжн` |
| `blues` | `autoGenreBlues` | `vocal` | `blues rock`, `blues music`, `blues`, `блюз`, `delta blues`, `electric blues`, `blues playlist`, `блюзова музика`, `блюз музика` |
| `funk` | `autoGenreFunk` | `vocal` | `funk music`, `funk`, `фанк`, `funk playlist`, `фанк музика`, `фанкова музика` |
| `soul` | `autoGenreSoul` | `vocal` | `neo soul`, `soul music`, `soul`, `соул`, `soul music playlist`, `нео-соул`, `соул музика` |
| `rnb` | `autoGenreRnb` | `vocal` | `rhythm and blues`, `r and b`, `r b`, `rnb`, `r&b`, `r&b music`, `r and b music`, `contemporary r&b`, `alternative r&b`, `uk r&b`, `ритм-н-блюз`, `ритм энд блюз`, `ритм-енд-блюз` |
| `gospel` | `autoGenreGospel` | `vocal` | `gospel music`, `gospel`, `госпел`, `gospel choir`, `gospel music playlist`, `євангельська музика`, `госпел музика` |

### 6. Country / Folk / Acoustic

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `country` | `autoGenreCountry` | `acoustic` | `country music`, `country`, `кантри`, `country playlist`, `alt-country`, `alternative country`, `country folk`, `country rock`, `кантрі музика`, `кантри музыка` |
| `folk` | `autoGenreFolk` | `acoustic` | `folk music`, `folk`, `фолк`, `folk playlist`, `indie folk`, `современный фолк`, `сучасний фолк` |
| `bluegrass` | `autoGenreBluegrass` | `acoustic` | `bluegrass`, `bluegrass music`, `блуграс`, `блюграсс` |
| `acoustic` | `autoGenreAcoustic` | `acoustic` | `acoustic music`, `acoustic guitar`, `acoustic`, `acoustic playlist`, `acoustic guitar music`, `акустична музика`, `акустическая музыка` |

### 7. Classical / Orchestral / Soundtrack

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `classical` | `autoGenreClassical` | `classical` | `classical music`, `classic music`, `classical`, `классическая музыка`, `классика`, `classical piano`, `classical orchestra`, `класична музика`, `класика музика` |
| `orchestral` | `autoGenreOrchestral` | `classical` | `orchestral music`, `orchestra`, `orchestral`, `orchestral soundtrack`, `orchestral score`, `оркестрова музика`, `оркестровая музыка` |
| `soundtrack` | `autoGenreSoundtrack` | `classical` | `film soundtrack`, `movie soundtrack`, `original soundtrack`, `soundtrack`, `ost`, `саундтрек`, `film score`, `movie score`, `original score`, `motion picture soundtrack`, `ost music`, `музыка из фильма`, `музика з фільму`, `саундтрек до фільму`, `саундтрек к фильму` |
| `gameMusic` | `autoGenreGameMusic` | `classical` | `video game music`, `game soundtrack`, `gaming soundtrack`, `video game ost`, `game ost`, `game music soundtrack`, `игровая музыка`, `музика з гри`, `ігрова музика`, `музыка из игры` |
| `opera` | `autoGenreOpera` | `classical` | `opera music`, `opera`, `опера`, `оперная музыка`, `оперна музика` |

### 8. Electronic

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `electronic` | `autoGenreElectronic` | `electronic` | `electronic music`, `electronica`, `электронная музыка`, `электроника`, `edm`, `edm music`, `edm mix`, `electronic dance music`, `electronic music playlist`, `електронна музика` |
| `house` | `autoGenreHouse` | `electronic` | `house music`, `house mix`, `house`, `house playlist`, `house beats`, `bass house`, `tech house`, `electro house`, `future house`, `afro house`, `хавс музика`, `хаус музика` |
| `deepHouse` | `autoGenreDeepHouse` | `electronic` | `deep house`, `deep-house`, `deep house music`, `дип-хаус` |
| `progressiveHouse` | `autoGenreProgressiveHouse` | `electronic` | `progressive house`, `prog house`, `progressive house music`, `прогрессив-хаус`, `прогресив-хаус` |
| `techno` | `autoGenreTechno` | `electronic` | `techno music`, `techno`, `техно`, `melodic techno`, `minimal techno`, `industrial techno`, `techno playlist`, `техно музыка`, `техно музика`, `мелодік техно`, `мелодик техно` |
| `trance` | `autoGenreTrance` | `electronic` | `psytrance`, `psy trance`, `uplifting trance`, `trance music`, `trance`, `транс`, `psy-trance music`, `goa trance`, `uplifting trance music`, `транс музика`, `транс музыка` |
| `dubstep` | `autoGenreDubstep` | `electronic` | `dubstep`, `дабстеп`, `melodic dubstep`, `brostep`, `dubstep music`, `дабстеп музика` |
| `drumBass` | `autoGenreDrumBass` | `electronic` | `drum and bass`, `drum n bass`, `drum bass`, `dnb`, `d and b`, `джангл днб`, `drum n bass music`, `dnb music`, `джангл-н-бейс`, `драм-н-бейс`, `драм-енд-бейс` |
| `jungle` | `autoGenreJungle` | `electronic` | `jungle music`, `jungle`, `jungle playlist`, `jungle dnb`, `джангл музика` |
| `breakbeat` | `autoGenreBreakbeat` | `electronic` | `breakbeat`, `break beat`, `breakbeat music`, `брейкбит музика` |
| `electro` | `autoGenreElectro` | `electronic` | `electro music`, `electro`, `electro music playlist`, `электро музыка`, `електро музика` |
| `hardstyle` | `autoGenreHardstyle` | `electronic` | `hardstyle`, `hard style`, `hardstyle music`, `хардстайл музика` |
| `synthwave` | `autoGenreSynthwave` | `electronic` | `synthwave`, `ретровейв`, `синтвейв`, `retro wave`, `retrowave`, `outrun music`, `ретро-вейв`, `ретровейв музыка`, `синтвейв музыка` |
| `garage` | `autoGenreGarage` | `electronic` | `uk garage`, `garage music`, `garage`, `ukg`, `uk garage music`, `garage music playlist`, `гараж музика` |

### 9. World / Latin / Reggae

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `reggae` | `autoGenreReggae` | `world` | `reggae`, `регги`, `roots reggae`, `dub reggae`, `reggae music`, `регги музыка`, `реггі музика` |
| `dancehall` | `autoGenreDancehall` | `world` | `dancehall`, `dance hall`, `денсхолл`, `dancehall music`, `денс-холл`, `денсхол музика` |
| `ska` | `autoGenreSka` | `world` | `ska`, `ска`, `ska punk`, `ska music`, `ска-панк`, `ска музика` |
| `reggaeton` | `autoGenreReggaeton` | `world` | `reggaeton`, `реггетон`, `reggaeton music`, `реггетон музыка`, `регетон музика` |
| `salsa` | `autoGenreSalsa` | `world` | `salsa music`, `salsa`, `сальса`, `salsa music playlist`, `сальса музика` |
| `bachata` | `autoGenreBachata` | `world` | `bachata`, `бачата`, `bachata music`, `бачата музика` |
| `cumbia` | `autoGenreCumbia` | `world` | `cumbia`, `кумбия`, `cumbia music`, `кумбия музыка`, `кумбія музика` |
| `afrobeats` | `autoGenreAfrobeats` | `world` | `afrobeats`, `afro beats`, `afrobeat`, `афробит`, `afrobeat music`, `afrobeats music`, `afrobeats playlist`, `афробитс`, `афробітс`, `афробіт музика` |
| `amapiano` | `autoGenreAmapiano` | `world` | `amapiano`, `amapiano music`, `amapiano mix` |
| `latin` | `autoGenreLatin` | `world` | `latin music`, `latin pop`, `latin mix`, `латино`, `latin playlist`, `latin dance music`, `латино музика`, `латино музыка`, `латинська музика` |
| `bossaNova` | `autoGenreBossaNova` | `world` | `bossa nova`, `bossanova`, `bossa nova music`, `босанова`, `боса-нова` |
| `samba` | `autoGenreSamba` | `world` | `samba`, `самба`, `samba music`, `самба музика` |
| `tango` | `autoGenreTango` | `world` | `tango`, `танго`, `tango music`, `танго музыка`, `танго музика` |
| `flamenco` | `autoGenreFlamenco` | `world` | `flamenco`, `фламенко`, `flamenco music`, `фламенко музика` |
| `bollywood` | `autoGenreBollywood` | `world` | `bollywood music`, `bollywood`, `bollywood songs`, `bollywood soundtrack`, `болливудская музыка`, `боллівудська музика` |

### 10. Experimental

| id | label | family | Алиасы для сопоставления |
|---|---|---|---|
| `experimental` | `autoGenreExperimental` | `neutral` | `experimental music`, `experimental`, `avant garde`, `avant-garde`, `experimental electronica`, `experimental hip hop`, `avant-garde music`, `авангардная музыка`, `авангардна музика` |

### 11. Аудиопрофили (только по спектру)

Эти записи имеют `aliases: []` и не определяются по словам в названии. Для аудиоанализа нужно не менее 6 измерений; беззвучный/очень тихий сигнал (средний RMS ниже −58 dB или слишком низкое значение спектра) оставляется без классификации. Кандидат применяется после 3 последовательных совпадений при confidence ≥ 0.60.

| id | label | family | Условие срабатывания |
|---|---|---|---|
| `audioBassHeavy` | `autoGenreAudioBassHeavy` | `bassHeavy` | bassShare > 0.37, highShare > 0.20, pulseRatio > 0.075 |
| `audioElectronic` | `autoGenreAudioElectronic` | `electronic` | bassShare > 0.27, highShare > 0.27, pulseRatio > 0.055 |
| `audioAtmospheric` | `autoGenreAudioAtmospheric` | `atmosphere` | pulseRatio < 0.04, bassShare < 0.30, highShare < 0.34 |
| `audioVocal` | `autoGenreAudioVocal` | `vocal` | midShare > 0.32, bassShare < 0.36, highShare > 0.18 |
| `audioOther` | `autoGenreAudioOther` | `neutral` | резервный профиль, если другие эвристики не подошли |

## Примечания по точности

- Автоопределение по названию распознаёт только слова, присутствующие в заголовке; это не метаданные жанра от YouTube/Spotify и не модель распознавания музыки.
- По одному спектру нельзя надёжно определить точный поджанр, поэтому аудиоанализ выбирает только широкую EQ-семью.
- Профили EQ сохранены консервативными; адаптация под конкретный трек ограничена диапазонами в `buildAdaptiveGenreProfile`.

## Изменения в этой версии

- Содержимое каталога и `offscreen.js` синхронизировано с архивом `Volume_Controller_Pro_4.7.91_optimized.zip`.
- Расширены английские варианты написания, жанровые уточнения и русско-украинские алиасы для существующих 76 жанровых меток.
- Добавлена защита от ложных совпадений одиночных общих слов внутри обычных названий песен/исполнителей.
- Ранжирование отдаёт приоритет конкретному поджанру (`deep house`) выше общих словосочетаний (`house mix`, `pop playlist`).
- Исправлен нижний порог confidence у `audioAtmospheric` и добавлены состояния EQ в сигнатуру статуса.
