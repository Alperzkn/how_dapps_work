import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[hook]]'lar -> "hook"'lar.
// English technical words without a glossary entry are quoted by hand: "flash loan".

const content: LessonContent = {
  labels: {
    oldWay: 'v2 / v3: her havuza ayrı sözleşme',
    oldWayI: 'v2 / v3: her havuz ayrı kurulur',
    newWay: 'v4: tek sözleşme, bütün havuzlar',
    newWayI: 'bütün havuzlar',
    you: 'sen',
    tab: 'üstü: alacağın | altı: borcun',
    flash0: 'hesap açılır',
    flash1: 'swap 1: ETH → USDC, hesaba yazılır',
    flash2: 'swap 2: USDC → DAI, USDC sıfırlanır',
    flash3: 'tek ödeme: ETH',
    flash4: 'tek çekim: DAI',
    flash5: 'hesap sıfır: tamam',
    before: 'swap öncesi',
    theSwap: 'swap',
    after: 'swap sonrası',
    hookB: 'hook: eklenti kurallar',
    hookI: 'hook sözleşmesi',
    others: 'diğer hook noktaları: | havuzun açılması, | likidite ekleme / çıkarma, | bağış',
    wrapOld: 'v2 / v3: önce ETH sarılır',
    direct: 'v4: ETH doğrudan girer',
    swing: 'fiyat oynaklığı',
    fee: 'ücret',
    volatility: 'Oynaklık',
    lpFee: 'Swap ücreti',
    cmp2B: 'para her fiyata | yayılır',
    cmp2I: 'x · y = k, tüm aralık | %0,30 ücret | LP token',
    cmp3B: 'fiyat bandını | sen seçersin',
    cmp3I: 'fiyat aralıkları | %0,01–1 fee tier | NFT position',
    cmp4B: 'tek bina, | eklenti kurallar',
    cmp4I: 'singleton + hook | serbest ya da dynamic fee | native ETH',
    need2B: 'yatır | ve unut',
    need2I: 'pasif LP, | küçük token çiftleri',
    need3B: 'daha çok ücret, | daha çok ilgi',
    need3I: 'aktif LP, | sabit ve büyük çiftler',
    need4B: 'özel | kurallar',
    need4I: 'özel mantık, | ucuz multi-hop',
  },
  steps: {
    singleton: {
      title: 'Her havuza bir sözleşmeden, hepsine tek sözleşmeye',
      alt: 'Solda, her biri ayrı bir havuz sözleşmesi olan altı küçük bina. Sağda, altı bölmeli büyük bir kasa. Küçük havuzlar binalardan çıkıp bölmelere zıplıyor.',
      body: {
        beginner: `Uniswap v2 ve v3'te her havuz kendi küçük binasında durur. Üç havuzdan geçen bir takas, [[token]]'ları bir kapıdan çıkarıp ötekinden sokmak zorundadır; hem de üç kez.

Uniswap v4 **bütün havuzları tek bir binaya** koyar. Her havuz, binanın içindeki bir bölmeden ibarettir.

Yeni bir havuz açmak artık bina inşa etmek değildir; yalnızca yeni bir bölmeye etiket yapıştırırsın. Havuzlar arasında dolaşan [[token]]'ların da binadan çıkması gerekmez.`,
        intermediate: `v2 ve v3'te bir "factory", her havuz için yeni bir [[smart-contract]] kurar. Her biri kendi [[token]]'larını tutar; bu yüzden birkaç havuzdan geçen bir rota, her adımda [[token]]'ları sözleşmeden sözleşmeye aktarır.

v4 bir [[singleton]] kullanır: tek bir sözleşme, yani [[pool-manager]], bütün havuzların durumunu ve [[token]]'larını tutar.

Değişenler:

- **Havuz açmak**, sözleşme kurmak yerine bir durum güncellemesidir; çok daha az [[gas]] harcar.
- **[[multi-hop]] bir [[swap]]** tek sözleşmenin içinde kalır; havuzlar arasında hiçbir şey aktarılmaz.
- Fiyatlama hâlâ v3'ün [[concentrated-liquidity]] yaklaşımıdır: [[tick]]'ler, aralıklar ve aynı [[swap]] matematiği.`,
        expert: `\`PoolManager\`, bütün havuzları \`mapping(PoolId => Pool.State) _pools\` içinde saklar. Bir havuzu [[pool-key]] tanımlar: \`currency0\`, \`currency1\`, \`fee\`, \`tickSpacing\` ve \`hooks\`; \`PoolId = keccak256(abi.encode(key))\` olur. \`initialize(key, sqrtPriceX96)\`, o kimlik için \`slot0\` değerini yazar; hiçbir "bytecode" kurulmaz.

\`Pool.State\`, v3 havuz durumunun bir kütüphane "struct"'ı halidir: \`slot0\` ([[sqrt-price-x96]], tick, protokol ücreti, LP ücreti), \`feeGrowthGlobal0X128\` / \`1X128\`, \`liquidity\`, \`ticks\`, \`tickBitmap\` ve \`positions\`. v3'ün yerleşik fiyat "oracle"'ı çekirdekten çıkarılmıştır; "oracle", bir [[hook]]'un sağlayabileceği bir şeydir.

\`fee\`, \`tickSpacing\` ve \`hooks\` anahtarın parçası olduğu için, yönetişimin onayladığı bir listeden seçilmez, serbest parametrelerdir. Aynı çift için istenen sayıda havuz var olabilir.

[[singleton]], bütün havuzların [[token]]'larını para birimi başına tek bir bakiyede tutar. Hangi havuzun neye sahip olduğu yalnızca bir muhasebe kaydıdır; bir sonraki adımı mümkün kılan da budur.`,
      },
      code: {
        lang: 'Solidity (v4-core)',
        source: `struct PoolKey {
    Currency currency0;    // küçük olan adres; address(0) native ETH demektir
    Currency currency1;
    uint24   fee;          // LP ücreti, bip'in yüzde biri cinsinden; 0x800000 = dinamik
    int24    tickSpacing;
    IHooks   hooks;        // hook sözleşmesi, yoksa address(0)
}

// PoolId = keccak256(abi.encode(poolKey))
mapping(PoolId id => Pool.State) internal _pools;

function initialize(PoolKey memory key, uint160 sqrtPriceX96)
    external returns (int24 tick);`,
      },
    },
    flash: {
      title: '"Flash accounting": hesabı aç, bir kez öde',
      alt: 'Kasa ortada duruyor; arkasındaki panoda bir sıfır çizgisinin çevresinde ETH, USDC ve DAI için üç çubuk var. İki takas, hiçbir token hareket etmeden çubukları değiştiriyor; sonra bir ETH parası kullanıcıdan kasaya, bir DAI parası kasadan kullanıcıya gidiyor ve bütün çubuklar sıfıra dönüyor.',
      body: {
        beginner: `Her siparişten sonra kasaya gidip ödemek yerine birkaç şey ısmarlayıp çıkarken bir kez ödediğin bir kafe düşün.

v4 de böyle çalışır. İşlemin sürerken bina yalnızca ne borçlu olduğunu ve ne alacağın olduğunu not eder. ETH'yi USDC'ye, sonra USDC'yi DAI'ye çevirmek hesapta iki satırdan ibarettir ve USDC birbirini götürür.

Sonunda ETH'yi ödersin, DAI'yi alırsın ve hesap tam olarak sıfır olmak zorundadır. Sıfır değilse her şey, hiç olmamış gibi geri alınır.`,
        intermediate: `[[flash-accounting]], [[pool-manager]]'ın bir işlem boyunca bakiye değişimlerini takip edip [[token]]'ları yalnızca **net** sonuç için hareket ettirmesi demektir.

ETH → USDC → DAI yönündeki [[multi-hop]] bir [[swap]] için sahneyi izle:

- 1. takas şunu yazar: "1 ETH borçlu, 2.000 USDC alacaklı".
- 2. takas şunu yazar: "2.000 USDC borçlu, 1.999 DAI alacaklı". USDC kayıtları birbirini götürür.
- Yalnızca iki aktarım gerçekleşir: 1 ETH içeri, 1.999 DAI dışarı.

v3'te aynı rota, USDC'yi ilk havuzdan çıkarıp ikincisine sokar. Burada aradaki [[token]] hiç hareket etmez ve her ek adımda tasarruf büyür.

Aynı mekanizma, sonunda her şey sıfırlandığı sürece likidite eklemeyi, çıkarmayı ve takası tek seferde yapmayı da kapsar.`,
        expert: `Durumu değiştiren bütün çağrılar bir kilidin içinde yapılır. Çağıran taraf \`PoolManager.unlock(data)\` çağırır; bu da \`msg.sender\` üzerinde \`unlockCallback(data)\` fonksiyonunu geri çağırır. Bu fonksiyonun içinde \`swap\`, \`modifyLiquidity\` ve \`donate\` hiçbir şey aktarmaz; çağıran ve para birimi başına tutulan bir \`int256\` "delta" değerine ekleme yapar. Negatif değer, çağıranın yöneticiye borçlu olduğunu; pozitif değer, yöneticinin çağırana borçlu olduğunu gösterir.

Borçlar \`settle()\` ile kapatılır ([[erc-20]] için: \`sync(currency)\`, aktarım, ardından \`settle()\`; ETH için: \`settle{value: …}()\`), alacaklar \`take(currency, to, amount)\` ile çekilir. Geri çağrı döndüğünde \`unlock\`, sıfırdan farklı "delta" sayısının sıfır olduğunu kontrol eder; değilse \`CurrencyNotSettled\` ile işlemi geri alır.

"Delta" değerleri, sıfırdan farklı olanların sayacı ve kilit bayrağı [[transient-storage]] içinde durur (EIP-1153 \`TSTORE\` / \`TLOAD\`). Bu alan işlemin sonunda silinir ve kalıcı depolamaya yazmak yerine erişim başına 100 [[gas]] harcar.

İki sonucu var. \`settle\`'dan önce \`take\` çağırmak, yöneticinin elindeki her şey için ücretsiz bir "flash loan" demektir; tek sınır, sonda yapılan sıfır kontrolüdür. Ayrıca çağıran, alacağını çekmek yerine karşılığında [[erc-6909]] "claim token"'ı basabilir (\`mint\`) ve daha sonra bir borcu ödemek için yakabilir (\`burn\`); sık işlem yapanlar böylece ERC-20 aktarımlarını tamamen atlar.`,
      },
      code: {
        lang: 'Solidity (iki adımlı bir swap taslağı)',
        source: `function swapEthToDai() external payable {
    poolManager.unlock(abi.encode(msg.sender));
}

function unlockCallback(bytes calldata data) external returns (bytes memory) {
    require(msg.sender == address(poolManager));
    address user = abi.decode(data, (address));

    // "exact input" negatif amountSpecified ile verilir; henüz hiçbir şey aktarılmadı
    BalanceDelta d1 = poolManager.swap(ethUsdcKey, firstHop, "");   // ETH -1, USDC +x
    BalanceDelta d2 = poolManager.swap(daiUsdcKey, secondHop, "");  // USDC -x, DAI +y

    poolManager.settle{value: 1 ether}();                  // borçlu olduğumuz ETH'yi öde
    poolManager.take(DAI, user, uint128(d2.amount0()));    // alacağımız DAI'yi çek
    return "";
}   // herhangi bir delta kalırsa unlock(), CurrencyNotSettled ile geri alınır`,
      },
    },
    hooks: {
      title: '"Hook": her işlemin çevresine takılan kod',
      alt: 'Bir takas, PoolManager üzerindeki bir şeritte ilerliyor. Havuzdan önceki ve sonraki birer kapıda duruyor; her kapıda bir sinyal, bir kablo boyunca ayrı duran hook sözleşmesine gidip geliyor ve kapı yanıyor.',
      body: {
        beginner: `Şimdiye kadar bütün Uniswap havuzları birebir aynı kurallara uyuyordu. v4, bir havuzu açan kişinin ona [[hook]] adı verilen küçük bir program takmasına izin verir.

Havuz, belirli anlarda [[hook]]'u çağırır: örneğin bir takastan hemen **önce** ve hemen **sonra**. [[hook]] o anda fazladan bir şey yapabilir: ücreti değiştirebilir, fiyatı kaydedebilir ya da birinin daha önce bıraktığı bir emri yerine getirebilir.

Paranın havuzdan geçişini izle. Yanan her kapıda havuz durur, [[hook]]'a sorar ve yoluna devam eder.`,
        intermediate: `[[hook]], havuz açılırken seçilen ayrı bir [[smart-contract]]'tır ve sonradan değiştirilemez. [[pool-manager]] onu belirli noktalarda çağırır:

- havuz **açılmadan** önce ve açıldıktan sonra;
- likidite **eklenmeden** ya da **çıkarılmadan** önce ve sonra;
- bir **[[swap]]**'tan önce ve sonra;
- havuzun likidite sağlayıcılarına yapılan bir **bağıştan** önce ve sonra.

Bir [[hook]] yalnızca ihtiyaç duyduğu noktaları uygular. Yapılmış örnekler:

- piyasa oynakken yükselen bir [[dynamic-fee]];
- seçilen fiyattan satan bir [[limit-order]];
- çok büyük tek bir emri saatlere yayan [[twamm]];
- v3'te yerleşik olan, v4'ün ise [[hook]]'lara bıraktığı fiyat "oracle"'ı.

[[hook]], senin takasına ya da likiditene dokunan bir koddur. Bir havuzu kullanan kişi, Uniswap'in yanında o havuzun [[hook]]'una da güvenmek zorundadır.`,
        expert: `Bir [[hook]]'un hangi geri çağrıları alacağı **adresinde** kodludur. En düşük 14 bit izin bayraklarıdır: \`BEFORE_INITIALIZE_FLAG = 1 << 13\` ile başlar, \`AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA_FLAG = 1 << 0\` ile biter; \`BEFORE_SWAP_FLAG\` \`1 << 7\`, \`AFTER_SWAP_FLAG\` ise \`1 << 6\`'dır. [[pool-manager]], \`uint160(address(key.hooks)) & flag\` değerine bakar ve bit sıfırsa çağrıyı atlar; böylece depolamadan okuma gerekmez. Kurulumu yapanlar, adres doğru bitleri taşıyana kadar bir \`CREATE2\` "salt"'ı arar; \`initialize\` de adresi uyguladığı fonksiyonlarla uyuşmayan bir [[hook]]'u reddeder.

Her geri çağrı kendi "selector"'ını döndürmek zorundadır. \`beforeSwap\` buna ek olarak bir \`BeforeSwapDelta\` ve \`uint24\` türünde bir ücret değeri döndürür. \`*_RETURNS_DELTA\` bayraklarıyla bir [[hook]], takasın bir kısmını kendisi alabilir ya da karşılayabilir; standart havuzun üzerine özel eğriler ve [[hook]]'un sahip olduğu likidite böyle kurulur.

[[hook]]'lar çağıranın \`unlock\`'u içinde çalışır, dolayısıyla [[flash-accounting]]'e dahildir: bir [[hook]] \`take\`, \`settle\` ya da \`modifyLiquidity\` çağırabilir ve kendi "delta" değerleri de sıfırlanmak zorundadır.

Riskler gerçektir. Bir [[hook]] yükseltilebilir olabilir, kendi ücretini kesebilir; likidite çıkarma geri çağrılarına sahip olanı da çekimleri başarısız kılabilir. Ayrıca her farklı \`hooks\` adresi ayrı bir havuz demektir; yani bir çiftin likiditesi v3'tekinden daha çok havuza bölünür.`,
      },
      code: {
        lang: 'Solidity (v4-core: IHooks.sol, Hooks.sol)',
        source: `function beforeSwap(
    address sender,
    PoolKey calldata key,
    SwapParams calldata params,
    bytes calldata hookData
) external returns (bytes4 selector, BeforeSwapDelta delta, uint24 lpFeeOverride);

function afterSwap(
    address sender,
    PoolKey calldata key,
    SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external returns (bytes4 selector, int128 hookDelta);

// izinler, hook adresinin düşük bitlerinde durur
uint160 constant BEFORE_SWAP_FLAG = 1 << 7;
uint160 constant AFTER_SWAP_FLAG  = 1 << 6;
// ...00C0 ile biten bir adres tam olarak bu iki geri çağrıyı alır`,
      },
    },
    'native-dynamic': {
      title: '"Native ETH" ve değişen ücretler',
      alt: 'Solda iki şerit var: arkadakinde bir ETH parası eski bir havuza varmadan önce bir sarma makinesinden geçiyor; öndekinde bir ETH parası doğrudan v4 havuzuna giriyor. Sağda bir hook sözleşmesi, zıplayan bir fiyat topunu izliyor ve top daha çok sallandıkça yükselen bir ücret göstergesini sürüyor.',
      body: {
        beginner: `İki küçük değişiklik v4'ü daha ucuz ve daha esnek yapar.

**Gerçek ETH.** v2 ve v3'te bir havuz ETH'nin kendisini tutamıyordu. Önce onu yerine geçen bir [[token]]'a çevirmen gerekiyordu; ödeme yapmadan önce fiş almak gibi. v4 havuzları ETH'yi doğrudan kabul eder.

**Ayarlanan ücretler.** Eski sürümlerde bir havuzun ücreti sonsuza kadar sabitti. v4'te bir [[hook]] onu değiştirebilir; fırtınada daha pahalıya çalışan bir taksi gibi. Sürgüyü oynat: fiyat sert oynadığında gösterge yükselir ve likidite sağlayanlar aldıkları risk için daha çok kazanır.`,
        intermediate: `**[[native-eth]].** v2 ve v3 havuzları yalnızca [[erc-20]] [[token]]'ları tutar; bu yüzden ETH'nin önce WETH'e sarılması, sonra da geri açılması gerekir. v4'te ETH, havuzun iki para biriminden biri olabilir. Böylece sarma ve açma adımları ortadan kalkar; üstelik ETH göndermek bir ERC-20 aktarımından daha az [[gas]] harcar.

**[[dynamic-fee]].** v3 dört sabit [[fee-tier]] sunar. v4'te bir havuz istediği sabit ücreti kullanabilir ya da ücretini dinamik ilan edip belirlemeyi [[hook]]'una bırakabilir.

Sürgü basit bir örneği sürer: sakin piyasada %0,05 olan ücret, yakın zamandaki oynaklık %10'a ulaştığında %1'e çıkar. Mantığı şu: oynak piyasa daha fazla [[impermanent-loss]] yaratır, öyleyse likidite sağlayanlar tam o sırada daha çok kazanmalıdır; sakin piyasada ise düşük ücret hacim çeker.

Kural, [[hook]]'u yazan kişi ne yazdıysa odur. Günün saatine, işlemin büyüklüğüne ya da işlemi kimin yaptığına da bağlı olabilirdi.`,
        expert: `**Para birimleri.** \`Currency\` bir adresi sarar ve \`address(0)\`, [[native-eth]] anlamına gelir. \`currency0 < currency1\` olduğu için ETH, bulunduğu havuzlarda her zaman \`currency0\`'dır. ETH borçları \`settle{value: amount}()\` ile ödenir; alacaklar \`take\` tarafından değer taşıyan düz bir çağrıyla gönderilir. WETH havuzları da var olabilir; yalnızca farklı birer [[pool-key]]'dir.

**Sabit ücretler.** \`key.fee\`, "basis point"'in yüzde biri cinsinden bir \`uint24\`'tür ve en fazla \`1_000_000\` (%100) olabilir; \`tickSpacing\` ise 1 ile 32767 arasında seçilir. v3'teki gibi biri diğerine bağlı değildir.

**Dinamik ücretler.** \`key.fee == LPFeeLibrary.DYNAMIC_FEE_FLAG\` (\`0x800000\`) ise havuz dinamiktir. LP ücreti 0'dan başlar ve iki yolla değiştirilebilir; ikisini de yalnızca havuzun kendi [[hook]]'u yapabilir:

- \`poolManager.updateDynamicLPFee(key, newFee)\`, \`slot0\` içine yeni bir ücret yazar; genellikle \`afterInitialize\` ya da \`beforeSwap\` içinden çağrılır;
- \`beforeSwap\`, \`fee | LPFeeLibrary.OVERRIDE_FEE_FLAG\` (\`0x400000\`) döndürerek depolamaya yazmadan yalnızca o [[swap]] için bir ücret uygular.

Sahnedeki eğri bir oyuncaktır: %0–10 oynaklık boyunca 5 "bps"'ten 100 "bps"'e doğrusal çıkar. Gerçek bir [[hook]], oynaklığı güvenebileceği bir yerden almalıdır; örneğin [[tick]] hareketlerine dair kendi kaydından. Ayrıca alıcıların büyük bir [[swap]]'tan hemen önce bu girdiyi oynatmaya çalışacağını varsaymalıdır.`,
      },
      code: {
        lang: 'Solidity (dinamik ücretli bir hook taslağı)',
        source: `// havuz, key.fee = LPFeeLibrary.DYNAMIC_FEE_FLAG ile açılmış olmalı

function beforeSwap(address, PoolKey calldata, SwapParams calldata, bytes calldata)
    external view onlyPoolManager
    returns (bytes4, BeforeSwapDelta, uint24)
{
    // ücret, bip'in yüzde biri cinsinden: 500 = %0,05, 10000 = %1
    uint24 fee = feeForVolatility(recentVolatility());

    return (
        IHooks.beforeSwap.selector,
        BeforeSwapDeltaLibrary.ZERO_DELTA,
        fee | LPFeeLibrary.OVERRIDE_FEE_FLAG   // yalnızca bu swap için geçerli
    );
}`,
      },
    },
    compare: {
      title: 'v2, v3 ve v4 yan yana',
      alt: 'Üç küçük model yan yana duruyor. v2: iki rezervli tek bir tekne. v3: hareket eden bir fiyat işaretinin çevresinde yükselen sütunlar. v4: dört havuz taşıyan tek bir blok, yanında bir hook kapısı ve havuzlar arasında zıplayan bir takas.',
      body: {
        beginner: `Üç sürüm yan yana:

- **v2 (2020)**: her [[token]] çifti için bir havuz. Paran bütün fiyatlara yayılır. Basittir ve kendi haline bırakabilirsin.
- **v3 (2021)**: bir fiyat bandı seçersin. Paran bandın içinde çok daha sıkı çalışır, dışında ise hiç çalışmaz.
- **v4 (2025)**: aynı bantlar; ama bütün havuzlar tek binada durur ve her havuza eklenti kurallar takılabilir.

Üç sürüm de hâlâ çalışıyor. Yenisi çıkınca eskiler kapatılmadı.`,
        intermediate: `**v2**

- Likidite: tüm aralık, \`x · y = k\`
- Ücret: %0,30; kendiliğinden havuza eklenir
- Payın: değiştirilebilir bir [[lp-token]]
- Sözleşme: her çift için bir tane

**v3**

- Likidite: bir [[price-range]] içinde [[concentrated-liquidity]]
- Ücret: %0,01, %0,05, %0,30 ya da %1'lik bir [[fee-tier]]; ayrı toplanır
- Payın: bir [[nft-position]]
- Sözleşme: her çift ve ücret kademesi için bir tane

**v4**

- Likidite: yoğunlaştırılmış, v3 ile aynı matematik
- Ücret: istenen değer ya da bir [[hook]]'un belirlediği [[dynamic-fee]]
- Payın: [[pool-manager]] içinde bir pozisyon; genellikle "NFT" olarak tutulur
- Sözleşme: bütün havuzlar için tek [[singleton]], [[flash-accounting]], [[native-eth]]`,
        expert: `**Fiyat durumu.** v2: \`reserve0\`, \`reserve1\` (\`uint112\`); değişmez, ücret düşüldükten sonra kontrol edilir. v3: [[sqrt-price-x96]], \`tick\`, aktif \`liquidity\`, [[tick]] başına \`liquidityNet\`, \`tickBitmap\`. v4: aynı yapı, \`PoolManager\` içinde \`PoolId\` başına tutulur.

**Pozisyonlar.** v2: çiftin bastığı ERC-20 payları; ücretler rezervlere eklenerek bileşik büyür. v3: \`(owner, tickLower, tickUpper)\` ile anahtarlanır, \`NonfungiblePositionManager\` tarafından ERC-721 olarak sarılır, ücretler \`feeGrowthInside\` ile izlenir. v4: \`(owner, tickLower, tickUpper, salt)\` ile anahtarlanır, çevre sözleşmesi \`PositionManager\` tarafından ERC-721 olarak sarılır.

**Hesaplaşma.** v2 ve v3: her havuz [[token]]'ları içeri ve dışarı aktarır; [[flash-swap]] ve geri çağrılar havuz başınadır. v4: \`unlock\` altında "delta" değerleri, net tutar üzerinden \`settle\` / \`take\`, [[transient-storage]], [[erc-6909]] ile alacak kaydı.

**"Oracle".** v2: aritmetik ortalamalı bir [[twap]] için birikimli fiyatlar. v3: geometrik ortalamalı [[twap]] için birikimli [[tick]] değerlerinden oluşan halka biçiminde bir gözlem dizisi. v4: çekirdekte yok; bir [[hook]] ekleyebilir.

**Genişletilebilirlik.** v2 ve v3: havuzun içinde yok. v4: açılış, likidite ekleme ve çıkarma, [[swap]] ve bağış üzerinde [[hook]]'lar; ayrıca serbest \`fee\` ve \`tickSpacing\`.

**Bu esnekliğin bedeli.** v4'te havuz başına denetlenecek daha çok şey ([[hook]]), çift başına daha çok havuz ve tek bir sözleşmede duran bütün fonlar vardır.`,
      },
    },
    choose: {
      title: 'Hangisi, ne zaman?',
      alt: 'Üç model arkada duruyor. Her birinin önünde bir kişi var; noktalı bir yol her kişiyi kendisine uyan modele götürüyor: pasif yatırımcıyı v2\'ye, aktif yöneticiyi v3\'e, özel kurallar isteyen geliştiriciyi v4\'e.',
      body: {
        beginner: `"En iyi" sürüm diye bir şey yok. Ne yapmak istediğine bağlı.

- İki [[token]] yatırıp üzerine düşünmek istemiyorsan: **v2** basit seçimdir.
- Daha fazla ücret karşılığında fiyatı izlemeye ve bandını ayarlamaya razıysan: **v3**.
- Farklı davranan bir havuza ihtiyacın varsa ya da birçok havuzdan geçen işlemler yapıyorsan: **v4**.

Yalnızca takas yapmak istiyorsan çoğu zaman seçim bile yapmazsın. Uygulama bütün sürümlerin havuzlarına bakar ve işlemini fiyatın en iyi olduğu yere gönderir.`,
        intermediate: `**Likidite sağlayan biri olarak**

- **v2**: tamamen pasiftir, hiçbir zaman [[out-of-range]] olmaz ve [[lp-token]] başka birçok uygulamada kabul edilir. Sermaye getirisi düşüktür. Yeni ve küçük [[token]]'larda yaygındır.
- **v3**: çok daha yüksek [[capital-efficiency]] sunar; ama aralıklar yönetim ister ve [[impermanent-loss]] büyür. Sabit çiftler ile büyük, likit çiftler için en uygunudur.
- **v4**: aynı aralık mekaniği, üstüne havuzun [[hook]]'u ne ekliyorsa o. Yatırmadan önce [[hook]]'un ne yaptığını oku.

**Alıcı olarak** genellikle emrini v2, v3 ve v4 havuzlarına bölen bir "router" kullanırsın. v4 rotaları, özellikle birkaç adımlıysa ya da ETH içeriyorsa, çoğunlukla daha az [[gas]] harcar.

**Geliştirici olarak** standart havuzda olmayan bir davranışa ihtiyacın varsa üzerine kuracağın sürüm v4'tür: özel ücretler, zincir üstünde [[limit-order]], [[twamm]] ya da kendi eğrin.`,
        expert: `**v2**, değiştirilebilir ve tüm aralığa yayılan bir pozisyona ihtiyacın olduğunda hâlâ doğru araçtır: başka protokollerin kabul ettiği teminat, doğal bir fiyat aralığı olmayan küçük [[token]]'lar ya da basit bir [[twap]] kaynağı. Bedeli, dolar başına düşen \`L\`'dir.

**v3**, büyük çiftlerde yılların biriktirdiği derin likiditeye ve yerleşik bir "oracle"'a sahiptir. Getiri, aralık seçimine ve bilgili akışa karşı yeniden dengelemeye bağlıdır; pasif geniş aralıklar, büyük [[swap]]'ların çevresine eklenen "just-in-time" likiditeyle seyrelir. Birçok [[liquidity-provider]] ona, değiştirilebilir pay veren yönetici sözleşmeleri üzerinden ulaşır.

**v4** mekanikte öndedir: daha ucuz havuz açılışı, [[flash-accounting]] sayesinde daha ucuz [[multi-hop]] rotalar, [[native-eth]], serbest \`fee\` ve \`tickSpacing\`. [[hook]]'lar, daha önce "fork" gerektiren tasarımların ortak altyapı üzerinde yaşamasını sağlar: [[dynamic-fee]], \`afterSwap\` içinde doldurulan [[limit-order]], [[twamm]], dönen "delta" değerleriyle özel eğriler, "oracle"'lar.

v4 ile üstlendiklerin:

- **[[hook]] riski**: her [[swap]]'ın ve likidite değişikliğinin yolunda duran fazladan bir sözleşme; yükseltilebilir olabilir, çekimi engelleyebilir. Onu havuzun kendisi gibi denetle.
- **Parçalanma**: \`(fee, tickSpacing, hooks)\` serbesttir; bir çiftin likiditesi birçok havuza dağılır ve rota bulmak zorlaşır.
- **Yoğunlaşma**: bütün havuzların fonlarını tek bir sözleşme tutar.

\`hooks = address(0)\` olan düz havuzlarda v4, daha düşük [[gas]] maliyetiyle v3 gibi davranır.`,
      },
    },
  },
};

export default content;
