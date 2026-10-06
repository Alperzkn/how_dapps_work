import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[swap]]'ı -> "swap"'ı.
// Numbers come from the simulator's defaults: a 1,000 ETH / 2,000,000 USDC pool, a 40,000 USDC buy,
// 1% tolerance, 10 USDC of attacker gas.

const content: LessonContent = {
  labels: {
    nameYou: 'Sen',
    nameB: 'B kişisi',
    nameC: 'C kişisi',
    pending: 'swap işlemin, bekliyor',
    mempool: 'herkese açık mempool',
    hidden: 'görülecek bir şey yok',
    bot: 'searcher botu',
    tunnel: 'builder\'lara özel yol',
    nextBlock: 'sıradaki block',
    block: 'block',
    first: 'ilk çalışır',
    last: 'son çalışır',
    bigSwap: 'büyük swap',
    back: 'back-run',
    front: 'front-run',
    yourSwap: 'senin swap\'ın',
    noAttack: 'saldırmaya değmez',
    poolPrice: 'havuz fiyatı',
    magnified: 'seviye değişimi 8 kat büyütüldü',
    market: 'dış piyasa',
    minLine: 'kabul ettiğin en az miktar',
    quote: 'teklif edilen',
    searchers: 'searcher\'lar',
    users: 'kullanıcılar',
    builders: 'builder teklifleri',
    relay: 'relay',
    localBuild: 'block\'u kendi kurar',
    proposer: 'proposer',
    inBand: 'ücret bandının içinde',
    yes: 'evet',
    no: 'hayır',
    tMempool: 'Dene: tutarı değiştir, botun ne okuduğuna bak',
    cTrade: 'Ödediğin',
    cReads: 'Herkes okuyabilir',
    cMinOut: 'En az alınacak',
    cImpact: 'Price impact',
    cWorth: 'Saldırmaya değer mi?',
    tOrder: 'Dene: işlemini kaydır, sonra sırayı bahşiş belirlesin',
    cEarlier: 'öne al',
    cLater: 'geriye al',
    cByTip: 'Bahşişe göre sırala',
    cTip: 'Bahşişin',
    cYouGet: 'Aldığın',
    cVsFirst: 'ilk olmaya göre',
    cYourSlot: 'Sıran',
    tArb: 'Dene: piyasayı oynat, sonra back-run yap',
    cMarket: 'Dış fiyat',
    cBackrun: 'Back-run yap',
    cReset: 'Havuzu sıfırla',
    cPoolPrice: 'Havuz fiyatı',
    cGap: 'Havuz / piyasa farkı',
    cArbTrade: 'En iyi işlem',
    cProfitOpen: 'Bekleyen kâr',
    cProfitTaken: 'Alınan kâr',
    tSandwich: 'Dene: işlemi küçült ya da havuzu derinleştir',
    cDepth: 'Havuz',
    cStage: 'Havuzu şu andan sonra göster',
    cStageYou: 'senin swap',
    cStage0: 'Başlangıç',
    cAlone: 'Tek başına alırdın',
    cYouLose: 'Kaybın',
    cAttacker: 'Saldırgan',
    sImpossible: 'yer yok',
    sAttacked: 'sandwich yedin',
    sUnprofitable: 'değmez',
    sPrivate: 'gizli',
    tSlip: 'Dene: aralığı daralt ya da gas maliyetini artır',
    cTol: 'Tolerans',
    cGas: 'Saldırgan gas',
    cFront: 'Front-run tutarı',
    cStatus: 'Sonuç',
    tDef: 'Dene: işlemi gizle ya da parçalara böl',
    cPrivate: 'Gizli gönder',
    cParts: 'Parça sayısı',
    tPbs: 'Basit model: bir block\'un değeri kimde kalır?',
    cBoost: 'Dış builder\'lar',
    cValue: 'Block\'un değeri',
    cBuilders: 'Builder sayısı',
    cProposerGets: 'Proposer alır',
    cBuilderKeeps: 'Builder\'da kalan',
    cShare: 'Proposer\'ın payı',
  },
  steps: {
    mempool: {
      title: 'Takasın, gerçekleşmeden önce herkese açıktır',
      alt: 'Soldaki kişi bir takas göndermiş. İşlem, "herkese açık mempool" yazan açık bir tepside parlayan bir paket olarak bekliyor. Tepsinin arkasındaki küçük robot, yani searcher botu, doğrudan pakete bakıyor. Sağda üç bölmeli boş bir block ve takasın yapılacağı havuz var.',
      body: {
        beginner: `"Takas yap" düğmesine bastığında hemen bir şey olmaz. Emrin önce sırasını beklemek üzere bir bekleme odasına gönderilir; bu odaya [[mempool]] denir. Ağdaki her bilgisayar içine bakabilir.

Kalabalık bir pazarda şöyle bağırdığını düşün: "Birazdan çok elma alacağım ve en fazla şu kadar öderim!" Bunu duyan herkes senden önce davranabilir.

Herkese açık bir blockchain üzerinde durum tam olarak budur. Bot denen programlar bekleyen her emri gün boyu okur. Kaydırıcıyı oynat: emir büyüdükçe onların daha çok ilgisini çeker.`,
        intermediate: `Bir [[swap]], bir [[transaction]]'dır. Sen imzaladıktan sonra [[wallet]]'ın onu bir [[node]]'a verir, [[node]]'lar da [[gossip]] ile birbirine iletir. Bir [[block]]'a girene kadar [[mempool]]'da bekler ve [[node]] çalıştıran herkes onu okuyabilir. Ethereum'da 12 saniyede bir yeni [[block]] gelir; yani tepki vermek için zaman vardır.

İzleyen biri her şeyi okuyabilir: hangi [[liquidity-pool]], hangi yön, ne kadar ve kabul edeceğin en düşük miktar.

Örnekte, 1.000 ETH ve 2.000.000 USDC tutan bir havuzdan ETH almak için 40.000 USDC ödüyorsun. Kendi işlemin fiyatı yaklaşık %2,2 oynatacak ([[price-impact]]); üstüne %1 [[slippage]] payı bırakıyorsun. Panel sonucu gösteriyor: bir [[searcher]] bu takastan aşağı yukarı 335 USDC alabilir. Tutarı 5.000 USDC'ye indir; uğraşmaya değmez hale gelir.`,
        expert: `Tek bir [[mempool]] yoktur. Her [[node]] bekleyen işlemleri kendi havuzunda tutar ve eşlerine iletir; bir [[searcher]], bağlantısı iyi [[node]]'lardan bekleyen işlemlere abone olur (\`eth_subscribe("newPendingTransactions")\`) ve her birini en güncel durum üzerinde simüle eder.

Router üzerinden yapılan bir takas bütün niyetini [[calldata]] içinde taşır: \`amountIn\`, \`amountOutMin\`, \`path\`, \`to\` ve \`deadline\`. [[searcher]], \`amountIn\` ile havuzun [[reserves]] değerlerinden işlem sonrası fiyatı; \`amountOutMin\` değerinden de ne kadar kötü bir fiyatı hâlâ kabul edeceğini tam olarak bilir.

Terim, *Flash Boys 2.0* makalesinden gelir (Daian ve diğerleri, 2019). Makale, [[dex]]'lerde sıralama için yarışan botları ölçmüş ve olguya "miner extractable value" adını vermiştir. Ethereum [[proof-of-stake]]'e geçtiğinden beri M harfi "maximal" diye okunur: [[mev]], bir [[block]] üretilirken işlemleri dahil ederek, dışarıda bırakarak ve yeniden sıralayarak, standart [[block]] ödülü ile [[gas-fee]]'lerin ötesinde elde edilebilecek değerdir.`,
      },
    },
    ordering: {
      title: 'Bloğu sıralayan, kimin önce gideceğine karar verir',
      alt: 'Üç bölmeli bir block içinde üç paket var: parlayan seninki ve diğer iki kişinin gri paketleri. Her paketin üzerinde sahibinin ne aldığı yazıyor. Yandaki havuz, üç takastan sonraki seviyelerini gösteriyor.',
      body: {
        beginner: `Üç kişi aynı havuzla takas yapmak istiyor. Havuz her takastan sonra fiyatını değiştirir; bu yüzden **sıra önemlidir**. Biri senden hemen önce alım yaparsa sen daha pahalıya alırsın.

Oklarla kendi işlemini bloğun içinde yukarı aşağı taşı. Emrin birebir aynı kaldığı halde "Aldığın" değerinin değiştiğini izle.

Sıraya kim karar verir? Bloğu bir araya getiren. Ona ödeme de yapılabilir: "Bahşişe göre sırala" seçeneğini aç ve ilk sıraya geçene kadar bahşişini artır. Sırayı seçerek kazanılabilecek bu ek paranın bir adı var: [[mev]].`,
        intermediate: `Zincirin kuralları hangi [[transaction]]'ların geçerli olduğunu söyler. Bir [[block]]'un onları hangi sırayla dizeceğini söylemez. Bu seçim bloğu kurana aittir ve para eder.

Burada B kişisi 60.000 USDC ile ETH alıyor, C kişisi 30 ETH satıyor. Senin 40.000 USDC'n için:

- blokta ilk sıradaysan: 19,55 ETH;
- B'nin alımının hemen ardındaysan: 18,44 ETH, yaklaşık %5,7 daha az;
- C'nin satışının hemen ardındaysan: 20,73 ETH, yaklaşık %6 daha fazla.

[[mev]], işlemleri dahil etme, dışarıda bırakma ve yeniden sıralama gücünden doğan değerdir. Bu değeri üç rol paylaşır. [[searcher]] fırsatı bulur. [[block-builder]], kurabileceği en değerli [[block]]'u kurar. O [[slot]] için seçilen [[validator]], yani [[proposer]], bir [[block]] seçip imzalar.

"Bahşişe göre sırala" açıkken yer, en yüksek öncelik ücretini verene gider. Sıra için böyle teklif verilir: [[eip-1559]] ile taban ücret yakılır, bahşiş ise [[block]]'u üretende kalır.`,
        expert: `Protokol bir [[block]]'un işlemlerini sırayla doğrular ama sıranın kendisini üreticiye bırakır. Dolayısıyla duruma bağlı her getiri, burada değişen [[reserves]] üzerinde \`getAmountOut\`, konumun bir fonksiyonudur.

Sıra için teklif verme önce açıkta yapılıyordu. *Flash Boys 2.0*, "priority gas auction" denen yarışları belgeledi: botlar birbirinin önüne geçmek için bekleyen işlemlerini tekrar tekrar daha yüksek [[gas]] fiyatıyla yeniliyordu. Bu, açık ve sürekli bir açık artırmaydı; kaybedenler de zincire giriyor ve geri alınan bir işlemin ücretini ödüyordu.

Bu yarışın büyük kısmı o günden beri açık ağın dışına taşındı. Bir [[searcher]], birlikte dahil edilecek ya da hiç edilmeyecek sıralı bir işlem listesini, yani bir "bundle"'ı, doğrudan [[block-builder]]'lara gönderir; ödemeyi öncelik ücretiyle ya da "builder"'ın ücret adresine doğrudan transferle yapar. Kaybeden "bundle"'lar bloğa girmez; yani açık artırma kapalı zarfla yapılır ve başarısızlığın maliyeti yoktur. "Builder"'lar genellikle "bundle"'ları bloğun en başına koyar, kalanını [[mempool]]'dan öncelik ücretine göre doldurur.

Simülatör üç takası %0,3 ücretle sırayla uygular: \`out = 0.997·dx·y / (x + 0.997·dx)\`; her birinden sonra \`x\` ve \`y\` güncellenir.`,
      },
    },
    backrun: {
      title: '"Back-running": arbitraj havuzu dürüst tutar',
      alt: 'Blokta büyük bir takas duruyor; düğmeye basılınca hemen arkasındaki bölmede yeşil bir back-run paketi beliriyor. Sağda havuz, onun arkasında da dış piyasa fiyatını gösteren bir ekran var. Havuz yeniden hizalanınca havuz fiyatı etiketi kırmızıdan normale dönüyor.',
      body: {
        beginner: `Bir havuz, ETH'nin başka yerde kaç para olduğunu bilmez. Yalnızca kendi içindekini bilir. Büyük bir takastan sonra ya da piyasa hareket ettiğinde havuzun fiyatı düpedüz yanlıştır.

Bunu düzelten kişi kâr eder: ucuz olan yerden alır, pahalı olan yerde satar. Buna [[arbitrage]] denir. Bunu, farkı yaratan işlemin hemen ardından yapmaya ise [[back-running]] denir.

Dış fiyatı havuzun fiyatından uzaklaştır, sonra "Back-run yap" düğmesine bas. Havuz piyasaya doğru geri döner, aradaki fark bota kalır. Bu yüzden kimsenin takası kötüleşmedi. Havuz fiyatları gerçek fiyatlara böyle yakın kalır.`,
        intermediate: `Bir [[amm]]'in fiyat kaynağı yoktur. Fiyatı, [[reserves]] değerlerinin oranıdır ve yalnızca biri işlem yaptığında değişir. Bu yüzden havuz ile geniş piyasa ne zaman ayrışsa, havuzu yeniden hizaya sokan kişiyi bedava para bekler.

[[back-running]], belirli bir işlemin yarattığı fırsatı yakalamak için kendi işlemini onun **hemen arkasına** yerleştirmektir. [[front-running]]'den farklı olarak öndeki kişinin aldığı miktarı değiştirmez.

Havuz 2.000'de, dış piyasa 2.080'deyken dene:

- en iyi işlem, 36.656 USDC ile yaklaşık 17,9 ETH almaktır;
- bu, havuzu 2.080'e değil, yaklaşık 2.074'e getirir;
- kâr, [[gas]] öncesi yaklaşık 670 USDC'dir.

2.074'te durmasının nedeni %0,3'lük ücrettir: piyasa fiyatının ±%0,3 çevresindeki bantta hiçbir işlem kâr etmez. Dış fiyatı 2.000 ya da 2.005 yap; düğme devre dışı kalır.

Bu kâr herkes için bedava değildir. Havuzdan, yani [[liquidity-provider]]'ların cebinden çıkar.`,
        expert: `Ücret çarpanı \`γ = 0.997\` olan bir \`(x, y)\` havuzu ve \`P\` dış fiyatı (x başına y) için, havuza x satan arbitrajcı \`max_Δx  γ·Δx·y/(x + γ·Δx) − P·Δx\` problemini çözer. Birinci derece koşulu \`γ·x·y / (x + γ·Δx)² = P\` şunu verir:

\`Δx = (√(γ·x·y / P) − x) / γ\`

Alım yönünde de simetrik olarak \`Δy = (√(γ·x·y·P) − y) / γ\`. Bunlar yalnızca havuz fiyatı \`[γ·P, P/γ]\` aralığının dışındaysa pozitiftir; bu aralık arbitrajsız banttır ve işlem bandın kenarında biter.

Uygulamada "back-run"'lar \`[hedef tx, benim tx]\` biçiminde "bundle" olarak gönderilir; böylece [[searcher]]'ın işlemi ya hedefin hemen arkasına girer ya da hiç girmez. "Order-flow auction"'lar da aynı kalıbı kullanır: kullanıcının işlemi kısmen açıklanır, [[searcher]]'lar onu "back-run" etme hakkı için teklif verir ve teklifin büyük kısmı kullanıcıya iade edilir.

LP'ler için likidite sağlamanın ana maliyeti budur. Milionis, Moallemi, Roughgarden ve Zhang buna "loss-versus-rebalancing" (LVR) der: havuz, kendisinden daha iyi bilgilenmiş arbitrajcılara karşı hep bayat bir fiyattan işlem yapar. Ücretsiz bir "constant product" havuzunda LVR, birim zamanda havuz değerinin \`σ²/8\`'i hızında birikir; \`σ\` volatilitedir. Bu, yalnızca fiyatın nereye vardığına bağlı olan [[impermanent-loss]]'tan ayrı bir şeydir.`,
      },
    },
    sandwich: {
      title: '"Sandwich": bir işlem önünde, bir işlem arkanda',
      alt: 'Blokta artık sırayla üç paket var: kırmızı bir front-run, senin turuncu takasın, kırmızı bir back-run. Mempool\'un arkasındaki searcher botunun gözü kırmızı ve bekleyen takasına kesikli bir çizgiyle bakıyor. Sağdaki havuz, bloğun seçilen anındaki seviyelerini gösteriyor.',
      body: {
        beginner: `Şimdi zararlı olan türü. Bot, ETH alma emrini görür ve aynı blokta iki şey yapar:

- **senden hemen önce** ETH alır; bu fiyatı yükseltir;
- **sen** o yüksek fiyattan alırsın ve fiyatı biraz daha yükseltirsin;
- **senden hemen sonra** aldığını, senin oluşturduğun fiyattan satar.

Senin takasın sandviçin içi, botun iki işlemi ise ekmeğidir. Buna [[sandwich-attack]] denir. Eline daha az ETH geçer; aradaki fark botun kârıdır.

1, 2 ve 3'e basarak bloğu adım adım gez ve havuzu izle. Sonra işlemini küçült ya da havuzu büyüt: bot uğraşmayı bırakır.`,
        intermediate: `[[front-running]], bilinen bir bekleyen işlemden kâr etmek için onun önüne bir işlem sokmaktır. [[sandwich-attack]] ise tek bir [[swap]]'ın çevresine yerleştirilen bir "front-run" ile ona eş bir "back-run"'dır.

Varsayılan değerlerle (40.000 USDC ödüyorsun, havuzda 1.000 ETH ve 2.000.000 USDC var, tolerans %1):

- tek başına 19,55 ETH alırdın;
- bot önce yaklaşık 10.190 USDC ile alım yapar;
- sen 19,35 ETH alırsın: yaklaşık 0,2 ETH, yani kabaca 390 USDC daha az;
- bot ETH'sini geri satar ve 10 USDC [[gas]] sonrası yaklaşık 335 USDC kâr eder.

Kaybettiğinin hepsi bota ulaşmaz: botun iki işlemi de havuzun %0,3'lük ücretini öder ve bu ücret [[liquidity-provider]]'lara gider.

İki şey bir "sandwich"'in değerini düşürür. **Daha küçük bir işlem** fiyatı daha az oynatır, yakalanacak şey azalır: bu havuzda 5.000 USDC, fiyatı ücretlerin tutarından daha az oynatır. **Daha derin bir havuz** da aynı etkiyi yapar. İki kaydırıcıyı da dene.`,
        expert: `Kurban, \`(x, y)\` rezervlerine \`v\` satsın ve asgari çıktısı \`m\` olsun. Saldırgan bir "front-run" tutarı \`a\` seçer:

- "front-run": \`b = out(a; x, y)\`, rezervler \`(x + a, y − b)\` olur;
- kurban: \`o(a) = out(v; x + a, y − b)\`, koşul \`o(a) ≥ m\`;
- "back-run": \`b\`, ters çevrilmiş rezervlere satılır ve \`a'\` alınır.

Kâr \`a' − a − gas\`'tır. \`o(a)\`, \`a\` arttıkça monoton azalır; bu yüzden koşul bir üst sınır \`a_max\` verir; burada ikiye bölme yöntemiyle bulunur. Kâr, saldırganın gidiş dönüşte ödediği %0,6 ücret elde ettiği ek fiyat farkını aşana kadar \`a\` ile artar; bu ise gerçekçi her toleransın çok ötesinde olur. Dolayısıyla uygulamada en iyi nokta \`a = a_max\`'tır ve kurbanın eline tam olarak \`amountOutMin\` geçer.

Bir "sandwich"'in kârlı olabilmesi için kurbanın kendi [[price-impact]]'i gidiş dönüş ücretini aşmalıdır: kabaca \`(1 + impact)·γ² > 1\`. Derin havuzlardaki küçük işlemlere tolerans ne olursa olsun bu yüzden dokunulmaz.

İki ayrı işlem olarak gönderilirse saldırı atomik değildir: "front-run" kurban olmadan bloğa girebilir. Bu yüzden [[searcher]]'lar \`[front-run, kurban tx, back-run]\` üçlüsünü tek bir "bundle" olarak gönderir; [[block-builder]] onu ya bütün olarak dahil eder ya da hiç etmez.`,
      },
      code: {
        lang: 'TypeScript (bu dersin simülatörü, kısaltılmış)',
        source: `// out(dx; x, y) = 0.997·dx·y / (x + 0.997·dx)          (Uniswap v2 getAmountOut)
function trySandwich(x, y, victimIn, a) {
  const s1 = swapV2(x, y, a);                 // front-run: saldırgan alır
  const s2 = swapV2(s1.x, s1.y, victimIn);    // kurban, daha kötü fiyattan
  const s3 = swapV2(s2.y, s2.x, s1.out);      // back-run: saldırgan hepsini satar
  return { victimOut: s2.out, gross: s3.out - a };
}

// 1. kurbanı amountOutMin'in üzerinde tutan en büyük front-run
let lo = 0, hi = aUpperBound;
for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2;
  if (trySandwich(x, y, victimIn, mid).victimOut >= minOut) lo = mid; else hi = mid;
}
// 2. [0, lo] içindeki en kârlı tutar; yalnızca gross - gas > 0 ise saldır`,
      },
    },
    slippage: {
      title: '"Slippage" toleransı, açık bıraktığın aralıktır',
      alt: 'Blok ve havuz öncekiyle aynı. Sağda uzun bir sütun duruyor: tepesi sana teklif edilen miktar, aşağıdaki koyu plaka kabul ettiğin en az miktar, tepedeki kırmızı dilim ise saldırganın aldığı pay. Dilim tam plakaya kadar iniyor.',
      body: {
        beginner: `Takas yaparken, ne kadar daha kötü bir sonucu hâlâ kabul edeceğini de söylersin. Bu paya [[slippage-tolerance]] denir. Var olmasının iyi bir nedeni var: sen beklerken fiyatlar oynar ve bu pay olmasa pek çok takas başarısız olurdu.

Ama sağdaki sütuna bak. Tepesi sana söz verilen miktar. Koyu plaka, kabul edeceğini söylediğin en az miktar. İkisinin arası açık bıraktığın bir aralık; kırmızı dilim de o aralığı plakaya kadar dolduran bot.

Toleransı düşür: plaka yükselir, kırmızı dilim küçülür. Bir noktada botun kârı masrafını karşılamaz ve seni rahat bırakır. Ama fazla sıkarsan, sıradan bir fiyat oynaması takasının başarısız olmasına yeter.`,
        intermediate: `[[slippage]], fiyatın teklif anı ile gerçekleşme anı arasındaki değişimidir. Senin [[slippage-tolerance]] değerin [[transaction]]'ın içinde bir sayıya dönüşür: asgari çıktı. Havuz daha azını verecekse takas geri alınır ve yalnızca [[gas-fee]] kaybedersin.

Saldırgan için bu asgari değer bir hedeftir. En iyi [[sandwich-attack]], fiyatı senin eline tam asgari miktar geçecek kadar iter. Varsayılan değerlerle:

- %1 tolerans: sen yaklaşık 0,196 ETH kaybedersin, botun net kârı yaklaşık 335 USDC;
- %0,5: sen yaklaşık 0,098 ETH kaybedersin, botun neti yaklaşık 160 USDC;
- %0,1: sen yaklaşık 0,020 ETH kaybedersin, botun neti 10 USDC [[gas]] sonrası yaklaşık 25 USDC;
- %0,1'de saldırganın [[gas]] maliyetini 40 USDC'ye çıkar; saldırı artık kâr etmez.

Yani tolerans körü körüne küçültülecek bir ayar değil, bir dengedir. Fazla gevşekse büyük bir ödül sunarsın. Fazla sıkıysa başkalarının işlemlerinden gelen olağan hareket takasını başarısız kılar; bu da [[gas]] ve zaman kaybıdır. Tolerans, kendi [[price-impact]]'ini kapsamaz: o zaten teklifin içindedir.`,
        expert: `v2 router'ında tolerans \`amountOutMin = teklif · (1 − tolerans)\` olur ve gerçekleşme anındaki [[reserves]] değerlerinden hesaplanan çıktıyla karşılaştırılır: \`require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT')\`. v3 router'ında aynı kontrol \`amountOutMinimum\` adıyla vardır; kesin bir fiyat sınırı için ayrıca \`sqrtPriceLimitX96\` bulunur.

En iyi "front-run" kurbanı sınıra kadar ittiği için, saldırı kârlı olduğu sürece kurbanın kaybı havuz derinliğinden bağımsız olarak \`tolerans × teklif\`'tir. Derinlik ve işlem büyüklüğü yalnızca saldırının kârlı *olup olmadığını* ve kaybın ne kadarının ücret ve [[gas]] sonrası saldırganda kaldığını belirler.

\`deadline\` başka bir riski karşılar. İmzalı bir takas bloğa girene kadar geçerli kalır; \`deadline\` olmasa, saatlerce bekleyen bir işlem sonradan, piyasa değişmiş ve onu eski \`amountOutMin\` değeriyle gerçekleştirmek bir başkası için kârlı hale gelmişken dahil edilebilir. \`ensure(deadline)\`, \`block.timestamp\` bu değeri geçtiğinde işlemi geri alır.

Aceleyle yazılmış kontratlarda ve botlarda sık görülen \`amountOutMin = 0\` ise sınırı tümden kaldırır: saldırganı durduran tek şey kendi ödediği ücretler olur.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Router02.sol)',
        source: `modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
    _;
}

function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,          // teklif * (1 - slippage toleransı)
    address[] calldata path,
    address to,
    uint deadline
) external virtual override ensure(deadline) returns (uint[] memory amounts) {
    amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin,
            'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, to);
}`,
      },
    },
    defences: {
      title: 'Savunmalar: alınacak şeyi azalt ya da gözden uzak dur',
      alt: '"Gizli gönder" açıkken kalın yeşil bir çizgi takasını senden alıp mempool\'un çevresinden dolaştırarak doğrudan bloğa taşıyor; mempool tepsisinde "görülecek bir şey yok" yazıyor ve botun gözü sönük. Blokta yalnızca senin takasın var. Seçenek kapalıyken ve işlem bölünmüşken blokta daha küçük bir paket duruyor; çevresinde kırmızı paketler olabilir de olmayabilir de.',
      body: {
        beginner: `İki tür savunma var.

**Alınacak şeyi azalt.** Daha sıkı bir tolerans, daha küçük bir işlem ya da büyük bir işlemi birkaç küçük parçaya bölmek. "Parça sayısı"nı artır: her parça daha küçük bir ödüldür ve bir noktadan sonra hiçbiri botun masrafına değmez.

**Gözden uzak dur.** "Gizli gönder"i işaretle. Takasın herkese açık bekleme odasını atlar ve doğrudan blokları kuranlara gider. Bot göremediği şeye saldıramaz.

İkisi de kusursuz değildir. Gizli göndermek, gönderdiğin tarafa güvenmek demektir. İşlemi parçalara bölmek ise daha çok ücret ve daha çok zaman demektir. Bu savunmalar sorunu küçültür; ortadan kaldırmaz.`,
        intermediate: `Simülatörün gösterdikleri:

- **Daha sıkı [[slippage-tolerance]]**: önceki adımdaki gibi daha dar bir aralık.
- **Bölmek**: varsayılan değerlerle 5 parçanın her biri yine "sandwich" yer ama botun toplam kârı yaklaşık 335'ten yaklaşık 48 USDC'ye düşer; 10 parçada hiçbir parça saldırmaya değmez. Her parça için [[gas]] ödersin; simülatör de parçalar arasında [[arbitrage]]'ın havuzu eski haline getirdiğini varsayar.
- **[[private-mempool]]**: takas, [[gossip]] ile yayılmak yerine özel bir [[rpc]] uç noktası üzerinden [[block-builder]]'lara gider. Bir [[block]]'a girene kadar açıktaki hiçbir bot onu görmez. Karşılığında o uç noktaya ve "builder"'lara, işlemi sömürmeyecekleri ve sızdırmayacakları konusunda güvenirsin; ayrıca işlemi yalnızca o "builder"'lar dahil edebildiği için bloğa girmesi uzayabilir.

Üst düzeyde başka yaklaşımlar:

- **"Order-flow auction"**: [[searcher]]'lar takasını [[back-running]] ile izleme hakkı için teklif verir ve teklifin büyük kısmı sana döner.
- **"Batch auction"**: emirler kısa bir süre toplanır ve çift başına tek bir fiyattan birlikte kapatılır; toplu işlemin içindeki sıra hiçbir şey ifade etmez. Yarışan "solver"'lar en iyi kapanışı arar.
- **[[limit-order]] ya da [[twamm]]**: fiyatını sabitler ya da büyük bir emri çok sayıda [[block]]'a yayar.

Bunların hepsi [[mev]]'i azaltır. Hiçbiri yok etmez: değer, emri artık ilk gören kimse ona kayar.`,
        expert: `**Özel emir akışı.** Flashbots Protect gibi servisler işlemleri RPC üzerinden kabul eder ve açık [[mempool]] yerine "builder"'lara iletir; işlem yalnızca geri alınmayacaksa bloğa girer, yani başarısız denemeler bir şeye mal olmaz. Güven varsayımı açıktır: operatör ve işlemi paylaştığı her "builder" onu açık haliyle görür. İşlemi görebilen ve bloğu sıralayabilen biri onu yine "sandwich" edebilir; koruma kriptografik değil, itibara ve sözleşmeye dayalıdır.

**"Order-flow auction".** MEV-Share, bekleyen bir işlem hakkında seçilmiş ipuçlarını açıklar; [[searcher]]'lar onu "back-run" eden kısmi "bundle"'lar gönderir ve ortaya çıkan ödemenin ayarlanabilir bir payı kullanıcıya iade edilir (Flashbots belgelerine göre varsayılan %90). Şimdilik yalnızca "back-run" kabul eder.

**"Batch auction" ve "intent".** CoW Protocol'de kullanıcılar bir [[transaction]] değil, limit fiyatlı bir "intent" imzalar. "Solver"'lar bir toplu işlemi kapatmak için yarışır; aynı açık artırmada aynı çiftte aynı yöndeki emirler tek bir fiyattan kapanır ve bu, toplu işlem içindeki sırayı anlamsız kılar. Zıt yönlü emirler bir [[amm]]'e hiç dokunmadan birbiriyle eşleştirilebilir. Sınır yine kullanıcının limit fiyatıdır: güvence zincir üstü bir sıralama kuralından değil, "solver" rekabetinin sonucundan gelir.

**Bir v4 [[hook]]'u ne yapabilir, ne yapamaz.** [[hook]] takasın içinde çalışır; bu yüzden ilk olmanın fiyatını değiştirebilir: volatiliteyle ya da işlemin öncelik ücretiyle yükselen bir [[dynamic-fee]] ya da arbitrajın bir kısmını LP'lere geri veren bir mantık. Bekleyen bir işlemi gizleyemez ve işlemin blokta nereye düşeceği konusunda söz hakkı yoktur. [[hook]]'lar kendi havuzlarındaki [[mev]]'i kimin kazanacağını yeniden biçimlendirir; sıralama "builder"'da kalır.`,
      },
    },
    pbs: {
      title: 'Bloklar bugün nasıl kuruluyor',
      alt: 'Soldan sağa bir tedarik zinciri: kullanıcılar ve bir searcher botu emirlerini bir sıra builder\'a gönderiyor; her builder\'ın yanında teklifini gösteren bir çubuk var. Kazanan builder\'ın bloğu yuvarlak bir relay\'den geçip üstünde paralar duran bir sütuna, yani proposer\'a ulaşıyor. Dış builder\'lar kapatılınca kullanıcılardan doğrudan proposer\'a kesikli bir çizgi gidiyor.',
      body: {
        beginner: `"Bloğu bir araya getiren" kim? Bugün çoğu zaman iki ayrı taraf.

Kârlı bir [[block]] kurmak uzmanlık işidir: hızlı bilgisayarlar, akıllı yazılım ve [[searcher]]'larla anlaşmalar gerekir. [[validator]]'ların çoğu buna göre kurulmamıştır. Bu yüzden "builder" denen uzmanlar eksiksiz bloklar hazırlar ve kendi bloklarının kullanılması için **teklif verir**. Sırası gelen [[validator]], yani [[proposer]], en yüksek teklifi alır ve imzalar.

Modelle oyna. Tek "builder" varken değerin çoğu onda kalır. Rakip ekle; teklifler tırmanır ve değer [[proposer]]'a akar. Kurmak ile önermek arasındaki bu ayrım sayesinde bir bloktaki [[mev]]'in çoğu [[validator]]'ların gelirine dönüşür.`,
        intermediate: `Bu ayrıma "proposer-builder separation" (PBS) denir. Ethereum'da bugün protokolün parçası değildir. [[mev-boost]] ile yapılır: bir [[validator]]'ın [[node]]'unun yanında çalıştırdığı, isteğe bağlı açık kaynak bir yazılım.

Elden ele geçen zincir:

- **Kullanıcılar ve [[searcher]]'lar**, işlemleri ve "bundle"'ları "builder"'lara gönderir.
- **[[block-builder]]**, kurabileceği en değerli [[block]]'u kurar ve yanına [[proposer]] için bir teklif koyar.
- **"Relay"** ikisinin arasında durur. Her "builder"'ın bloğunu denetler, [[proposer]]'a yalnızca başlığı ve teklifi gösterir.
- **[[proposer]]**, içeriği görmeden en yüksek teklifli başlığı imzalar; ancak ondan sonra "relay" bloğun tamamını açıklar.

[[proposer]] körlemesine imzalar; böylece "builder"'ın işlemlerini kopyalayıp kârı kendine alamaz.

Bedeli, yoğunlaşma ve güvendir. Blokların büyük bir bölümü bir avuç "builder" ve "relay" üzerinden geçer ve iki taraf da "relay"'e güvenmek zorundadır: [[proposer]] bloğun geçerli olduğuna ve gerçekten açıklanacağına, "builder" ise "relay"'in içeriğini çalmayacağına. Bir [[validator]] bütün bunları atlayıp bloğunu [[mempool]]'dan kendisi de kurabilir.`,
        expert: `[[mev-boost]], "consensus client" için bir "sidecar"'dır ve "builder API"'sini uygular. [[validator]], ücret adresini ve [[gas]] limitini "relay"'lere kaydeder (\`registerValidator\`). Kendi [[slot]]'unda \`getHeader\`, her "relay"'in en iyi \`ExecutionPayloadHeader\` değerini ve teklifini döndürür; [[proposer]] seçtiği başlığın üzerine "blinded" bir "beacon block" imzalayıp gönderir; "relay" ancak ondan sonra içeriği açıklar ve blok yayılır. Aynı [[slot]] için ikinci, farklı bir blok imzalamak [[slashing]] gerektiren bir çift imzadır; bir [[proposer]]'ın içeriği görüp bloğu kendisi için yeniden kurmasını engelleyen şey budur.

"Relay"'e güven iki yönlüdür. [[proposer]]'lar bloğun geçerliliği, teklifin doğruluğu ve verinin erişilebilirliği için "relay"'e dayanır: imzadan sonra içerik açıklanmazsa [[slot]] kaçar. "Builder"'lar ise bloklarının önüne geçilmeyeceğine ve sızdırılmayacağına güvenir. "Relay"'ler ilettiklerini süzebilir de; bu onları bir sansür darboğazı yapar.

İki protokol değişikliği bu varsayımları hedef alır. "Enshrined PBS" (EIP-7732), "builder"'ları protokol içinde stake eden aktörler yapar; teklifleri "beacon chain"'e işlenir ve bir "payload timeliness committee" içeriğin açıklandığını onaylar; böylece güvenilen "relay" ortadan kalkar. Glamsterdam yükseltmesi için seçilmiştir; bunu planlanmış say ve devreye girip girmediğini kontrol et. "Fork-choice enforced inclusion lists" (FOCIL, EIP-7805, taslak) ise bir [[validator]] komitesinin sonraki bloğun içermesi gereken işlemleri listelemesine izin verir; [[attestation]] yapanlar yalnızca buna uyan bloklara oy verir.

Paneldeki, ikinci fiyat mantığıyla çalışan basit bir modeldir: her "builder" bloğun değerinin bir kesrini gerçekleştirebilir ve en iyisi, ikinciyi, tek başınaysa [[proposer]]'ın kendi yerel bloğunu kıl payı geçerek kazanır. Gerçek "builder" marjları özel emir akışına, gecikmeye ve teklif stratejisine bağlıdır.`,
      },
      code: {
        lang: 'HTTP (Ethereum builder API, MEV-Boost\'un kullandığı biçimiyle)',
        source: `# düzenli olarak: relay'lere ödemenin nereye yapılacağını ve gas limitini bildir
POST /eth/v1/builder/validators            # SignedValidatorRegistrationV1[]

# proposer'ın slot'unda: her relay'den en iyi teklifini iste
GET  /eth/v1/builder/header/{slot}/{parent_hash}/{pubkey}
#    -> SignedBuilderBid { header: ExecutionPayloadHeader, value, pubkey }

# yalnızca o başlığı içeren bir block imzala; gövde ancak ondan sonra açıklanır
POST /eth/v1/builder/blinded_blocks        # SignedBlindedBeaconBlock
#    -> relay tam ExecutionPayload'ı açıklar ve block yayılır`,
      },
    },
  },
};

export default content;
