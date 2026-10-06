import type { GlossaryTerm } from '../../../types';

// Uniswap is a product name: in Turkish text it is written plainly, never as [[uniswap]].

const terms: GlossaryTerm[] = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    proper: true,
    category: 'defi',
    related: ['dex', 'amm', 'liquidity-pool', 'constant-product'],
    lesson: 'uniswap-v2',
    en: {
      short: 'The best-known decentralized exchange on Ethereum: a set of smart contracts where people swap tokens against pools instead of against each other.',
      long: `Uniswap is a [[dex]] built as an [[amm]]. Each market is a [[liquidity-pool]] holding two tokens; traders [[swap]] against the pool and pay a fee to the people who supplied the tokens.

There are several versions that all still run. v2 (2020) uses the simple [[constant-product]] rule over the whole price range. v3 (2021) adds [[concentrated-liquidity]]. v4 (2025) puts every pool in one contract and adds programmable hooks.

The contracts are permissionless: anyone can create a pool for any pair of [[erc-20]] tokens, add liquidity or trade, without an account or an approval from anyone.`,
    },
    tr: {
      short: 'Ethereum\'un en bilinen merkeziyetsiz borsası: insanların birbirleriyle değil, havuzlarla [[token]] takas ettiği bir kontrat kümesi.',
      long: `Uniswap, [[amm]] olarak kurulmuş bir [[dex]]'tir. Her piyasa iki [[token]] tutan bir [[liquidity-pool]]'dur; kullanıcılar havuzla [[swap]] yapar ve [[token]]'ları sağlayanlara bir ücret öder.

Hâlâ çalışan birkaç sürümü vardır. v2 (2020), bütün fiyat aralığında basit [[constant-product]] kuralını kullanır. v3 (2021) [[concentrated-liquidity]] ekler. v4 (2025) bütün havuzları tek bir kontratta toplar ve programlanabilir "hook"'lar getirir.

Kontratlar izinsizdir: herkes, hesap açmadan ve kimseden onay almadan, herhangi iki [[erc-20]] [[token]]'ı için havuz oluşturabilir, likidite ekleyebilir ya da takas yapabilir.`,
    },
  },
  {
    id: 'dex',
    name: 'DEX',
    category: 'defi',
    related: ['uniswap', 'amm', 'order-book', 'swap'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Decentralized exchange: a place to trade tokens that runs as smart contracts, so you keep custody of your funds until the trade itself.',
      long: `On a centralized exchange you deposit funds into the company's account and trade on its internal database. On a DEX the trade is a [[transaction]] you sign from your own [[wallet]]; the [[smart-contract]] takes one [[token]] and gives you the other in the same step, or the whole thing reverts.

Most DEXs are [[amm|AMMs]] such as [[uniswap]]; some use an on-chain or hybrid [[order-book]].

The trade-offs: no sign-up and no custodian, but you pay [[gas]], everyone can see your pending trade, and nobody can undo a mistake.`,
    },
    tr: {
      short: '"Decentralized exchange": [[smart-contract]] olarak çalışan bir takas yeri; takasın kendisine kadar paran senin elinde kalır.',
      long: `Merkezi bir borsada parayı şirketin hesabına yatırırsın ve onun kendi veritabanında alım satım yaparsın. Bir [[dex]]'te ise takas, kendi [[wallet]]'ından imzaladığın bir [[transaction]]'dır; [[smart-contract]] aynı adımda bir [[token]]'ı alır ve diğerini verir, yoksa işlemin tamamı geri alınır.

[[dex]]'lerin çoğu Uniswap gibi birer [[amm]]'dir; bazıları ise zincir üstü ya da karma bir [[order-book]] kullanır.

Artısı ve eksisi: kayıt ve saklayıcı yoktur; ama [[gas]] ödersin, bekleyen takasını herkes görebilir ve bir hatayı kimse geri alamaz.`,
    },
  },
  {
    id: 'amm',
    name: 'AMM',
    category: 'defi',
    related: ['constant-product', 'liquidity-pool', 'order-book', 'dex'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Automated market maker: a contract that quotes a price from a formula and its own token balances, instead of matching buyers with sellers.',
      long: `A market maker is someone always willing to buy or sell. An AMM automates that role in a [[smart-contract]]: it holds [[reserves]] of two tokens and uses a fixed rule, such as the [[constant-product]] formula, to decide how much of one it gives for the other.

The tokens come from [[liquidity-provider|liquidity providers]], who earn the trading fees. The price is kept in line with the wider market by [[arbitrage]].

AMMs suit blockchains because a trade needs only one [[transaction]] and nobody has to keep orders updated.`,
    },
    tr: {
      short: '"Automated market maker": alıcıyla satıcıyı eşleştirmek yerine, fiyatı bir formülden ve kendi [[token]] bakiyelerinden hesaplayan kontrat.',
      long: `Piyasa yapıcı, her an almaya ya da satmaya hazır olan taraftır. Bir [[amm]] bu rolü bir [[smart-contract]] içinde otomatikleştirir: iki [[token]]'ın [[reserves]] değerlerini tutar ve birinin karşılığında diğerinden ne kadar vereceğine [[constant-product]] formülü gibi sabit bir kuralla karar verir.

[[token]]'ları [[liquidity-provider]]'lar sağlar ve takas ücretlerini onlar kazanır. Fiyatı piyasanın geri kalanıyla aynı hizada tutan ise [[arbitrage]]'dır.

[[amm]] bir [[blockchain]] için uygundur, çünkü bir takas tek bir [[transaction]] ister ve kimsenin emirleri güncel tutması gerekmez.`,
    },
  },
  {
    id: 'liquidity-pool',
    name: 'liquidity pool',
    category: 'defi',
    related: ['reserves', 'liquidity-provider', 'lp-token', 'amm'],
    lesson: 'uniswap-v2',
    en: {
      short: 'A contract holding two tokens that anyone can trade against.',
      long: `In [[uniswap]] v2 each pair of tokens has one pool (the Pair contract). The amounts it holds are its [[reserves]], and their ratio is the price.

A deeper pool, one with larger [[reserves]], moves less for a trade of the same size, so traders get better prices there.

The tokens belong to the [[liquidity-provider|liquidity providers]], in proportion to the [[lp-token|LP tokens]] they hold. The contract has no owner who could withdraw them.`,
    },
    tr: {
      short: 'İki [[token]] tutan ve herkesin karşısında takas yapabildiği kontrat.',
      long: `Uniswap v2'de her [[token]] çiftinin tek bir havuzu (Pair kontratı) vardır. Havuzun tuttuğu miktarlar onun [[reserves]] değerleridir; bunların oranı da fiyattır.

Derin bir havuz, yani [[reserves]] değerleri büyük olan bir havuz, aynı büyüklükteki bir takasta daha az oynar; bu yüzden orada daha iyi fiyat alınır.

[[token]]'lar, ellerindeki [[lp-token]] oranında [[liquidity-provider]]'lara aittir. Kontratın onları çekebilecek bir sahibi yoktur.`,
    },
  },
  {
    id: 'liquidity-provider',
    name: 'liquidity provider',
    category: 'defi',
    related: ['liquidity-pool', 'lp-token', 'impermanent-loss'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Someone who deposits tokens into a pool so that others can trade, and earns the trading fees in return. Often shortened to LP.',
      long: `In [[uniswap]] v2 a liquidity provider adds both tokens of a [[liquidity-pool]] in the current price ratio and receives [[lp-token|LP tokens]] as proof of their share.

Their income is the 0.3% fee on every [[swap]], which accumulates in the pool. Their main risk is [[impermanent-loss]]: when the price moves, the pool position is worth less than simply holding the two tokens.

Whether providing liquidity pays depends on fees earned against that loss, so it works best for pairs with high volume relative to how far the price drifts.`,
    },
    tr: {
      short: 'Başkaları takas yapabilsin diye bir havuza [[token]] yatıran ve karşılığında takas ücretlerini kazanan kişi. Kısaca LP.',
      long: `Uniswap v2'de bir [[liquidity-provider]], bir [[liquidity-pool]]'un iki [[token]]'ını da güncel fiyat oranında ekler ve payının kanıtı olarak [[lp-token]] alır.

Geliri, her [[swap]]'tan kesilen ve havuzda biriken %0,3'lük ücrettir. Başlıca riski [[impermanent-loss]]'tur: fiyat oynadığında havuzdaki pozisyon, iki [[token]]'ı sadece elde tutmaktan daha az eder.

Likidite sağlamanın kazandırıp kazandırmayacağı, kazanılan ücretlerin bu kaybı aşıp aşmadığına bağlıdır; bu yüzden en iyi, fiyat sapmasına kıyasla hacmi yüksek olan çiftlerde işler.`,
    },
  },
  {
    id: 'lp-token',
    name: 'LP token',
    category: 'defi',
    related: ['liquidity-provider', 'liquidity-pool', 'reserves'],
    lesson: 'uniswap-v2',
    en: {
      short: 'A token that represents a share of a liquidity pool; burning it returns that share of both reserves.',
      long: `When a [[liquidity-provider]] deposits into a [[uniswap]] v2 pool, the Pair contract mints LP tokens to them. Holding 1% of the LP token supply means owning 1% of whatever the pool holds.

Fees are not paid out separately. They stay in the [[reserves]], so each LP token slowly becomes redeemable for more.

The first deposit mints \`sqrt(x · y)\` tokens minus a small permanently locked minimum; later deposits mint in proportion to the existing supply. Being a normal [[erc-20]], an LP token can be transferred or used elsewhere.`,
    },
    tr: {
      short: 'Bir [[liquidity-pool]]\'daki payı temsil eden [[token]]; yakıldığında iki rezervin o paya düşen kısmını geri verir.',
      long: `Bir [[liquidity-provider]] bir Uniswap v2 havuzuna yatırma yaptığında Pair kontratı ona [[lp-token]] basar. [[lp-token]] arzının %1'ini tutmak, havuzda ne varsa onun %1'ine sahip olmak demektir.

Ücretler ayrıca dağıtılmaz. [[reserves]] içinde kalır; böylece her [[lp-token]] zamanla daha fazlasına çevrilebilir hale gelir.

İlk yatırma \`sqrt(x · y)\` kadar [[lp-token]] basar; bunun küçük bir alt sınırı kalıcı olarak kilitlenir. Sonraki yatırmalar mevcut arzla orantılı basım yapar. Sıradan bir [[erc-20]] olduğu için [[lp-token]] aktarılabilir ya da başka yerlerde kullanılabilir.`,
    },
  },
  {
    id: 'constant-product',
    name: 'constant product',
    category: 'defi',
    related: ['amm', 'reserves', 'price-impact', 'swap'],
    lesson: 'uniswap-v2',
    en: {
      short: 'The pricing rule x · y = k: a trade may change the two reserves, but not lower their product.',
      long: `If a pool holds **x** of one token and **y** of another, any [[swap]] must leave \`x · y\` at least as large as before. Adding to one side therefore lets you remove a calculable amount from the other.

The rule gives a curve (a hyperbola) of allowed [[reserves]]. The price is the ratio \`y / x\`, which changes continuously as trades move the pool along the curve. The pool can never run out of either token, because the price rises without limit as a reserve approaches zero.

It is the formula behind [[uniswap]] v1 and v2. With the 0.3% fee included, the product grows slightly with every trade.`,
    },
    tr: {
      short: 'x · y = k fiyatlama kuralı: bir takas iki rezervi değiştirebilir, ama çarpımlarını düşüremez.',
      long: `Bir havuz bir [[token]]'dan **x**, diğerinden **y** kadar tutuyorsa her [[swap]], \`x · y\` çarpımını en az eskisi kadar büyük bırakmak zorundadır. Bu yüzden bir tarafa ekleme yapmak, diğer taraftan hesaplanabilir bir miktarı çekmene izin verir.

Kural, izin verilen [[reserves]] değerlerinin bir eğrisini (hiperbol) verir. Fiyat \`y / x\` oranıdır ve takaslar havuzu eğri boyunca kaydırdıkça sürekli değişir. Havuzda hiçbir [[token]] tükenmez, çünkü bir rezerv sıfıra yaklaştıkça fiyat sınırsız yükselir.

Uniswap v1 ve v2'nin arkasındaki formül budur. %0,3'lük ücret hesaba katıldığında çarpım her takasta biraz büyür.`,
    },
  },
  {
    id: 'reserves',
    name: 'reserves',
    category: 'defi',
    related: ['liquidity-pool', 'constant-product', 'twap'],
    lesson: 'uniswap-v2',
    en: {
      short: 'The amounts of each token a pool currently holds; their ratio is the pool\'s price.',
      long: `A [[uniswap]] v2 pool stores \`reserve0\` and \`reserve1\`. Dividing one by the other gives the spot price; multiplying them gives the \`k\` of the [[constant-product]] rule.

The stored reserves are updated at the end of every [[swap]], deposit and withdrawal. Tokens sent to the contract outside those operations do not count until \`sync\` is called.

Reserves can be moved a long way within one [[transaction]], so other contracts must not use them directly as a price feed; that is what the [[twap]] accumulators are for.`,
    },
    tr: {
      short: 'Bir havuzun o anda her [[token]]\'dan tuttuğu miktarlar; oranları havuzun fiyatıdır.',
      long: `Bir Uniswap v2 havuzu \`reserve0\` ve \`reserve1\` değerlerini saklar. Birini diğerine bölmek "spot" fiyatı, ikisini çarpmak ise [[constant-product]] kuralındaki \`k\` değerini verir.

Saklanan değerler her [[swap]], yatırma ve çekme işleminin sonunda güncellenir. Bu işlemlerin dışında kontrata gönderilen [[token]]'lar, \`sync\` çağrılana kadar hesaba katılmaz.

[[reserves]] tek bir [[transaction]] içinde çok uzağa oynatılabilir; bu yüzden başka kontratlar onları doğrudan fiyat kaynağı olarak kullanmamalıdır. [[twap]] biriktiricileri bunun için vardır.`,
    },
  },
  {
    id: 'swap',
    name: 'swap',
    category: 'defi',
    related: ['price-impact', 'slippage', 'constant-product', 'dex'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Exchanging one token for another against a pool, in a single transaction.',
      long: `In a swap you send an amount of one [[token]] to a [[liquidity-pool]] and receive the other. How much you receive follows from the pool's [[reserves]] and its formula; in [[uniswap]] v2 that is the [[constant-product]] rule, after a 0.3% fee on the input.

A swap changes the reserves and therefore the price for the next trader. The larger the swap relative to the pool, the larger its [[price-impact]].

Users normally swap through a Router contract, which checks a minimum output to guard against [[slippage]] and can chain several pools when no direct pair exists.`,
    },
    tr: {
      short: 'Tek bir [[transaction]] içinde, bir havuz karşısında bir [[token]]\'ı diğeriyle değiştirmek.',
      long: `Bir [[swap]]'ta bir [[liquidity-pool]]'a bir [[token]]'dan belirli bir miktar gönderir, karşılığında diğerini alırsın. Ne kadar alacağını havuzun [[reserves]] değerleri ve formülü belirler; Uniswap v2'de bu, girdiden %0,3 ücret kesildikten sonra uygulanan [[constant-product]] kuralıdır.

Bir [[swap]], [[reserves]] değerlerini ve dolayısıyla sıradaki kişi için fiyatı değiştirir. Havuza göre ne kadar büyükse [[price-impact]] de o kadar büyük olur.

Kullanıcılar genellikle bir Router kontratı üzerinden [[swap]] yapar; Router, [[slippage]]'a karşı asgari çıktıyı kontrol eder ve doğrudan bir çift yoksa birkaç havuzu art arda kullanabilir.`,
    },
  },
  {
    id: 'slippage',
    name: 'slippage',
    category: 'defi',
    related: ['price-impact', 'swap', 'arbitrage'],
    lesson: 'uniswap-v2',
    en: {
      short: 'The difference between the amount you were quoted and the amount you actually receive, because the pool changed before your trade executed.',
      long: `Between signing a [[swap]] and its inclusion in a [[block]], other trades can move the pool. Your trade then executes at a different price than the one shown.

Wallets and dapps let you set a **slippage tolerance**, for example 0.5%. It becomes a minimum output in the [[transaction]]; if the pool would pay less, the trade reverts and you only lose the [[gas-fee]].

Slippage is not the same as [[price-impact]], which is the price movement your own trade causes and is known in advance. A high tolerance also makes you a target for bots that trade just before and after you.`,
    },
    tr: {
      short: 'Sana gösterilen miktar ile eline gerçekten geçen miktar arasındaki fark; nedeni, takasın işlenmeden önce havuzun değişmiş olmasıdır.',
      long: `Bir [[swap]]'ı imzalaman ile onun bir [[block]]'a girmesi arasında başka takaslar havuzu oynatabilir. Senin takasın da ekranda gördüğünden farklı bir fiyattan gerçekleşir.

Cüzdanlar ve [[dapp]]'ler bir **slippage toleransı** belirlemene izin verir; örneğin %0,5. Bu değer [[transaction]]'ın içinde asgari bir çıktıya dönüşür; havuz daha azını ödeyecekse takas geri alınır ve yalnızca [[gas-fee]] kaybedersin.

[[slippage]], [[price-impact]] ile aynı şey değildir; o, kendi takasının yol açtığı ve önceden bilinen fiyat hareketidir. Yüksek bir tolerans seni, senden hemen önce ve sonra takas yapan botların hedefi haline de getirir.`,
    },
  },
  {
    id: 'price-impact',
    name: 'price impact',
    category: 'defi',
    related: ['slippage', 'swap', 'constant-product', 'reserves'],
    lesson: 'uniswap-v2',
    en: {
      short: 'How much worse your average price is than the pool\'s price before your trade, caused by the size of your own trade.',
      long: `Every unit you add to a pool makes the next unit worth a little less. A [[swap]] therefore fills at an average price worse than the starting price. The gap, as a percentage, is the price impact.

In a [[constant-product]] pool it depends on the trade size relative to the [[reserves]]: selling an amount equal to 1% of the reserve costs about 1% (plus the fee); selling 10% costs about 9%.

Price impact is known before you trade and is shown by the interface. [[slippage|Slippage]] is the extra, unpredictable part that comes from other people's trades.`,
    },
    tr: {
      short: 'Ortalama fiyatının, takasından önceki havuz fiyatından ne kadar kötü olduğu; nedeni kendi takasının büyüklüğüdür.',
      long: `Havuza eklediğin her birim, bir sonraki birimin değerini biraz düşürür. Bu yüzden bir [[swap]], başlangıç fiyatından daha kötü bir ortalama fiyatla gerçekleşir. Aradaki farkın yüzdesi [[price-impact]]'tir.

Bir [[constant-product]] havuzunda bu, takasın [[reserves]] değerlerine göre büyüklüğüne bağlıdır: rezervin %1'i kadar satış yaklaşık %1 (artı ücret), %10'u kadar satış ise yaklaşık %9 kaybettirir.

[[price-impact]] takastan önce bilinir ve arayüzde gösterilir. [[slippage]] ise başkalarının takaslarından gelen, öngörülemeyen ek kısımdır.`,
    },
  },
  {
    id: 'impermanent-loss',
    name: 'impermanent loss',
    category: 'defi',
    related: ['liquidity-provider', 'arbitrage', 'constant-product'],
    lesson: 'uniswap-v2',
    en: {
      short: 'How much less a liquidity position is worth than simply holding the same tokens, after the price has moved.',
      long: `As the price changes, a pool keeps selling the token that is rising and buying the one that is falling. A [[liquidity-provider]] therefore ends up with more of the weaker token than if they had held.

For a [[constant-product]] pool, if the price changes by a factor **r**, the position is worth \`2·√r / (1 + r) − 1\` relative to holding: about −5.7% when the price doubles or halves, and −20% at 4×.

It is "impermanent" because it disappears if the price returns to the entry level. Withdrawing at a different price makes it real. Trading fees are the compensation, and they are not included in the formula.`,
    },
    tr: {
      short: 'Fiyat oynadıktan sonra bir likidite pozisyonunun, aynı [[token]]\'ları sadece elde tutmaya göre ne kadar daha az ettiği.',
      long: `Fiyat değiştikçe havuz, yükselen [[token]]'ı satıp düşeni almaya devam eder. Bu yüzden bir [[liquidity-provider]]'ın elinde, elde tutsaydı olacağından daha fazla zayıf [[token]] kalır.

Bir [[constant-product]] havuzunda fiyat **r** katına çıkarsa pozisyonun elde tutmaya göre değeri \`2·√r / (1 + r) − 1\` olur: fiyat ikiye katlandığında ya da yarıya indiğinde yaklaşık −%5,7, 4 katında −%20.

Adındaki "impermanent" (kalıcı olmayan), fiyat giriş seviyesine dönerse kaybın ortadan kalkmasından gelir. Farklı bir fiyattan çekmek onu gerçek kılar. Karşılığı takas ücretleridir; formül bunları içermez.`,
    },
  },
  {
    id: 'twap',
    name: 'TWAP',
    category: 'defi',
    related: ['reserves', 'arbitrage', 'flash-swap'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Time-weighted average price: the average of a pool\'s price over a period, used as a price feed that is hard to manipulate.',
      long: `The current price of a pool can be pushed far away and back within one [[transaction]], so a lending protocol that read it directly could be tricked.

[[uniswap]] v2 therefore keeps two running totals, \`price0CumulativeLast\` and \`price1CumulativeLast\`. At the first interaction in each [[block]] it adds the price from the end of the previous block multiplied by the seconds elapsed.

Another contract reads the total at two moments and divides the difference by the time between them. To shift that average, an attacker would have to hold a wrong price across many blocks while [[arbitrage]] traders take money from them.`,
    },
    tr: {
      short: '"Time-weighted average price": bir havuzun fiyatının belirli bir süredeki ortalaması; oynatılması zor bir fiyat kaynağı olarak kullanılır.',
      long: `Bir havuzun anlık fiyatı tek bir [[transaction]] içinde çok uzağa itilip geri getirilebilir; onu doğrudan okuyan bir borç protokolü kandırılabilir.

Uniswap v2 bu yüzden iki birikimli toplam tutar: \`price0CumulativeLast\` ve \`price1CumulativeLast\`. Her [[block]]'taki ilk etkileşimde, bir önceki [[block]]'un sonundaki fiyatı geçen saniye sayısıyla çarpıp toplama ekler.

Başka bir kontrat bu toplamı iki farklı anda okur ve farkı aradaki süreye böler. Bu ortalamayı kaydırmak isteyen bir saldırgan, yanlış bir fiyatı birçok [[block]] boyunca korumak zorunda kalır; bu sırada [[arbitrage]] yapanlar onun parasını alır.`,
    },
  },
  {
    id: 'flash-swap',
    name: 'flash swap',
    category: 'defi',
    related: ['swap', 'arbitrage', 'constant-product'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Taking tokens out of a pool first and paying for them later in the same transaction; if the payment is missing, everything is undone.',
      long: `A [[uniswap]] v2 pool sends the output of a [[swap]] before it checks that it was paid. If the caller passes extra data, the pool then calls back into the caller's contract (\`uniswapV2Call\`), and only afterwards verifies the [[constant-product]] condition.

Inside that callback the caller can use the tokens, for example to do [[arbitrage]] on another exchange, and then pay the pool with the other token or return the same token plus the 0.3% fee.

Because a [[transaction]] is atomic, the pool cannot lose: if it is not made whole, the whole transaction reverts. The borrower needs no capital beyond [[gas]].`,
    },
    tr: {
      short: 'Bir havuzdan [[token]]\'ları önce alıp bedelini aynı [[transaction]] içinde sonra ödemek; ödeme gelmezse her şey geri alınır.',
      long: `Bir Uniswap v2 havuzu, bir [[swap]]'ın çıktısını bedelin ödendiğini kontrol etmeden önce gönderir. Çağıran taraf ek veri geçirirse havuz onun kontratını geri çağırır (\`uniswapV2Call\`) ve [[constant-product]] koşulunu ancak bundan sonra doğrular.

Çağıran taraf bu geri çağrının içinde [[token]]'ları kullanabilir, örneğin başka bir borsada [[arbitrage]] yapar; ardından havuza diğer [[token]] ile öder ya da aynı [[token]]'ı %0,3'lük ücretle birlikte geri verir.

Bir [[transaction]] atomik olduğu için havuz zarar edemez: alacağı tamamlanmazsa işlemin tamamı geri alınır. Ödünç alanın [[gas]] dışında sermayeye ihtiyacı yoktur.`,
    },
  },
  {
    id: 'order-book',
    name: 'order book',
    category: 'defi',
    related: ['amm', 'dex', 'liquidity-pool'],
    lesson: 'uniswap-v2',
    en: {
      short: 'A list of waiting buy and sell offers at different prices; a trade happens when a buyer and a seller agree.',
      long: `Traditional exchanges keep an order book. Buyers post **bids**, sellers post **asks**, and an engine matches them. The gap between the best bid and the best ask is the spread.

It gives precise prices when many participants keep quoting, but every new or cancelled order is an update. On a [[blockchain]] each update would be a paid [[transaction]], which made order books impractical on Ethereum.

An [[amm]] replaces the book with a [[liquidity-pool]] and a formula. Some newer chains and rollups are fast and cheap enough to run order books again.`,
    },
    tr: {
      short: 'Farklı fiyatlarda bekleyen alış ve satış tekliflerinin listesi; bir alıcı ile bir satıcı anlaştığında işlem gerçekleşir.',
      long: `Geleneksel borsalar bir [[order-book]] tutar. Alıcılar alış emri ("bid"), satıcılar satış emri ("ask") girer ve bir motor bunları eşleştirir. En iyi alış ile en iyi satış arasındaki farka "spread" denir.

Çok sayıda katılımcı sürekli fiyat verdiğinde hassas fiyatlar sunar; ama her yeni ya da iptal edilen emir bir güncellemedir. Bir [[blockchain]] üzerinde her güncelleme ücretli bir [[transaction]] olurdu; bu da Ethereum'da [[order-book]] kullanımını elverişsiz kıldı.

Bir [[amm]], defterin yerine bir [[liquidity-pool]] ve bir formül koyar. Daha yeni bazı zincirler ve "rollup"'lar, [[order-book]]'u yeniden çalıştırabilecek kadar hızlı ve ucuzdur.`,
    },
  },
  {
    id: 'arbitrage',
    name: 'arbitrage',
    category: 'defi',
    related: ['impermanent-loss', 'swap', 'twap', 'flash-swap'],
    lesson: 'uniswap-v2',
    en: {
      short: 'Buying where something is cheap and selling where it is expensive, which pulls the two prices together.',
      long: `A [[liquidity-pool]] does not know the market price. If ETH trades at 2,000 elsewhere and at 1,950 in a pool, a trader buys it from the pool and sells it elsewhere, repeating until the pool price is back near 2,000.

That profit-seeking is what keeps an [[amm]] accurate. It is done by bots competing within each [[block]].

The profit comes out of the pool: arbitrageurs always trade against it at stale prices. Seen from the [[liquidity-provider]]'s side, that is the source of [[impermanent-loss]].`,
    },
    tr: {
      short: 'Bir şeyi ucuz olduğu yerden alıp pahalı olduğu yerde satmak; bu da iki fiyatı birbirine yaklaştırır.',
      long: `Bir [[liquidity-pool]] piyasa fiyatını bilmez. ETH başka yerde 2.000'den, bir havuzda ise 1.950'den işlem görüyorsa biri onu havuzdan alır ve başka yerde satar; havuz fiyatı yeniden 2.000 civarına gelene kadar bunu tekrarlar.

Bir [[amm]]'i doğru tutan şey bu kâr arayışıdır. Bunu, her [[block]]'ta birbiriyle yarışan botlar yapar.

Kâr havuzdan çıkar: [[arbitrage]] yapanlar havuzla hep bayat fiyatlardan takas eder. [[liquidity-provider]] tarafından bakıldığında [[impermanent-loss]]'un kaynağı budur.`,
    },
  },
];

export default terms;
