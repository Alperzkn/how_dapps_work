import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[tick]]'ler -> "tick"'ler.
// English technical words without a glossary entry are quoted by hand: "stablecoin".

const content: LessonContent = {
  labels: {
    priceNow: 'şimdiki fiyat',
    inRange: 'aralıkta',
    outRange: 'aralık dışı',
    idle: 'atıl sermaye',
    busy: '±%7,5 için kullanılan:',
    v2Spread: 'v2: her yere yayılmış',
    ruler: 'fiyat ekseni bir cetvel',
    tickStep: '1 tick = %0,01 fiyat adımı',
    activeRange: 'aktif aralık',
    usdcSide: 'takas edildi: USDC',
    ethSide: 'hâlâ ETH',
    tickBoundary: 'tick geçildi: likidite değişir',
    trader: 'alıcı ETH alıyor',
    tierStable: 'sabit çiftler',
    tierMost: 'çoğu çift',
    tierExotic: 'egzotik çiftler',
    nftCaption: 'her pozisyon ayrı bir NFT',
    v2Needs: 'v2 için gereken',
    v3Needs: 'v3 için gereken',
    noDepth: 'bu fiyatta derinlik yok',
    lower: 'Alt',
    upper: 'Üst',
    price: 'Fiyat',
    status: 'Pozisyon',
    holds: 'İçerik (10.000 USDC ile)',
    vsV2: 'v2’ye göre',
    ticks: 'Tick olarak aralık',
  },
  steps: {
    idle: {
      title: 'v2 havuzunun çoğu boşta bekler',
      alt: '1.000 ile 3.000 USDC arasındaki fiyat ekseni boyunca uzun, düz bir likidite tabakası uzanıyor. Yalnızca 2.000 olan güncel fiyatın çevresindeki dar, renkli kısım işlem görüyor; gri kalan kısım atıl.',
      body: {
        beginner: `Girişten en arkadaki tozlu depoya kadar bütün raflarına eşit miktarda mal koyan bir dükkân düşün. Müşteriler ise yalnızca kapının yanındaki iki rafa uğruyor.

v2'deki bir [[liquidity-pool]] böyle çalışır. [[liquidity-provider]]'ların koyduğu para, sıfıra yakın bir fiyattan sonsuza kadar **mümkün olan her fiyata** yayılır.

Oysa ETH'nin fiyatı her yere uğramaz; çoğu gün birkaç yüzde oynar. Tabakanın gri kısmı, belki hiç gelmeyecek fiyatları bekleyen paradır.`,
        intermediate: `v2'de [[constant-product]] kuralı \`x · y = k\`, 0'dan ∞'a kadar her fiyat için geçerlidir. Bu basittir ve havuz hiç tükenmez, ama sermayeyi boşa harcar.

Alım satımlar yalnızca güncel fiyatın yakınındaki [[reserves]] kısmını kullanır. ETH 2.000 USDC iken fiyatı 1.850–2.150 arasında herhangi bir yere götürmek, havuzun değerinin %4'ünden azını kullanır. Kalan %96 bu aralıkta hiçbir şey kazanmaz; ancak ETH aralıktan çıkarsa işe yarar.

"Stablecoin" çiftlerinde durum daha da uçtadır. Uniswap'in v3 duyuru yazısı, v2'deki bir DAI/USDC havuzunun sermayesinin yalnızca %0,5 kadarını 0,99 ile 1,01 arasındaki işlemlere ayırdığını belirtir; oysa hacmin neredeyse tamamı orada döner.`,
        expert: `v2'deki bir pozisyon, \`x · y = L²\` eğrisinin tamamına yayılmış likiditedir: \`x = L / √P\` ve \`y = L · √P\`. Fiyatın \`P\`'den \`P'\`'ye gitmesi için havuzun yalnızca \`Δy = L · (√P' − √P)\` kadarına ihtiyacı vardır; geri kalanı o aralığın dışındaki fiyatlar için tutulan teminattır.

\`P\` çevresindeki bir \`[Pa, Pb]\` aralığı için gerçekten gereken sermaye payı:

\`(2√P − √Pa − P/√Pb) / (2√P)\`

Fiyat 2.000 iken 1.850–2.150 için bu %3,7; fiyat 1,00 iken 0,99–1,01 için %0,5 eder. Bunun tersi, v3'ün sunduğu [[capital-efficiency]] kazancıdır: bu iki aralık için 27× ve 200×.

v2'de sonuç, TVL başına yüksek [[price-impact]] ve sermayeye göre düşük ücret getirisidir. v3, aralığı her [[liquidity-provider]]'ın kendisinin seçmesine izin verir.`,
      },
    },
    concentrated: {
      title: '"Concentrated liquidity"',
      alt: 'Düz tabaka, bir alt ve bir üst fiyat arasında yükselen uzun sütunlara dönüşmüş. Soluk bir çerçeve eski v2 tabakasını gösteriyor. Bir işaret, aralığın içindeki güncel fiyatı gösteriyor.',
      body: {
        beginner: `Uniswap v3 sana şunu söyleme imkânı verir: "Paramı **yalnızca şu iki fiyat arasında** kullan." Buna [[concentrated-liquidity]] denir.

Aynı para daha dar bir banda sıkıştırılınca çok daha yüksek durur. Yüksek olması, alıcıların fiyatı oynatmadan daha çok takas yapabilmesi ve senin ücretlerden daha büyük pay alman demektir.

Sürgüleri oynat. Bandı daralt, sütunlar yükselsin. Şimdi fiyatı bandın bir kenarından dışarı çıkar: fiyat geri dönene kadar pozisyonun çalışmaz.`,
        intermediate: `[[concentrated-liquidity]] ile bir [[liquidity-provider]] bir [[price-range]] seçer: bir alt ve bir üst fiyat. Aralığın içinde pozisyon tıpkı bir v2 havuzu gibi işlem görür; yalnızca çok daha büyük bir havuz gibi.

Sürgüleri dene:

- Fiyat 2.000 iken 1.800–2.200 aralığındaki 10.000 USDC'lik bir pozisyon, v2'deki yaklaşık 204.000 USDC kadar derindir: kabaca 20×.
- Aralığı 1.900–2.100'e daraltırsan yaklaşık 40× olur.
- Fiyatı aralığın dışına çıkarırsan pozisyon [[out-of-range]] durumuna düşer: ücret kazanmaz ve tek bir [[token]] tutar.

Sütunlar, içlerinde ne olduğuna göre renklidir. Güncel fiyatın altında kalan kısım çoktan USDC'ye çevrilmiştir; üstünde kalan kısım hâlâ ETH'dir.`,
        expert: `Bir pozisyon \`[Pa, Pb]\` içinde, [[liquidity-l]] değeri \`L\` olan bir [[constant-product]] eğrisi gibi davranır; eğri, her sınırda tam olarak bir [[token]] tükenecek şekilde kaydırılmıştır. Gerçekte tuttuğu miktarlar:

- \`x = L · (1/√P − 1/√Pb)\`
- \`y = L · (√P − √Pa)\`

Burada \`P\`, \`[Pa, Pb]\` aralığına sıkıştırılır. Kaydırma terimleri eklenince [[virtual-reserves]] elde edilir: \`(x + L/√Pb) · (y + L·√Pa) = L²\`.

Yatırılan değer sabitken aralık daraldıkça \`L\` büyür. Tüm aralığa göre çarpan \`2√P / (2√P − √Pa − P/√Pb)\` olur; \`P\` sınırların geometrik ortalamasıysa bu \`1 / (1 − (Pa/Pb)^¼)\` biçimine sadeleşir. Paneldeki sayılar bu formüllerden gelir.

\`Pa\`'nın altında pozisyonun tamamı token0'dır (\`y = 0\`); \`Pb\`'nin üstünde tamamı token1'dir (\`x = 0\`). Havuzun aktif likiditesi, aralığı güncel fiyatı içeren bütün pozisyonların \`L\` değerlerinin toplamıdır.`,
      },
      code: {
        lang: 'Solidity (LiquidityAmounts.sol, sadeleştirilmiş)',
        source: `// karekök fiyatlar Q64.96 sayılardır: sqrtP * 2^96
function getAmount0ForLiquidity(uint160 sqrtRatioAX96, uint160 sqrtRatioBX96, uint128 liquidity)
    internal pure returns (uint256 amount0)
{
    // x = L * (1/sqrtA - 1/sqrtB)
    return FullMath.mulDiv(
        uint256(liquidity) << FixedPoint96.RESOLUTION,   // RESOLUTION = 96
        sqrtRatioBX96 - sqrtRatioAX96,
        sqrtRatioBX96
    ) / sqrtRatioAX96;
}

function getAmount1ForLiquidity(uint160 sqrtRatioAX96, uint160 sqrtRatioBX96, uint128 liquidity)
    internal pure returns (uint256 amount1)
{
    // y = L * (sqrtB - sqrtA)
    return FullMath.mulDiv(liquidity, sqrtRatioBX96 - sqrtRatioAX96, FixedPoint96.Q96);   // Q96 = 2^96
}`,
      },
    },
    ticks: {
      title: '"Tick": fiyat cetvelinin çizgileri',
      alt: 'Fiyat ekseninde artık cetvel gibi eşit aralıklı küçük direkler var. Daha uzun iki direk pozisyonun alt ve üst sınırını gösteriyor; pozisyon bu ikisinin arasında uzun sütunlar olarak duruyor.',
      body: {
        beginner: `Bandının kenarları için istediğin her fiyatı seçemezsin. Fiyat çizgisi bir cetvel gibi işaretlidir ve kenarların bir işaretin üstüne oturmak zorundadır. Bu işaretlerin her birine [[tick]] denir.

İşaretler birbirine çok yakındır: her biri bir öncekinden yalnızca %0,01 daha yüksek bir fiyattır. Yani pratikte [[price-range]]'ini neredeyse istediğin yere koyabilirsin.

Sürgüleri oynat ve daha uzun iki direğe bak. Onlar, pozisyonunun başladığı ve bittiği [[tick]]'lerdir.`,
        intermediate: `[[tick]], bir fiyatı gösteren tam sayı bir sıra numarasıdır: bir [[tick]] yukarı çıkmak fiyatı 1,0001 ile çarpar, yani %0,01'lik bir adımdır. Bir [[price-range]] iki fiyat olarak değil, alt ve üst olmak üzere iki [[tick]] olarak saklanır.

Havuzlar her [[tick]]'i sınır olarak kabul etmez. Her havuzun, [[fee-tier]]'ına bağlı bir [[tick-spacing]] değeri vardır: bu değer 60 ise yalnızca 60'a bölünen [[tick]]'ler kullanılabilir; bu da sınırların yaklaşık %0,6 arayla dizilmesi demektir.

Havuz yalnızca bir pozisyonun başladığı ya da bittiği [[tick]]'lerde fazladan iş yapar. Bunlara "initialized tick" denir. [[tick-spacing]] büyüdükçe büyük bir [[swap]] sırasında geçilecek böyle noktaların sayısı azalır ve [[swap]] daha az [[gas]] harcar.`,
        expert: `Fiyatlar [[tick]] ile numaralanır: \`p(i) = 1.0001^i\`; \`i\`, \`[−887272, 887272]\` aralığında bir \`int24\`'tür. Havuz fiyatın kendisini saklamaz. \`slot0\` içinde [[sqrt-price-x96]] tutulur: \`√(token1/token0)\` değerinin işaretsiz Q64.96 sabit noktalı gösterimi. Yanında güncel \`tick = ⌊log₁.₀₀₀₁ P⌋\` durur. \`√P\` ile çalışmak [[swap]] denklemlerini doğrusal yapar: \`Δy = L · Δ√P\` ve \`Δx = L · Δ(1/√P)\`.

Bir pozisyonun sınırları havuzun [[tick-spacing]] değerinin katı olmalıdır: %0,01, %0,05, %0,30 ve %1 kademeleri için sırasıyla 1, 10, 60 ve 200.

Fiyat her zaman ham birimlerle \`token1/token0\`'dır ve [[token]]'lar adrese göre sıralanır. Burada gösterilen [[tick]]'ler, insanın okuduğu 2.000 USDC/ETH fiyatı içindir ([[tick]] 76.012, \`sqrtPriceX96 ≈ 3,54 × 10^30\`). Gerçek "mainnet" havuzunda token0 USDC'dir ve WETH'in 18 ondalığına karşılık 6 ondalığı vardır; bu yüzden 2.000 USDC/ETH, ham fiyat olarak 5 × 10^8'e ve 200.311 civarında bir [[tick]]'e karşılık gelir.

Her [[tick]]'in durumu \`ticks[i]\` içinde tutulur (\`liquidityGross\`, \`liquidityNet\`, dışarıdaki ücret büyümesi). Bir sonraki "initialized tick", \`tickBitmap\` ile bulunur: kullanılabilir her [[tick]] için bir bit, \`int16(tick / tickSpacing >> 8)\` anahtarlı 256 bitlik kelimelere paketlenir.`,
      },
      code: {
        lang: 'Solidity (UniswapV3Pool.sol, kısaltılmış)',
        source: `struct Slot0 {
    uint160 sqrtPriceX96;  // sqrt(token1/token0) * 2^96
    int24   tick;          // floor(log_1.0001(fiyat))
    uint16  observationIndex;
    uint16  observationCardinality;
    uint16  observationCardinalityNext;
    uint8   feeProtocol;
    bool    unlocked;      // reentrancy kilidi
}
Slot0 public slot0;

uint128 public liquidity;                     // güncel tick'teki aktif L
mapping(int24 => Tick.Info) public ticks;     // liquidityNet, feeGrowthOutside...
mapping(int16 => uint256) public tickBitmap;  // hangi tick'ler initialized`,
      },
    },
    crossing: {
      title: 'Bir "swap", "tick"\'lerin üzerinden yürür',
      alt: 'Farklı yüksekliklerde sütunlardan oluşan bir sıra. Bir alıcı USDC gönderip ETH alıyor; fiyat işareti sütun sütun sağa ilerliyor. Geçtiği sütunlar ETH renginden USDC rengine dönüyor, işaretin altındaki sütun parlıyor.',
      body: {
        beginner: `Birçok kişi farklı bantlar seçtiği için havuz bir şehir silüetine benzer: çok bandın üst üste geldiği yerde yüksek, az bandın olduğu yerde alçak.

Bir alıcının ETH almasını izle. Fiyat sağa doğru, sütun sütun tırmanır. O anda işi yapan tek sütun, işaretin altındaki sütundur.

Yüksek bir sütunda fiyat yavaş ilerler, çünkü o fiyattan satılacak çok şey vardır. Alçak sütunda ise koşar. Fiyatın geçtiği her sütun ETH'sini satmıştır ve artık USDC tutar.`,
        intermediate: `Herhangi bir anda yalnızca [[price-range]]'i güncel fiyatı içeren pozisyonlar aktiftir. Bir sonraki işlemin [[price-impact]] değerini onların toplam likiditesi belirler.

Bir [[swap]] aralık aralık ilerler:

- Bulunduğu aralığın içinde, aktif likiditeyi kullanarak bildiğimiz eğriyi izler.
- Bir pozisyonun başladığı ya da bittiği bir [[tick]]'e ulaşınca havuz o pozisyonun likiditesini ekler ya da çıkarır ve yoluna devam eder.
- Alıcı, her aralıkta takas ettiği miktar üzerinden ücret öder; bu ücret orada aktif olan pozisyonlar arasında paylaşılır.

Yani büyük bir [[swap]] birkaç [[tick]] geçebilir ve ortalama fiyatı, her aralığın ne kadar derin olduğuna bağlıdır. Her geçiş fazladan [[gas]] harcar.`,
        expert: `Havuz, aktif aralık için tek bir sayı tutar: \`liquidity\`, yani aralıkta olan pozisyonların [[liquidity-l]] toplamı. \`swap()\`, girdi tükenene ya da fiyat sınırına ulaşılana kadar döner:

- \`tickBitmap.nextInitializedTickWithinOneWord\` ile [[swap]] yönündeki bir sonraki "initialized tick" bulunur;
- \`SwapMath.computeSwapStep\`, güncel \`L\` ile [[sqrt-price-x96]] değerini o [[tick]]'in fiyatına doğru ilerletir: token1 girişi için \`Δ√P = Δy / L\`, token0 girişi için \`Δ(1/√P) = Δx / L\`; ücret girdiden kesilir;
- [[tick]] fiyatına ulaşıldıysa geçilir: \`ticks.cross()\`, o [[tick]]'in \`feeGrowthOutside\` değerlerini çevirir ve \`liquidityNet\` döndürür; bu değer yukarı giderken \`liquidity\`'ye eklenir, aşağı giderken çıkarılır.

Bir [[tick]]'teki \`liquidityNet\`, alt sınırı o [[tick]] olan pozisyonlar için \`+L\`, üst sınırı o [[tick]] olanlar için \`−L\` değerlerinin toplamıdır.

Ücretler, fiyatlamada kullanılan rezervlere hiç karışmaz. Her adım \`feeGrowthGlobal0X128\` ya da \`feeGrowthGlobal1X128\` değerine \`feeAmount · 2^128 / liquidity\` ekler. Bir pozisyonun payı \`feeGrowthInside = global − below − above\` olarak okunur; bu, pozisyonun iki [[tick]]'indeki \`feeGrowthOutside\` değerlerinden hesaplanır.`,
      },
      code: {
        lang: 'Solidity (UniswapV3Pool.swap, sadeleştirilmiş)',
        source: `while (state.amountSpecifiedRemaining != 0 && state.sqrtPriceX96 != sqrtPriceLimitX96) {
    (step.tickNext, step.initialized) =
        tickBitmap.nextInitializedTickWithinOneWord(state.tick, tickSpacing, zeroForOne);
    step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

    // güncel aralığın içinde, aktif likiditeyle takas
    (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) =
        SwapMath.computeSwapStep(state.sqrtPriceX96,
                                 sqrtRatioTargetX96,   // sıradaki tick'in fiyatı ya da fiyat sınırı
                                 state.liquidity, state.amountSpecifiedRemaining, fee);

    state.feeGrowthGlobalX128 +=
        FullMath.mulDiv(step.feeAmount, FixedPoint128.Q128, state.liquidity);

    if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {       // tick'e ulaşıldı
        if (step.initialized) {
            int128 liquidityNet = ticks.cross(step.tickNext, /* ücret büyümesi, oracle */);
            if (zeroForOne) liquidityNet = -liquidityNet;    // aşağı gidiliyor
            state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
        }
        state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
    }
}`,
      },
    },
    'fees-nft': {
      title: 'Ücret kademeleri ve "NFT" olarak pozisyonlar',
      alt: 'Aynı çift için üç ayrı havuz yan yana duruyor; üzerlerinde %0,05, %0,30 ve %1 yazıyor ve sütunları ince, orta ve kalın. Üstlerinde kartlar süzülüyor; her kart kapsadığı fiyat aralığına bağlı.',
      body: {
        beginner: `v2'de bütün havuzlar aynı %0,3 ücreti alırdı. v3'te aynı iki [[token]] için birden fazla havuz olabilir ve her birinin ücreti farklıdır: fiyatı pek oynamayan çiftler için çok küçük, riskli çiftler için daha büyük bir ücret.

İkinci bir değişiklik daha var. v2'de herkesin havuzdaki payı aynı türden bir şeydi, bu yüzden basit bir [[token]] olabiliyordu. v3'te bandını sen seçersin ve hiçbir bant bir diğerine benzemez.

Bu yüzden pozisyonun eşi olmayan bir makbuzdur: bir "NFT". Kartta hangi havuz, hangi bant ve ne kadar olduğu yazar. Kart kimdeyse pozisyon onundur.`,
        intermediate: `Bir v3 havuzunu iki [[token]] **ve** bir [[fee-tier]] tanımlar. Kademeler %0,01, %0,05, %0,30 ve %1'dir. Her kademe, kendi fiyatı ve likiditesi olan ayrı bir havuzdur; bir çift için hangisinin derin havuz olacağına piyasa karar verir.

- %0,01 ve %0,05: "stablecoin" çiftleri ve en büyük çiftler; burada [[liquidity-provider]] az risk alır.
- %0,30: çoğu çift.
- %1: oynak ya da az işlem gören [[token]]'lar.

Kademe aynı zamanda [[tick-spacing]] değerini de belirler: 1, 10, 60 ve 200.

Her pozisyonun aralığı kendine ait olduğu için v2'nin birbirinin yerine geçebilen [[lp-token]]'ı artık işe yaramaz. Bir pozisyon bir [[nft-position]]'dır, yani bir ERC-721 [[token]]'dır. Ücretler v2'deki gibi pozisyona geri eklenmez: ayrı bir yerde birikir ve sahibi onları kendisi toplar.`,
        expert: `"Factory", \`(token0, token1, fee)\` üçlüsünü tek bir havuza eşler; \`feeAmountTickSpacing\` ise 100 → 1, 500 → 10, 3000 → 60, 10000 → 200 değerlerini verir (ücretler "basis point"'in yüzde biri cinsindendir). %0,01 kademesi sonradan yönetişim kararıyla, \`enableFeeAmount\` üzerinden eklendi.

Çekirdek havuz "NFT" diye bir şey bilmez. Pozisyonları \`keccak256(abi.encodePacked(owner, tickLower, tickUpper))\` ile anahtarlar ve \`liquidity\`, \`feeGrowthInside0LastX128\`, \`feeGrowthInside1LastX128\`, \`tokensOwed0\` ve \`tokensOwed1\` değerlerini saklar. Çoğu kullanıcı için \`owner\`, çevre sözleşmesi \`NonfungiblePositionManager\`'dır; bu sözleşme her pozisyon için bir [[nft-position]] (ERC-721) basar ve \`tokenId → (pool, tickLower, tickUpper, liquidity, …)\` kaydını tutar.

Alacak ücret, her [[token]] için \`liquidity · (feeGrowthInside − feeGrowthInsideLast) / 2^128\` kadardır. Pozisyona dokunulduğunda \`tokensOwed0\` / \`tokensOwed1\` alanlarına yazılır ve \`collect()\` ile ödenir. Bileşik getiri oluşmaz; yeniden yatırmak için tekrar likidite eklemek gerekir.

Birbirinin yerine geçemeyen pozisyonlar, bir [[erc-20]] beklenen yerlerde doğrudan kullanılamaz. Bu boşluğu, bir v3 pozisyonunu yönetip karşılığında değiştirilebilir pay veren "vault" sözleşmeleri doldurur.`,
      },
      code: {
        lang: 'Solidity (INonfungiblePositionManager.sol)',
        source: `struct MintParams {
    address token0;
    address token1;
    uint24  fee;         // 500 = %0,05, 3000 = %0,30
    int24   tickLower;   // tickSpacing'in katı olmalı
    int24   tickUpper;
    uint256 amount0Desired;
    uint256 amount1Desired;
    uint256 amount0Min;  // slippage koruması
    uint256 amount1Min;
    address recipient;   // NFT'yi alan adres
    uint256 deadline;
}

function mint(MintParams calldata params)
    external payable
    returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);`,
      },
    },
    efficiency: {
      title: 'Sermayenden daha fazlası, ama daha fazla risk',
      alt: 'İki sıra likidite. Arkada, tüm aralığa yayılmış düz v2 tabakası ve yanında yüksek bir sermaye yığını. Önde, yoğunlaştırılmış v3 pozisyonu ve yanında güncel fiyatta aynı derinliği sağlayan çok daha küçük bir yığın.',
      body: {
        beginner: `Soldaki iki yığın işin özünü gösteriyor. Bugünkü fiyatta alıcılara aynı derinliği sunmak için v2 büyük yığına ihtiyaç duyar. Senin v3 bandın için küçük yığın yeter.

İyi haber bu: fiyat bandının içinde kaldığı sürece aynı para çok daha fazla ücret kazanır.

Kötü haber şu: fiyat bandı geride bırakabilir. Fiyatı bandın dışına kaydır. Pozisyonun artık hiçbir şey kazanmaz ve tamamı, ucuzlayan [[token]]'a dönüşmüştür. Dar bantlar daha çok kazanır ama daha sık geride kalır.`,
        intermediate: `[[capital-efficiency]], sermayenin bir aralıkta sağladığı derinliğin, v2'de sağlayacağı derinliğe oranıdır. Sürgüleri dene: 1.800–2.200 yaklaşık 20×, 1.950–2.050 yaklaşık 80× eder.

Bedeli risktir:

- **[[out-of-range]]**: fiyat aralığından çıkınca ücret kazanmazsın. Aralığın üstünde yalnızca USDC tutarsın (yukarı çıkarken bütün ETH'ni satmışsındır); altında yalnızca ETH (aşağı inerken hep almışsındır).
- **Daha büyük [[impermanent-loss]]**: pozisyonun bir v2 pozisyonundan daha hızlı yeniden dengelenir; bu yüzden elde tutmaya göre kayıp, verimlilikle yaklaşık aynı oranda büyür.
- **Bakım**: aralıkta kalmak pozisyonu taşımayı gerektirir; bu [[gas]] harcar ve kaybı kesinleştirir.

Dar aralıklar, "stablecoin"'ler gibi fiyatını koruyan çiftlere uyar. Geniş aralıklar oynak çiftlere uyar.`,
        expert: `Aynı sermaye için [[liquidity-l]] değeri \`L\`, verimlilik çarpanı \`2√P / (2√P − √Pa − P/√Pb)\` kadar büyüktür. Hacim başına ücret geliri aktif \`L\` içindeki payınla orantılıdır; dolayısıyla aralıkta kaldığın sürece aynı çarpanla büyür.

Kayıp da öyle. Bir pozisyonun aralık içindeki değeri \`V(P) = L · (2√P − √Pa − P/√Pb)\` olur. Başlangıçtaki miktarları elde tutmaya göre farkta kaydırma terimleri birbirini götürür ve geriye \`L · (2√P − √P₀ − P/√P₀)\` kalır: bu, aynı \`L\`'ye sahip bir v2 pozisyonunun [[impermanent-loss]] değerinin ta kendisidir. \`L\` *n* kat büyükse, bir sınıra ulaşılana kadar sermayeye oranla kayıp da *n* kat büyüktür.

Sınırın ötesinde pozisyon %100 değer kaybeden varlıktan oluşur ve kazanmayı bırakır: \`Pb\`'nin üstünde \`L · (√Pb − √Pa)\` kadar token1, \`Pa\`'nın altında \`L · (1/√Pa − 1/√Pb)\` kadar token0 tutar. Bu yüzden fiyatın tamamen üstüne ya da altına konan tek taraflı bir aralık, ücret kazanan bekleyen bir limit emri gibi davranır; ama fiyat geri dönerse emir geri açılır.

v3'te bir [[liquidity-provider]]'ın getirisi, ücretlerden bu kaybın çıkarılmasıyla bulunur. Ücretler, aktif [[tick]]'te likidite sağlayana gider; bu yüzden pasif geniş pozisyonlar, aktif yönetilen dar pozisyonlarla yarışır. Bunlara, büyük bir [[swap]]'tan hemen önce eklenip hemen sonra çekilen likidite de dahildir.`,
      },
    },
  },
};

export default content;
