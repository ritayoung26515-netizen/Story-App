import type {
  RelationshipEdge,
  StoryProject,
  SupportingCharacter,
} from '../types/story';

export const LENGYE_TWELVE_BROTHERS_PRESET: SupportingCharacter[] = [
  {
    id: 'sup_lengye_01',
    name: '冷夜梟',
    titleOrRank: '大哥・冷夜集團掌舵人',
    linkedProtagonistId: 'char_emma',
    traits: '最沉穩威嚴、一言九鼎，對外手腕鐵血，對唯一的妹妹極度護短。',
    specialtyOrRole: '執掌家族龐大商業帝國與最高決策權',
    relationshipToProtagonist: '把冷夜紫當作家族底線，只要妹妹開口幾乎無條件兜底。',
    currentStatus: '坐鎮香港冷夜集團總部・外界聯繫暫時中斷',
    branchStatusMap: {},
    accentColor: '#334155',
  },
  {
    id: 'sup_lengye_02',
    name: '冷夜爵',
    titleOrRank: '二哥・歐洲藝術與奢品收藏家',
    linkedProtagonistId: 'char_emma',
    traits: '常駐歐洲與倫敦，優雅挑剔，唯獨對妹妹的審美與裝扮毫無節制地寵愛。',
    specialtyOrRole: '偏愛收藏與奢侈品，最愛帶高訂珠寶禮服寵妹妹',
    relationshipToProtagonist: '負責包辦冷夜紫衣帽間裡所有限量高訂與古董珠寶。',
    currentStatus: '常駐歐洲倫敦・剛空運高訂禮服回港',
    branchStatusMap: {},
    accentColor: '#92400E',
  },
  {
    id: 'sup_lengye_03',
    name: '冷夜燼',
    titleOrRank: '三哥・黑白兩道聞名的「鬼手」',
    linkedProtagonistId: 'char_emma',
    traits: '極度冷靜危險，外冷內護，對人體結構、機關陷阱與毒藥藥理瞭若指掌。',
    specialtyOrRole: '精通機關與藥理，替妹妹備下無數保命退路與防身器具',
    relationshipToProtagonist: '在冷夜紫身上悄悄留了只有她知道怎麼觸發的應急藥囊與暗器。',
    currentStatus: '行蹤隱秘・留給妹妹的銀鐲暗器已就緒',
    branchStatusMap: {},
    accentColor: '#9F1239',
  },
  {
    id: 'sup_lengye_04',
    name: '冷夜澈',
    titleOrRank: '四哥・戶外與馬術俱樂部主理',
    linkedProtagonistId: 'char_emma',
    traits: '性格爽朗直接、體能極強，討厭彎彎繞繞的陰謀。',
    specialtyOrRole: '熱衷戶外探險、馬術與高爾夫等運動，體術與反應力拔群',
    relationshipToProtagonist: '從小帶冷夜紫騎馬射箭，對妹妹體能與安全格外上心。',
    currentStatus: '在港島馬術俱樂部・不知妹妹捲入副本',
    branchStatusMap: {},
    accentColor: '#3F6212',
  },
  {
    id: 'sup_lengye_05',
    name: '冷夜墨',
    titleOrRank: '五哥・金融與資本操盤手',
    linkedProtagonistId: 'char_emma',
    traits: '戴金絲眼鏡，斯文敗類氣質，算計極其精明，凡事只看籌碼與回報。',
    specialtyOrRole: '跨境資本運作、做空敵對勢力、精算風險',
    relationshipToProtagonist: '唯有在妹妹花錢或需要動用資金時，從不計算成本收益。',
    currentStatus: '在港處理金融做空・隨時準備資本施壓',
    branchStatusMap: {},
    accentColor: '#475569',
  },
  {
    id: 'sup_lengye_06',
    name: '冷夜寒',
    titleOrRank: '六哥・家族法務與私人會所主理',
    linkedProtagonistId: 'char_emma',
    traits: '冷峻斯文、邏輯極其嚴密，善於利用規則與法條把人逼進死角。',
    specialtyOrRole: '負責家族法務、危機公關與高端私人會所籌備',
    relationshipToProtagonist: '無論冷夜紫惹出多大風波，都能在法律與輿論層面替她抹平痕跡。',
    currentStatus: '主持維港頂層私人會所・善後待機',
    branchStatusMap: {},
    accentColor: '#1E293B',
  },
  {
    id: 'sup_lengye_07',
    name: '冷夜冽',
    titleOrRank: '七哥・地下賽車手與紈絝少爺',
    linkedProtagonistId: 'char_emma',
    traits: '張揚不羈、嘴欠愛看熱鬧，極敏銳地察覺他人之間的情感拉扯。',
    specialtyOrRole: '頂級賽車改裝與極限駕駛，最喜歡調侃晏沉與妹妹',
    relationshipToProtagonist: '經常故意在晏沉面前戳破曖昧，既疼妹妹又愛看男人吃癟。',
    currentStatus: '曾於會所當面見過晏沉並調侃・現於賽車場',
    branchStatusMap: {},
    accentColor: '#B45309',
  },
  {
    id: 'sup_lengye_08',
    name: '冷夜琰',
    titleOrRank: '八哥・全球拍賣行常客',
    linkedProtagonistId: 'char_emma',
    traits: '出手極其闊綽、性情隨性慵懶，只要合眼緣便不問代價拍下。',
    specialtyOrRole: '熱衷全球拍賣會與稀世藝術品、奇珍異寶收藏',
    relationshipToProtagonist: '常把拍賣會壓軸珍品直接轉送到冷夜紫名下。',
    currentStatus: '海外拍賣會巡迴中・隨時備好珍品',
    branchStatusMap: {},
    accentColor: '#6B21A8',
  },
  {
    id: 'sup_lengye_09',
    name: '冷夜曜',
    titleOrRank: '九哥・溫潤清雋的舊案親歷者',
    linkedProtagonistId: 'char_emma',
    traits: '性情溫潤柔和，早年曾遭綁架重傷休養近一年，與三哥關係極好。',
    specialtyOrRole: '極擅察言觀色與安撫人心，對綁架與密室創傷極度敏感',
    relationshipToProtagonist: '最擔心冷夜紫像當年自己一樣落入險境，總是溫柔勸她萬事小心。',
    currentStatus: '曾遭綁架重傷休養近一年已癒・在主宅靜養',
    branchStatusMap: {},
    accentColor: '#0369A1',
  },
  {
    id: 'sup_lengye_10',
    name: '冷夜淵',
    titleOrRank: '十哥・海外暗線執掌者',
    linkedProtagonistId: 'char_emma',
    traits: '低調神秘，極少在公開場合露面，行蹤難以捉摸。',
    specialtyOrRole: '長年待在海外打理家族暗線、情報網與特殊產業',
    relationshipToProtagonist: '只要冷夜紫或家族需要跨國暗線支援，永遠第一個悄無聲息到位。',
    currentStatus: '長年駐守海外暗線・未曾露面',
    branchStatusMap: {},
    accentColor: '#312E81',
  },
  {
    id: 'sup_lengye_11',
    name: '冷夜星',
    titleOrRank: '十一哥・陽光跳脫的玩伴哥哥',
    linkedProtagonistId: 'char_emma',
    traits: '年紀與冷夜紫最相近，性格陽光跳脫、沒有架子，氣氛製造機。',
    specialtyOrRole: '常陪妹妹解悶、熟悉年輕一代圈子與潮流資訊',
    relationshipToProtagonist: '冷夜紫無聊或心情不好時最先找來一起逃課逛街的哥哥。',
    currentStatus: '在維港會所廳內・陪妹妹喝湯逗趣',
    branchStatusMap: {},
    accentColor: '#0284C7',
  },
  {
    id: 'sup_lengye_12',
    name: '冷夜辰',
    titleOrRank: '十二哥・黏人竹馬哥哥',
    linkedProtagonistId: 'char_emma',
    traits: '排行第十二，比冷夜紫年長兩歲，外表乖巧黏人實則佔有欲極強。',
    specialtyOrRole: '從小與冷夜紫一起長大、最常黏在她身邊的近距離守護者',
    relationshipToProtagonist: '對任何想靠近冷夜紫的男人（尤其是晏沉）都抱有本能敵意。',
    currentStatus: '緊跟妹妹身邊・對晏沉充滿敵意防備',
    branchStatusMap: {},
    accentColor: '#7C2D12',
  },
];

export function createLengyeEmmaProject(): StoryProject {
  const now = new Date().toISOString();

  const emmaId = 'char_emma';
  const yanId = 'char_yanchen';
  const rayId = 'char_ray';
  const kelvinId = 'char_kelvin';
  const annId = 'char_ann';

  const initialEdges: RelationshipEdge[] = [
    {
      id: 'rel_emma_yanchen',
      sourceId: emmaId,
      targetId: yanId,
      type: 'ambiguous',
      bidirectional: true,
      description:
        '同居小姐與貼身保鏢的危險共生與成年情慾拉扯：冷夜紫習慣被全世界捧在掌心，卻偏偏在朝夕相處的晏沉（Ash）壓迫性掌控與身體接觸下失守；外界公認全球前十最危險的 Ash，唯獨對同居的 Emma 收斂利爪與嗜血本性。',
    },
    {
      id: 'rel_ray_emma',
      sourceId: rayId,
      targetId: emmaId,
      type: 'doting_protect',
      bidirectional: false,
      description:
        '23歲的國際時尚品牌總監霍睿（Ray Fok）是 Emma 的世交兄長，從小看著她長大，凡事講究貴族禮儀與「優雅」儀表，對冷夜紫格外照顧偏袒。',
    },
    {
      id: 'rel_kelvin_emma',
      sourceId: kelvinId,
      targetId: emmaId,
      type: 'kinship',
      bidirectional: true,
      description:
        '19歲新銳建築師陸啟言（Kelvin Luk）是與 Emma 一起長大的青梅竹馬，對她保留少年時期的默契與保護欲，卻因同居保鏢晏沉的出現而氣氛微妙。',
    },
    {
      id: 'rel_kelvin_ann',
      sourceId: kelvinId,
      targetId: annId,
      type: 'ambiguous',
      bidirectional: true,
      description:
        '情侶關係：Kelvin 是 Ann 最緊抓不放的依靠，但 Kelvin 與 Emma 深厚的青梅竹馬默契總讓脆弱敏感的沈安寧暗自不安。',
    },
    {
      id: 'rel_ann_emma',
      sourceId: annId,
      targetId: emmaId,
      type: 'custom',
      customLabel: '點頭微距',
      bidirectional: true,
      description:
        '僅有幾面之緣、並不熟悉！沈安寧身為 Kelvin 的女友，面對光芒萬丈、受十二位哥哥與世交兄長捧在手心的冷夜紫既禮貌客套又敏感自卑；Emma 也僅以客氣名門禮數相待。',
    },
    {
      id: 'rel_ray_yan',
      sourceId: rayId,
      targetId: yanId,
      type: 'hostile',
      bidirectional: true,
      description:
        '世交兄長與貼身保鏢之間的暗流對峙：優雅挑剔的霍睿本能察覺 Ash 身上洗不掉的血腥與危險氣息，對他同居守護 Emma 一事始終保持貴族式的冷眼防備。',
    },
    {
      id: 'rel_kelvin_yan',
      sourceId: kelvinId,
      targetId: yanId,
      type: 'hostile',
      bidirectional: false,
      description:
        '青梅竹馬對同居貼身保鏢的警戒：陸啟言雖不知 Ash 在地下世界的真正威名，卻本能對這個氣場冷酷暴戾、寸步不離盯著 Emma 的男人心生戒心。',
    },
    {
      id: 'rel_yan_07',
      sourceId: 'sup_lengye_07',
      targetId: yanId,
      type: 'hostile',
      bidirectional: true,
      description:
        '七哥冷夜冽最喜歡當面調侃貼身保鏢晏沉與冷夜紫，實則帶著試探與防備，盯緊這個危險男人是否有資格留在妹妹身邊。',
    },
    {
      id: 'rel_12_yan',
      sourceId: 'sup_lengye_12',
      targetId: yanId,
      type: 'hostile',
      bidirectional: false,
      description:
        '十二哥冷夜辰比妹妹大兩歲、從小黏在身邊，視同居保鏢晏沉為奪走妹妹注意力的頭號危險分子。',
    },
    {
      id: 'rel_03_09',
      sourceId: 'sup_lengye_03',
      targetId: 'sup_lengye_09',
      type: 'kinship',
      bidirectional: true,
      description:
        '三哥冷夜燼與曾遭綁架重傷休養近一年的九哥冷夜曜關係極好，兩人私下極為默契。',
    },
    ...LENGYE_TWELVE_BROTHERS_PRESET.map((b, idx) => ({
      id: `rel_bro_emma_${idx + 1}`,
      sourceId: b.id,
      targetId: emmaId,
      type: 'doting_protect' as const,
      bidirectional: false,
      description: `${b.name}（${b.titleOrRank}）：${b.relationshipToProtagonist}`,
    })),
  ];

  // Radial layout coordinates for clean initial graph
  const nodePositions: Record<string, { x: number; y: number }> = {
    [emmaId]: { x: 320, y: 270 },
    [yanId]: { x: 610, y: 170 },
    [rayId]: { x: 620, y: 310 },
    [kelvinId]: { x: 690, y: 430 },
    [annId]: { x: 805, y: 430 },
  };
  LENGYE_TWELVE_BROTHERS_PRESET.forEach((b, idx) => {
    const angle = (idx / LENGYE_TWELVE_BROTHERS_PRESET.length) * Math.PI * 2;
    nodePositions[b.id] = {
      x: Math.round(320 + Math.cos(angle) * 215),
      y: Math.round(270 + Math.sin(angle) * 205),
    };
  });

  return {
    id: 'proj_lengye_emma',
    title: '冷夜掌珠・暗湧迴廊',
    subtitle:
      '19歲香港頂級豪門冷夜家唯一千金冷夜紫 Emma，在十二位兄長的極致溺愛、同居貼身保鏢 Ash 及世交竹馬圈的暗潮中，走向二十種平行結局。',
    genreNote: '香港豪門千金 × 危險貼身保鏢 × 18禁官能張力 × 遊戲副本計分',
    coverImage: '/src/assets/images/novel_cover_chiaroscuro_1795605807325.jpg',
    autoExtractOnGenerate: true,
    targetTotalWords: 100000,
    updatedAt: now,
    characters: [
      {
        id: emmaId,
        name: '冷夜紫',
        alias: 'Emma · 冷夜家掌上明珠',
        role: '第一視角・19歲香港頂級豪門冷夜家唯一千金',
        ageOrPresence:
          '19歲，明豔嬌貴、被全家族當成眼珠子疼愛長大的唯一女孩，眼尾自帶一點被寵慣的嬌氣與銳氣。',
        sensorySignature:
          '二哥送的頂級白茶與玫瑰冷香、腕間三哥特製的細銀醫療防身鐲、緊張時微微咬住下唇的細膩神態',
        coreTraits:
          '被十二個哥哥溺愛長大卻不愚蠢；驕縱裡帶著敏銳直覺與膽識，習慣被護著，但真遇事絕不拖累在意的人，在與同居保鏢晏沉試探時極具反差感。',
        invariants: [
          '19歲香港頂級豪門冷夜家唯一千金，對十二位哥哥的排位、專長與稱呼絕不可混淆（例如三哥「鬼手」懂藥理機關、七哥愛賽車調侃、十二哥大兩歲最黏她）',
          '沒有任何陰險害人之心；她驕氣任性但本性純粹，在任何平行世界都不會無故背刺家人',
          '對 Kelvin 的女友沈安寧僅有幾面之緣，對話保持禮貌客氣與豪門分寸，不會毫無理由裝成閨蜜',
        ],
        surfacePersona:
          '被寵得理直氣壯的小公主，舉手投足皆是香港頂級名門養出來的從容貴氣。',
        hasDarkSide: false,
        darkShadow: '',
        secretDesire:
          '在十二位兄長與世交護佑之外，渴望在貼身保鏢 Ash 眼前證明自己並非只會躲在身後的玻璃花瓶，並在危險與情慾的邊界真正掌控一次節奏。',
        povVoiceStyle:
          '感官極度敏銳細膩，帶著嬌貴少女獨有的挑剔視線與對溫度、氣味、疼痛與快感的直接體會；邏輯思考清晰果斷。',
        relationships:
          '受冷夜家十二位哥哥與世交兄長霍睿（Ray）偏愛守護，與陸啟言（Kelvin）為青梅竹馬；與同居貼身保鏢晏沉（Ash）之間存在危險、朝夕相處的18禁官能拉扯；與 Kelvin 女友沈安寧（Ann）僅有幾面之緣。',
        characterFamiliarity: {
          [yanId]: 'intimate',
          [rayId]: 'intimate',
          [kelvinId]: 'intimate',
          [annId]: 'acquaintance',
          sup_lengye_01: 'intimate',
          sup_lengye_02: 'intimate',
          sup_lengye_03: 'intimate',
          sup_lengye_04: 'intimate',
          sup_lengye_05: 'intimate',
          sup_lengye_06: 'intimate',
          sup_lengye_07: 'intimate',
          sup_lengye_08: 'intimate',
          sup_lengye_09: 'intimate',
          sup_lengye_10: 'intimate',
          sup_lengye_11: 'intimate',
          sup_lengye_12: 'intimate',
        },
        accentColor: '#9F1239',
        gameProfile: {
          className: '高敏直覺破局者',
          levelOrRank: '新手期・高幸運隱藏體質',
          skills: '微表情與謊言直覺、名門禮儀與奢品真偽辨識',
          keyItems: '三哥冷夜燼備下的應急藥囊與細銀防身鐲、二哥所贈黑鑽胸針',
        },
      },
      {
        id: yanId,
        name: '晏沉',
        alias: 'Yan Chen · 地下代號 Ash / 灰燼',
        role: '第二視角・25歲左右｜Emma 同居貼身保鏢 × 全球前十最危險人物',
        ageOrPresence:
          '25歲左右，輪廓鋒利冷峻，骨節帶傷疤卻修長有力，周身散發極端危險與暴戾壓迫感，唯獨站在冷夜紫身邊時才刻意收斂爪牙。',
        sensorySignature:
          '冷雪松混著淡淡硝煙與鐵鏽氣息、指腹粗糙卻滾燙的溫度、同居屋簷下深夜貼近她耳畔壓低氣音的掌控感',
        coreTraits:
          '外界公認全球前十名最危險人物之一，地下代號「Ash / 灰燼」。心智極端縝密，精於佈局算計，擅長以微小代價撬動巨大權力槓桿。本性冷酷暴戾、不講情面，唯獨對同居的冷夜紫 Emma 收斂爪牙與耐心縱容，以貼身保鏢身分將她納入居所與視線範圍內嚴密護衛。',
        invariants: [
          '所有行動與反制都精於佈局算計、以微小代價撬動權力槓桿，邏輯極端縝密，絕不做無意義的蠢事或強行開掛',
          '對外冷酷暴戾到近乎無情，唯獨對同居的冷夜紫收斂爪牙；面對她的試探與親近充滿成年情慾佔有欲',
          '除當面見過或情報耳聞者外，對冷夜家其餘兄長與沈安寧等外圈人物保持陌生警戒，絕不可無故裝熟',
        ],
        surfacePersona:
          '冷夜紫名義上的同居貼身保鏢，寡言危險、深不可測，永遠站在她身後三步之內。',
        hasDarkSide: true,
        darkShadow:
          '全球前十極危人物「Ash / 灰燼」的冷酷暴戾底色——為清除威脅可以毫不眨眼地借刀殺人或設局毀掉整個棋盤；對 Emma 越想克制越容易在密閉居所裡失控佔有。',
        secretDesire:
          '想讓這顆被十二個哥哥與豪門世交捧在雲端的掌珠，習慣在同居屋簷下只對自己卸下防備、在自己掌心裡紅著眼尾喘息。',
        povVoiceStyle:
          '冷酷精準、像頂尖棋手般計算空間距離、權力槓桿與退路；視線落在 Emma 身上時卻透出克制到極點、隨時會失控的滾燙佔有慾。',
        relationships:
          'Emma 的同居貼身保鏢；對霍睿（Ray）與陸啟言（Kelvin）保持禮貌表面下的冷眼防備與敵意；對沈安寧（Ann）完全陌生；僅與七哥冷夜冽、十一及十二哥打過照面，對多數冷夜兄長仍屬陌生或僅聞名號。',
        characterFamiliarity: {
          [emmaId]: 'intimate',
          [rayId]: 'acquaintance',
          [kelvinId]: 'acquaintance',
          [annId]: 'stranger',
          sup_lengye_01: 'heard_of',
          sup_lengye_02: 'stranger',
          sup_lengye_03: 'stranger',
          sup_lengye_04: 'stranger',
          sup_lengye_05: 'heard_of',
          sup_lengye_06: 'heard_of',
          sup_lengye_07: 'acquaintance',
          sup_lengye_08: 'stranger',
          sup_lengye_09: 'stranger',
          sup_lengye_10: 'stranger',
          sup_lengye_11: 'acquaintance',
          sup_lengye_12: 'acquaintance',
        },
        accentColor: '#334155',
        gameProfile: {
          className: '極危戰術操盤者（Ash）',
          levelOrRank: 'Rank S+・全球前十威脅度',
          skills: '微代價權力槓桿佈局、反追蹤偵察與極限近身格殺',
          keyItems: '消音黑曜石腕錶、定製貼身防禦匕首、冷夜紫公寓備份門禁卡',
        },
      },
      {
        id: rayId,
        name: '霍睿',
        alias: 'Ray Fok · 國際時尚品牌總監',
        role: '第三視角・23歲｜國際時尚品牌總監 × Emma 世交兄長',
        ageOrPresence:
          '23歲，修長挺拔、輪廓帶有混血般的冷冽貴氣，領針與袖扣永遠分毫不差，舉手投足皆是百年老牌貴族般的從容與挑剔。',
        sensorySignature:
          '冷冽檀木與高級手工羊絨衣料香氣、永遠一塵不染的牛津皮鞋聲、審視他人儀表時微抬下頷的優雅姿態',
        coreTraits:
          '極度注重個人儀表與「優雅」，對任何粗鄙、失態或狼狽都本能排斥；作為 Emma 的世交兄長，平日毒舌挑剔卻十分護短，骨子裡維持著頂級名門的貴族做派與社交禮儀。',
        invariants: [
          '任何危機或混亂場面下都極度維持個人儀表與「優雅」，絕不當眾失態歇斯底里',
          '沒有陰暗害人之心；身為世交兄長對 Emma 偏心照顧，對晏沉這種身上帶著血腥氣的貼身保鏢本能排斥戒備',
          '對 Kelvin 女友沈安寧幾乎不認識（素未謀面或僅知其名），絕不對外圈陌生人展現世交般的熱絡',
        ],
        surfacePersona:
          '名利場與時裝週裡優雅難馴的年輕品牌掌門人，永遠帶著無可挑剔的貴族微笑。',
        hasDarkSide: false,
        darkShadow: '',
        secretDesire:
          '守護這群從小一起長大的世交圈層與家族體面，絕不容許來路不明的危險人物把冷夜紫拖進泥沼。',
        povVoiceStyle:
          '優雅冷靜、講究裁縫線條、光影構圖與社交距離感，字裡行間帶著高級名流圈的克制與銳利品評。',
        relationships:
          'Emma 從小到大的世交兄長（與二哥冷夜爵同在歐洲時尚奢品圈交集頗深）；認識同圈層的陸啟言（Kelvin）；對晏沉（Ash）保持貴族式的優雅敵意；對沈安寧（Ann）素未謀面。',
        characterFamiliarity: {
          [emmaId]: 'intimate',
          [kelvinId]: 'familiar',
          [yanId]: 'acquaintance',
          [annId]: 'stranger',
          sup_lengye_01: 'familiar',
          sup_lengye_02: 'intimate',
          sup_lengye_03: 'heard_of',
          sup_lengye_04: 'familiar',
          sup_lengye_05: 'familiar',
          sup_lengye_06: 'familiar',
          sup_lengye_07: 'familiar',
          sup_lengye_08: 'acquaintance',
          sup_lengye_09: 'acquaintance',
          sup_lengye_10: 'stranger',
          sup_lengye_11: 'familiar',
          sup_lengye_12: 'familiar',
        },
        accentColor: '#92400E',
        gameProfile: {
          className: '秩序與奢品鑑別師',
          levelOrRank: '高階社交名流',
          skills: '高奢工藝材質辨識、貴族社交暗語解讀、極高儀態自持力',
          keyItems: '定製雙排扣長風衣、祖母綠鉑金袖扣',
        },
      },
      {
        id: kelvinId,
        name: '陸啟言',
        alias: 'Kelvin Luk · 新銳建築師',
        role: '第四視角・19歲｜曾獲國內設計大獎的青年新銳建築師 × Emma 青梅竹馬',
        ageOrPresence:
          '19歲，身形清雋、指尖偶爾沾著建築模型的碳粉與木屑，眼神澄淨專注，帶著天才少年設計師獨有的敏銳與溫潤。',
        sensorySignature:
          '淡雪松木與硫酸紙藍圖的味道、隨身攜帶的金屬比例尺、緊張或專注時輕敲桌面計算結構的節奏',
        coreTraits:
          '曾獲國內設計大獎的青年新銳建築師，對空間幾何、結構邏輯與材質張力有極高天賦。身為 Emma 的青梅竹馬，對她保有一份少年時期的真心關切與維護；對待女友沈安寧則溫柔體貼，卻常在兩端情感與圈層落差間感到無力。',
        invariants: [
          '19歲青年建築師，解決密閉空間或建築謎題時必定運用真實建築力學、動線與結構原理，絕不靠玄學硬解',
          '沒有任何陰險算計；重視青梅竹馬 Emma 的安危，也盡力安撫照顧敏感的女友 Ann',
          '對貼身保鏢晏沉（Ash）只限認識且暗自防備，不了解他在地下世界的恐怖實力',
        ],
        surfacePersona:
          '謙遜清雋、專注設計且在建築界嶄露頭角的名門青年才俊。',
        hasDarkSide: false,
        darkShadow: '',
        secretDesire:
          '想親手設計出一座真正屬於重要之人的安全建築，並證明十九歲的自己也有足夠力量護住青梅竹馬與女友，不總是被晏沉或兄長們比下去。',
        povVoiceStyle:
          '具有空間縱深感、對線條、比例、光影折射與結構承重格外敏銳，帶著十九歲青年的真誠與隱約的不甘。',
        relationships:
          'Emma 的青梅竹馬；沈安寧（Ann）的現任男友；熟識世交兄長霍睿（Ray）；對同居在 Emma 身邊的晏沉（Ash）認識但疏離警戒。',
        characterFamiliarity: {
          [emmaId]: 'intimate',
          [annId]: 'intimate',
          [rayId]: 'familiar',
          [yanId]: 'acquaintance',
          sup_lengye_01: 'acquaintance',
          sup_lengye_02: 'acquaintance',
          sup_lengye_03: 'stranger',
          sup_lengye_04: 'acquaintance',
          sup_lengye_05: 'acquaintance',
          sup_lengye_06: 'acquaintance',
          sup_lengye_07: 'familiar',
          sup_lengye_08: 'heard_of',
          sup_lengye_09: 'acquaintance',
          sup_lengye_10: 'stranger',
          sup_lengye_11: 'familiar',
          sup_lengye_12: 'familiar',
        },
        accentColor: '#0369A1',
        gameProfile: {
          className: '空間結構解析師',
          levelOrRank: '新銳設計金獎得主',
          skills: '建築空間動線推演、暗格與承重牆結構判讀',
          keyItems: '黃銅建築比例尺、速寫筆記本與碳筆',
        },
      },
      {
        id: annId,
        name: '沈安寧',
        alias: 'Ann Shum',
        role: '第五視角・Kelvin 女友｜與 Emma 僅有幾面之緣 · 脆弱敏感',
        ageOrPresence:
          '十九至二十歲，身形纖細單薄，眼神容易受驚閃躲，指尖總緊緊攥著衣角或 Kelvin 的衣袖，帶著易碎的玻璃感。',
        sensorySignature:
          '淡淡的洗衣精與櫻花護手霜氣味、受壓迫時急促發抖的呼吸、小心翼翼觀察眾人臉色的微動作',
        coreTraits:
          '陸啟言（Kelvin）的女友，出身遠不如冷夜家與霍家顯赫，性格脆弱敏感、極度缺乏安全感。與 Emma 僅有幾面之緣（並不熟悉！），每次踏入這群天之驕子的圈子都渾身緊繃，既害怕拖累 Kelvin，又對眾人圍繞冷夜紫的偏愛深感疏離與惶恐。',
        invariants: [
          '與冷夜紫 Emma 僅有幾面之緣、並不熟悉！見到 Emma 必須保持疏離拘謹與客套（絕不可寫成熟悉閨蜜）',
          '對霍睿（Ray）、晏沉（Ash）及冷夜家十二位哥哥皆屬素未謀面或完全陌生，絕不可叫出對方名字或裝熟',
          '沒有陰險心機，性格脆弱敏感，面對高壓恐懼或冷暴力時會本能退縮、發抖或眼眶泛紅',
        ],
        surfacePersona:
          '安靜柔弱、緊跟在男友 Kelvin 身邊顯得格格不入的小家碧玉。',
        hasDarkSide: false,
        darkShadow: '',
        secretDesire:
          '只希望自己能不被這個過於耀眼又殘酷的圈子吞噬，緊緊留住 Kelvin 放在自己身上的目光，平安回到原本安穩的生活。',
        povVoiceStyle:
          '高度敏感、放大外界視線與壓迫感，對冷漠眼神、腳步聲與豪門圈的陌生距離感格外敏銳且充滿焦慮細節。',
        relationships:
          '陸啟言（Kelvin）的女友；與 Emma 僅有幾面之緣（僅屬點頭之交／不熟）；對晏沉（Ash）、霍睿（Ray）與冷夜家十二位兄長完全陌生。',
        characterFamiliarity: {
          [kelvinId]: 'intimate',
          [emmaId]: 'acquaintance',
          [yanId]: 'stranger',
          [rayId]: 'stranger',
          sup_lengye_01: 'stranger',
          sup_lengye_02: 'stranger',
          sup_lengye_03: 'stranger',
          sup_lengye_04: 'stranger',
          sup_lengye_05: 'stranger',
          sup_lengye_06: 'stranger',
          sup_lengye_07: 'stranger',
          sup_lengye_08: 'stranger',
          sup_lengye_09: 'stranger',
          sup_lengye_10: 'stranger',
          sup_lengye_11: 'stranger',
          sup_lengye_12: 'stranger',
        },
        accentColor: '#6B21A8',
        gameProfile: {
          className: '脆敏危機感知者',
          levelOrRank: '普通素人玩家',
          skills: '對惡意與殺氣極度敏感的直覺預警',
          keyItems: 'Kelvin 送的淺藍絲巾、止痛與安神小藥盒',
        },
      },
    ],
    supportingCharacters: LENGYE_TWELVE_BROTHERS_PRESET,
    relationshipEdges: initialEdges,
    nodePositions,
    world: {
      mode: 'game_dungeon',
      eraAndSetting:
        '現實線為紙醉金迷卻暗流洶湧的香港頂級豪門圈（冷夜家半山莊園、私人會所與賽道）；副本線則被捲入嚴格計分制的封閉逃生遊戲空間。',
      climateAndSenses:
        '現實是冷氣極足的絲絨沙龍、高級香水與深夜維港霓虹；進入副本後則是濕冷石牆、倒數計時滴答聲、密閉喘息與汗水交織的高壓感官。',
      powerStructure:
        '現實世界由冷夜家大哥冷夜梟與各大門閥制衡；副本內一切唯「系統計分規則」與「絕對邏輯線索」是從，金錢與家世在副本規則內無法直接買通必死判定。',
      taboos:
        '1. 嚴禁 AI 為了讓主角通關或完成某個動作而擅自憑空加設定、加道具或改規則；2. 副本計分必須首尾連貫不可遺忘；3. 冷夜家十二位哥哥的身分與專長不可錯置。',
      locations: [
        '香港半山冷夜家主宅（冷夜紫的粉紫高訂衣帽間與兄長書房）',
        '六哥冷夜寒名下的維港頂層私人會所',
        '副本一：午夜鐘樓公館（限時推理計分場域）',
      ],
      atmosphereImage:
        '/src/assets/images/world_atmosphere_noir_1795605807183.jpg',
      gameSystem: {
        systemName: '鏡界計分審判系統',
        coreMechanics:
          '嚴格累積制計分（0 / 500 分通關）：解開邏輯線索 +40~80 分、觸發隱藏真相 +100 分、觸犯禁忌或邏輯誤判 -50 分。所有分數異動必須寫明因果並即時累計。',
        systemVoiceTone: '精準、冰冷、不講情面的電子提示音，只在觸發得分/扣分或規則判定時響起。',
        currencyAndPenalty: '累積分數未達 500 分無法開啟出口；分數歸零直接抹殺或鎖入壞結局分支。',
        dungeons: [
          {
            id: 'dung_clocktower',
            code: 'DUN-01',
            name: '午夜鐘樓公館',
            difficulty: '★★★★☆（高邏輯推理＋密閉壓迫）',
            clearCondition:
              '累積取得 500 點邏輯積分，並在第四次鐘響前憑「實際尋獲的鑰匙與遺囑順序」打開地窖銅門。',
            deathPenaltyAndTaboos:
              '1. 鐘聲響起時不可在走廊發出超過 40 分貝聲響（違者 -80 分）；2. 不得使用非本副本產出且未於角色欄登記的道具；3. 謊報推理結果直接扣除 50 分。',
            environmentNotes:
              '全館停電僅餘壁爐微光與暴雨窗影，空間鎖死無法聯絡外界十二位哥哥。',
            bossOrAnomaly: '無面管家（只根據玩家是否違反物理痕跡與時間順序進行懲罰）',
          },
        ],
      },
    },
    contentSettings: {
      proseStyle:
        '文字極具電影感與文學質感：寫情慾時大膽、潮濕、極具18禁成年官能張力（體溫、呼吸、皮膚觸感、失控邊緣）；寫解謎與行動時嚴守因果邏輯，絕不降智或強行開掛。',
      sensualLevel: 'explicit_literary',
      darknessLevel: 'morally_grey',
      strictCanonLock: true,
      antiBlandnessRules: [
        '描寫18禁親密情色段落時，必須寫出真實的感官細節、體溫、喘息、肌膚與心理拉扯，絕不以「一夜過去」或白開水一筆帶過',
        '描寫推理與副本闖關時必須嚴格講求邏輯：線索來源、時間差、物理限制必須交代清楚',
        '副本積分變動必須寫明原因並與目前總分一致，不可寫到一半忘記先前分數',
        '禁止為推進劇情而擅自替角色添加設定裡沒有的新技能、新道具、新親戚或隱藏規則',
      ],
      customDirectives:
        '冷夜紫是19歲被十二個哥哥寵大的千金，既有被愛包圍的嬌氣與光亮，也有面對晏沉時獨有的少女青澀與大膽試探反差。',
    },
    branches: [
      {
        id: 'main',
        code: 'MAIN',
        title: '共同主線：初入鐘樓與分數起算',
        parentBranchId: 'main',
        forkTimelineOrder: 0,
        endingTone: '主線幹道',
        divergencePremise:
          '冷夜紫 Emma 意外與晏沉一同被捲入「午夜鐘樓公館」副本前的豪門序幕與初段推理。',
        status: 'writing',
      },
      {
        id: 'end_01',
        code: 'END-01',
        title: '滿分破局・掌珠反客為主線',
        parentBranchId: 'main',
        forkTimelineOrder: 20,
        endingTone: 'HE / 雙強破局',
        divergencePremise:
          '冷夜紫靠三哥備下的細銀防身鐲與嚴密時間差推理湊齊 500 分，反過來把晏沉逼進衣櫃暗格裡討回利息。',
        status: 'planning',
      },
    ],
    chapters: [
      {
        id: 'ch_emma_01',
        number: 1,
        timelineOrder: 10,
        timelineLabel: 'Day 1 · 20:30 半山莊園晚宴前',
        branchId: 'main',
        dungeonId: undefined,
        dungeonScore: {
          currentScore: 0,
          targetClearScore: 500,
          sanOrHp: 'SAN 100 / 狀態滿值',
          scoreLog: [],
        },
        actTitle: '序幕：香港冷夜家',
        title: '十二份偏愛與不速之客',
        povCharacterId: emmaId,
        status: 'drafting',
        targetWords: 2800,
        summary:
          '冷夜紫 19 歲生日前夕的私人會所試裝夜，幾位哥哥輪流寵溺登場，七哥冷夜冽當面調侃她與晏沉的微妙氣氛。',
        beats: [],
        content: `六哥名下的維港頂層會所今晚清了場，冷氣開得足，絲絨地毯吸盡了高跟鞋的細碎聲響。

冷夜紫坐在落地窗邊的單人沙發上，剛試完二哥冷夜爵從倫敦空運回來的紫羅蘭緞面晚裝。腕間那隻細銀醫療鐲是三哥冷夜燼上個月親手改製的，冰涼貼著脈搏，裡頭藏著極細的應急鎮定針與微弱定位器——雖然十二位哥哥總愛把她當瓷娃娃護著，但三哥從來不嫌準備多餘。

「小紫，試好衣服還不過來喝湯？九哥特地讓廚房燉的。」十一哥冷夜星端著瓷碗晃過來，身後跟著比她只大兩歲、幾乎寸步不離的十二哥冷夜辰。

還沒等她開口，門口傳來低沉的腳步聲。七哥冷夜冽手裡轉著跑車鑰匙，視線故意往剛從暗色走廊走出的男人身上瞟了一圈，語氣帶著一貫的欠揍與促狹：「喲，說曹操曹操到。晏先生，你盯著我家小妹這條露背裙看超過三秒了——再看下去，五哥今晚可就要做空你名下的碼頭股價了。」

晏沉站在光影交界處，黑色襯衫領口解開兩顆扣子，眼神冷冽卻精準地鎖住冷夜紫微紅的耳尖。他沒有理會冷夜冽的挑釁，只慢條斯理地走近兩步，修長指節在沙發扶手邊緣輕叩一記，壓低了只有兩人能聽清的氣音：「冷夜小姐，這條裙子的背後拉鍊，好像沒拉到頂。」`,
        lastMemorySyncAt: now,
        updatedAt: now,
      },
      {
        id: 'ch_emma_02',
        number: 2,
        timelineOrder: 20,
        timelineLabel: 'Day 1 · 23:45 鐘樓副本開局',
        branchId: 'main',
        dungeonId: 'dung_clocktower',
        dungeonScore: {
          currentScore: 120,
          targetClearScore: 500,
          sanOrHp: 'SAN 92 / 體力正常',
          scoreLog: [
            {
              id: 'log_1',
              reason: '發現壁爐灰燼中的鐘錶齒輪時間差矛盾',
              delta: 80,
              timelineLabel: '23:50',
            },
            {
              id: 'log_2',
              reason: '冷夜紫利用名門奢品知識識破假古董花瓶暗格',
              delta: 40,
              timelineLabel: '00:05',
            },
          ],
        },
        actTitle: '副本一：午夜鐘樓公館',
        title: '壁爐暗格與衣櫃裡的呼吸',
        povCharacterId: emmaId,
        status: 'drafting',
        targetWords: 3200,
        summary:
          '兩人被拉入無法聯絡十二位哥哥的鐘樓副本，憑邏輯推導取得開局 120 分，卻因鐘聲將至被迫一同躲進狹窄衣櫃避險。',
        beats: [],
        content: `【鏡界計分審判系統：當前副本《午夜鐘樓公館》，通關門檻 500 分。目前累計積分：120 / 500 分。距離第二次鐘響尚餘 45 秒。】

冰冷的系統提示音在腦海裡散去時，走廊盡頭已經傳來無面管家拖曳鐵鍊的刮擦聲。

「別出聲，超過四十分貝會扣八十分。」晏沉反手扣住冷夜紫的手腕，在最後十秒將她拉進主臥室厚重的胡桃木衣櫃裡，順手帶上雕花木門。

狹窄黑暗的空間裡全是高級樟木與兩人身上的氣息。冷夜紫身上的高訂絲綢裙擺被擠得緊貼大腿，背脊直接撞進晏沉溫熱的胸膛。門縫外只有一線壁爐微光，而她剛才死死攥在手心的那枚齒輪還在發燙——那是她靠著二哥平時教她辨認古董鐘錶的經驗，在花瓶暗格裡搶先翻出來的證物。

晏沉一隻手臂橫過她纖細的腰肢，掌心滾燙地隔著薄薄真絲按在她小腹上，逼她貼得更緊以騰出門縫視野；他溫熱的呼吸就落在她敏感的頸側，低啞得幾乎擦過耳膜：「心跳這麼快，冷夜小姐……是怕外面的東西，還是怕我？」`,
        updatedAt: now,
      },
    ],
    memories: [
      {
        id: 'mem_emma_01',
        category: 'character',
        title: '冷夜紫的防身手鐲與十二位哥哥背景',
        detail: '冷夜紫腕間佩戴三哥冷夜燼改製的細銀防身鐲（內藏極細鎮定針與定位器），身上穿著二哥冷夜爵送的紫羅蘭緞面露背晚裝；七哥冷夜冽曾當面調侃晏沉。',
        timelineOrder: 10,
        timelineLabel: 'Day 1 · 20:30',
        branchId: 'main',
        relatedCharacterIds: [emmaId, yanId],
        sourceChapterId: 'ch_emma_01',
        sourceChapterTitle: '第 1 章：十二份偏愛與不速之客',
        pinned: true,
        resolved: false,
        createdAt: now,
      },
      {
        id: 'mem_emma_02',
        category: 'plot',
        title: '鐘樓副本開局計分 120/500 與齒輪線索',
        detail: '冷夜紫與晏沉通過壁爐齒輪時間差（+80分）及假花瓶暗格辨識（+40分）累積至 120/500 分；為躲避鐘響四十分貝扣分禁忌而共處胡桃木衣櫃內。',
        timelineOrder: 20,
        timelineLabel: 'Day 1 · 23:55',
        branchId: 'main',
        relatedCharacterIds: [emmaId, yanId],
        sourceChapterId: 'ch_emma_02',
        sourceChapterTitle: '第 2 章：壁爐暗格與衣櫃裡的呼吸',
        pinned: true,
        resolved: false,
        createdAt: now,
      },
    ],
  };
}

export function createStarterProject(): StoryProject {
  const now = new Date().toISOString();
  return {
    id: 'proj_tide_corrosion',
    title: '潮蝕',
    subtitle: '一座常年被鹹霧與舊債籠罩的港口，與三個在多重結局裡互相試探的靈魂',
    genreNote: '心理寫實 · 多重平行結局 · 感官張力',
    coverImage: '/src/assets/images/novel_cover_chiaroscuro_1795605807325.jpg',
    autoExtractOnGenerate: true,
    targetTotalWords: 60000,
    updatedAt: now,
    characters: [
      {
        id: 'char_shen',
        name: '沈硯修',
        alias: '夜航船醫',
        role: '第一視角・表面溫文冷靜的走私船醫',
        ageOrPresence: '三十四歲，指節修長且常帶著消毒水與雪松煙草味',
        sensorySignature: '永遠扣到領口的白襯衫、冷雨打濕的黑呢大衣、指腹微涼的觸感',
        coreTraits: '理性、克制、擅長在混亂中替自己和他人止血，卻對疼痛與失控有強烈好奇。',
        invariants: [
          '無論在哪個平行世界，絕不會對失去反抗能力的傷患下毒手',
          '情緒越翻湧時說話越平緩精準，絕不失態咆哮',
        ],
        surfacePersona: '在港口診所替無證船員縫合傷口，說話節制、禮貌、從不失態。',
        hasDarkSide: true,
        darkShadow: '享受看著失控者向自己低頭求饒的瞬間；十年前海上大火的知情者，卻冷眼讓秘密腐爛。',
        secretDesire: '想徹底拆解林微瀾那張無懈可擊的冷漠面具，看她在自己掌心裡顫抖、失語。',
        povVoiceStyle: '冷靜克制、擅長解剖人體與人性的弱點，習慣在心裡把慾望換算成傷口與脈搏。',
        relationships: '與林微瀾維持著「互相利用與身體試探」的危險默契。',
        accentColor: '#9F1239',
      },
      {
        id: 'char_lin',
        name: '林微瀾',
        alias: '白銀拍賣官',
        role: '第二視角・專營黑市古董與遺產清算的女人',
        ageOrPresence: '三十歲，頸側有極淡的燙傷舊痕，習慣用黑絲緞遮住半截手腕',
        sensorySignature: '雨水浸泡過的梔子花與鐵鏽味、高跟鞋敲過濕石階的節奏、微啞的菸嗓',
        coreTraits: '極度清醒、傲骨、寧可自傷也不欠人情，把所有籌碼都算在心裡。',
        invariants: [
          '絕不向權勢者下跪求饒，即使瀕臨絕境也會保留最後一張反殺底牌',
          '談判時絕對守信於自己親口立下的契約條款',
        ],
        surfacePersona: '精明、優雅、在男性主導的港城商會裡遊刃有餘，笑起來恰到好處。',
        hasDarkSide: true,
        darkShadow: '寧願用自己的身體當作談判籌碼，也不允許任何人掌握她的軟肋；曾偽造父親的死因證明。',
        secretDesire: '渴望某個人能在撕破她所有偽裝後，依然敢把刀和頸動脈同時交到她手裡。',
        povVoiceStyle: '銳利、敏感、對金錢與肉體的交換極為清醒，總在最親密的時刻保持一分旁觀的冷酷。',
        relationships: '夜裡在沈硯修的診所床榻上交換體溫與情報。',
        accentColor: '#6B21A8',
      },
      {
        id: 'char_xu',
        name: '許知南',
        alias: '燈塔實習生',
        role: '第三視角・剛調來晦港氣象站的年輕紀錄員',
        ageOrPresence: '二十三歲，總穿著洗得發白的帆布外套，眼裡還留著對海面日出的期待',
        sensorySignature: '陽光曬過的棉布味、鉛筆屑與海鹽氣息、緊張時會無意識摩挲袖扣',
        coreTraits: '純粹、固執、誠實且富同理心，像一盞硬要在暴雨裡亮著的煤油燈。',
        invariants: [
          '沒有任何陰暗算計；看見有人落水或流血，第一反應永遠是伸手去拉',
          '絕不說違背良心的假證詞，哪怕會因此丟掉性命',
        ],
        surfacePersona: '對晦港地下規則一無所知，真心相信紀錄好潮汐就能救下遠航的船員。',
        hasDarkSide: false,
        darkShadow: '',
        secretDesire: '只是希望這座永遠下雨的城市，有一天能讓身邊的人不用再提心吊膽地活著。',
        povVoiceStyle: '真誠、敏銳、帶著不被污染的溫度，用乾淨的視線去撞擊晦港的腐敗與曖昧。',
        relationships: '偶然救過受傷的林微瀾一命，成為沈硯修與林微瀾在黑暗中唯一不想毀掉的微光。',
        accentColor: '#0369A1',
      },
    ],
    supportingCharacters: [],
    relationshipEdges: [
      {
        id: 'rel_shen_lin',
        sourceId: 'char_shen',
        targetId: 'char_lin',
        type: 'ambiguous',
        bidirectional: true,
        description: '診所無影燈下的身體試探與情報交易，互相算計卻又對彼此體溫上癮。',
      },
      {
        id: 'rel_xu_lin',
        sourceId: 'char_xu',
        targetId: 'char_lin',
        type: 'doting_protect',
        bidirectional: false,
        description: '許知南對林微瀾抱有單純的關心與善意，成為晦港裡少數不帶交換條件的微光。',
      },
    ],
    nodePositions: {
      char_shen: { x: 240, y: 220 },
      char_lin: { x: 520, y: 220 },
      char_xu: { x: 380, y: 390 },
    },
    world: {
      mode: 'literary',
      eraAndSetting: '架空近代海港都市「晦港」——霓虹尚未全面普及，煤氣燈、電報局與遠洋貨輪並存的濕冷年代。',
      climateAndSenses: '全年有八個月在下雨。空氣裡永遠浮著腐敗的海藻味、柴油煙、潮濕石牆的霉斑。',
      powerStructure: '明面由港口總督署與老牌航運家族統治；暗地裡所有航道與黑市皆由三號碼頭契約決定生死。',
      taboos: '禁止追問十年前「白鯨號」沉船名單；禁止在未經允許的情況下踏入冷鏈倉庫地下二層。',
      locations: [
        '沈硯修的臨海閣樓診所（二樓藥櫃後方藏有雙人窄床與未登記手術台）',
        '三號碼頭地下拍賣廳（只憑銅牌入場的暗室）',
        '東防波堤老燈塔（許知南值夜的觀測室）',
      ],
      atmosphereImage: '/src/assets/images/world_atmosphere_noir_1795605807183.jpg',
      gameSystem: {
        systemName: '晦港深淵終端',
        coreMechanics: '生存點數清算制，每個副本限時 72 小時內找出核心異常規則。',
        systemVoiceTone: '冰冷、簡潔、不帶任何感情波動的機械播報。',
        currencyAndPenalty: '違背副本禁忌將扣除壽命時數或永久抹除一段重要記憶。',
        dungeons: [],
      },
    },
    contentSettings: {
      proseStyle: '潮濕冷冽的心理寫實，注重感官細節與角色人設對比。',
      sensualLevel: 'explicit_literary',
      darknessLevel: 'morally_grey',
      strictCanonLock: true,
      antiBlandnessRules: [
        '禁止使用「他感到很憤怒/心碎/興奮」等空洞情緒總結，必須寫出脈搏、呼吸、肌肉緊繃或微動作',
        '有黑暗面的角色展現深沉算計，沒有黑暗面的角色必須嚴守其純粹底線，絕不強行黑化',
        '嚴禁為強行推進情節而擅自新增未設定的道具、機關或家族背景',
      ],
      customDirectives: '',
    },
    branches: [
      {
        id: 'main',
        code: 'MAIN',
        title: '共同主線：暴雨前夜',
        parentBranchId: 'main',
        forkTimelineOrder: 0,
        endingTone: '主線幹道',
        divergencePremise: '一切分歧尚未發生前，三位主角在晦港交匯的既定事實。',
        status: 'writing',
      },
      {
        id: 'branch_end_01',
        code: 'END-01',
        title: '焚毀帳本・共犯逃亡線',
        parentBranchId: 'main',
        forkTimelineOrder: 20,
        endingTone: 'TE 危險共生',
        divergencePremise: '林微瀾在拍賣後選擇當場燒毀白銀標籤，拉著沈硯修連夜炸毀三號冷庫逃向公海。',
        status: 'writing',
      },
    ],
    chapters: [
      {
        id: 'ch_01',
        number: 1,
        timelineOrder: 10,
        timelineLabel: 'Day 1 · 23:10 暴雨夜',
        branchId: 'main',
        dungeonScore: {
          currentScore: 0,
          targetClearScore: 500,
          sanOrHp: '正常',
          scoreLog: [],
        },
        actTitle: '共同主線',
        title: '縫線與梔子',
        povCharacterId: 'char_shen',
        status: 'polishing',
        targetWords: 2500,
        summary: '暴雨夜，林微瀾帶著肩胛骨的裂傷闖入沈硯修的診所。',
        beats: [],
        content: `雨在十一點後變得黏稠，像是從海面上撈起來還沒瀝乾的髒水，一遍遍糊在診所的毛玻璃窗上。

沈硯修把最後一把止血鉗放進煮沸槽時，樓梯轉角傳來高跟鞋踩碎水窪的聲音。節奏很穩，只是每第三步，鞋跟會極輕微地頓一下——那是左肩或肋下在牽扯。

「我不用麻藥。」林微瀾坐上診察床，單手解開濕透的黑色風衣，左肩後方撕開了一道三寸長的口子。

沈硯修走過去，站在她兩膝之間，戴上乳膠手套。林微瀾仰起頭，伸出冰涼的指尖勾住他沒扣緊的領帶，輕輕往下一拽，兩人鼻尖幾乎相抵。「那要看沈醫生縫線的時候，手會不會抖。」`,
        lastMemorySyncAt: now,
        updatedAt: now,
      },
      {
        id: 'ch_02',
        number: 2,
        timelineOrder: 20,
        timelineLabel: 'Day 2 · 01:30 拍賣前刻',
        branchId: 'main',
        dungeonScore: {
          currentScore: 0,
          targetClearScore: 500,
          sanOrHp: '正常',
          scoreLog: [],
        },
        actTitle: '共同主線',
        title: '冷庫裡的白銀標籤',
        povCharacterId: 'char_lin',
        status: 'drafting',
        targetWords: 2500,
        summary: '林微瀾強忍肩傷主持午夜暗室拍賣，遇見送電報來的許知南。',
        beats: [],
        content: `回到三號碼頭地下拍賣廳時，沈硯修留在她肩胛骨上的七針還在一跳一跳地發熱，像七顆埋進肉裡的火種。

抱著防雨油布包的許知南在走廊停步：「林小姐，防波堤今晚風浪超標，站長讓我務必把這份停航電報交給碼頭管理處。」他將一顆溫熱薑糖輕放在桌角：「外頭很冷，早點歇息。」`,
        updatedAt: now,
      },
    ],
    memories: [
      {
        id: 'mem_01',
        category: 'intimacy',
        title: '診所無影燈下的未麻醉縫合',
        detail: '林微瀾拒絕麻醉讓沈硯修縫合左肩後方三寸裂傷，兩人在極近距離下以領帶牽引完成試探。',
        timelineOrder: 10,
        timelineLabel: 'Day 1 · 23:20',
        branchId: 'main',
        relatedCharacterIds: ['char_shen', 'char_lin'],
        sourceChapterId: 'ch_01',
        sourceChapterTitle: '第 1 章：縫線與梔子',
        pinned: true,
        resolved: false,
        createdAt: now,
      },
    ],
  };
}

export function createBlankProject(
  title: string,
  template: 'literary' | 'game_dungeon' | 'lengye_emma' = 'literary'
): StoryProject {
  if (template === 'lengye_emma') {
    const p = createLengyeEmmaProject();
    return {
      ...p,
      id: `proj_${Date.now()}`,
      title: title.trim() || p.title,
    };
  }

  const now = new Date().toISOString();
  const id = `proj_${Date.now()}`;
  const firstCharId = `char_${Date.now()}_1`;

  if (template === 'game_dungeon') {
    const c2 = `char_${Date.now()}_2`;
    const d1 = `dung_${Date.now()}_1`;
    return {
      id,
      title: title.trim() || '七日迴廊：異常副本錄',
      subtitle: '高壓規則怪談 × 嚴密邏輯推演 × 20條平行結局分支',
      genreNote: '遊戲副本 · 計分制 · 多結局生存',
      coverImage: '/src/assets/images/novel_cover_chiaroscuro_1795605807325.jpg',
      autoExtractOnGenerate: true,
      targetTotalWords: 80000,
      updatedAt: now,
      characters: [
        {
          id: firstCharId,
          name: '顧言',
          alias: '解謎觀察者',
          role: '第一視角・冷靜計算副本規律的玩家',
          ageOrPresence: '二十七歲，左腕戴著機械錶',
          sensorySignature: '薄荷菸味、迅速掃視門鎖與反光鏡面的視線',
          coreTraits: '理性務實、邏輯嚴密，對隊友保持適度邊界但絕不無故背刺。',
          invariants: ['不殺無辜新人玩家', '推理必依現場物證，不靠猜測'],
          surfacePersona: '寡言可靠的高階玩家',
          hasDarkSide: true,
          darkShadow: '為保住關鍵通關線索，對企圖害人的敵對玩家毫不留情。',
          secretDesire: '找出系統背後真正操縱平行時間線的秘密。',
          povVoiceStyle: '精準、具空間幾何感與倒數計時壓迫感。',
          relationships: '與蘇晴形成智謀與直覺互補。',
          accentColor: '#334155',
          gameProfile: {
            className: '規則解析者',
            levelOrRank: 'Rank S-',
            skills: '異常紅字標記、時間差記憶回溯',
            keyItems: '破碎的羅盤',
          },
        },
        {
          id: c2,
          name: '蘇晴',
          alias: '白銀醫療兵',
          role: '第二視角・堅守人性的前線治療者',
          ageOrPresence: '二十四歲，眼神清亮堅定',
          sensorySignature: '柑橘與酒精味、安撫傷患時穩定的聲線',
          coreTraits: '勇敢、坦率、有強烈的保護欲與共情力。',
          invariants: ['絕不具備任何陰險背叛心理', '拒絕犧牲同伴換取免死'],
          surfacePersona: '溫和堅定的治癒系隊友',
          hasDarkSide: false,
          darkShadow: '',
          secretDesire: '帶著同伴一起活著走出迴廊。',
          povVoiceStyle: '真摯、感官鮮活。',
          relationships: '完全信任顧言的邏輯推演。',
          accentColor: '#0369A1',
          gameProfile: {
            className: '聖詠醫療官',
            levelOrRank: 'Rank A',
            skills: '急診縫合領域',
            keyItems: '白銀聽診器',
          },
        },
      ],
      supportingCharacters: [],
      relationshipEdges: [
        {
          id: `rel_${Date.now()}`,
          sourceId: firstCharId,
          targetId: c2,
          type: 'accomplice',
          bidirectional: true,
          description: '在致命副本裡將後背交給彼此的生死搭檔。',
        },
      ],
      nodePositions: {
        [firstCharId]: { x: 260, y: 240 },
        [c2]: { x: 540, y: 240 },
      },
      world: {
        mode: 'game_dungeon',
        eraAndSetting: '被稱作「迴廊中繼站」的封閉異界空間。',
        climateAndSenses: '極端壓迫的密閉建築感官。',
        powerStructure: '由「主系統」發布計分任務與執行抹殺判定。',
        taboos: '嚴禁在寫作時擅自替角色添加未登記道具或漏洞。',
        locations: ['中繼站 7 號安全屋', '聖瑪麗療養院（副本一）'],
        atmosphereImage:
          '/src/assets/images/world_atmosphere_noir_1795605807183.jpg',
        gameSystem: {
          systemName: '零號迴廊計分系統',
          coreMechanics: '累計積分達到目標分數才可解鎖出口；違規即扣分。',
          systemVoiceTone: '冷漠簡潔的機械文字提示。',
          currencyAndPenalty: '低於 0 分直接抹殺。',
          dungeons: [
            {
              id: d1,
              code: 'DUN-01',
              name: '霧鎖聖瑪麗療養院',
              difficulty: '★★★★☆',
              clearCondition: '累計 500 分並找出院長遺囑。',
              deathPenaltyAndTaboos: '凌晨兩點後不可照鏡子（違者 -100 分）。',
              environmentNotes: '濃霧封閉空間',
              bossOrAnomaly: '無面值夜護士長',
            },
          ],
        },
      },
      contentSettings: {
        proseStyle: '高壓緊張的副本推理與有質感的感官描寫。',
        sensualLevel: 'intense',
        darknessLevel: 'morally_grey',
        strictCanonLock: true,
        antiBlandnessRules: [
          '通關積分必須精確累計，不可寫到一半忘記分數',
          '嚴禁擅自增加未設定的道具或機關幫主角開掛',
        ],
        customDirectives: '',
      },
      branches: [
        {
          id: 'main',
          code: 'MAIN',
          title: '共同主線：登錄副本',
          parentBranchId: 'main',
          forkTimelineOrder: 0,
          endingTone: '共同起點',
          divergencePremise: '進入副本的共同開篇。',
          status: 'writing',
        },
      ],
      chapters: [
        {
          id: `ch_${Date.now()}_1`,
          number: 1,
          timelineOrder: 10,
          timelineLabel: 'Day 1 · 21:00',
          branchId: 'main',
          dungeonId: d1,
          dungeonScore: {
            currentScore: 0,
            targetClearScore: 500,
            sanOrHp: 'SAN 100 / 正常',
            scoreLog: [],
          },
          actTitle: '副本一',
          title: '病床號 404',
          povCharacterId: firstCharId,
          status: 'drafting',
          targetWords: 3000,
          summary: '在濃霧中睜開眼，確認副本計分門檻與初始線索。',
          beats: [],
          content: '',
          updatedAt: now,
        },
      ],
      memories: [],
    };
  }

  return {
    id,
    title: title.trim() || '未命名長篇手稿',
    subtitle: '在此寫下這部作品的核心命題與平行分支構想',
    genreNote: '文學寫實 · 多重結局',
    coverImage: '/src/assets/images/novel_cover_chiaroscuro_1795605807325.jpg',
    autoExtractOnGenerate: true,
    targetTotalWords: 50000,
    updatedAt: now,
    characters: [
      {
        id: firstCharId,
        name: '主角一',
        alias: '第一視角',
        role: '核心敘事者',
        ageOrPresence: '描述外在年齡、氣質與神態細節',
        sensorySignature: '身上獨特的氣味、習慣動作或聲音線條',
        coreTraits: '核心性格底色',
        invariants: ['寫下一條跨所有平行世界都絕不可改變的人設底線'],
        surfacePersona: '在他人面前展現的日常形象',
        hasDarkSide: false,
        darkShadow: '',
        secretDesire: '內心最真實的渴望或追求',
        povVoiceStyle: '此視角獨有的敘事語調與觀察焦點',
        relationships: '與其他角色的互動關係',
        accentColor: '#9F1239',
      },
    ],
    supportingCharacters: [],
    relationshipEdges: [],
    nodePositions: {
      [firstCharId]: { x: 380, y: 240 },
    },
    world: {
      mode: 'literary',
      eraAndSetting: '設定故事發生的時代與空間',
      climateAndSenses: '描述氣味、濕度與光影',
      powerStructure: '誰掌握資源、權力或秘密',
      taboos: '這個世界不可觸碰的禁忌',
      locations: ['核心場景一'],
      atmosphereImage:
        '/src/assets/images/world_atmosphere_noir_1795605807183.jpg',
      gameSystem: {
        systemName: '遊戲系統名稱',
        coreMechanics: '',
        systemVoiceTone: '',
        currencyAndPenalty: '',
        dungeons: [],
      },
    },
    contentSettings: {
      proseStyle: '精煉、具感官顆粒感與心理張力的現代文學筆法',
      sensualLevel: 'explicit_literary',
      darknessLevel: 'shadows',
      strictCanonLock: true,
      antiBlandnessRules: [
        '禁止空洞的情緒形容詞總結',
        '嚴守角色不變鐵則與既定設定，禁止臨時加設定',
      ],
      customDirectives: '',
    },
    branches: [
      {
        id: 'main',
        code: 'MAIN',
        title: '共同主線',
        parentBranchId: 'main',
        forkTimelineOrder: 0,
        endingTone: '主線幹道',
        divergencePremise: '各條平行結局共同承接的前置主線。',
        status: 'writing',
      },
    ],
    chapters: [
      {
        id: `ch_${Date.now()}_1`,
        number: 1,
        timelineOrder: 10,
        timelineLabel: '序幕 · 第一日',
        branchId: 'main',
        dungeonScore: {
          currentScore: 0,
          targetClearScore: 500,
          sanOrHp: '正常',
          scoreLog: [],
        },
        actTitle: '共同主線',
        title: '序章',
        povCharacterId: firstCharId,
        status: 'outline',
        targetWords: 2500,
        summary: '第一章的核心衝突與感官開場。',
        beats: [],
        content: '',
        updatedAt: now,
      },
    ],
    memories: [],
  };
}
