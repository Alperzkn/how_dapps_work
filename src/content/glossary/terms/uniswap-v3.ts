import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'concentrated-liquidity',
    name: 'concentrated liquidity',
    category: 'defi',
    related: ['price-range', 'capital-efficiency', 'liquidity-l', 'out-of-range'],
    lesson: 'uniswap-v3',
    en: {
      short: 'Liquidity that works only between two chosen prices instead of across every price.',
      long: `In Uniswap v2 a deposit is spread over all prices from zero to infinity. With concentrated liquidity, introduced in v3, each [[liquidity-provider]] chooses a [[price-range]] and their capital is used only while the price is inside it.

The same money in a narrower range gives deeper markets and a larger share of fees: this is [[capital-efficiency]]. The price for it is that the position becomes [[out-of-range]] and stops earning when the market moves past either bound.`,
    },
    tr: {
      short: 'Bütün fiyatlara yayılmak yerine yalnızca seçilen iki fiyat arasında çalışan likidite.',
      long: `Uniswap v2'de yatırılan para sıfırdan sonsuza kadar bütün fiyatlara yayılır. v3 ile gelen [[concentrated-liquidity]] yaklaşımında her [[liquidity-provider]] bir [[price-range]] seçer ve sermayesi yalnızca fiyat bu aralığın içindeyken kullanılır.

Aynı para daha dar bir aralıkta daha derin bir piyasa ve ücretlerden daha büyük bir pay sağlar; buna [[capital-efficiency]] denir. Bedeli şudur: piyasa sınırlardan birini aşınca pozisyon [[out-of-range]] durumuna düşer ve kazanmayı bırakır.`,
    },
  },
  {
    id: 'tick',
    name: 'tick',
    category: 'defi',
    related: ['tick-spacing', 'price-range', 'sqrt-price-x96'],
    lesson: 'uniswap-v3',
    en: {
      short: 'An integer index for a price in Uniswap v3: each tick is a price 0.01% above the previous one.',
      long: `Uniswap v3 does not let positions start and end at arbitrary prices. Prices are numbered by ticks, with \`price = 1.0001^tick\`, so neighbouring ticks differ by 0.01%. Tick 0 is a price of 1.

A [[price-range]] is stored as a lower and an upper tick. During a [[swap]], the pool only has to do extra work when the price crosses a tick where some position begins or ends; there it adds or removes that position's liquidity.

Which ticks may be used as boundaries depends on the pool's [[tick-spacing]].`,
    },
    tr: {
      short: 'Uniswap v3\'te bir fiyatı gösteren tam sayı sıra numarası; her [[tick]] bir öncekinden %0,01 yüksek bir fiyattır.',
      long: `Uniswap v3, pozisyonların rastgele fiyatlarda başlayıp bitmesine izin vermez. Fiyatlar [[tick]] ile numaralanır: \`price = 1.0001^tick\`. Yani komşu iki [[tick]] arasında %0,01 fark vardır; 0 numaralı [[tick]] 1 fiyatına karşılık gelir.

Bir [[price-range]], alt ve üst olmak üzere iki [[tick]] olarak saklanır. Bir [[swap]] sırasında havuz, yalnızca fiyat bir pozisyonun başladığı ya da bittiği bir [[tick]]'i geçtiğinde fazladan iş yapar; orada o pozisyonun likiditesini ekler ya da çıkarır.

Hangi [[tick]]'lerin sınır olarak kullanılabileceği havuzun [[tick-spacing]] değerine bağlıdır.`,
    },
  },
  {
    id: 'price-range',
    name: 'price range',
    category: 'defi',
    related: ['concentrated-liquidity', 'tick', 'out-of-range'],
    lesson: 'uniswap-v3',
    en: {
      short: 'The lower and upper price between which a v3 position provides liquidity.',
      long: `A v3 position is defined by a lower and an upper price, stored as two [[tick|ticks]]. While the market price is between them, the position trades and earns fees.

As the price moves up through the range, the position gradually sells its first token for the second; moving down, it buys it back. At the upper bound it holds only the second token, at the lower bound only the first.

A narrow range gives more [[capital-efficiency]] but is left behind more easily; see [[out-of-range]].`,
    },
    tr: {
      short: 'Bir v3 pozisyonunun likidite sağladığı alt ve üst fiyat arası.',
      long: `Bir v3 pozisyonu, iki [[tick]] olarak saklanan bir alt ve bir üst fiyatla tanımlanır. Piyasa fiyatı ikisinin arasındayken pozisyon işlem görür ve ücret kazanır.

Fiyat aralığın içinde yukarı çıktıkça pozisyon ilk [[token]]'ını azar azar ikincisi karşılığında satar; aşağı indikçe geri alır. Üst sınırda yalnızca ikinci [[token]]'ı, alt sınırda yalnızca birincisini tutar.

Dar bir aralık daha fazla [[capital-efficiency]] sağlar ama daha kolay geride kalır; bkz. [[out-of-range]].`,
    },
  },
  {
    id: 'fee-tier',
    name: 'fee tier',
    category: 'defi',
    related: ['tick-spacing', 'liquidity-pool', 'dynamic-fee'],
    lesson: 'uniswap-v3',
    en: {
      short: 'One of the fixed swap fees a Uniswap v3 pool can have: 0.01%, 0.05%, 0.30% or 1%.',
      long: `In v2 every pool charges 0.30%. In v3 the same pair of tokens can have several pools, one per fee tier, each with its own price and liquidity.

Low tiers suit pairs whose price barely moves, such as two stablecoins, because liquidity providers take little risk there. High tiers compensate providers of volatile or rarely traded tokens.

The tier also sets the pool's [[tick-spacing]]: 1, 10, 60 and 200 for 0.01%, 0.05%, 0.30% and 1%.`,
    },
    tr: {
      short: 'Bir Uniswap v3 havuzunun sahip olabileceği sabit [[swap]] ücretlerinden biri: %0,01, %0,05, %0,30 ya da %1.',
      long: `v2'de her havuz %0,30 ücret alır. v3'te aynı [[token]] çifti için her [[fee-tier]] başına bir tane olmak üzere birden fazla havuz olabilir; her birinin fiyatı ve likiditesi ayrıdır.

Düşük kademeler, iki "stablecoin" gibi fiyatı pek oynamayan çiftlere uyar; çünkü likidite sağlayanlar orada az risk alır. Yüksek kademeler, oynak ya da az işlem gören [[token]]'lara likidite sağlayanların riskini karşılar.

Kademe, havuzun [[tick-spacing]] değerini de belirler: %0,01, %0,05, %0,30 ve %1 için sırasıyla 1, 10, 60 ve 200.`,
    },
  },
  {
    id: 'nft-position',
    name: 'NFT position',
    category: 'defi',
    related: ['price-range', 'lp-token', 'concentrated-liquidity'],
    lesson: 'uniswap-v3',
    en: {
      short: 'A Uniswap v3 liquidity position represented as a unique ERC-721 token rather than a fungible LP token.',
      long: `In v2 all shares of a pool are identical, so they are an ordinary [[lp-token]]. In v3 every position has its own [[price-range]], so two positions are generally not interchangeable.

The \`NonfungiblePositionManager\` contract therefore mints an ERC-721 token for each position. The token id points to the pool, the lower and upper [[tick]], the liquidity and the fees owed. Whoever owns the token can add or remove liquidity and collect fees.

Fees are not reinvested automatically; they accumulate separately until collected.`,
    },
    tr: {
      short: 'Değiştirilebilir bir [[lp-token]] yerine eşsiz bir ERC-721 [[token]] olarak temsil edilen Uniswap v3 likidite pozisyonu.',
      long: `v2'de bir havuzdaki bütün paylar aynıdır; bu yüzden sıradan bir [[lp-token]] olarak tutulur. v3'te her pozisyonun kendi [[price-range]]'i vardır; iki pozisyon genellikle birbirinin yerine geçemez.

Bu nedenle \`NonfungiblePositionManager\` sözleşmesi her pozisyon için bir ERC-721 [[token]] basar. Bunun kimlik numarası havuzu, alt ve üst [[tick]]'i, likiditeyi ve alacak ücretleri gösterir. Ona sahip olan kişi likidite ekleyip çıkarabilir ve ücretleri toplayabilir.

Ücretler kendiliğinden yeniden yatırılmaz; toplanana kadar ayrı bir yerde birikir.`,
    },
  },
  {
    id: 'sqrt-price-x96',
    name: 'sqrtPriceX96',
    category: 'defi',
    related: ['tick', 'liquidity-l', 'virtual-reserves'],
    lesson: 'uniswap-v3',
    en: {
      short: 'How a v3 pool stores its price: the square root of the price, multiplied by 2^96.',
      long: `A v3 pool does not keep reserves and divide them. It stores the current price directly, as \`sqrtPriceX96 = √(token1/token0) · 2^96\`, a Q64.96 fixed-point number in a \`uint160\`.

The square root is used because the swap formulas become linear in it: the amount of token1 that moves is \`L · Δ√P\`, and the amount of token0 is \`L · Δ(1/√P)\`, where \`L\` is the [[liquidity-l|liquidity]].

To read a price: \`price = (sqrtPriceX96 / 2^96)²\`, in raw token units, so the tokens' decimals still have to be applied. The pool also stores the matching [[tick]].`,
    },
    tr: {
      short: 'Bir v3 havuzunun fiyatı saklama biçimi: fiyatın karekökünün 2^96 ile çarpılmış hali.',
      long: `Bir v3 havuzu rezerv tutup bunları birbirine bölmez. Güncel fiyatı doğrudan saklar: \`sqrtPriceX96 = √(token1/token0) · 2^96\`; bu, bir \`uint160\` içinde duran Q64.96 sabit noktalı bir sayıdır.

Karekök kullanılır, çünkü [[swap]] formülleri onunla doğrusal hale gelir: yer değiştiren token1 miktarı \`L · Δ√P\`, token0 miktarı \`L · Δ(1/√P)\` olur; burada \`L\`, [[liquidity-l]] değeridir.

Fiyatı okumak için: \`price = (sqrtPriceX96 / 2^96)²\`. Sonuç ham [[token]] birimleriyledir; ondalık basamakların ayrıca uygulanması gerekir. Havuz buna karşılık gelen [[tick]]'i de saklar.`,
    },
  },
  {
    id: 'liquidity-l',
    name: 'liquidity (L)',
    category: 'defi',
    related: ['virtual-reserves', 'sqrt-price-x96', 'concentrated-liquidity'],
    lesson: 'uniswap-v3',
    en: {
      short: 'The number L that measures how deep a pool or position is: L = √(x · y) of the curve it trades on.',
      long: `For a [[constant-product]] curve \`x · y = k\`, liquidity is \`L = √k\`. It measures depth: moving the square root of the price by \`Δ√P\` takes \`L · Δ√P\` of the second token, so a larger \`L\` means a smaller [[price-impact]].

In v3 each position has its own \`L\` over its [[price-range]]. The pool's active liquidity at any moment is the sum of \`L\` over the positions whose range contains the current price, and it changes whenever the price crosses a [[tick]] where a position begins or ends.

For a fixed deposit, a narrower range gives a larger \`L\`.`,
    },
    tr: {
      short: 'Bir havuzun ya da pozisyonun ne kadar derin olduğunu ölçen L sayısı: işlem gördüğü eğrinin √(x · y) değeri.',
      long: `Bir [[constant-product]] eğrisi \`x · y = k\` için likidite \`L = √k\` olarak tanımlanır. Derinliği ölçer: fiyatın karekökünü \`Δ√P\` kadar oynatmak, ikinci [[token]]'dan \`L · Δ√P\` kadar gerektirir; yani \`L\` büyüdükçe [[price-impact]] küçülür.

v3'te her pozisyonun, kendi [[price-range]]'i üzerinde ayrı bir \`L\` değeri vardır. Havuzun herhangi bir andaki aktif likiditesi, aralığı güncel fiyatı içeren pozisyonların \`L\` toplamıdır ve fiyat, bir pozisyonun başladığı ya da bittiği bir [[tick]]'i her geçtiğinde değişir.

Yatırılan miktar sabitken aralık daraldıkça \`L\` büyür.`,
    },
  },
  {
    id: 'virtual-reserves',
    name: 'virtual reserves',
    category: 'defi',
    related: ['liquidity-l', 'reserves', 'concentrated-liquidity'],
    lesson: 'uniswap-v3',
    en: {
      short: 'The reserves a v2 pool would need to be as deep as a v3 position is inside its range.',
      long: `Inside its [[price-range]], a v3 position trades as if it were a v2 pool with reserves \`x = L/√P\` and \`y = L·√P\`. Those are its virtual reserves.

The position really holds less: \`x_real = L·(1/√P − 1/√Pb)\` and \`y_real = L·(√P − √Pa)\`. The difference is the part of a full-range curve that would only be needed outside the range, and v3 simply does not ask for it.

That is why the real reserves run out exactly at the bounds: at the upper bound the position has no first token left, and at the lower bound no second token.`,
    },
    tr: {
      short: 'Bir v2 havuzunun, bir v3 pozisyonunun kendi aralığındaki derinliğine ulaşmak için ihtiyaç duyacağı rezervler.',
      long: `Bir v3 pozisyonu, [[price-range]]'inin içinde sanki rezervleri \`x = L/√P\` ve \`y = L·√P\` olan bir v2 havuzuymuş gibi işlem görür. Bunlara [[virtual-reserves]] denir.

Pozisyonun gerçekte tuttuğu miktar daha azdır: \`x_real = L·(1/√P − 1/√Pb)\` ve \`y_real = L·(√P − √Pa)\`. Aradaki fark, tüm aralığa yayılan bir eğrinin yalnızca aralığın dışında ihtiyaç duyacağı kısımdır; v3 bunu hiç istemez.

Gerçek rezervlerin tam sınırlarda tükenmesinin nedeni budur: üst sınırda pozisyonda ilk [[token]]'dan, alt sınırda ikinci [[token]]'dan hiç kalmaz.`,
    },
  },
  {
    id: 'capital-efficiency',
    name: 'capital efficiency',
    category: 'defi',
    related: ['concentrated-liquidity', 'price-range', 'impermanent-loss'],
    lesson: 'uniswap-v3',
    en: {
      short: 'How much market depth a given amount of capital provides, compared with spreading it over all prices.',
      long: `A v3 position in a narrow [[price-range]] provides the same depth as a much larger v2 deposit. The ratio is the capital efficiency: \`2√P / (2√P − √Pa − P/√Pb)\` for a range \`[Pa, Pb]\` at price \`P\`.

A range of about ±10% around the price gives roughly 20×; ±1% gives roughly 200×.

The gain is not free. While in range, [[impermanent-loss]] as a share of capital grows by the same factor, and once the price leaves the range the position earns nothing.`,
    },
    tr: {
      short: 'Belirli bir sermayenin, bütün fiyatlara yayılmasına kıyasla ne kadar piyasa derinliği sağladığı.',
      long: `Dar bir [[price-range]] içindeki v3 pozisyonu, çok daha büyük bir v2 yatırımıyla aynı derinliği sağlar. Bu oran [[capital-efficiency]] değeridir: fiyat \`P\` iken \`[Pa, Pb]\` aralığı için \`2√P / (2√P − √Pa − P/√Pb)\`.

Fiyatın yaklaşık ±%10 çevresindeki bir aralık kabaca 20×, ±%1'lik bir aralık kabaca 200× verir.

Bu kazanç bedelsiz değildir. Aralıktayken sermayeye oranla [[impermanent-loss]] aynı çarpanla büyür; fiyat aralıktan çıkınca da pozisyon hiçbir şey kazanmaz.`,
    },
  },
  {
    id: 'tick-spacing',
    name: 'tick spacing',
    category: 'defi',
    related: ['tick', 'fee-tier', 'pool-key'],
    lesson: 'uniswap-v3',
    en: {
      short: 'The gap between ticks that positions may use as boundaries in a given pool.',
      long: `Every [[tick]] is a valid price, but only every *n*-th tick can be the edge of a position, where *n* is the pool's tick spacing. In v3 it is fixed by the [[fee-tier]]: 1, 10, 60 or 200.

With a spacing of 60, boundaries are about 0.6% apart. Coarser spacing means fewer ticks where liquidity can change, so a large [[swap]] crosses fewer of them and uses less [[gas]]. Finer spacing lets providers place liquidity more precisely.

In v4 the spacing is chosen freely when the pool is created; it is a field of the [[pool-key]].`,
    },
    tr: {
      short: 'Belirli bir havuzda pozisyonların sınır olarak kullanabileceği [[tick]]\'ler arasındaki boşluk.',
      long: `Her [[tick]] geçerli bir fiyattır, ama yalnızca her *n*'inci [[tick]] bir pozisyonun kenarı olabilir; *n*, havuzun [[tick-spacing]] değeridir. v3'te bunu [[fee-tier]] belirler: 1, 10, 60 ya da 200.

Değer 60 iken sınırlar yaklaşık %0,6 arayla dizilir. Aralık kabalaştıkça likiditenin değişebileceği [[tick]] sayısı azalır; büyük bir [[swap]] daha azını geçer ve daha az [[gas]] harcar. İncelen aralık ise likiditeyi daha hassas yerleştirmeye izin verir.

v4'te bu değer havuz oluşturulurken serbestçe seçilir; [[pool-key]]'in bir alanıdır.`,
    },
  },
  {
    id: 'out-of-range',
    name: 'out of range',
    category: 'defi',
    related: ['price-range', 'concentrated-liquidity', 'impermanent-loss'],
    lesson: 'uniswap-v3',
    en: {
      short: 'A v3 position whose price range no longer contains the market price; it earns no fees.',
      long: `When the market price moves past a bound of a position's [[price-range]], the position is out of range. It is no longer part of the pool's active liquidity, so it earns no swap fees.

By then it has been fully converted into one token: above the range it holds only the second token (it sold the first all the way up), and below the range only the first. That is the token that has lost value relative to the other.

The position becomes active again if the price returns. Otherwise the owner has to withdraw and open a new range, which costs [[gas]] and locks in the [[impermanent-loss]].`,
    },
    tr: {
      short: 'Fiyat aralığı artık piyasa fiyatını içermeyen v3 pozisyonu; ücret kazanmaz.',
      long: `Piyasa fiyatı bir pozisyonun [[price-range]]'inin sınırlarından birini aşınca pozisyon [[out-of-range]] olur. Artık havuzun aktif likiditesinin parçası değildir, dolayısıyla [[swap]] ücreti kazanmaz.

O ana kadar tamamen tek bir [[token]]'a dönüşmüştür: aralığın üstünde yalnızca ikinci [[token]]'ı tutar (yukarı çıkarken birincisini hep satmıştır), aralığın altında ise yalnızca birincisini. Bu, diğerine göre değer kaybetmiş olan [[token]]'dır.

Fiyat geri dönerse pozisyon yeniden aktif olur. Dönmezse sahibinin pozisyonu çekip yeni bir aralık açması gerekir; bu [[gas]] harcar ve [[impermanent-loss]]'u kesinleştirir.`,
    },
  },
];

export default terms;
