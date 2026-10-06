import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'node',
    name: 'node',
    category: 'basics',
    related: ['full-node', 'light-node', 'p2p', 'gossip'],
    lesson: 'network',
    en: {
      short: "A computer that runs a blockchain's software and talks to other such computers.",
      long: `Nodes are what a [[blockchain]] physically consists of. Each one keeps a copy of the chain, checks new [[transaction|transactions]] and [[block|blocks]] against the rules, and passes valid ones on to its peers.

There is no registration. Anyone can start a node, and no node has more authority than another.

Nodes differ in how much they store and verify. A [[full-node]] checks everything; a [[light-node]] checks only a small part and relies on full nodes for the rest.`,
    },
    tr: {
      short: 'Bir [[blockchain]]\'in yazılımını çalıştıran ve aynı işi yapan diğer bilgisayarlarla konuşan bilgisayar.',
      long: `Bir [[blockchain]] fiziksel olarak [[node]]'lardan oluşur. Her biri zincirin bir kopyasını tutar, yeni [[transaction]] ve [[block]]'ları kurallara göre kontrol eder ve geçerli olanları "peer"'larına iletir.

Kayıt olmak gerekmez. İsteyen herkes bir [[node]] başlatabilir ve hiçbir [[node]]'un diğerinden fazla yetkisi yoktur.

[[node]]'lar ne kadar veri sakladıklarına ve neyi doğruladıklarına göre ayrılır. [[full-node]] her şeyi kontrol eder; [[light-node]] yalnızca küçük bir kısmını kontrol eder, gerisi için [[full-node]]'lara dayanır.`,
    },
  },
  {
    id: 'full-node',
    name: 'full node',
    category: 'basics',
    related: ['node', 'light-node', 'consensus'],
    lesson: 'network',
    en: {
      short: 'A node that downloads every block and verifies every rule itself, trusting no one.',
      long: `A full node replays the whole history, or starts from a recent state it can verify, and from then on checks every [[block]] and every [[transaction]] against all of the protocol rules.

Because it verifies everything, it cannot be tricked into accepting an invalid block, no matter how many others accept it. In that sense full nodes are what enforces the rules of a chain.

A full node does not have to keep all historical data; many prune old blocks. A node that keeps every past state is called an archive node. Running a full node earns nothing by itself: producing blocks is a separate role.`,
    },
    tr: {
      short: 'Her [[block]]\'u indiren ve her kuralı kendisi doğrulayan, kimseye güvenmeyen [[node]].',
      long: `[[full-node]] bütün geçmişi baştan işler ya da doğrulayabildiği yakın tarihli bir durumdan başlar; ondan sonra her [[block]]'u ve her [[transaction]]'ı protokol kurallarının tamamına göre kontrol eder.

Her şeyi doğruladığı için, başka kaç kişi kabul ederse etsin geçersiz bir [[block]]'u kabul etmeye kandırılamaz. Bu anlamda bir zincirin kurallarını uygulatan, [[full-node]]'lardır.

Bir [[full-node]] bütün geçmiş veriyi saklamak zorunda değildir; çoğu eski [[block]]'ları siler. Geçmişteki her durumu saklayana "archive node" denir. [[full-node]] çalıştırmak tek başına kazanç getirmez: [[block]] üretmek ayrı bir roldür.`,
    },
  },
  {
    id: 'light-node',
    name: 'light node',
    category: 'basics',
    related: ['full-node', 'node', 'block-header', 'merkle-root'],
    lesson: 'network',
    en: {
      short: 'A node that keeps only block headers and asks full nodes for proofs of the data it needs.',
      long: `A light node, or light client, is built for phones, browsers and small devices. It downloads each [[block-header]], which is tiny, and skips the transactions.

To learn about a particular payment or balance it asks a [[full-node]] for the data together with a proof that ties it to a [[merkle-root]] in a header. It can check that proof without trusting the node.

The trade-off: a light node verifies that the header chain is the one most of the network follows, not that every transaction inside obeys the rules. It assumes the majority of block producers is honest.`,
    },
    tr: {
      short: 'Yalnızca [[block-header]]\'ları tutan ve ihtiyaç duyduğu verinin kanıtını [[full-node]]\'lardan isteyen [[node]].',
      long: `[[light-node]], diğer adıyla "light client", telefonlar, tarayıcılar ve küçük cihazlar için tasarlanmıştır. Çok küçük olan her [[block-header]]'ı indirir, [[transaction]]'ları indirmez.

Belirli bir ödeme ya da bakiye hakkında bilgi almak için bir [[full-node]]'dan veriyi ve onu bir [[block-header]]'daki [[merkle-root]]'a bağlayan kanıtı ister. Bu kanıtı, o [[node]]'a güvenmeden kontrol edebilir.

Bunun bir bedeli vardır: [[light-node]], elindeki [[block-header]] zincirinin ağın çoğunun izlediği zincir olduğunu doğrular; içindeki her [[transaction]]'ın kurallara uyduğunu değil. [[block]] üretenlerin çoğunluğunun dürüst olduğunu varsayar.`,
    },
  },
  {
    id: 'p2p',
    name: 'P2P',
    category: 'basics',
    related: ['node', 'gossip', 'decentralization'],
    lesson: 'network',
    en: {
      short: 'Peer-to-peer: a network in which computers connect directly to each other as equals, with no central server.',
      long: `In a peer-to-peer network every participant is both client and server. Each [[node]] keeps connections to a few others, called its peers, and all of them speak the same protocol.

A blockchain's P2P layer does three things: it finds peers, it spreads new [[transaction|transactions]] and [[block|blocks]] by [[gossip]], and it lets a new node download the history.

Since there is no hub, there is nothing to seize or shut down. The price is that messages take a few hops to reach everyone, and that every node has to assume its peers may be lying.`,
    },
    tr: {
      short: '"Peer-to-peer": bilgisayarların merkezi bir sunucu olmadan, eşit taraflar olarak doğrudan birbirine bağlandığı ağ.',
      long: `[[p2p]] ağında her katılımcı hem istemci hem sunucudur. Her [[node]], "peer" denen birkaç başka [[node]] ile bağlantı kurar ve hepsi aynı protokolü konuşur.

Bir [[blockchain]]'in [[p2p]] katmanı üç iş yapar: "peer" bulur, yeni [[transaction]] ve [[block]]'ları [[gossip]] ile yayar ve yeni bir [[node]]'un geçmişi indirmesini sağlar.

Ortada bir merkez olmadığı için el konulacak ya da kapatılacak bir şey de yoktur. Bedeli şudur: mesajların herkese ulaşması birkaç adım sürer ve her [[node]], "peer"'larının yalan söyleyebileceğini varsaymak zorundadır.`,
    },
  },
  {
    id: 'gossip',
    name: 'gossip',
    category: 'basics',
    related: ['p2p', 'node', 'mempool'],
    lesson: 'network',
    en: {
      short: 'The way news spreads in a P2P network: each node passes it to its peers, who pass it to theirs.',
      long: `A [[node]] that receives a new [[transaction]] or [[block]] checks it and forwards it to the peers it is connected to. They repeat the step. The number of informed nodes grows exponentially, so the whole network hears within seconds.

To save bandwidth, nodes usually announce a short identifier first and send the full data only to peers that ask for it.

Gossip is robust because it is redundant. A node normally hears the same message from several peers, so one faulty or dishonest peer cannot hide it. Invalid messages are dropped instead of forwarded.`,
    },
    tr: {
      short: 'Bir [[p2p]] ağında haberin yayılma biçimi: her [[node]] "peer"\'larına iletir, onlar da kendi "peer"\'larına.',
      long: `Yeni bir [[transaction]] ya da [[block]] alan [[node]] onu kontrol eder ve bağlı olduğu "peer"'lara iletir. Onlar da aynı adımı tekrarlar. Haberi alan [[node]] sayısı üstel olarak büyür; bütün ağ birkaç saniye içinde duymuş olur.

Bant genişliğinden tasarruf için [[node]]'lar genellikle önce kısa bir kimlik duyurur, verinin tamamını yalnızca isteyen "peer"'lara gönderir.

[[gossip]], tekrarlı olduğu için dayanıklıdır. Bir [[node]] aynı mesajı çoğunlukla birkaç "peer"'dan duyar; bozuk ya da hileci tek bir "peer" onu saklayamaz. Geçersiz mesajlar iletilmez, atılır.`,
    },
  },
  {
    id: 'fork',
    name: 'fork',
    category: 'consensus',
    related: ['fork-choice', 'reorg', 'consensus', 'block'],
    lesson: 'network',
    en: {
      short: 'A split in the chain: two or more valid blocks that follow the same parent.',
      long: `The word has two meanings.

A **temporary fork** happens when two producers publish a [[block]] at nearly the same time. Part of the network sees one first, part the other. The [[fork-choice]] rule resolves it within a block or two, and one of the blocks is discarded.

A **protocol fork** is a change to the rules. In a soft fork the new rules are stricter, so old [[node|nodes]] still accept new blocks. In a hard fork the new rules allow blocks the old ones reject; nodes that do not upgrade stay on a separate chain. Ethereum Classic and Bitcoin Cash began that way.`,
    },
    tr: {
      short: 'Zincirde ayrılma: aynı ebeveyni izleyen iki ya da daha fazla geçerli [[block]].',
      long: `Kelimenin iki anlamı vardır.

**Geçici [[fork]]**, iki üretici neredeyse aynı anda birer [[block]] yayınladığında oluşur. Ağın bir kısmı önce birini, bir kısmı ötekini görür. [[fork-choice]] kuralı bunu bir iki [[block]] içinde çözer ve [[block]]'lardan biri atılır.

**Protokol [[fork]]'u** ise kuralların değişmesidir. "Soft fork"'ta yeni kurallar daha sıkıdır; eski [[node]]'lar yeni [[block]]'ları kabul etmeye devam eder. "Hard fork"'ta yeni kurallar, eskilerin reddettiği [[block]]'lara izin verir; yazılımını güncellemeyen [[node]]'lar ayrı bir zincirde kalır. Ethereum Classic ve Bitcoin Cash böyle ortaya çıkmıştır.`,
    },
  },
  {
    id: 'reorg',
    name: 'reorg',
    category: 'consensus',
    related: ['fork', 'fork-choice', 'finality', 'confirmation'],
    lesson: 'network',
    en: {
      short: 'Reorganization: a node drops the latest blocks of its chain and switches to a competing branch.',
      long: `A reorg happens when the [[fork-choice]] rule tells a [[node]] that another branch is now better than the one it was following. The node undoes its own latest [[block|blocks]] back to the common ancestor and applies the blocks of the other branch.

[[transaction|Transactions]] that were only in the dropped blocks go back to the [[mempool]]. Most are included again soon, but a payment that looked confirmed may briefly disappear, or be replaced by a conflicting one.

Shallow reorgs of one block are a normal result of network delay. Deep ones are rare and can be a sign of an attack. That is the reason for waiting for several [[confirmation|confirmations]] or for [[finality]].`,
    },
    tr: {
      short: '"Reorganization": bir [[node]]\'un zincirindeki son [[block]]\'ları bırakıp rakip bir dala geçmesi.',
      long: `[[fork-choice]] kuralı bir [[node]]'a, başka bir dalın izlediği daldan daha iyi olduğunu söylediğinde [[reorg]] olur. [[node]], ortak ataya kadar kendi son [[block]]'larını geri alır ve öteki dalın [[block]]'larını uygular.

Yalnızca bırakılan [[block]]'larda bulunan [[transaction]]'lar [[mempool]]'a döner. Çoğu kısa sürede yeniden bir [[block]]'a girer; ama onaylanmış görünen bir ödeme kısa süreliğine kaybolabilir ya da onunla çelişen bir başkası yerini alabilir.

Tek [[block]]'luk sığ [[reorg]]'lar ağ gecikmesinin olağan sonucudur. Derin olanlar nadirdir ve bir saldırının işareti olabilir. Birkaç [[confirmation]] ya da [[finality]] beklemenin nedeni budur.`,
    },
  },
  {
    id: 'finality',
    name: 'finality',
    category: 'consensus',
    related: ['confirmation', 'reorg', 'consensus', 'fork-choice'],
    lesson: 'network',
    en: {
      short: 'The guarantee that a block, and every transaction in it, will not be reverted.',
      long: `There are two kinds.

**Probabilistic finality**, as on Bitcoin: a block is never absolutely final, but each new block on top makes a [[reorg]] exponentially less likely. After enough [[confirmation|confirmations]] the remaining risk is negligible.

**Economic finality**, as on Ethereum: [[validator|validators]] vote, and once two thirds of the total [[stake]] has confirmed a checkpoint it is finalized. Reverting it would require at least one third of the stake to break the rules provably and be destroyed. This normally takes about a quarter of an hour.

Some chains use BFT-style [[consensus]] in which a block is final as soon as it is produced, typically within seconds.`,
    },
    tr: {
      short: 'Bir [[block]]\'un ve içindeki her [[transaction]]\'ın artık geri alınmayacağına dair güvence.',
      long: `İki türü vardır.

**Olasılıksal [[finality]]**, Bitcoin'deki gibi: bir [[block]] hiçbir zaman mutlak olarak kesin değildir ama üstüne gelen her yeni [[block]] bir [[reorg]] olasılığını üstel olarak düşürür. Yeterince [[confirmation]] sonrasında kalan risk ihmal edilebilir.

**Ekonomik [[finality]]**, Ethereum'daki gibi: [[validator]]'lar oy verir ve toplam [[stake]]'in üçte ikisi bir "checkpoint"'i onayladığında o "finalized" olur. Onu geri almak, [[stake]]'in en az üçte birinin kuralları kanıtlanabilir biçimde çiğnemesini ve yok edilmesini gerektirir. Bu normalde yaklaşık on beş dakika sürer.

Bazı zincirler, bir [[block]]'un üretildiği anda, genellikle saniyeler içinde kesinleştiği BFT türü bir [[consensus]] kullanır.`,
    },
  },
  {
    id: 'decentralization',
    name: 'decentralization',
    category: 'basics',
    related: ['node', 'p2p', 'consensus'],
    lesson: 'network',
    en: {
      short: 'Spreading control over many independent parties so that no single one can change the rules or stop the system.',
      long: `A decentralized network has no owner, no head office and no master copy of the data. Thousands of independent [[node|nodes]] hold the [[ledger]] and enforce the same rules.

The benefit is resilience: there is no single point that can fail, be bribed, be hacked or be ordered to censor. The cost is efficiency, because everything is stored and checked many times over.

It is a matter of degree, and it has several dimensions: how many nodes verify, how concentrated block production is, how many independent software clients exist, and who can change the code.`,
    },
    tr: {
      short: 'Kontrolün birçok bağımsız tarafa dağıtılması; böylece tek bir taraf kuralları değiştiremez ya da sistemi durduramaz.',
      long: `Merkezi olmayan bir ağın sahibi, genel merkezi ya da verinin "asıl" kopyası yoktur. Binlerce bağımsız [[node]] [[ledger]]'ı tutar ve aynı kuralları uygular.

Faydası dayanıklılıktır: çökebilecek, rüşvet verilebilecek, ele geçirilebilecek ya da sansüre zorlanabilecek tek bir nokta yoktur. Bedeli verimliliktir, çünkü her şey defalarca saklanır ve kontrol edilir.

[[decentralization]] bir derece meselesidir ve birkaç boyutu vardır: kaç [[node]]'un doğrulama yaptığı, [[block]] üretiminin ne kadar yoğunlaştığı, kaç bağımsız istemci yazılımı bulunduğu ve kodu kimin değiştirebildiği.`,
    },
  },
  {
    id: 'consensus',
    name: 'consensus',
    category: 'consensus',
    related: ['fork-choice', 'finality', 'node', 'fork'],
    lesson: 'network',
    en: {
      short: 'How nodes that do not trust each other agree on one history of the ledger.',
      long: `Validation tells a [[node]] whether a [[block]] is allowed. Consensus settles which of the allowed blocks comes next, so that every honest node ends up with the same chain.

A consensus mechanism has two parts. A rule for who may propose a block, which must be costly to abuse: [[proof-of-work]] spends energy, [[proof-of-stake]] puts deposited funds at risk. And a [[fork-choice]] rule that picks between competing branches.

It aims at two properties: safety, meaning honest nodes never settle on conflicting histories, and liveness, meaning new transactions keep getting included.`,
    },
    tr: {
      short: 'Birbirine güvenmeyen [[node]]\'ların [[ledger]]\'ın tek bir geçmişi üzerinde anlaşma yöntemi.',
      long: `Doğrulama, bir [[node]]'a bir [[block]]'un kurallara uyup uymadığını söyler. [[consensus]] ise kurallara uyan [[block]]'lardan hangisinin sıradaki olacağını belirler; böylece dürüst her [[node]] aynı zincire ulaşır.

Bir [[consensus]] mekanizmasının iki parçası vardır. Birincisi kimin [[block]] önerebileceğini belirleyen ve kötüye kullanması pahalı olması gereken kuraldır: [[proof-of-work]] enerji harcatır, [[proof-of-stake]] yatırılan teminatı riske sokar. İkincisi, yarışan dallar arasında seçim yapan [[fork-choice]] kuralıdır.

İki özelliği hedefler: "safety", yani dürüst [[node]]'ların çelişen geçmişlerde karar kılmaması; ve "liveness", yani yeni [[transaction]]'ların [[block]]'lara girmeye devam etmesi.`,
    },
  },
  {
    id: 'fork-choice',
    name: 'fork choice',
    category: 'consensus',
    related: ['fork', 'reorg', 'consensus', 'finality'],
    lesson: 'network',
    en: {
      short: 'The rule a node uses to decide which branch is the real chain when several valid ones exist.',
      long: `When a [[fork]] occurs, every candidate branch is valid, so a [[node]] needs a tie-breaker that all honest nodes apply in the same way.

Bitcoin's rule: follow the branch with the most accumulated [[proof-of-work]]. This is often called the "longest chain" rule, although what counts is total work and not the number of blocks.

Ethereum's rule, [[lmd-ghost]]: starting from the last justified checkpoint, at each split take the branch backed by the most [[stake]], counting only the most recent vote of each [[validator]]. It never crosses a finalized block.

When the rule points to a different branch than before, the node performs a [[reorg]].`,
    },
    tr: {
      short: 'Birden fazla geçerli dal olduğunda bir [[node]]\'un hangisinin asıl zincir olduğuna karar vermek için kullandığı kural.',
      long: `Bir [[fork]] oluştuğunda aday dalların hepsi geçerlidir; bu yüzden bir [[node]]'un, dürüst bütün [[node]]'ların aynı biçimde uyguladığı bir seçim kuralına ihtiyacı vardır.

Bitcoin'in kuralı: en çok birikmiş [[proof-of-work]] taşıyan dalı izle. Buna sık sık "longest chain" kuralı denir ama önemli olan [[block]] sayısı değil, toplam iştir.

Ethereum'un kuralı [[lmd-ghost]]: son "justified checkpoint"'ten başla, her ayrımda en çok [[stake]]'in desteklediği dalı seç; her [[validator]]'ın yalnızca en son oyunu say. Kural, "finalized" bir [[block]]'un gerisine asla geçmez.

Kural öncekinden farklı bir dalı gösterdiğinde [[node]] bir [[reorg]] yapar.`,
    },
  },
];

export default terms;
