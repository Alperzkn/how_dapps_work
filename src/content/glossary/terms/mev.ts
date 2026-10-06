import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'mev',
    name: 'MEV',
    category: 'defi',
    related: ['searcher', 'block-builder', 'proposer', 'sandwich-attack', 'arbitrage'],
    lesson: 'mev',
    en: {
      short: 'Maximal extractable value: what can be earned from choosing which transactions go into a block and in what order, beyond the normal reward and fees.',
      long: `Whoever produces a [[block]] decides which transactions it contains and in what order. Because the outcome of a [[swap]] or a liquidation depends on what ran before it, that freedom is worth money. MEV is the name for that value.

Some of it is harmless or useful, such as [[arbitrage]] that brings a pool's price back in line with the market. Some of it is taken directly from users, such as a [[sandwich-attack]].

The term was coined as "miner extractable value" in the 2019 paper *Flash Boys 2.0*. Since Ethereum uses [[proof-of-stake]], the M is read as "maximal".`,
    },
    tr: {
      short: '"Maximal extractable value": bir [[block]]\'a hangi işlemlerin hangi sırayla gireceğini seçerek, olağan ödül ve ücretlerin ötesinde kazanılabilen değer.',
      long: `Bir [[block]]'u üreten, içine hangi işlemlerin hangi sırayla gireceğine karar verir. Bir [[swap]]'ın ya da bir tasfiyenin sonucu kendisinden önce neyin çalıştığına bağlı olduğu için bu özgürlük para eder. [[mev]], bu değerin adıdır.

Bir kısmı zararsız, hatta yararlıdır; örneğin bir havuzun fiyatını piyasayla yeniden hizalayan [[arbitrage]]. Bir kısmı ise doğrudan kullanıcılardan alınır; örneğin [[sandwich-attack]].

Terim, 2019 tarihli *Flash Boys 2.0* makalesinde "miner extractable value" olarak ortaya atıldı. Ethereum [[proof-of-stake]] kullandığından beri M harfi "maximal" diye okunur.`,
    },
  },
  {
    id: 'front-running',
    name: 'front-running',
    category: 'defi',
    related: ['mev', 'sandwich-attack', 'back-running', 'mempool'],
    lesson: 'mev',
    en: {
      short: 'Getting your own transaction placed just before a pending one you have seen, to profit from what that one is about to do.',
      long: `A pending [[transaction]] in the [[mempool]] shows what it will do. If it will push a price up, someone who buys just before it gets the lower price and can sell into the higher one.

Getting in front means being ordered earlier in the same [[block]], which is bought with a higher priority fee or by paying a [[block-builder]] directly.

Front-running makes the original transaction worse off. That is the difference from [[back-running]], which only acts afterwards.`,
    },
    tr: {
      short: 'Gördüğün bekleyen bir işlemin hemen önüne kendi işlemini yerleştirip onun yapacağı şeyden kâr etmek.',
      long: `[[mempool]]'da bekleyen bir [[transaction]], ne yapacağını gösterir. Bir fiyatı yukarı itecekse, ondan hemen önce alan kişi düşük fiyattan alır ve yükselen fiyattan satabilir.

Öne geçmek, aynı [[block]] içinde daha önce sıralanmak demektir; bu da daha yüksek bir öncelik ücretiyle ya da bir [[block-builder]]'a doğrudan ödeme yaparak satın alınır.

[[front-running]], asıl işlemin sonucunu kötüleştirir. Yalnızca sonradan hareket eden [[back-running]]'den farkı budur.`,
    },
  },
  {
    id: 'sandwich-attack',
    name: 'sandwich attack',
    category: 'defi',
    related: ['front-running', 'back-running', 'slippage-tolerance', 'price-impact', 'amm'],
    lesson: 'mev',
    en: {
      short: 'Two trades wrapped around a victim\'s swap: one just before it to move the price, one just after it to cash out.',
      long: `The attacker sees a pending [[swap]] on an [[amm]]. It buys the same token first, which raises the price; the victim then buys at the worse price and raises it further; the attacker sells immediately after.

The attacker can only push the price as far as the victim's [[slippage-tolerance]] allows, because beyond that the victim's swap reverts and there is nothing to profit from. Both of the attacker's trades pay the pool fee, so small swaps in deep pools are not worth attacking.

The victim loses, the attacker gains somewhat less, and the pool's [[liquidity-provider|liquidity providers]] collect the extra fees.`,
    },
    tr: {
      short: 'Kurbanın takasının çevresine sarılan iki işlem: fiyatı oynatmak için hemen önce bir tane, kârı almak için hemen sonra bir tane.',
      long: `Saldırgan bir [[amm]] üzerinde bekleyen bir [[swap]] görür. Önce aynı varlığı kendisi alır ve fiyatı yükseltir; kurban daha kötü fiyattan alır ve fiyatı biraz daha yükseltir; saldırgan hemen ardından satar.

Saldırgan fiyatı ancak kurbanın [[slippage-tolerance]] değerinin izin verdiği kadar itebilir; çünkü ötesinde kurbanın takası geri alınır ve kâr edilecek bir şey kalmaz. Saldırganın iki işlemi de havuz ücreti öder; bu yüzden derin havuzlardaki küçük takaslara saldırmaya değmez.

Kurban kaybeder, saldırgan bundan biraz daha azını kazanır, fazladan ücretleri de havuzun [[liquidity-provider]]'ları toplar.`,
    },
  },
  {
    id: 'back-running',
    name: 'back-running',
    category: 'defi',
    related: ['arbitrage', 'front-running', 'mev', 'searcher'],
    lesson: 'mev',
    en: {
      short: 'Placing a transaction directly after a specific one to capture the opportunity it leaves behind, usually an arbitrage.',
      long: `A large [[swap]] leaves a pool's price out of line with the rest of the market. The first transaction after it can trade the pool back and keep the difference. That is [[arbitrage]], and aiming for the slot right behind the swap is back-running.

It does not change what the earlier trader received, which is why it is generally seen as the benign form of [[mev]]. The profit still comes from somewhere: from the pool's [[liquidity-provider|liquidity providers]].

Some systems auction the right to back-run a user's transaction and give most of the proceeds back to that user.`,
    },
    tr: {
      short: 'Belirli bir işlemin hemen arkasına bir işlem yerleştirip onun geride bıraktığı fırsatı, çoğu zaman bir arbitrajı, yakalamak.',
      long: `Büyük bir [[swap]], bir havuzun fiyatını piyasanın geri kalanından uzaklaştırır. Ondan sonraki ilk işlem havuzu geri çekip aradaki farkı alabilir. Bu bir [[arbitrage]]'dır; takasın hemen arkasındaki yeri hedeflemeye de [[back-running]] denir.

Öndeki kişinin aldığı miktarı değiştirmez; bu yüzden genellikle [[mev]]'in zararsız biçimi sayılır. Kâr yine de bir yerden gelir: havuzun [[liquidity-provider]]'larından.

Bazı sistemler, bir kullanıcının işlemini "back-run" etme hakkını açık artırmaya çıkarır ve gelirin çoğunu o kullanıcıya geri verir.`,
    },
  },
  {
    id: 'searcher',
    name: 'searcher',
    category: 'defi',
    related: ['mev', 'block-builder', 'mempool', 'arbitrage'],
    lesson: 'mev',
    en: {
      short: 'Someone who runs bots that scan pending transactions and chain state for profitable ordering opportunities.',
      long: `A searcher watches the [[mempool]] and the latest state, simulates what each pending [[transaction]] will do, and looks for [[arbitrage]], liquidations, [[back-running]] and [[sandwich-attack|sandwiches]].

When it finds one, it sends its transactions to a [[block-builder]], usually as a bundle that must be included in a fixed order or not at all, and offers part of the profit as payment for inclusion.

Searchers compete with each other, so most of the profit of a well-known opportunity is bid away to builders and, through them, to the [[proposer]].`,
    },
    tr: {
      short: 'Bekleyen işlemleri ve zincirin durumunu tarayıp sıralamadan doğan kârlı fırsatları arayan botları çalıştıran kişi.',
      long: `Bir [[searcher]], [[mempool]]'u ve en güncel durumu izler, bekleyen her [[transaction]]'ın ne yapacağını simüle eder ve [[arbitrage]], tasfiye, [[back-running]] ve [[sandwich-attack]] fırsatları arar.

Bir fırsat bulduğunda işlemlerini bir [[block-builder]]'a gönderir; çoğu zaman belirli bir sırayla dahil edilmesi ya da hiç edilmemesi gereken bir "bundle" olarak. Bloğa girmenin bedeli olarak kârın bir kısmını teklif eder.

[[searcher]]'lar birbiriyle yarışır; bu yüzden iyi bilinen bir fırsatın kârının çoğu teklifle "builder"'lara, onlar üzerinden de [[proposer]]'a gider.`,
    },
  },
  {
    id: 'block-builder',
    name: 'block builder',
    category: 'consensus',
    related: ['proposer', 'mev-boost', 'searcher', 'mev'],
    lesson: 'mev',
    en: {
      short: 'A specialist that assembles a complete block from pending transactions and searcher bundles, and bids to have a proposer use it.',
      long: `Building the most valuable [[block]] possible takes fast simulation, good connections and private order flow. Builders do that work and compete in an auction: each offers the [[proposer]] a payment for choosing its block.

The builder decides the order of transactions, so it is the party that actually controls [[mev]] inside a block. Competition between builders pushes most of that value on to the proposer.

On Ethereum today builders reach proposers through relays and [[mev-boost]]. A few builders produce a large share of blocks, which is a concern for censorship resistance.`,
    },
    tr: {
      short: 'Bekleyen işlemlerden ve "searcher" paketlerinden eksiksiz bir "block" kuran ve bir [[proposer]]\'ın onu kullanması için teklif veren uzman.',
      long: `Olabilecek en değerli [[block]]'u kurmak hızlı simülasyon, iyi bağlantılar ve özel emir akışı ister. "Builder"'lar bu işi yapar ve bir açık artırmada yarışır: her biri, kendi bloğunu seçmesi için [[proposer]]'a bir ödeme teklif eder.

İşlemlerin sırasına [[block-builder]] karar verir; yani bir bloğun içindeki [[mev]]'i fiilen denetleyen taraf odur. "Builder"'lar arasındaki rekabet bu değerin çoğunu [[proposer]]'a aktarır.

Ethereum'da bugün "builder"'lar [[proposer]]'lara "relay"'ler ve [[mev-boost]] üzerinden ulaşır. Blokların büyük bir bölümünü az sayıda "builder" üretir; bu da sansüre direnç açısından bir kaygıdır.`,
    },
  },
  {
    id: 'private-mempool',
    name: 'private mempool',
    category: 'defi',
    related: ['mempool', 'block-builder', 'front-running', 'sandwich-attack', 'rpc'],
    lesson: 'mev',
    en: {
      short: 'A way to send a transaction straight to block builders instead of broadcasting it, so public bots cannot see it before it is in a block.',
      long: `Normally a [[transaction]] is gossiped to every [[node]] and waits in the public [[mempool]]. With a private route, your [[wallet]] sends it to a special [[rpc]] endpoint that forwards it only to one or more [[block-builder|builders]].

Bots watching the public network never see it, so they cannot [[front-running|front-run]] or sandwich it.

The cost is trust: the endpoint and the builders do see it, and you rely on them not to exploit or leak it. It can also take longer to be included, since only those builders can put it in a [[block]].`,
    },
    tr: {
      short: 'Bir işlemi yayınlamak yerine doğrudan "block builder"\'lara göndermenin yolu; böylece açıktaki botlar onu bir [[block]]\'a girmeden göremez.',
      long: `Normalde bir [[transaction]] her [[node]]'a [[gossip]] ile yayılır ve herkese açık [[mempool]]'da bekler. Özel bir yolda ise [[wallet]]'ın onu, yalnızca bir ya da birkaç [[block-builder]]'a ileten özel bir [[rpc]] uç noktasına gönderir.

Açık ağı izleyen botlar onu hiç görmez; dolayısıyla [[front-running]] ya da "sandwich" yapamazlar.

Bedeli güvendir: uç nokta ve "builder"'lar işlemi görür ve onu sömürmeyeceklerine, sızdırmayacaklarına güvenmek zorundasın. Bloğa girmesi de uzayabilir, çünkü onu bir [[block]]'a yalnızca o "builder"'lar koyabilir.`,
    },
  },
  {
    id: 'slippage-tolerance',
    name: 'slippage tolerance',
    category: 'defi',
    related: ['slippage', 'price-impact', 'sandwich-attack', 'swap'],
    lesson: 'mev',
    en: {
      short: 'How much worse than the quoted amount you are willing to receive from a swap before it should fail instead.',
      long: `Prices can move between the moment you see a quote and the moment your [[swap]] executes. The tolerance, for example 0.5%, says how much of that [[slippage]] you accept.

Inside the [[transaction]] it becomes a minimum output. If the pool would give less, the swap reverts and you pay only the [[gas-fee]].

It is also the room you leave for a [[sandwich-attack]]: an attacker can push the price exactly as far as your minimum allows. Too high and you offer a large prize; too low and ordinary price movement makes your swap fail.`,
    },
    tr: {
      short: 'Bir takastan, teklif edilen miktardan ne kadar azını almaya razı olduğun; daha azı çıkacaksa takas başarısız olur.',
      long: `Bir teklifi gördüğün an ile [[swap]]'ın gerçekleştiği an arasında fiyat oynayabilir. Tolerans, örneğin %0,5, bu [[slippage]]'ın ne kadarını kabul ettiğini söyler.

[[transaction]]'ın içinde asgari bir çıktıya dönüşür. Havuz daha azını verecekse takas geri alınır ve yalnızca [[gas-fee]] ödersin.

Aynı zamanda bir [[sandwich-attack]] için bıraktığın yerdir: saldırgan fiyatı tam senin asgari değerinin izin verdiği kadar itebilir. Fazla yüksekse büyük bir ödül sunarsın; fazla düşükse olağan fiyat hareketi takasını başarısız kılar.`,
    },
  },
  {
    id: 'mev-boost',
    name: 'MEV-Boost',
    proper: true,
    category: 'consensus',
    related: ['block-builder', 'proposer', 'validator', 'mev'],
    lesson: 'mev',
    en: {
      short: 'Optional open-source software that lets an Ethereum validator take blocks from outside builders through relays instead of building its own.',
      long: `MEV-Boost runs next to a [[validator]]'s node. When it is that validator's turn as [[proposer]], it asks relays for the best bid. Each bid comes from a [[block-builder]] and shows only the block's header and the payment offered.

The proposer signs the header with the highest bid without seeing the transactions; only then does the relay reveal the full [[block]]. Signing blind stops the proposer from copying the builder's work.

It is an out-of-protocol form of proposer-builder separation and depends on trusting relays. Moving this mechanism into the protocol itself has been specified as EIP-7732.`,
    },
    tr: {
      short: 'Bir Ethereum [[validator]]\'ının kendi bloğunu kurmak yerine "relay"\'ler üzerinden dış "builder"\'lardan blok almasını sağlayan, isteğe bağlı açık kaynak yazılım.',
      long: `MEV-Boost, bir [[validator]]'ın [[node]]'unun yanında çalışır. [[proposer]] olma sırası o [[validator]]'a geldiğinde "relay"'lerden en iyi teklifi ister. Her teklif bir [[block-builder]]'dan gelir ve yalnızca bloğun başlığını ve önerilen ödemeyi gösterir.

[[proposer]], işlemleri görmeden en yüksek teklifli başlığı imzalar; "relay" ancak ondan sonra [[block]]'un tamamını açıklar. Körlemesine imzalamak, [[proposer]]'ın "builder"'ın emeğini kopyalamasını engeller.

Protokol dışı bir "proposer-builder separation" biçimidir ve "relay"'lere güvenmeye dayanır. Bu mekanizmanın protokolün içine taşınması EIP-7732 olarak tanımlanmıştır.`,
    },
  },
];

export default terms;
