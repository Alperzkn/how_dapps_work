import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'singleton',
    name: 'singleton',
    category: 'defi',
    related: ['pool-manager', 'flash-accounting', 'pool-key'],
    lesson: 'uniswap-v4',
    en: {
      short: 'A design where one contract holds every pool, instead of deploying a new contract per pool.',
      long: `In Uniswap v2 and v3 each pool is a separate contract that holds its own tokens. Uniswap v4 keeps all pools inside a single contract, the [[pool-manager]]. This is the singleton design.

Creating a pool becomes a cheap state update rather than a contract deployment. A [[multi-hop]] swap no longer moves tokens from one pool contract to the next, because every pool's tokens are already in the same place; see [[flash-accounting]].

The trade-off is concentration: one contract holds the funds of every pool.`,
    },
    tr: {
      short: 'Her havuz için yeni bir sözleşme kurmak yerine bütün havuzları tek bir sözleşmenin tuttuğu tasarım.',
      long: `Uniswap v2 ve v3'te her havuz, kendi [[token]]'larını tutan ayrı bir sözleşmedir. Uniswap v4 bütün havuzları tek bir sözleşmenin, yani [[pool-manager]]'ın içinde tutar. Bu tasarıma [[singleton]] denir.

Havuz açmak, sözleşme kurmak yerine ucuz bir durum güncellemesine dönüşür. [[multi-hop]] bir [[swap]] artık [[token]]'ları bir havuz sözleşmesinden diğerine taşımaz, çünkü bütün havuzların [[token]]'ları zaten aynı yerdedir; bkz. [[flash-accounting]].

Bedeli yoğunlaşmadır: bütün havuzların fonlarını tek bir sözleşme tutar.`,
    },
  },
  {
    id: 'pool-manager',
    name: 'PoolManager',
    category: 'defi',
    related: ['singleton', 'pool-key', 'flash-accounting', 'hook'],
    lesson: 'uniswap-v4',
    en: {
      short: 'The single Uniswap v4 contract that stores every pool and holds all their tokens.',
      long: `\`PoolManager\` is the core contract of Uniswap v4. It keeps the state of every pool in one mapping, indexed by an id derived from the [[pool-key]], and it holds one balance per token for all pools together.

Every action goes through it: \`initialize\` creates a pool, \`modifyLiquidity\` adds or removes liquidity, \`swap\` trades, \`donate\` gives tokens to a pool's liquidity providers. These calls are only allowed while the manager is unlocked, and they record what is owed rather than moving tokens; see [[flash-accounting]].

At the configured points it calls the pool's [[hook]].`,
    },
    tr: {
      short: 'Bütün havuzları saklayan ve hepsinin [[token]]\'larını tutan tek Uniswap v4 sözleşmesi.',
      long: `\`PoolManager\`, Uniswap v4'ün çekirdek sözleşmesidir. Her havuzun durumunu, [[pool-key]]'den türetilen bir kimlikle erişilen tek bir eşlemede saklar ve bütün havuzlar için [[token]] başına tek bir bakiye tutar.

Her işlem onun üzerinden geçer: \`initialize\` havuz açar, \`modifyLiquidity\` likidite ekler ya da çıkarır, \`swap\` takas yapar, \`donate\` bir havuzun likidite sağlayıcılarına [[token]] verir. Bu çağrılara yalnızca yöneticinin kilidi açıkken izin verilir ve [[token]] taşımak yerine kimin neyi borçlu olduğunu kaydederler; bkz. [[flash-accounting]].

Belirlenen noktalarda havuzun [[hook]]'unu çağırır.`,
    },
  },
  {
    id: 'hook',
    name: 'hook',
    category: 'defi',
    related: ['pool-manager', 'dynamic-fee', 'twamm', 'limit-order', 'pool-key'],
    lesson: 'uniswap-v4',
    en: {
      short: 'A separate contract attached to a v4 pool that runs custom code before or after swaps and liquidity changes.',
      long: `A hook is chosen when a v4 pool is created and is part of its [[pool-key]]; it cannot be swapped out later. The [[pool-manager]] calls it at fixed points: before and after initialization, adding liquidity, removing liquidity, swapping and donating.

Which of these calls a hook receives is encoded in the low bits of its contract address, so the manager can tell without reading storage.

Hooks make new pool behaviour possible without forking Uniswap: a [[dynamic-fee]], a [[limit-order]], [[twamm|TWAMM]], oracles, custom pricing. They also add risk, because a hook is extra code in the path of your trade or your liquidity, written by whoever created the pool.`,
    },
    tr: {
      short: 'Bir v4 havuzuna takılan, takaslardan ve likidite değişikliklerinden önce ya da sonra özel kod çalıştıran ayrı bir sözleşme.',
      long: `[[hook]], bir v4 havuzu açılırken seçilir ve [[pool-key]]'in parçasıdır; sonradan değiştirilemez. [[pool-manager]] onu sabit noktalarda çağırır: havuzun açılmasından, likidite eklemeden, likidite çıkarmadan, takastan ve bağıştan önce ve sonra.

Bir [[hook]]'un bu çağrılardan hangilerini alacağı, sözleşme adresinin düşük bitlerinde kodludur; böylece yönetici bunu depolamadan okumadan anlar.

[[hook]]'lar, Uniswap'i kopyalayıp değiştirmeden yeni havuz davranışlarını mümkün kılar: [[dynamic-fee]], [[limit-order]], [[twamm]], "oracle"'lar, özel fiyatlama. Aynı zamanda risk de ekler; çünkü [[hook]], takasının ya da likiditenin yolunda duran ve havuzu açan kişinin yazdığı fazladan bir koddur.`,
    },
  },
  {
    id: 'flash-accounting',
    name: 'flash accounting',
    category: 'defi',
    related: ['pool-manager', 'transient-storage', 'multi-hop', 'erc-6909'],
    lesson: 'uniswap-v4',
    en: {
      short: 'Uniswap v4 records what is owed during a transaction and transfers only the net amounts at the end.',
      long: `In v4, a swap or a liquidity change does not move tokens straight away. The [[pool-manager]] adds the amounts to a running balance for the caller: what they owe and what they are owed, per token.

Before the transaction finishes, every balance must be back at zero: debts are paid in with \`settle\` and credits are withdrawn with \`take\`. If anything is left over, the whole transaction reverts.

So a route through several pools only transfers the first token in and the last token out; the tokens in between cancel on paper. The running balances are kept in [[transient-storage]], which makes this cheap.`,
    },
    tr: {
      short: 'Uniswap v4\'ün işlem boyunca borç ve alacakları kaydedip yalnızca net tutarları en sonda aktarması.',
      long: `v4'te bir takas ya da likidite değişikliği [[token]]'ları hemen hareket ettirmez. [[pool-manager]], tutarları çağıran için tutulan bir hesaba ekler: [[token]] başına ne borçlu olduğu ve ne alacağı olduğu.

İşlem bitmeden önce her bakiye sıfıra dönmek zorundadır: borçlar \`settle\` ile ödenir, alacaklar \`take\` ile çekilir. Geriye bir şey kalırsa bütün işlem geri alınır.

Böylece birkaç havuzdan geçen bir rota yalnızca giren ilk [[token]]'ı ve çıkan son [[token]]'ı aktarır; aradakiler kâğıt üzerinde birbirini götürür. Bu hesap [[transient-storage]] içinde tutulur; ucuz olmasını sağlayan da budur.`,
    },
  },
  {
    id: 'transient-storage',
    name: 'transient storage',
    category: 'dapps',
    related: ['flash-accounting', 'pool-manager', 'gas'],
    lesson: 'uniswap-v4',
    en: {
      short: 'Contract storage that lasts only for one transaction and is much cheaper than permanent storage.',
      long: `Transient storage was added to Ethereum by EIP-1153 in the Cancun upgrade of March 2024. It has two opcodes, \`TSTORE\` and \`TLOAD\`, which work like ordinary storage writes and reads, except that everything is wiped when the transaction ends.

Because nothing has to be saved to the chain's permanent state, each access costs 100 [[gas]], far less than a normal storage write.

It suits values that only matter within one transaction: reentrancy locks, and the running balances of Uniswap v4's [[flash-accounting]].`,
    },
    tr: {
      short: 'Yalnızca tek bir işlem boyunca yaşayan ve kalıcı depolamadan çok daha ucuz olan sözleşme depolaması.',
      long: `[[transient-storage]], Ethereum'a Mart 2024'teki Cancun yükseltmesinde EIP-1153 ile eklendi. İki "opcode"'u vardır: \`TSTORE\` ve \`TLOAD\`. Bunlar sıradan depolama yazma ve okuma işlemleri gibi çalışır; tek fark, işlem bitince her şeyin silinmesidir.

Zincirin kalıcı durumuna hiçbir şey kaydedilmediği için her erişim 100 [[gas]] harcar; bu, normal bir depolama yazımından çok daha azdır.

Yalnızca tek bir işlem içinde anlam taşıyan değerlere uygundur: "reentrancy" kilitleri ve Uniswap v4'teki [[flash-accounting]] hesabı gibi.`,
    },
  },
  {
    id: 'pool-key',
    name: 'PoolKey',
    category: 'defi',
    related: ['pool-manager', 'hook', 'tick-spacing', 'dynamic-fee'],
    lesson: 'uniswap-v4',
    en: {
      short: 'The five values that identify a Uniswap v4 pool: two currencies, fee, tick spacing and hook address.',
      long: `A v4 pool has no address of its own. It is identified by a \`PoolKey\`: \`currency0\`, \`currency1\`, \`fee\`, \`tickSpacing\` and \`hooks\`. The hash of the key, \`keccak256(abi.encode(key))\`, is the \`PoolId\` under which the [[pool-manager]] stores the pool.

The two currencies are sorted by address, and \`address(0)\` stands for [[native-eth]]. The fee is in hundredths of a basis point, or a special flag meaning [[dynamic-fee]]. The [[tick-spacing]] is free to choose.

Change any one field and you have a different pool. That gives pool creators freedom, and it also means one pair of tokens can be split over many pools.`,
    },
    tr: {
      short: 'Bir Uniswap v4 havuzunu tanımlayan beş değer: iki para birimi, ücret, [[tick-spacing]] ve [[hook]] adresi.',
      long: `Bir v4 havuzunun kendine ait bir adresi yoktur. Onu bir \`PoolKey\` tanımlar: \`currency0\`, \`currency1\`, \`fee\`, \`tickSpacing\` ve \`hooks\`. Anahtarın özeti, yani \`keccak256(abi.encode(key))\`, [[pool-manager]]'ın havuzu sakladığı \`PoolId\` değeridir.

İki para birimi adrese göre sıralanır ve \`address(0)\`, [[native-eth]] anlamına gelir. Ücret, "basis point"'in yüzde biri cinsindendir ya da [[dynamic-fee]] anlamına gelen özel bir bayraktır. [[tick-spacing]] serbestçe seçilir.

Tek bir alanı değiştirirsen ortaya farklı bir havuz çıkar. Bu, havuz açanlara özgürlük verir; ama aynı [[token]] çiftinin birçok havuza bölünebilmesi anlamına da gelir.`,
    },
  },
  {
    id: 'dynamic-fee',
    name: 'dynamic fee',
    category: 'defi',
    related: ['hook', 'fee-tier', 'pool-key'],
    lesson: 'uniswap-v4',
    en: {
      short: 'A swap fee that a v4 pool\'s hook can change over time, instead of a fixed percentage.',
      long: `In v2 the fee is always 0.30%, and in v3 it is one of a few fixed tiers; see [[fee-tier]]. A v4 pool can instead be created with a dynamic fee, which its [[hook]] sets.

The hook can store a new fee for the pool, or return a fee for a single swap from its before-swap callback. Only the pool's own hook is allowed to do this.

A common idea is to charge more when the market is volatile, when liquidity providers lose more to [[impermanent-loss]], and less when it is calm. The actual rule is whatever the hook implements, so it is worth reading before trading in or providing liquidity to such a pool.`,
    },
    tr: {
      short: 'Sabit bir yüzde yerine, bir v4 havuzunun [[hook]]\'unun zaman içinde değiştirebildiği [[swap]] ücreti.',
      long: `v2'de ücret her zaman %0,30'dur; v3'te ise birkaç sabit kademeden biridir, bkz. [[fee-tier]]. Bir v4 havuzu bunların yerine, [[hook]]'unun belirlediği bir [[dynamic-fee]] ile açılabilir.

[[hook]], havuz için yeni bir ücret kaydedebilir ya da takastan önceki geri çağrısından yalnızca o [[swap]] için bir ücret döndürebilir. Buna yalnızca havuzun kendi [[hook]]'u yetkilidir.

Yaygın fikir, likidite sağlayanların [[impermanent-loss]] yüzünden daha çok kaybettiği oynak piyasada daha yüksek, sakin piyasada daha düşük ücret almaktır. Asıl kural, [[hook]] neyi uyguluyorsa odur; böyle bir havuzda işlem yapmadan ya da likidite sağlamadan önce okumaya değer.`,
    },
  },
  {
    id: 'erc-6909',
    name: 'ERC-6909',
    category: 'dapps',
    related: ['flash-accounting', 'pool-manager', 'erc-20'],
    lesson: 'uniswap-v4',
    en: {
      short: 'A minimal standard for one contract to track balances of many tokens; v4 uses it for claims on tokens left in the PoolManager.',
      long: `ERC-6909 lets a single contract keep balances for many token ids, with a much smaller interface than earlier multi-token standards.

Uniswap v4's [[pool-manager]] implements it. When a caller is owed tokens at the end of an action, they can mint an ERC-6909 claim for that amount instead of withdrawing the real tokens. Later they can burn the claim to pay a debt.

Minting and burning are just balance updates inside the manager, so no [[erc-20]] transfer is needed. That saves gas for traders, liquidity managers and hooks that go in and out often; see [[flash-accounting]].`,
    },
    tr: {
      short: 'Tek bir sözleşmenin birçok [[token]] bakiyesini izlemesi için yalın bir standart; v4 bunu "PoolManager" içinde bırakılan [[token]]\'lar üzerindeki alacaklar için kullanır.',
      long: `ERC-6909, tek bir sözleşmenin birçok [[token]] kimliği için bakiye tutmasını sağlar; arayüzü önceki çoklu [[token]] standartlarından çok daha küçüktür.

Uniswap v4'ün [[pool-manager]]'ı bu standardı uygular. Bir işlemin sonunda alacaklı kalan taraf, gerçek [[token]]'ları çekmek yerine o tutar için bir ERC-6909 alacak kaydı bastırabilir. Daha sonra bir borcu ödemek için bu kaydı yakabilir.

Basma ve yakma, yöneticinin içindeki bakiye güncellemelerinden ibarettir; bu yüzden [[erc-20]] aktarımı gerekmez. Sık girip çıkan alıcılar, likidite yöneticileri ve [[hook]]'lar için [[gas]] tasarrufu sağlar; bkz. [[flash-accounting]].`,
    },
  },
  {
    id: 'native-eth',
    name: 'native ETH',
    category: 'defi',
    related: ['pool-key', 'pool-manager', 'erc-20'],
    lesson: 'uniswap-v4',
    en: {
      short: 'Ether itself, used directly in a v4 pool without first wrapping it into the WETH token.',
      long: `Ether is not an [[erc-20]] token; it is built into Ethereum and moves in a different way. Uniswap v2 and v3 pools can only hold ERC-20 tokens, so ETH has to be wrapped into WETH before a swap and unwrapped after it.

Uniswap v4 pools can hold ETH directly. In a [[pool-key]] it is written as the zero address, \`address(0)\`.

This removes the wrapping steps, and a plain ETH transfer costs less [[gas]] than an ERC-20 transfer, so ETH swaps become cheaper.`,
    },
    tr: {
      short: 'Önce WETH adlı [[token]]\'a sarılmadan bir v4 havuzunda doğrudan kullanılan Ether\'in kendisi.',
      long: `Ether bir [[erc-20]] [[token]] değildir; Ethereum'un içine gömülüdür ve farklı bir yolla hareket eder. Uniswap v2 ve v3 havuzları yalnızca ERC-20 [[token]]'ları tutabilir; bu yüzden ETH'nin takastan önce WETH'e sarılması, sonra da geri açılması gerekir.

Uniswap v4 havuzları ETH'yi doğrudan tutabilir. Bir [[pool-key]] içinde sıfır adresi, yani \`address(0)\` olarak yazılır.

Böylece sarma adımları ortadan kalkar; ayrıca düz bir ETH aktarımı bir ERC-20 aktarımından daha az [[gas]] harcadığı için ETH takasları ucuzlar.`,
    },
  },
  {
    id: 'twamm',
    name: 'TWAMM',
    category: 'defi',
    related: ['hook', 'limit-order', 'price-impact'],
    lesson: 'uniswap-v4',
    en: {
      short: 'Time-weighted average market maker: a way to execute one very large order as a stream of tiny trades over time.',
      long: `Selling a very large amount in one [[swap]] moves the price a lot; see [[price-impact]]. A TWAMM breaks the order into a continuous stream of very small trades spread over hours or days, so the seller gets close to the average price of that period.

The small trades are not sent one by one. The order is recorded once, and whenever someone interacts with the pool, the trades that should have happened since the last interaction are worked out and applied in one step.

In Uniswap v4 this can be built as a [[hook]] on a pool.`,
    },
    tr: {
      short: '"Time-weighted average market maker": çok büyük tek bir emri zamana yayılmış minik işlemler akışı olarak gerçekleştirme yöntemi.',
      long: `Çok büyük bir tutarı tek bir [[swap]] ile satmak fiyatı fazlasıyla oynatır; bkz. [[price-impact]]. [[twamm]], emri saatlere ya da günlere yayılan çok küçük işlemlerden oluşan sürekli bir akışa böler; böylece satıcı o dönemin ortalama fiyatına yakın bir fiyat alır.

Küçük işlemler tek tek gönderilmez. Emir bir kez kaydedilir ve biri havuzla her etkileşime girdiğinde, son etkileşimden beri gerçekleşmiş olması gereken işlemler hesaplanıp tek adımda uygulanır.

Uniswap v4'te bu, bir havuzun üzerine [[hook]] olarak kurulabilir.`,
    },
  },
  {
    id: 'limit-order',
    name: 'limit order',
    category: 'defi',
    related: ['hook', 'tick', 'out-of-range', 'order-book'],
    lesson: 'uniswap-v4',
    en: {
      short: 'An order to buy or sell at a chosen price or better, which waits until the market reaches that price.',
      long: `A normal [[swap]] trades immediately at whatever price the pool gives. A limit order says "sell only at this price or higher" and waits.

In Uniswap v3 you can imitate one by placing liquidity in a single narrow range above the current price: as the price rises through it, your token is sold. But if the price falls back, the trade is undone unless you withdraw in time.

A v4 [[hook]] can fix that. It places the liquidity in one [[tick]] range and, in its after-swap callback, notices when the price has crossed the range and withdraws the filled order so it cannot be reversed.`,
    },
    tr: {
      short: 'Seçilen fiyattan ya da daha iyisinden almak veya satmak için verilen, piyasa o fiyata gelene kadar bekleyen emir.',
      long: `Normal bir [[swap]], havuz hangi fiyatı veriyorsa o fiyattan hemen gerçekleşir. Bir [[limit-order]] ise "yalnızca bu fiyattan ya da daha yükseğinden sat" der ve bekler.

Uniswap v3'te, güncel fiyatın üstündeki tek bir dar aralığa likidite koyarak bunu taklit edebilirsin: fiyat aralığın içinden yükselirken [[token]]'ın satılır. Ama fiyat geri düşerse, zamanında çekmediğin sürece işlem geri alınmış olur.

Bir v4 [[hook]]'u bunu çözebilir. Likiditeyi tek bir [[tick]] aralığına koyar ve takastan sonraki geri çağrısında fiyatın aralığı geçtiğini fark edip dolan emri çeker; böylece emir tersine dönemez.`,
    },
  },
  {
    id: 'multi-hop',
    name: 'multi-hop',
    category: 'defi',
    related: ['flash-accounting', 'singleton', 'swap'],
    lesson: 'uniswap-v4',
    en: {
      short: 'A swap that goes through two or more pools in a row, for example ETH to USDC and then USDC to DAI.',
      long: `There is not always a deep pool for the two tokens you want to trade. A router then sends the trade along a path: token A to B in one pool, then B to C in the next. Each step is a hop.

In Uniswap v2 and v3 every hop transfers tokens out of one pool contract and into another, and each transfer costs [[gas]].

In v4 all pools sit in one [[singleton]] contract and [[flash-accounting]] cancels the intermediate tokens on paper, so only the first token in and the last token out are actually transferred.`,
    },
    tr: {
      short: 'Art arda iki ya da daha fazla havuzdan geçen [[swap]]; örneğin önce ETH\'den USDC\'ye, sonra USDC\'den DAI\'ye.',
      long: `Takas etmek istediğin iki [[token]] için her zaman derin bir havuz bulunmaz. O zaman bir "router" işlemi bir yol boyunca gönderir: bir havuzda A'dan B'ye, bir sonrakinde B'den C'ye. Her adıma "hop" denir.

Uniswap v2 ve v3'te her adım, [[token]]'ları bir havuz sözleşmesinden çıkarıp diğerine aktarır ve her aktarım [[gas]] harcar.

v4'te bütün havuzlar tek bir [[singleton]] sözleşmede durur ve [[flash-accounting]] aradaki [[token]]'ları kâğıt üzerinde götürür; yalnızca giren ilk [[token]] ve çıkan son [[token]] gerçekten aktarılır.`,
    },
  },
];

export default terms;
