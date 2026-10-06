import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[swap]]'ı -> "swap"'ı.
// Uniswap is a product name: written plainly, never as [[uniswap]] (that would add quotes).

const content: LessonContent = {
  labels: {
    orderBook: 'Order book',
    asks: 'satış',
    bids: 'alış',
    poolReady: 'Pool: her an fiyat verir',
    noSellers: 'satıcı yok: emir dolmaz',
    unfilled: 'dolmadı',
    bookAvg: 'Defter ort.',
    poolAvg: 'Pool ort.',
    filled: 'Dolan',
    buyEth: 'Al',
    depth_busy: 'Dolu',
    depth_thin: 'Sığ',
    depth_empty: 'Boş',
    tryBook: 'Dene: defterin satabileceğinden fazlasını al',
    curve: 'fiyat eğrisi',
    hold: 'elde tut',
    inPool: 'havuzda',
    il: 'Impermanent loss',
    trader: 'Takas yapan',
    in: 'giren',
    out: 'çıkan',
    lp: 'Liquidity provider',
    you: 'Sen',
    others: 'diğer LP\'ler',
    lpToken: 'LP token = pay',
    bothTokens: 'iki token, eşit değerde',
    counted: 'küçük taraf sayılır',
    tryPool: 'Dene: likidite ekle, sonra geri çek',
    deposit: 'Yatır',
    unbalanced: 'Dengesiz yatır',
    remove: 'Likiditeyi çek',
    addBack: 'Yeniden ekle',
    lpTokens: 'LP token',
    share: 'Payın',
    back: 'Geri alırsın',
    gift: 'Diğer LP\'lere kalan',
    fee: '%0,3 ücret havuzda kalır',
    sell: 'Sat',
    impact: 'Price impact',
    minOut: 'En az',
    youGet: 'Alacağın',
    price: 'USDC / ETH',
    arbRun: 'Arbitrage yap',
    arbUndo: 'Geri al',
    arbitrageur: 'Arbitrajcı',
    arbNone: 'kazanç yok',
    arbProfit: 'Arbitrage kârı',
    tryFees: 'Dene: havuzdan takas geçir',
    trades: 'Takas',
    moreTrades: '+20 takas',
    resetTrades: 'Baştan başla',
    volume: 'Hacim',
    income: 'Ücret geliri',
    modeSlip: 'Slippage',
    modeIl: 'Impermanent loss',
    tolerance: 'Tolerans',
    priceMoved: 'Önce fiyat oynar',
    wouldGet: 'Ödeyeceği',
    result: 'Swap',
    goesThrough: 'gerçekleşir',
    reverts: 'revert olur',
    quoted: 'gösterilen',
    minLine: 'en az',
    ilPrice: 'ETH fiyatı',
    breakEven: 'Başa baş için ücret',
    volNeeded: 'gereken hacim',
  },
  steps: {
    orderbook: {
      title: '"Order book" yok',
      alt: 'Solda bir pano var: üstte satış emirleri, altta alış emirleri, aralarında bir boşluk. Önünde bir alıcı duruyor. Sürgü alıcının ne kadar almak istediğini belirliyor: emir satış tekliflerini kullandıkça teklifler sırayla yanıyor; bir düğme de panoyu dolu, sığ ya da boş yapıyor. Sağda, iki token tutan bir havuz aynı emri kendi fiyatından karşılıyor.',
      body: {
        beginner: `Normal bir borsada alıcının bir satıcıya ihtiyacı vardır. İki taraf da istediği fiyatı yazar ve karşı taraftan biri kabul edene kadar bekler. Bekleyen tekliflerin bu listesine [[order-book]] denir.

Uniswap farklı çalışır. Liste de yoktur, bekleme de. Onun yerine içinde iki çeşit [[token]] duran büyük bir kap vardır ve sen o kapla takas yaparsın.

Fiyatını kendi belirleyen bir otomat düşün: bir [[token]] atarsın, diğeri çıkar. Her zaman açıktır ve her takastan sonra fiyatı kendiliğinden ayarlar.

**Dene:** almak istediğin miktarı artır. Panoda emrin satış tekliflerini birer birer tüketir; her biri bir öncekinden biraz daha pahalıdır. Şimdi panoyu *Sığ* ya da *Boş* yap: emir satıcı bulamaz ve bir kısmı karşılanmadan kalır. Sağdaki havuzda ise satıcı hiç bitmez. Ama emir büyüdükçe fiyatına bak: küçük bir kaptan büyük bir alım pahalıya gelir.`,
        intermediate: `Klasik bir borsa, alış emirleriyle ("bid") satış emirlerini ("ask") bir [[order-book]] içinde eşleştirir. Bunun için sürekli emir girip iptal eden çok sayıda aktif katılımcı gerekir; yoksa en iyi alış ile en iyi satış arasındaki fark ("spread") açılır.

Bir [[blockchain]] üzerinde her emir girişi ve her iptal, [[gas-fee]] ödeyen bir [[transaction]] olurdu. Ethereum'da bu fazlasıyla pahalıydı.

Uniswap bir [[dex]]'tir ve [[order-book]] yerine bir [[amm]] ("automated market maker") kullanır: iki [[token]] tutan ve fiyatı bir formülden hesaplayan bir [[smart-contract]]. Karşı tarafta biri çevrimiçi olmasa da herkes, her an, tek bir [[transaction]] ile onunla takas yapabilir.

**Dene.** Sürgü, ETH için verilmiş bir piyasa alım emridir. Dolu panoda 5 ETH ortalama 2.003 USDC'den karşılanır: 4 ETH 2.002'den, 1 ETH 2.006'dan. 40 ETH istersen satışta yalnızca 30 ETH vardır; gerisi karşılanmaz. *Sığ* panoda aynı 5 ETH'nin tanesi yaklaşık 2.199'a gelir; *Boş* panoda ise hiçbir şey alınamaz.

Örnek havuz (100 ETH ve 200.000 USDC) her büyüklükteki emri karşılar, ama buradan 5 ETH'nin tanesi yaklaşık 2.112 USDC tutar. Derin bir [[order-book]], fiyat konusunda küçük bir havuzdan iyidir. Havuzun garanti ettiği şey, her an bir fiyat vermesidir.`,
        expert: `Zincir üzerinde merkezi limit emirli bir [[order-book]], her emir, her iptal ve her eşleşme için bir durum yazması gerektirir; piyasa yapıcılar da her fiyat hareketinde kotasyon yenilemek için ödeme yapmak zorundadır. Saniyelerle ölçülen [[block]] süreleri ve yazma başına [[gas]] maliyetiyle bu, Uniswap çıktığında Ethereum L1 üzerinde uygulanabilir değildi.

Bir [[amm]] bu hassasiyetten vazgeçip sadeliği seçer: likidite pasiftir, fiyat havuzun bakiyelerinin saf bir fonksiyonudur ve bir [[swap]], O(1) depolama yazması yapan tek bir çağrıdır.

Uniswap v2 (Mayıs 2020) üç kontrattan oluşur:

- **Factory**: \`createPair(tokenA, tokenB)\`, her [[token]] çifti için \`CREATE2\` ile tek bir Pair kontratı yükler; böylece çiftin [[address]] değeri zincir dışında hesaplanabilir. \`getPair\` bunu sorgular.
- **Pair**: iki [[reserves]] değerini tutar; \`mint\`, \`burn\`, \`swap\`, \`skim\`, \`sync\` fonksiyonlarını uygular ve kendisi de bir [[erc-20]]'dir (yani [[lp-token]]).
- **Router**: kullanıcının ihtiyaç duyduğu güvenlik kontrollerini ve çok adımlı rotalamayı yapan, durum tutmayan bir yardımcıdır (\`swapExactTokensForTokens\`, \`addLiquidity\`). Pair kimseye güvenmez; yalnızca kendi değişmezini kontrol eder.

v2 çiftleri her zaman [[erc-20]]/[[erc-20]] biçimindedir; [[ether]], Router tarafından WETH olarak sarmalanır. [[token]]'lar adrese göre sıralı saklanır: \`token0\` < \`token1\`.

Kontrol, iki gerçekleştirme modelini bir piyasa alım emri üzerinde karşılaştırır. Defterde yürürken ortalama fiyat, tüketilen satış emirleri üzerinden \`Σ pᵢ · qᵢ / Σ qᵢ\` olur; bekleyen derinlikten büyük bir emir ancak kısmen karşılanır. Havuz ise belirli bir çıktının fiyatını \`getAmountIn\` ile hesaplar: \`amountIn = reserveIn · amountOut · 1000 / ((reserveOut − amountOut) · 997) + 1\`. Bu değer her \`amountOut < reserveOut\` için sonludur ve çıktı rezerve yaklaştıkça sınırsız büyür: havuz, rezervinden küçük hiçbir miktarı geri çevirmez, sadece bedelini ister.`,
      },
    },
    pool: {
      title: 'Havuz ve "liquidity provider"\'lar',
      alt: 'Havuzun iki yanında iki kişi duruyor; soldaki sensin. Senden havuza hem pembe hem mavi bir token uçuyor, iki seviye yatırdığın miktar kadar yükseliyor ve başının üstündeki yeşil token payınla birlikte büyüyor. Likiditeyi çektiğinde token\'lar sana geri uçuyor ve seviyeler alçalıyor.',
      body: {
        beginner: `Kaptaki [[token]]'lar nereden geliyor? Sıradan insanlardan; onlara [[liquidity-provider]] denir.

Her biri kaba **iki** [[token]]'ı birden koyar; örneğin bir miktar ETH ve onun karşılığı kadar dolar. Bu kaba [[liquidity-pool]] denir.

Peki neden koysunlar? Takas yapan herkes küçük bir ücret öder ve bu ücretler kabı dolduran herkes arasında paylaşılır. Kap ne kadar büyükse, fiyatı sıçratmadan o kadar büyük takasları kaldırabilir.

**Dene:** soldaki kişi sensin. Sürgüyü çekerek kaba ETH koy. Karşılığı olan dolar da onunla birlikte girer, iki seviye yükselir ve başının üstündeki yeşil makbuz payınla birlikte büyür. *Likiditeyi çek* düğmesine bas; iki [[token]]'dan da payına düşen geri gelir.`,
        intermediate: `Bir [[liquidity-pool]] iki [[token]] tutar. Tuttuğu miktarlara [[reserves]] denir. Bu derste havuz **100 ETH** ve **200.000 USDC** ile başlıyor.

Fiyat, [[reserves]] değerlerinin oranından ibarettir: 200.000 / 100 = **ETH başına 2.000 USDC**. Bu fiyatı kimse bir yere yazmaz; havuzun içindekilerden kendiliğinden çıkar.

Bir [[liquidity-provider]], yatırdığı miktar fiyatı oynatmasın diye iki [[token]]'ı da mevcut oranda eklemek zorundadır: örneğin 10 ETH ile birlikte 20.000 USDC. Bunu herkes, istediği miktarla, kimseden izin almadan yapabilir.

Havuzdaki fiyat başka yerlerdeki fiyattan uzaklaşırsa, birileri ucuz kalan tarafı fiyat yeniden eşitlenene kadar satın alır. Havuz fiyatını piyasayla aynı hizada tutan şey bu [[arbitrage]]'dır.

**Dene.** 10 ETH yatır: karşılığı olan 20.000 USDC de onunla girer, havuz 110 ETH ve 220.000 USDC'ye büyür, sen de havuzun 1/11'ine (yaklaşık %9,1) sahip olursun. *Likiditeyi çek* sana iki [[reserves]] değerinin aynı oranını geri verir.

Şimdi *Dengesiz yatır* kutusunu işaretle ve USDC'yi az gönder. Yalnızca küçük taraf sayılır; bu yüzden daha az pay alırsın ve hemen çeksen bile koyduğundan az ETH geri gelir: fazlalık artık bütün sağlayıcıların ortak malıdır. Uygulamalar bunun olmaması için eşleşen miktarı senin yerine hesaplar.`,
        expert: `Likidite, iki [[token]]'ı Pair kontratına gönderip \`mint(to)\` çağırarak eklenir. Pair miktarları argüman olarak almaz: [[token]] bakiyelerini saklı [[reserves]] değerleriyle karşılaştırır ve aradaki farkı yatırılan miktar sayar. Router'daki \`addLiquidity\`, eşleşen miktarları \`quote(amountA, reserveA, reserveB) = amountA · reserveB / reserveA\` ile hesaplar ve ikisini tek bir [[transaction]] içinde gönderir.

Oranı tutmayan bir yatırma reddedilmez; bir taraftaki fazlalık havuza bağışlanmış olur, çünkü pay iki oranın küçüğü üzerinden basılır (sonraki adımlar).

[[reserves]] değerleri depolamada \`uint112 reserve0\`, \`uint112 reserve1\` ve \`uint32 blockTimestampLast\` olarak tek bir slota sıkıştırılmış halde önbelleklenir. Yalnızca \`mint\`, \`burn\`, \`swap\` ve \`sync\` sonunda güncellenir; yani Pair'e doğrudan gönderilen [[token]]'lar, bunlardan biri çalışana kadar fiyatı değiştirmez. \`skim\` bu fazlalığı herkesin çekmesine izin verir; \`sync\` ise [[reserves]] değerlerini bakiyelere eşitler.

İlk yatıran kişi başlangıç oranını, dolayısıyla başlangıç fiyatını seçer. Yanlış seçerse [[arbitrage]] bunu o kişinin zararına düzeltir.

Kontrol, var olan bir havuzda gerçek basım kuralını çalıştırır: \`liquidity = min(dx · totalSupply / x, dy · totalSupply / y)\`. Örnek havuz için \`totalSupply = √(100 · 200000) ≈ 4.472\` alınır ([[token]] ondalıkları ve \`MINIMUM_LIQUIDITY\` hesaba katılmadan). Oran dışı bir yatırma "spot" fiyatı da oynatır, çünkü [[reserves]] \`x + dx\` ve \`y + dy\` olur; çekişte gösterilen miktarlar, bu yeni rezervler üzerinden \`liquidity · reserve / totalSupply\` değerleridir.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Pair, kısaltılmış)',
        source: `uint112 private reserve0;           // tek depolama slotu:
uint112 private reserve1;           // 112 + 112 + 32 bit
uint32  private blockTimestampLast;

function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    _blockTimestampLast = blockTimestampLast;
}

// UniswapV2Library: havuz fiyatından amountA'ya karşılık gelen B miktarı
function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
    require(amountA > 0, 'UniswapV2Library: INSUFFICIENT_AMOUNT');
    require(reserveA > 0 && reserveB > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    amountB = amountA.mul(reserveB) / reserveA;
}`,
      },
    },
    curve: {
      title: 'x · y = k',
      alt: 'Havuzun arkasındaki panoda aşağı doğru bükülen bir eğri var. Parlayan bir nokta havuzun eğri üzerindeki yerini gösteriyor; kesikli çizgiler onu iki eksene bağlıyor. Sürgüyü oynatmak noktayı eğri boyunca kaydırıyor ve havuzdaki iki seviyeyi değiştiriyor; bir düğme de iki token\'dan hangisinin satılacağını seçiyor.',
      body: {
        beginner: `Kabın tek bir kuralı var: **"token"'lardan biri artarsa diğeri azalmak zorundadır**; bu da sabit bir eğri boyunca olur. Havuzun arkasındaki pano o eğriyi, parlayan nokta ise havuzun şu an eğrinin neresinde olduğunu gösteriyor.

Sürgüyü oynat. Havuza ETH eklendikçe nokta sağa ve aşağı kayar: havuzda daha çok ETH, daha az dolar. Düğmeyi çevirip dolar eklersen nokta öbür yöne tırmanır.

Havuzda bol olan ucuzlar, az olan pahalanır. Fiyatlama mekanizmasının tamamı bundan ibarettir; arkasında ne bir insan ne de bir fiyat listesi vardır.`,
        intermediate: `[[reserves]] değerlerine **x** (ETH) ve **y** (USDC) diyelim. Havuz bunların çarpımını sabit tutar: **x · y = k**. Bu, [[constant-product]] kuralıdır.

Burada k = 100 × 200.000 = 20.000.000. Bir takas x'i 110'a çıkarırsa y yaklaşık 20.000.000 / 110 ≈ 181.818'e düşmek zorundadır; yani takası yapan kişi kabaca 18.182 USDC çekebilir (gerçekte ücret yüzünden biraz daha az).

Herhangi bir noktadaki fiyat y / x'tir, yani eğrinin o noktadaki eğimi. Başlangıçta 2.000'dir; x = 110 olduğunda yaklaşık 1.653.

İki sonuç:

- eğri eksenlere hiç değmez; yani havuzdaki [[token]]'lardan hiçbiri tamamen tüketilemez;
- bir takas eğri boyunca ne kadar ileri iterse fiyat o kadar kötüleşir. Küçük havuzlarda büyük takaslar pahalıdır.

Düğmeyle takasın yönünü çevir. USDC satmak noktayı yukarı ve sola taşır: havuzda daha az ETH kalır, yani her ETH daha pahalıdır.`,
        expert: `Ücretleri bir kenara bırakırsak, \`Δx\` girip \`Δy\` çıkan bir [[swap]], \`(x + Δx)(y − Δy) = x · y\` eşitliğini sağlamalıdır; buradan \`Δy = y · Δx / (x + Δx)\`. Marjinal ("spot") fiyat \`−dy/dx = y / x\` olur; sonlu büyüklükte bir takasın ortalama gerçekleşme fiyatı ise \`y / (x + Δx)\`'tir ve her zaman "spot" fiyattan kötüdür.

\`k\` gerçekte sabit değildir: bir [[swap]] sırasında asla **azalmaması** gereken bir değişmezdir. Ücretler onu her takasta büyütür; likidite basıldığında ya da yakıldığında da değişir (\`√k\`, [[lp-token]] arzıyla orantılıdır).

Eğri 0'dan ∞'a her fiyatta likidite sunar. v2'nin hiçbir parametre olmadan her çiftte çalışmasının nedeni de, sermayenin büyük kısmının hiç ulaşılmayan fiyatlarda beklemesinin nedeni de budur. Uniswap v3 tam olarak bunu [[concentrated-liquidity]] ile çözer.

Zincirde her şey ham [[token]] birimleri üzerinde tam sayı aritmetiğidir. İnsanın okuduğu fiyat, \`reserve1 / reserve0\` değerinin \`10^(decimals0 − decimals1)\` ile ölçeklenmiş halidir; 18 ve 6 ondalıklı iki [[token]]'ın havuzunda ham oran, ekranda görünen fiyattan on iki basamak uzaktadır.

Kontrol %0,3 ücreti uygular; bu yüzden bir takastan sonra nokta, başlangıçtaki \`k\` için çizilmiş eğrinin kıl payı üstünde durur. O küçük boşluk, \`k\`'nin büyümesidir.`,
      },
    },
    swap: {
      title: 'Bir "swap" fiyatı kaydırır',
      alt: 'Havuzun yanında bir kişi duruyor. Ondan havuza bir token uçuyor, havuzdan ona diğeri geri geliyor; yönü bir düğme seçiyor. Satılan token\'ın seviyesi yükseliyor, diğeri alçalıyor ve eğrideki nokta kayıyor. Sürgü takasın büyüklüğünü belirliyor. Arbitrage düğmesine basınca ikinci bir kişi ters yönde takas yapıyor ve nokta başladığı yerin yakınına dönüyor.',
      body: {
        beginner: `Biri elindeki ETH karşılığında dolar almak istiyor. ETH'yi havuza bırakır, havuz da ona dolar verir. Buna [[swap]] denir.

İki seviyeyi izle: ETH tarafı yükselir, dolar tarafı alçalır. Havuzda ETH artık daha bol olduğu için, bir sonraki ETH satan kişi biraz daha kötü bir fiyat alır.

Önce küçük, sonra büyük bir miktar dene. Küçük bir takas fiyatı neredeyse hiç oynatmaz. Büyük bir takas ise çok oynatır ve ETH başına eline belirgin biçimde daha az dolar geçer. Bu farka [[price-impact]] denir.

Düğmeyi çevirip ters yönde takas yap: dolar verip ETH al. Bu kez dolar seviyesi yükselir ve ETH pahalanır. Sonra *Arbitrage yap* düğmesine bas. Başka biri havuzdaki fiyatın şaştığını fark eder, ters yönde takas yapıp fiyatı başka yerlerdeki fiyatın yakınına geri getirir ve aradaki farkı kâr olarak cebine koyar.`,
        intermediate: `Sürgü **10 ETH**'deyken sayılar şöyle:

- havuz 10 ETH alır; bunun %0,3'ü (0,03 ETH) ücrettir;
- karşılığında yaklaşık **18.132 USDC** öder; yani takası yapanın eline ETH başına 2.000 değil, yaklaşık 1.813 USDC geçer;
- [[reserves]] değerleri 110 ETH ve yaklaşık 181.868 USDC olur; havuzun yeni fiyatı yaklaşık **ETH başına 1.653 USDC**'dir.

2.000 ile 1.813 arasındaki fark [[price-impact]]'tir: burada yaklaşık %9,3, çünkü 10 ETH havuzun onda biri. Aynı havuza 1 ETH satmak yalnızca %1,3 kadar kaybettirir.

Böyle bir takasın hemen ardından ETH bu havuzda başka yerlere göre ucuzdur. Biri onu buradan alıp piyasa fiyatından satar ve havuz yeniden 2.000 civarına döner. Bu [[arbitrage]] kârını, fiyatı oynatan kişi ödemiş olur.

**Dene.** Yönü çevir ve 20.000 USDC sat: tanesi yaklaşık 2.206 USDC'den yaklaşık 9,07 ETH alırsın, havuz fiyatı da yaklaşık 2.419'a çıkar. Sonra herhangi bir takasın ardından *Arbitrage yap* düğmesine bas. Piyasa 2.000'deyken arbitrajcı, havuz o fiyatın %0,3'lük ücret payı kadar yakınına gelene dek takas yapar (daha ilerisi zarar ettirir) ve panel kârını gösterir: 10 ETH'lik bir satıştan sonra yaklaşık 1.759 USDC.`,
        expert: `Router çıktıyı \`getAmountOut\` ile hesaplar:

\`amountOut = amountIn · 997 · reserveOut / (reserveIn · 1000 + amountIn · 997)\`

%0,3'lük ücret, [[constant-product]] adımından önce girdiden düşülür. 10 ETH için: \`9.97 · 200000 / 109.97 ≈ 18132.22\`. Tam sayı bölmesi aşağı, yani havuzun lehine yuvarlar. Tersi olan \`getAmountIn\` de aynı nedenle 1 wei ekler.

Pair bu formülü kullanmaz. \`swap(amount0Out, amount1Out, to, data)\` **önce** çıktıları gönderir, sonra bakiyelerini okur, girdileri buradan çıkarır ve değişmezi ücret uygulanmış haliyle kontrol eder:

\`(balance0 · 1000 − amount0In · 3) · (balance1 · 1000 − amount1In · 3) ≥ reserve0 · reserve1 · 1000²\`

Pair'i doğrudan çağıran biri girdiyi önceden göndermiş olmalı (ya da "callback" içinde ödemeli) ve çıktıyı kendisi hesaplamalıdır; fazlasını istemek \`UniswapV2: K\` ile "revert" olur, azını istemek ise havuza hediyedir.

Sonlu bir takasın ücret dahil [[price-impact]] değeri \`1 − 0.997 · x / (x + 0.997 · Δx)\`'tir; takastan sonraki "spot" fiyat \`(y − Δy) / (x + Δx)\` olur. Çok adımlı rotalar (\`path = [A, B, C]\`) aynı formülü çift çift zincirler ve her adımda ücret öder.

Arbitrage düğmesi, dışarıdaki bir \`P\` fiyatına karşı kârı en büyük yapan takası çözer. \`γ = 0.997\` ile, y [[token]]'ından \`Δy = (√(γ · P · x · y) − y) / γ\` ya da x [[token]]'ından \`Δx = (√(γ · x · y / P) − x) / γ\` satmak, ücret sonrası marjinal fiyatı \`P\`'ye eşitler. Havuz bu yüzden \`P\`'nin üstünde değil, ondan yaklaşık %0,3 uzakta kalır: bu bandın içinde hiçbir takas kâr getirmez. Kâr, fiyatı oynatan kişinin cebinden çıkar ve o kişinin \`P\`'ye göre kaybından küçüktür; çünkü iki takasın ücreti de LP'lerde kalır.`,
      },
      code: {
        lang: 'Solidity (Uniswap v2, kısaltılmış)',
        source: `// UniswapV2Library
function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
    require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    uint amountInWithFee = amountIn.mul(997);
    uint numerator = amountInWithFee.mul(reserveOut);
    uint denominator = reserveIn.mul(1000).add(amountInWithFee);
    amountOut = numerator / denominator;
}

// UniswapV2Pair.swap: önce öde, sonra doğrula
if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);
if (data.length > 0) IUniswapV2Callee(to).uniswapV2Call(msg.sender, amount0Out, amount1Out, data);
balance0 = IERC20(_token0).balanceOf(address(this));
balance1 = IERC20(_token1).balanceOf(address(this));
uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
require(amount0In > 0 || amount1In > 0, 'UniswapV2: INSUFFICIENT_INPUT_AMOUNT');
uint balance0Adjusted = balance0.mul(1000).sub(amount0In.mul(3));
uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
require(balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000**2), 'UniswapV2: K');`,
      },
    },
    fees: {
      title: 'Ücretler ve "LP token"',
      alt: 'Takaslar sürüyor. Havuza giren her token\'dan küçük turuncu bir para ayrılıp havuzda kalıyor. Sürgü havuzdan ne kadar çok takas geçirirse havuzda o kadar çok turuncu para yüzüyor ve yanındaki para yığını o kadar yükseliyor. Liquidity provider\'ların her biri yeşil bir token tutuyor: havuzdaki payları.',
      body: {
        beginner: `Her takas kapta küçük bir bahşiş bırakır: takası yapanın koyduğu miktarın %0,3'ü. Bahşişler tek tek dağıtılmaz. Kabın içinde kalır; böylece kap yavaş yavaş büyür.

Bir [[liquidity-provider]] kaba [[token]] eklediğinde karşılığında [[lp-token]] adında bir makbuz alır. Makbuz şunu söyler: "bu kişi kabın şu kadarlık payına sahip".

Sonra makbuzu geri verir ve o anda kapta ne varsa ondan payına düşeni alır; arada biriken bütün bahşişler dahil. Kazancı buradan gelir.

**Dene:** *Takas* sürgüsünü çekerek kaptan daha çok takas geçir. Her biri geride bir para bırakır. Paraların havuzda birikmesini ve yanında yığılmasını izle: kimse sana bir şey vermedi, ama makbuzun artık daha değerli.`,
        intermediate: `Ücret, her [[swap]]'ın **girdisinin %0,3'üdür**. [[reserves]] içinde bırakılır; yani her takas, yeni pay yaratmadan havuzu biraz büyütür.

Paylar [[lp-token]] ile izlenir. Havuzda 100 ETH ve 200.000 USDC varken 10 ETH ve 20.000 USDC eklersen, mevcut [[lp-token]] arzının %10'u kadar yeni [[lp-token]] alırsın ve havuzun 1/11'ine (yaklaşık %9,1) sahip olursun.

Çıkmak için [[lp-token]]'larını yakarsın ve o andaki **iki** [[reserves]] değerinin de aynı oranını geri alırsın. Payını ve ücretlerden payına düşeni alırsın; ama çoğu zaman koyduğundan farklı bir karışım halinde, çünkü takaslar oranı değiştirmiştir.

[[lp-token]] sıradan bir [[token]]'dır: gönderilebilir, satılabilir ya da başka [[dapp]]'lerde kullanılabilir.

**Dene.** Burada 110 ETH ve 220.000 USDC tutan bir havuzun 1/11'i senin; yani payın 40.000 USDC değerinde. Her takas kabaca 10.000 USDC'lik: biri 5 ETH satar, sonraki onu geri alır. 200 takastan sonra havuzdan 2 milyon USDC'ye yakın hacim geçmiş, x · y yaklaşık %2,6 büyümüş ve payın yaklaşık 522 USDC değerlenmiştir. Bu, hacmin %0,3'ü çarpı senin havuzdaki payındır; yeni bir [[lp-token]] da basılmamıştır.`,
        expert: `Pair kontratının kendisi [[lp-token]]'dır ([[erc-20]], 18 ondalık). Basım:

- **İlk yatırma**: \`liquidity = sqrt(amount0 · amount1) − MINIMUM_LIQUIDITY\`; \`MINIMUM_LIQUIDITY = 1000\` birim ise kalıcı olarak \`address(0)\`'a basılır. Geometrik ortalama, pay değerini başlangıç oranından bağımsız kılar; yakılan miktar ise tek bir payın değerini şişirip sonraki yatıranların payını sıfıra yuvarlatmayı aşırı pahalı hale getirir.
- **Sonrasında**: \`liquidity = min(amount0 · totalSupply / reserve0, amount1 · totalSupply / reserve1)\`.

\`burn\`, her [[token]] için \`liquidity · balance / totalSupply\` kadarını geri verir. Ücretler [[reserves]] içinde kaldığından \`√k / totalSupply\`, "mint" ve "burn" arasında yalnızca büyür; ücret geliri bu büyümedir.

Protokol ücreti anahtarı: \`factory.feeTo\` ayarlıysa \`_mintFee\`, bir sonraki \`mint\` ya da \`burn\` sırasında bu adrese yeni [[lp-token]] basar; miktar, \`kLast\`'tan beri \`√k\`'daki büyümenin 1/6'sına eşittir (hacmin %0,05'i; LP'lere %0,25 kalır). Bunun tembelce yapılması, her [[swap]]'ta fazladan bir transferi önler.

Dikkat edilecekler: transferden ücret kesen ya da "rebase" yapan [[token]]'lar, bakiyelerin yalnızca Pair üzerinden değiştiği varsayımını bozar; \`sync\` ve \`skim\` bunun için vardır, Router'da da ayrı \`…SupportingFeeOnTransferTokens\` fonksiyonları bulunur.

Simülasyon iki yönde sırayla [[swap]] yapar ve \`x · y\` ile \`√k / totalSupply\` değerlerini verir. Havuzdaki bir pay, y [[token]]'ı cinsinden \`2 · √(k · P) · pay\` eder; dolayısıyla basım ve yakım yokken ve fiyat aynı kalmışken \`√k\`'deki oransal büyüme, her [[lp-token]]'ın getirisinin ta kendisidir. Oran olarak ücret geliri kabaca \`0.003 · hacim / havuz değeri\` olur.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Pair.mint, kısaltılmış)',
        source: `uint public constant MINIMUM_LIQUIDITY = 10**3;

function mint(address to) external lock returns (uint liquidity) {
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    uint balance0 = IERC20(token0).balanceOf(address(this));
    uint balance1 = IERC20(token1).balanceOf(address(this));
    uint amount0 = balance0.sub(_reserve0);   // az önce gönderilen miktar
    uint amount1 = balance1.sub(_reserve1);

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint _totalSupply = totalSupply;
    if (_totalSupply == 0) {
        liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
        _mint(address(0), MINIMUM_LIQUIDITY); // sonsuza dek kilitli
    } else {
        liquidity = Math.min(amount0.mul(_totalSupply) / _reserve0,
                             amount1.mul(_totalSupply) / _reserve1);
    }
    require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
    _mint(to, liquidity);

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint(reserve0).mul(reserve1);
    emit Mint(msg.sender, amount0, amount1);
}`,
      },
    },
    risks: {
      title: '"Slippage" ve "impermanent loss"',
      alt: 'Eğrili pano yeniden havuzun arkasında, yanında da iki sütun duruyor. Slippage görünümünde sütunlar gösterilen miktarı ve swap\'ın gerçekte ödeyeceğini gösteriyor; bir plaka kabul edilen en düşük miktarı işaretliyor ve sütun plakanın altına inince kırmızıya dönüyor. Impermanent loss görünümünde sütunlar iki token\'ı sadece elde tutmanın değerini ve aynı miktarı havuzda bırakmanın değerini gösteriyor; sürgü fiyatı oynattıkça havuz sütunu, elde tutma sütununun altında kalıyor.',
      body: {
        beginner: `Burada seni şaşırtabilecek iki şey var.

**Takas yapanlar için:** düğmeye bastığın an ile takasın gerçekten gerçekleştiği an arasında fiyat değişebilir, çünkü başkaları senden önce takas yapar. Eline ekranda gördüğünden biraz daha azı geçer. Buna [[slippage]] denir. Uygulama bir sınır koymana izin verir: "bundan azını alacaksam takası iptal et".

**Havuza para koyanlar için:** fiyat oynadığında havuz, değeri yükselen [[token]]'ı kendiliğinden satar ve değeri düşeni biriktirir. Sonucu iki sütun gösteriyor: havuzdaki payın, iki [[token]]'ı cüzdanında tutsaydın sahip olacağından daha az eder. Bu farka [[impermanent-loss]] denir.

Panelde iki sekme var. *Slippage* sekmesinde ne kadar kötü bir sonucu kabul edeceğini seç, sonra takasından önce fiyatı oynat: fiyat sınırından fazla kayarsa takas kötü fiyattan gerçekleşmek yerine iptal olur. *Impermanent loss* sekmesinde ETH fiyatını yukarı ya da aşağı çek ve iki sütun arasındaki farkın açılmasını izle. Havuza para koymanın değmesi için kazandığın ücretlerin bu farktan büyük olması gerekir.`,
        intermediate: `[[slippage]], sana gösterilen miktar ile gerçekleşen miktar arasındaki farktır; nedeni, başka takasların seninkinden önce işlenmesidir. Kendini bir toleransla korursun. Tolerans %0,5 ve gösterilen miktar 18.132 USDC ise [[transaction]] yaklaşık 18.042 USDC'lik bir alt sınır taşır ve daha azını kabul etmek yerine başarısız olur. Çok dar bir tolerans takasları başarısız kılar; çok geniş bir tolerans ise başkalarını senden hemen önce takas yapıp aradaki farkı almaya davet eder.

[[impermanent-loss]], aynı başlangıç [[token]]'ları için iki seçeneği karşılaştırır: elde tutmak ya da havuza koymak. ETH'nin USDC karşısındaki fiyatı r katına çıkarsa, havuzdaki pozisyon elde tutmaya göre şu kadar daha az eder:

- r = 1,25 (%25 artış): yaklaşık %0,6
- r = 2 (fiyat ikiye katlanır): yaklaşık %5,7
- r = 4: %20

Fiyat 1/r'ye düştüğünde de aynı sayılar geçerlidir. Fiyat girdiğin seviyeye dönerse kayıp sıfıra iner; adındaki "impermanent" (kalıcı olmayan) buradan gelir. Farklı bir fiyattan çıktığında ise kalıcı olur.

**Dene.** *Slippage* sekmesinde takas 10 ETH'dir. *Önce fiyat oynar* sürgüsünü toleransının ötesine çek; sonuç "revert olur"a döner. Toleransı gevşetirsen takas yeniden gerçekleşir, ama daha az USDC ile. *Impermanent loss* sekmesinde havuzun %10'u senin: başlangıçta 10 ETH ve 20.000 USDC. Fiyatı 2× yap. [[arbitrage]] havuzu ETH başına 4.000 USDC'ye taşımıştır; elde tutmak 60.000 USDC ederdi, havuzdaki pozisyon yaklaşık 56.569 eder ve panel, başa baş için gereken 3.431 USDC'lik ücreti gösterir.`,
        expert: `[[slippage]] koruması Pair'de değil, Router'dadır: \`swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)\`, çıktı \`amountOutMin\`'in altında kalırsa \`INSUFFICIENT_OUTPUT_AMOUNT\` ile "revert" olur; \`deadline\` ise bayatlamış bir [[transaction]]'ın çok sonra çalışmasını engeller. Bekleyen bir [[swap]], [[mempool]]'da görünür; dolayısıyla \`amountOutMin\`, bir "sandwich" saldırısının (önce al, sonra sat) çekebileceği miktarın ta kendisidir. Sıfır alt sınır neredeyse her şeyi kaybettirebilir.

[[impermanent-loss]]: P fiyatındaki bir [[constant-product]] havuzunda bir LP payı \`x = L / √P\` ve \`y = L · √P\` tutar; y cinsinden değeri \`2L√P\`'dir. Başlangıç miktarlarını elde tutmanın değeri ise \`L√P₀ · (1 + r)\` olur; burada \`r = P / P₀\`. Buradan

\`IL(r) = 2 · √r / (1 + r) − 1\`

çıkar. Bu değer ≤ 0'dır, r ↔ 1/r için simetriktir ve ücretleri hesaba katmaz. Havuz volatiliteye karşı "short" konumdadır: LP ücret kazanır, bu sapmayı ise [[arbitrage]] yapanlara öder.

[[twap]] "oracle"'ı: \`_update\`, her [[block]]'taki ilk çağrıda \`price · timeElapsed\` değerini \`price0CumulativeLast\` ve \`price1CumulativeLast\`'a ekler (UQ112.112 sabit noktalı sayı; taşma kasıtlıdır). Tüketen kontrat iki anlık değer saklar ve \`(cum₂ − cum₁) / (t₂ − t₁)\` ile aritmetik ortalama fiyatı hesaplar. Örneklenen fiyat **bir önceki [[block]]'un sonundaki** fiyat olduğu için onu oynatmak, bozulmuş bir fiyatı [[arbitrage]]'a karşı birden fazla [[block]] boyunca tutmayı gerektirir. \`getReserves()\` değerini bir işlemin içinde asla fiyat olarak okuma: atomik biçimde oynatılıp eski haline getirilebilir.

[[flash-swap]]: \`swap\` önce ödeyip sonra kontrol ettiği için çağıran taraf boş olmayan bir \`data\` geçirebilir, [[token]]'ları alır, \`uniswapV2Call\` içinde kullanır ve çağrı dönmeden hesabı kapatır: ya diğer [[token]] ile ya da aynı [[token]]'ı ücretiyle birlikte geri vererek (\`amount · 1000 / 997\`, yaklaşık %0,3009). Değişmez kontrolü başarısız olursa her şey geri alınır.

Kontroller: \`amountOutMin = quote · (1 − tolerans)\`. Önceki takaslar, havuzu aynı \`k\` üzerinde eski fiyatın \`(1 − m)\` katına taşıyan bir hareket olarak modellenir; ardından senin \`getAmountOut\` değerin yeniden hesaplanır ve \`amountOutMin\` ile karşılaştırılır. Fiyat sürgüsünde havuz \`x = x₀ / √r\`, \`y = y₀ · √r\` noktasına konur; bu, ücretsiz [[arbitrage]]'ın vardığı son durumdur. Gösterilen hacim \`kayıp / (0.003 · pay)\` değeridir: ücretleri bu pozisyona o kadar ödeyecek işlem hacmi.`,
      },
      code: {
        lang: 'Solidity (UniswapV2Pair._update, kısaltılmış)',
        source: `function _update(uint balance0, uint balance1, uint112 _reserve0, uint112 _reserve1) private {
    require(balance0 <= uint112(-1) && balance1 <= uint112(-1), 'UniswapV2: OVERFLOW');
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast; // taşma isteniyor
    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
        // * asla taşmaz, + için taşma isteniyor
        price0CumulativeLast += uint(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
        price1CumulativeLast += uint(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
    }
    reserve0 = uint112(balance0);
    reserve1 = uint112(balance1);
    blockTimestampLast = blockTimestamp;
    emit Sync(reserve0, reserve1);
}

// Oracle kullanan taraf: iki gözlem arasında token0'ın token1 cinsinden ortalama fiyatı
// twap = (price0Cumulative_2 - price0Cumulative_1) / (t_2 - t_1)   // UQ112.112`,
      },
    },
  },
};

export default content;
