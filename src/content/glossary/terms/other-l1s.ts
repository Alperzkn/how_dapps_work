import type { GlossaryTerm } from '../../../types';

// Turkish: chain names (Solana, Avalanche, Cosmos, Bitcoin, Ethereum) are proper
// nouns and are written plainly, never as [[solana]] etc., which would add quotes.
// Performance figures are approximate and dated.

const terms: GlossaryTerm[] = [
  {
    id: 'layer-1',
    name: 'layer 1',
    category: 'chains',
    related: ['blockchain', 'scalability-trilemma', 'bitcoin', 'ethereum'],
    lesson: 'other-l1s',
    en: {
      short: 'A base blockchain that orders and settles its own transactions with its own consensus. Often written L1.',
      long: `A layer 1 (L1) is a [[blockchain]] that stands on its own: it has its own validators or miners, its own [[consensus]] and its own native coin for fees. [[bitcoin]], [[ethereum]], [[solana]] and [[avalanche]] are layer 1s.

The term exists to contrast with a [[layer-2]], a system that processes transactions elsewhere but relies on a layer 1 for its security, for example a [[rollup]] that posts its data to Ethereum.

Layer 1s differ mainly in how they answer the [[scalability-trilemma]]: how fast they are, how many independent parties run them, and how costly they are to attack.`,
    },
    tr: {
      short: 'Kendi [[transaction]]\'larını kendi [[consensus]] mekanizmasıyla sıralayıp kesinleştiren taban [[blockchain]]. Kısaca L1.',
      long: `[[layer-1]] (L1), kendi ayakları üzerinde duran bir [[blockchain]]'dir: kendi [[validator]]'ları ya da [[miner]]'ları, kendi [[consensus]] mekanizması ve ücretler için kendi coin'i vardır. Bitcoin, Ethereum, Solana ve Avalanche birer [[layer-1]] zinciridir.

Bu terim [[layer-2]] ile karşılaştırma yapmak için kullanılır: [[transaction]]'ları başka yerde işleyen ama güvenliği için bir [[layer-1]]'a dayanan sistemler; örneğin verisini Ethereum'a yazan bir [[rollup]].

[[layer-1]] zincirleri en çok [[scalability-trilemma]]'ya verdikleri cevapla ayrışır: ne kadar hızlı oldukları, onları kaç bağımsız tarafın çalıştırdığı ve onlara saldırmanın ne kadar pahalı olduğu.`,
    },
  },
  {
    id: 'scalability-trilemma',
    name: 'scalability trilemma',
    category: 'chains',
    related: ['layer-1', 'tps', 'parallel-execution'],
    lesson: 'other-l1s',
    en: {
      short: 'The observation that a blockchain struggles to be secure, decentralized and scalable all at once.',
      long: `The scalability trilemma says that a blockchain design can comfortably achieve two of three goals, but the third suffers:

- **security**: attacking the chain is prohibitively expensive;
- **decentralization**: many independent participants can run a node and take part;
- **scalability**: the chain processes many transactions quickly and cheaply.

For example, bigger and faster blocks raise capacity but also the cost of running a node, so fewer people do. A small validator group is fast but easier to corrupt.

It is a rule of thumb rather than a proven law. Much current work, including rollups, sharding and [[parallel-execution]], is an attempt to loosen it.`,
    },
    tr: {
      short: 'Bir [[blockchain]]\'in aynı anda hem güvenli hem merkeziyetsiz hem de ölçeklenebilir olmakta zorlandığı gözlemi.',
      long: `[[scalability-trilemma]], bir [[blockchain]] tasarımının üç hedeften ikisine rahatça ulaşabildiğini, ama üçüncüsünün zarar gördüğünü söyler:

- **güvenlik**: zincire saldırmak karşılanamayacak kadar pahalıdır;
- **merkeziyetsizlik**: birbirinden bağımsız çok sayıda katılımcı [[node]] çalıştırabilir ve sürece katılabilir;
- **ölçeklenebilirlik**: zincir çok sayıda [[transaction]]'ı hızlı ve ucuz işler.

Örneğin daha büyük ve daha hızlı [[block]]'lar kapasiteyi artırır, ama [[node]] çalıştırmanın maliyetini de artırır; bu yüzden daha az kişi çalıştırır. Küçük bir [[validator]] grubu hızlıdır, ama yoldan çıkarılması daha kolaydır.

Kanıtlanmış bir yasa değil, pratik bir kuraldır. "Rollup"'lar, "sharding" ve [[parallel-execution]] gibi güncel çalışmaların çoğu onu gevşetme çabasıdır.`,
    },
  },
  {
    id: 'tps',
    name: 'TPS',
    category: 'chains',
    related: ['scalability-trilemma', 'layer-1', 'block'],
    lesson: 'other-l1s',
    en: {
      short: 'Transactions per second: how many transactions a chain processes each second.',
      long: `TPS is the most quoted measure of a chain's capacity. It follows from how much fits in a [[block]] and how often blocks are produced.

Rough orders of magnitude (as of 2026): [[bitcoin]] around 7, [[ethereum]]'s base chain a few tens, and high-throughput chains such as [[solana]] roughly one to a few thousand user transactions per second in practice.

Treat headline TPS numbers with care. They depend on what is counted as a transaction (a simple transfer is far cheaper than a complex contract call), on whether the figure is a lab benchmark or real usage, and they say nothing about how long a transaction takes to become final or how hard the chain is to attack.`,
    },
    tr: {
      short: '"Transactions per second": bir zincirin saniyede işlediği [[transaction]] sayısı.',
      long: `[[tps]], bir zincirin kapasitesi için en sık anılan ölçüdür. Bir [[block]]'a ne kadar sığdığından ve [[block]]'ların ne sıklıkla üretildiğinden çıkar.

Kabaca büyüklükler (2026 itibarıyla): Bitcoin 7 civarı, Ethereum'un taban zinciri birkaç on, Solana gibi yüksek iş hacimli zincirler ise pratikte saniyede kabaca bin ile birkaç bin arası kullanıcı [[transaction]]'ı.

Manşetlerdeki [[tps]] rakamlarına dikkatle yaklaş. Neyin [[transaction]] sayıldığına (basit bir transfer, karmaşık bir "contract" çağrısından çok daha ucuzdur) ve rakamın laboratuvar ölçümü mü gerçek kullanım mı olduğuna bağlıdır; ayrıca bir [[transaction]]'ın ne kadar sürede kesinleştiği ya da zincire saldırmanın ne kadar zor olduğu hakkında hiçbir şey söylemez.`,
    },
  },
  {
    id: 'solana',
    name: 'Solana',
    proper: true,
    category: 'chains',
    related: ['proof-of-history', 'parallel-execution', 'layer-1', 'tps'],
    lesson: 'other-l1s',
    en: {
      short: 'A layer 1 (2020) built for high throughput on a single chain, using a built-in clock and parallel execution.',
      long: `Solana is a [[layer-1]] launched in 2020. Its goal is to make one chain fast enough for everything, rather than splitting activity across many chains.

Two ideas stand out. [[proof-of-history]] gives the network a shared, verifiable clock, so validators spend less time agreeing on the order of events. [[parallel-execution]] lets transactions that touch different accounts run at the same time on different CPU cores. Security comes from [[proof-of-stake]].

Blocks arrive roughly every 250 milliseconds (as of October 2026, down from 400) and fees are usually very low. The cost is demanding hardware and bandwidth for validators, which limits who can run one.`,
    },
    tr: {
      short: 'İçindeki saat ve [[parallel-execution]] sayesinde tek zincirde yüksek iş hacmi için kurulmuş bir [[layer-1]] (2020).',
      long: `Solana, 2020'de başlatılan bir [[layer-1]] zinciridir. Amacı, hareketi çok sayıda zincire bölmek yerine tek bir zinciri her şeye yetecek kadar hızlı yapmaktır.

İki fikir öne çıkar. [[proof-of-history]] ağa ortak, doğrulanabilir bir saat verir; böylece [[validator]]'lar olayların sırası üzerinde anlaşmaya daha az zaman harcar. [[parallel-execution]] ise farklı hesaplara dokunan [[transaction]]'ların farklı işlemci çekirdeklerinde aynı anda çalışmasını sağlar. Güvenlik [[proof-of-stake]] ile sağlanır.

[[block]]'lar kabaca 250 milisaniyede bir gelir (Ekim 2026 itibarıyla; önceden 400'dü) ve ücretler genellikle çok düşüktür. Bedeli, [[validator]]'lar için yüksek donanım ve bant genişliği gereksinimidir; bu da kimlerin [[validator]] çalıştırabileceğini sınırlar.`,
    },
  },
  {
    id: 'proof-of-history',
    name: 'Proof of History',
    category: 'consensus',
    related: ['solana', 'hash', 'sha-256', 'timestamp'],
    lesson: 'other-l1s',
    en: {
      short: 'Solana’s verifiable clock: a long chain of hashes that proves the order of events and that time has passed.',
      long: `Proof of History (PoH) is a sequence made by running a [[hash]] function over and over, each output becoming the next input. Since there is no shortcut to the millionth output, having it proves that a million steps of work, and therefore some real time, went by.

Transactions are mixed into the sequence as they arrive, which gives each one a provable position: this one came after that one. Validators receive blocks whose internal order is already fixed and can check the sequence quickly by verifying many pieces of it in parallel.

Despite the name, PoH is not a [[consensus]] mechanism. It is a clock. Deciding which blocks are final is still done by validators voting with their stake, using [[proof-of-stake]].`,
    },
    tr: {
      short: 'Solana\'nın doğrulanabilir saati: olayların sırasını ve zamanın geçtiğini kanıtlayan uzun bir [[hash]] zinciri.',
      long: `[[proof-of-history]] (PoH), bir [[hash]] fonksiyonunu tekrar tekrar çalıştırarak üretilen bir dizidir; her çıktı bir sonrakinin girdisi olur. Milyonuncu çıktıya kestirmeden ulaşmanın yolu olmadığı için, ona sahip olmak bir milyon adımlık işin ve dolayısıyla bir miktar gerçek zamanın geçtiğini kanıtlar.

[[transaction]]'lar geldikçe diziye karıştırılır; bu da her birine kanıtlanabilir bir konum verir: şu, bundan sonra geldi. [[validator]]'lar iç sırası zaten sabitlenmiş [[block]]'lar alır ve dizinin birçok parçasını paralel doğrulayarak onu hızlıca kontrol edebilir.

Adına rağmen PoH bir [[consensus]] mekanizması değildir; bir saattir. Hangi [[block]]'ların kesinleştiğine yine [[validator]]'lar, [[proof-of-stake]] ile, [[stake]]'leriyle oy vererek karar verir.`,
    },
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    proper: true,
    category: 'chains',
    related: ['subnet', 'layer-1', 'bft', 'evm'],
    lesson: 'other-l1s',
    en: {
      short: 'A layer 1 (2020) that reaches agreement by repeated random sampling and lets projects launch their own chains.',
      long: `Avalanche is a [[layer-1]] launched in 2020. Its consensus works differently from both mining and classic voting: each validator repeatedly asks a small random sample of other validators what they prefer and follows the majority. After enough rounds the whole network has converged, typically within a second or two (as of 2026).

The main network runs three chains. The best known, the C-Chain, runs the [[evm]], so Ethereum contracts and tools work on it.

Avalanche also lets anyone start an additional chain with its own validators and rules, originally called a [[subnet]] and now an Avalanche L1. Capacity grows by adding chains rather than enlarging one.`,
    },
    tr: {
      short: 'Tekrarlı rastgele örneklemeyle anlaşmaya varan ve projelerin kendi zincirini başlatmasına izin veren bir [[layer-1]] (2020).',
      long: `Avalanche, 2020'de başlatılan bir [[layer-1]] zinciridir. [[consensus]] mekanizması hem [[mining]]'den hem de klasik oylamadan farklı çalışır: her [[validator]], rastgele seçtiği küçük bir [[validator]] grubuna neyi tercih ettiklerini tekrar tekrar sorar ve çoğunluğa uyar. Yeterince turdan sonra bütün ağ aynı noktada buluşur; bu genellikle bir iki saniye sürer (2026 itibarıyla).

Ana ağ üç zincir çalıştırır. En bilineni olan C-Chain üzerinde [[evm]] çalışır; yani Ethereum "contract"'ları ve araçları orada da işler.

Avalanche ayrıca herkesin kendi [[validator]]'ları ve kuralları olan ek bir zincir başlatmasına izin verir; buna başlangıçta [[subnet]] deniyordu, artık Avalanche L1 deniyor. Kapasite, tek bir zinciri büyüterek değil, zincir ekleyerek artar.`,
    },
  },
  {
    id: 'subnet',
    name: 'subnet',
    category: 'chains',
    related: ['avalanche', 'layer-1', 'cosmos'],
    lesson: 'other-l1s',
    en: {
      short: 'On Avalanche, a separate chain with its own validators and rules; now officially called an Avalanche L1.',
      long: `A subnet is a group of validators that runs one or more blockchains of its own alongside the main [[avalanche]] network. Its creators choose the virtual machine, the fee token, who may validate and who may use it.

That makes subnets attractive for applications that want dedicated capacity or special rules, such as a game or a regulated institution. Activity on one subnet does not compete for block space with the others.

Since an upgrade in late 2024 these chains are called "Avalanche L1s" and no longer need their validators to also secure the main network. The trade-off is that each one is only as secure as its own validator set.`,
    },
    tr: {
      short: 'Avalanche\'ta kendi [[validator]]\'ları ve kuralları olan ayrı bir zincir; resmi adı artık Avalanche L1.',
      long: `[[subnet]], ana Avalanche ağının yanında kendine ait bir ya da daha fazla [[blockchain]] çalıştıran bir [[validator]] grubudur. Kurucuları sanal makineyi, ücret token'ını, kimin [[validator]] olabileceğini ve kimin kullanabileceğini seçer.

Bu, kendine ayrılmış kapasite ya da özel kurallar isteyen uygulamalar için caziptir; örneğin bir oyun ya da düzenlemeye tabi bir kurum. Bir [[subnet]] üzerindeki hareket, diğerleriyle [[block]] alanı için yarışmaz.

2024 sonundaki bir güncellemeden beri bu zincirlere "Avalanche L1" deniyor ve [[validator]]'larının artık ana ağı da güvenceye alması gerekmiyor. Bedeli, her birinin ancak kendi [[validator]] kümesi kadar güvenli olmasıdır.`,
    },
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    proper: true,
    category: 'chains',
    related: ['tendermint', 'ibc', 'layer-1', 'subnet'],
    lesson: 'other-l1s',
    en: {
      short: 'An ecosystem of independent, application-specific chains that share a toolkit and talk to each other over IBC.',
      long: `Cosmos is not one chain but a family of them. The idea is that each application should have its own [[layer-1]], an "app chain", with its own validators, token and governance, instead of sharing one general-purpose chain.

Most of these chains are built with the same open-source toolkit (the Cosmos SDK) and use [[tendermint]]-style consensus, which gives final blocks in a few seconds.

They are connected by [[ibc]], a protocol that lets chains send tokens and messages to each other while each chain verifies the other for itself. The Cosmos Hub, launched in 2019, was the first such chain.`,
    },
    tr: {
      short: 'Ortak bir araç setini paylaşan ve birbirleriyle [[ibc]] üzerinden konuşan, uygulamaya özel bağımsız zincirlerden oluşan ekosistem.',
      long: `Cosmos tek bir zincir değil, bir zincir ailesidir. Fikir şu: her uygulama, genel amaçlı tek bir zinciri paylaşmak yerine kendi [[validator]]'ları, token'ı ve yönetişimi olan kendi [[layer-1]] zincirine, yani bir "app chain"'e sahip olmalı.

Bu zincirlerin çoğu aynı açık kaynak araç setiyle (Cosmos SDK) kurulur ve birkaç saniyede kesinleşmiş [[block]] veren [[tendermint]] tarzı bir [[consensus]] kullanır.

Onları [[ibc]] bağlar: zincirlerin birbirine token ve mesaj göndermesini sağlayan, her zincirin karşı tarafı kendisinin doğruladığı bir protokol. 2019'da başlatılan Cosmos Hub bu zincirlerin ilkiydi.`,
    },
  },
  {
    id: 'tendermint',
    name: 'Tendermint',
    proper: true,
    category: 'consensus',
    related: ['bft', 'cosmos', 'ibc'],
    lesson: 'other-l1s',
    en: {
      short: 'A voting-based consensus engine in which a block is final as soon as more than two thirds of the stake approves it.',
      long: `Tendermint is the consensus engine behind most [[cosmos]] chains; its maintained version is called CometBFT. It is a [[bft]] protocol: it keeps working correctly as long as less than one third of the voting power is faulty or malicious.

For each block one validator proposes, then all validators vote in two stages, "prevote" and "precommit". When more than two thirds of the voting power has precommitted, the block is committed and can never be reverted. There are no competing forks to wait out.

The price is that every validator takes part in every block, so validator sets are kept fairly small, and if more than a third of them go offline the chain pauses rather than risk a split.`,
    },
    tr: {
      short: '[[stake]]\'in üçte ikisinden fazlası onaylar onaylamaz [[block]]\'un kesinleştiği, oylamaya dayalı [[consensus]] motoru.',
      long: `[[tendermint]], Cosmos zincirlerinin çoğunun arkasındaki [[consensus]] motorudur; bugün sürdürülen sürümünün adı CometBFT'dir. Bir [[bft]] protokolüdür: oy gücünün üçte birinden azı hatalı ya da kötü niyetli olduğu sürece doğru çalışmaya devam eder.

Her [[block]] için bir [[validator]] öneri yapar, sonra bütün [[validator]]'lar iki aşamada oy verir: "prevote" ve "precommit". Oy gücünün üçte ikisinden fazlası "precommit" verdiğinde [[block]] kesinleşir ve bir daha geri alınamaz. Bitmesi beklenecek, yarışan "fork"'lar yoktur.

Bedeli, her [[validator]]'ın her [[block]]'a katılmasıdır; bu yüzden [[validator]] kümeleri görece küçük tutulur ve üçte birinden fazlası çevrimdışı kalırsa zincir bölünme riskine girmek yerine durur.`,
    },
  },
  {
    id: 'ibc',
    name: 'IBC',
    category: 'chains',
    related: ['cosmos', 'tendermint', 'layer-1'],
    lesson: 'other-l1s',
    en: {
      short: 'Inter-Blockchain Communication: a protocol for sending tokens and messages between independent chains.',
      long: `IBC lets two separate blockchains exchange data packets without trusting a company or a custodian in the middle. It is the standard way [[cosmos]] chains connect.

Each chain keeps a "light client" of the other: a small on-chain program that follows the other chain's block headers. When a packet arrives, it comes with a cryptographic proof, and the receiving chain checks that proof against the headers it already tracks.

The packets are carried by relayers, ordinary programs anyone can run. A relayer can delay a packet but cannot fake one, because the proof would not verify. When a token moves over IBC, the original is locked on the source chain and a representation of it is created on the destination.`,
    },
    tr: {
      short: '"Inter-Blockchain Communication": bağımsız zincirler arasında token ve mesaj göndermeye yarayan protokol.',
      long: `[[ibc]], iki ayrı [[blockchain]]'in arada bir şirkete ya da emanetçiye güvenmeden veri paketi alışverişi yapmasını sağlar. Cosmos zincirlerinin birbirine bağlanmasının standart yoludur.

Her zincir diğerinin bir "light client"'ını tutar: karşı zincirin [[block-header]]'larını takip eden, zincir üstünde çalışan küçük bir program. Bir paket geldiğinde yanında kriptografik bir kanıt taşır ve alıcı zincir bu kanıtı zaten takip ettiği [[block-header]]'lara karşı kontrol eder.

Paketleri "relayer"'lar taşır; bunlar herkesin çalıştırabildiği sıradan programlardır. Bir "relayer" bir paketi geciktirebilir ama sahtesini üretemez, çünkü kanıt doğrulanmaz. Bir token [[ibc]] üzerinden taşındığında aslı kaynak zincirde kilitlenir ve hedef zincirde onun bir temsili yaratılır.`,
    },
  },
  {
    id: 'bft',
    name: 'BFT',
    category: 'consensus',
    related: ['tendermint', 'avalanche', 'cosmos'],
    lesson: 'other-l1s',
    en: {
      short: 'Byzantine fault tolerance: staying correct even when some participants lie, cheat or go silent.',
      long: `A system is Byzantine fault tolerant if it still reaches the right result when some of its participants behave arbitrarily badly, not just crash. The name comes from a thought experiment about generals who must agree on a plan although some of them are traitors.

Classic BFT protocols tolerate fewer than one third faulty participants. With \`n = 3f + 1\` validators they survive \`f\` bad ones, and a decision needs agreement from more than two thirds. [[tendermint]] is of this kind, and so is the finality part of Ethereum's [[proof-of-stake]].

These protocols give fast, definite finality, but every validator must exchange messages with the others, which limits how many validators can take part. Sampling-based designs such as [[avalanche]] relax this at the price of probabilistic guarantees.`,
    },
    tr: {
      short: '"Byzantine fault tolerance": bazı katılımcılar yalan söylese, hile yapsa ya da sussa bile doğru kalabilmek.',
      long: `Bir sistem, katılımcılarının bir kısmı yalnızca çökmekle kalmayıp keyfi biçimde kötü davrandığında bile doğru sonuca varabiliyorsa "Byzantine fault tolerant" sayılır. Ad, bazıları hain olduğu halde bir plan üzerinde anlaşmak zorunda olan generallerle ilgili bir düşünce deneyinden gelir.

Klasik [[bft]] protokolleri hatalı katılımcıların üçte birden az olmasına dayanır. \`n = 3f + 1\` [[validator]] ile \`f\` kötü niyetliye katlanabilirler ve bir karar için üçte ikiden fazlasının anlaşması gerekir. [[tendermint]] bu türdendir; Ethereum'daki [[proof-of-stake]]'in [[finality]] kısmı da öyle.

Bu protokoller hızlı ve kesin [[finality]] verir, ama her [[validator]]'ın diğerleriyle mesajlaşması gerekir; bu da kaç [[validator]]'ın katılabileceğini sınırlar. Avalanche gibi örneklemeye dayalı tasarımlar, olasılıksal garantiler pahasına bu sınırı gevşetir.`,
    },
  },
  {
    id: 'parallel-execution',
    name: 'parallel execution',
    category: 'chains',
    related: ['solana', 'tps', 'scalability-trilemma', 'evm'],
    lesson: 'other-l1s',
    en: {
      short: 'Running transactions that do not touch the same data at the same time, on several CPU cores.',
      long: `Most early blockchains execute transactions strictly one after another, because any transaction might read what the previous one wrote. That leaves most of a modern multi-core processor idle.

Parallel execution runs independent transactions simultaneously. The hard part is knowing in advance which ones are independent. [[solana]] requires every transaction to list the accounts it will read and write, so the runtime can schedule non-overlapping ones side by side. Other designs run transactions optimistically and redo the ones that turn out to conflict.

The results must be identical to some one-at-a-time ordering, or nodes would disagree. Transactions that compete for the same account, a popular trading pool for example, still run in sequence.`,
    },
    tr: {
      short: 'Aynı veriye dokunmayan [[transaction]]\'ları birden çok işlemci çekirdeğinde aynı anda çalıştırmak.',
      long: `İlk [[blockchain]]'lerin çoğu [[transaction]]'ları kesin bir sırayla, birbiri ardına çalıştırır; çünkü herhangi bir [[transaction]], bir öncekinin yazdığını okuyabilir. Bu, modern çok çekirdekli bir işlemcinin büyük kısmını boşta bırakır.

[[parallel-execution]], birbirinden bağımsız [[transaction]]'ları aynı anda çalıştırır. Zor olan, hangilerinin bağımsız olduğunu önceden bilmektir. Solana, her [[transaction]]'ın okuyacağı ve yazacağı hesapları listelemesini şart koşar; böylece çalışma ortamı çakışmayanları yan yana planlayabilir. Başka tasarımlar [[transaction]]'ları iyimser biçimde çalıştırır ve çakıştığı ortaya çıkanları yeniden yapar.

Sonuçlar, [[transaction]]'ların tek tek işlendiği bir sıralamayla birebir aynı olmak zorundadır; yoksa [[node]]'lar anlaşamaz. Aynı hesap için yarışan [[transaction]]'lar, örneğin popüler bir alım satım havuzuna gidenler, yine sırayla çalışır.`,
    },
  },
];

export default terms;
