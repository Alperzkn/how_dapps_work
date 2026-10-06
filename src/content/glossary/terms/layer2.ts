import type { GlossaryTerm } from '../../../types';

// Turkish: chain and product names (Ethereum, Arbitrum, Starknet...) are proper
// nouns and are written plainly. Time-dependent figures are approximate, as of 2026.

const terms: GlossaryTerm[] = [
  {
    id: 'layer-2',
    name: 'layer 2',
    category: 'chains',
    related: ['layer-1', 'rollup', 'sequencer', 'bridge'],
    lesson: 'layer2',
    en: {
      short: 'A system that processes transactions outside a base chain but relies on that chain for security. Often written L2.',
      long: `A layer 2 (L2) runs transactions somewhere cheaper and faster than its [[layer-1]], and uses the layer 1 to make the result trustworthy: as the place where its data is published, where disputes are settled, and where users' deposits are held.

The most common kind on [[ethereum]] is the [[rollup]]. Not everything called an L2 offers the same guarantees: what matters is where the data is published, how the state is proven correct, and who can change the rules.

Users reach an L2 through a [[bridge]] and pay fees that are usually a small fraction of the layer 1's.`,
    },
    tr: {
      short: '[[transaction]]\'ları taban zincirin dışında işleyen ama güvenliği için o zincire dayanan sistem. Kısaca L2.',
      long: `[[layer-2]] (L2), [[transaction]]'ları [[layer-1]]'den daha ucuz ve daha hızlı bir yerde çalıştırır ve sonucu güvenilir kılmak için [[layer-1]]'i kullanır: verisinin yayımlandığı, anlaşmazlıkların çözüldüğü ve kullanıcıların yatırdığı paranın tutulduğu yer olarak.

Ethereum'da en yaygın türü [[rollup]]'tır. L2 denen her şey aynı güvenceleri sunmaz: önemli olan verinin nerede yayımlandığı, durumun doğruluğunun nasıl kanıtlandığı ve kuralları kimin değiştirebildiğidir.

Kullanıcılar bir L2'ye [[bridge]] üzerinden ulaşır ve genellikle [[layer-1]]'dekinin küçük bir kesri kadar ücret öder.`,
    },
  },
  {
    id: 'rollup',
    name: 'rollup',
    category: 'chains',
    related: ['layer-2', 'optimistic-rollup', 'zk-rollup', 'data-availability', 'sequencer'],
    lesson: 'layer2',
    en: {
      short: 'A layer 2 that executes transactions off the base chain and posts their data and a commitment to the result back to it.',
      long: `A rollup "rolls up" many transactions into a batch. It executes them on its own chain, then writes the compressed transaction data and a state root (a short commitment to the resulting state) to its [[layer-1]].

Because the data is on the layer 1, anyone can recompute the rollup's state without trusting its operator. Because the commitment is there too, a contract on the layer 1 can decide which state is valid and release withdrawals against it.

The two families differ in how that state is shown to be correct: an [[optimistic-rollup]] accepts it unless someone proves fraud within a challenge window; a [[zk-rollup]] requires a [[validity-proof]] up front. The cost of posting to the layer 1 is shared by everyone in a batch, which is why fees are low.`,
    },
    tr: {
      short: '[[transaction]]\'ları taban zincirin dışında çalıştırıp verilerini ve sonuca dair bir "commitment"\'ı o zincire yazan [[layer-2]].',
      long: `[[rollup]], çok sayıda [[transaction]]'ı bir "batch" hâlinde toplar. Onları kendi zincirinde çalıştırır, sonra sıkıştırılmış [[transaction]] verisini ve bir "state root"'u (ortaya çıkan duruma dair kısa bir "commitment") [[layer-1]]'e yazar.

Veri [[layer-1]]'de olduğu için herkes operatöre güvenmeden [[rollup]]'ın durumunu yeniden hesaplayabilir. "Commitment" da orada olduğu için [[layer-1]]'deki bir contract hangi durumun geçerli olduğuna karar verebilir ve çekimleri ona göre serbest bırakabilir.

İki aile, bu durumun doğruluğunun nasıl gösterildiğinde ayrışır: [[optimistic-rollup]], bir itiraz süresi içinde biri hileyi kanıtlamadıkça durumu kabul eder; [[zk-rollup]] ise baştan bir [[validity-proof]] ister. [[layer-1]]'e yazmanın maliyeti "batch"'teki herkes arasında paylaşılır; ücretlerin düşük olmasının nedeni budur.`,
    },
  },
  {
    id: 'optimistic-rollup',
    name: 'optimistic rollup',
    category: 'chains',
    related: ['rollup', 'fraud-proof', 'zk-rollup', 'bridge'],
    lesson: 'layer2',
    en: {
      short: 'A rollup whose state roots are assumed correct unless someone proves otherwise during a challenge window.',
      long: `In an optimistic rollup a proposer posts a state root to the [[layer-1]] and stakes a bond. Nobody checks it on the spot. Instead, a challenge window opens, about 7 days on the large optimistic rollups as of 2026.

During the window, anyone who re-executes the batch and gets a different result can dispute it with a [[fraud-proof]]. If the dispute succeeds the root is thrown out and the proposer loses the bond.

The security assumption is that at least one honest party is watching and able to challenge. The cost is delay: withdrawals to the layer 1 have to wait until the window has closed. Examples are OP Mainnet, Base and Arbitrum One.`,
    },
    tr: {
      short: '"State root"\'ları, itiraz süresi içinde biri aksini kanıtlamadıkça doğru varsayılan [[rollup]].',
      long: `[[optimistic-rollup]]'ta bir "proposer", [[layer-1]]'e bir "state root" yazar ve teminat yatırır. Kimse onu o anda denetlemez. Bunun yerine bir itiraz süresi açılır; 2026 itibarıyla büyük [[optimistic-rollup]]'larda yaklaşık 7 gün.

Süre boyunca, "batch"'i yeniden çalıştırıp farklı bir sonuç bulan herkes bir [[fraud-proof]] ile itiraz edebilir. İtiraz başarılı olursa "root" çöpe atılır ve "proposer" teminatını kaybeder.

Güvenlik varsayımı, en az bir dürüst tarafın izliyor ve itiraz edebiliyor olmasıdır. Bedeli gecikmedir: [[layer-1]]'e çekimler sürenin dolmasını beklemek zorundadır. Örnekler: OP Mainnet, Base ve Arbitrum One.`,
    },
  },
  {
    id: 'zk-rollup',
    name: 'zk rollup',
    category: 'chains',
    related: ['rollup', 'validity-proof', 'optimistic-rollup', 'bridge'],
    lesson: 'layer2',
    en: {
      short: 'A rollup that proves every batch correct with a cryptographic validity proof checked on the base chain.',
      long: `A zk rollup posts each batch to the [[layer-1]] together with a [[validity-proof]]: a short cryptographic proof that executing the batch on the old state gives the new state. A verifier contract checks the proof, and only then is the new state root accepted.

There is no challenge window, so a batch is final on the layer 1 as soon as its proof is verified, and withdrawals do not wait a week. The trade-off is the prover: generating proofs takes heavy computation and adds a delay of minutes to hours (as of 2026).

"zk" stands for zero knowledge, but most zk rollups use the proofs for their small size, not for privacy: the transaction data is still published. Examples are ZKsync Era, Starknet, Scroll and Linea.`,
    },
    tr: {
      short: 'Her "batch"\'in doğruluğunu, taban zincirde kontrol edilen kriptografik bir [[validity-proof]] ile kanıtlayan [[rollup]].',
      long: `[[zk-rollup]], her "batch"'i [[layer-1]]'e bir [[validity-proof]] ile birlikte yazar: "batch"'i eski durum üzerinde çalıştırmanın yeni durumu verdiğinin kısa bir kriptografik kanıtı. Bir "verifier" contract'ı kanıtı kontrol eder; yeni "state root" ancak ondan sonra kabul edilir.

İtiraz süresi yoktur; bu yüzden bir "batch", kanıtı doğrulanır doğrulanmaz [[layer-1]]'de kesindir ve çekimler bir hafta beklemez. Ödünleşim "prover" tarafındadır: kanıt üretmek ağır hesaplama ister ve dakikalardan saatlere varan bir gecikme ekler (2026 itibarıyla).

"zk", "zero knowledge"'ın kısaltmasıdır, ama çoğu [[zk-rollup]] kanıtları gizlilik için değil, küçük oldukları için kullanır: [[transaction]] verisi yine yayımlanır. Örnekler: ZKsync Era, Starknet, Scroll ve Linea.`,
    },
  },
  {
    id: 'sequencer',
    name: 'sequencer',
    category: 'chains',
    related: ['rollup', 'layer-2', 'mempool', 'data-availability'],
    lesson: 'layer2',
    en: {
      short: 'The party that orders a rollup\'s transactions, produces its blocks and posts the batches to the base chain.',
      long: `A sequencer receives users' transactions, puts them in order, executes them and gives a fast "soft" confirmation. Periodically it posts the batches to the [[layer-1]], which fixes the order for good.

As of 2026, most rollups have a single sequencer run by one organisation. It can go offline, delay or ignore transactions, and choose their order. If the rollup's proofs work, it cannot forge transactions or take funds.

Rollups limit the sequencer's power with forced inclusion: a user can submit a transaction through a contract on the layer 1, and the rollup's rules require it to be included within a fixed delay, whether the sequencer cooperates or not.`,
    },
    tr: {
      short: 'Bir [[rollup]]\'ın [[transaction]]\'larını sıralayan, [[block]]\'larını üreten ve "batch"\'leri taban zincire yazan taraf.',
      long: `[[sequencer]], kullanıcıların [[transaction]]'larını alır, sıraya koyar, çalıştırır ve hızlı bir ön onay ("soft confirmation") verir. Belirli aralıklarla "batch"'leri [[layer-1]]'e yazar; bu, sırayı kalıcı olarak sabitler.

2026 itibarıyla çoğu [[rollup]]'ın tek bir kuruluşun işlettiği tek bir [[sequencer]]'ı var. Çevrimdışı kalabilir, [[transaction]]'ları geciktirebilir ya da görmezden gelebilir ve sıralarını seçebilir. [[rollup]]'ın kanıtları çalışıyorsa sahte [[transaction]] üretemez ve fonlara el koyamaz.

[[rollup]]'lar [[sequencer]]'ın gücünü "forced inclusion" ile sınırlar: kullanıcı bir [[transaction]]'ı [[layer-1]]'deki bir contract üzerinden gönderebilir ve [[rollup]]'ın kuralları, [[sequencer]] iş birliği yapsa da yapmasa da onun belirli bir gecikme içinde dahil edilmesini şart koşar.`,
    },
  },
  {
    id: 'data-availability',
    name: 'data availability',
    category: 'chains',
    related: ['rollup', 'blob', 'calldata', 'full-node'],
    lesson: 'layer2',
    en: {
      short: 'The guarantee that the data needed to check a chain\'s state has actually been published and can be downloaded.',
      long: `A state root says what the result of a batch is, but not what was in the batch. To check the result, or to prove your own balance, you need the transactions themselves. Data availability is the guarantee that they were published.

If an operator could withhold the data, an [[optimistic-rollup]] could not be challenged and users of any [[rollup]] could be unable to exit. Rollups therefore publish their data on the [[layer-1]], as [[calldata]] or, more cheaply, in a [[blob]].

Availability is about publication, not permanent storage: the data must be obtainable for long enough that anyone who wants to verify can do so. Systems that publish their data somewhere other than the layer 1 are not rollups in the strict sense and carry an extra trust assumption.`,
    },
    tr: {
      short: 'Bir zincirin durumunu denetlemek için gereken verinin gerçekten yayımlandığının ve indirilebildiğinin güvencesi.',
      long: `Bir "state root", bir "batch"'in sonucunun ne olduğunu söyler, ama "batch"'te ne olduğunu söylemez. Sonucu denetlemek ya da kendi bakiyeni kanıtlamak için [[transaction]]'ların kendisine ihtiyacın vardır. [[data-availability]], onların yayımlandığının güvencesidir.

Operatör veriyi saklayabilseydi bir [[optimistic-rollup]]'a itiraz edilemez, herhangi bir [[rollup]]'ın kullanıcıları da çıkış yapamayabilirdi. Bu yüzden [[rollup]]'lar verilerini [[layer-1]]'de yayımlar: [[calldata]] olarak ya da daha ucuza bir [[blob]] içinde.

Burada söz konusu olan kalıcı saklama değil, yayımlamadır: veri, doğrulamak isteyen herkesin bunu yapabileceği kadar uzun süre elde edilebilir olmalıdır. Verisini [[layer-1]]'den başka bir yerde yayımlayan sistemler dar anlamda [[rollup]] değildir ve ek bir güven varsayımı taşır.`,
    },
  },
  {
    id: 'blob',
    name: 'blob',
    category: 'chains',
    related: ['data-availability', 'calldata', 'rollup', 'gas'],
    lesson: 'layer2',
    en: {
      short: 'A large packet of data attached to an Ethereum block, cheap because nodes only keep it for about 18 days.',
      long: `Blobs were added to [[ethereum]] by EIP-4844 in March 2024 as inexpensive space for [[rollup]] data. One blob holds 4,096 values of 32 bytes each, about 128 kB.

A blob travels alongside a block rather than inside it. Smart contracts cannot read its contents; they only see a hash of a commitment to it. Nodes must keep blobs for about 18 days and may then delete them, while the commitment stays in the chain for good.

Blob space has its own fee market, separate from ordinary [[gas]]: the price rises when blocks carry more blobs than a target number and falls when they carry fewer. As of 2026 the target is 14 blobs per block and the maximum 21.`,
    },
    tr: {
      short: 'Bir Ethereum [[block]]\'una iliştirilen büyük veri paketi; [[node]]\'lar onu yalnızca yaklaşık 18 gün sakladığı için ucuzdur.',
      long: `[[blob]]'lar, [[rollup]] verisi için ucuz bir alan olarak Mart 2024'te EIP-4844 ile Ethereum'a eklendi. Bir [[blob]], her biri 32 bayt olan 4.096 değer tutar; yaklaşık 128 kB.

[[blob]], [[block]]'un içinde değil, yanında taşınır. [[smart-contract]]'lar içeriğini okuyamaz; yalnızca ona ait bir "commitment"'ın [[hash]]'ini görür. [[node]]'lar [[blob]]'ları yaklaşık 18 gün saklamak zorundadır, sonra silebilir; "commitment" ise zincirde kalıcıdır.

[[blob]] alanının, sıradan [[gas]]'tan ayrı, kendine ait bir ücret piyasası vardır: [[block]]'lar hedef sayıdan fazla [[blob]] taşıdığında fiyat yükselir, az taşıdığında düşer. 2026 itibarıyla hedef [[block]] başına 14, üst sınır 21 [[blob]]'dur.`,
    },
  },
  {
    id: 'bridge',
    name: 'bridge',
    category: 'chains',
    related: ['layer-2', 'rollup', 'smart-contract', 'ibc'],
    lesson: 'layer2',
    en: {
      short: 'A mechanism for moving assets between chains, usually by locking them on one and issuing them on the other.',
      long: `A bridge lets an asset that lives on one chain be used on another. The usual pattern: the asset is locked in a [[smart-contract]] on the source chain and an equal amount is created on the destination; going back, that amount is destroyed and the original is released.

A [[rollup]]'s canonical bridge is a contract on its [[layer-1]] that releases funds only against a state root the layer 1 has accepted. Deposits take minutes. Withdrawals take as long as it takes for the state to become final there: hours on a [[zk-rollup]], about a week on an [[optimistic-rollup]].

Other bridges, between unrelated chains, rely on their own validators, light clients or liquidity providers. A bridge is only as safe as whatever decides that the lock on the other side really happened.`,
    },
    tr: {
      short: 'Varlıkları zincirler arasında taşımaya yarayan düzenek; genellikle birinde kilitleyip diğerinde çıkararak çalışır.',
      long: `[[bridge]], bir zincirde yaşayan bir varlığın başka bir zincirde kullanılmasını sağlar. Olağan kalıp şudur: varlık kaynak zincirdeki bir [[smart-contract]]'ta kilitlenir ve hedefte aynı miktar yaratılır; geri dönerken o miktar yok edilir ve asıl varlık serbest bırakılır.

Bir [[rollup]]'ın asıl [[bridge]]'i, [[layer-1]]'deki bir contract'tır ve fonları yalnızca [[layer-1]]'in kabul ettiği bir "state root"'a karşılık serbest bırakır. Yatırma dakikalar sürer. Çekim ise durumun orada kesinleşmesi kadar sürer: [[zk-rollup]]'ta saatler, [[optimistic-rollup]]'ta yaklaşık bir hafta.

Birbiriyle ilgisiz zincirler arasındaki diğer [[bridge]]'ler kendi [[validator]]'larına, "light client"'larına ya da likidite sağlayıcılarına dayanır. Bir [[bridge]], karşı taraftaki kilitlemenin gerçekten yapıldığına karar veren şey ne kadar güvenliyse o kadar güvenlidir.`,
    },
  },
  {
    id: 'fraud-proof',
    name: 'fraud proof',
    category: 'chains',
    related: ['optimistic-rollup', 'rollup', 'validity-proof', 'merkle-root'],
    lesson: 'layer2',
    en: {
      short: 'Evidence, checked by the base chain, that a state root posted by an optimistic rollup is wrong. Also called a fault proof.',
      long: `A fraud proof is how an [[optimistic-rollup]] catches a wrong state root. A challenger who disagrees with the proposer opens a dispute on the [[layer-1]].

Re-running the whole batch on the layer 1 would be far too expensive, so the two sides play a bisection game: they repeatedly halve the disputed computation and state where they still disagree, until one single step is left. The layer 1 executes that step itself and sees who was wrong. The loser forfeits a bond.

The scheme is secure as long as one honest party is willing and able to challenge within the window. Some projects prefer the name "fault proof", since a wrong root may be a mistake rather than fraud.`,
    },
    tr: {
      short: 'Bir [[optimistic-rollup]]\'ın yazdığı "state root"\'un yanlış olduğuna dair, taban zincirin denetlediği kanıt. "Fault proof" da denir.',
      long: `[[fraud-proof]], bir [[optimistic-rollup]]'ın yanlış bir "state root"'u yakalama yoludur. "Proposer" ile aynı fikirde olmayan bir "challenger", [[layer-1]]'de bir anlaşmazlık açar.

Bütün "batch"'i [[layer-1]]'de yeniden çalıştırmak fazlasıyla pahalı olurdu; bu yüzden iki taraf bir ikiye bölme ("bisection") oyunu oynar: tartışmalı hesaplamayı tekrar tekrar yarıya indirir ve hâlâ nerede ayrıştıklarını söylerler; ta ki tek bir adım kalana kadar. [[layer-1]] o adımı kendisi çalıştırır ve kimin yanıldığını görür. Kaybeden teminatını yitirir.

Süre içinde itiraz etmeye istekli ve bunu yapabilecek tek bir dürüst taraf olduğu sürece düzenek güvenlidir. Bazı projeler "fault proof" adını tercih eder, çünkü yanlış bir "root" hile değil, hata da olabilir.`,
    },
  },
  {
    id: 'validity-proof',
    name: 'validity proof',
    category: 'chains',
    related: ['zk-rollup', 'rollup', 'fraud-proof', 'hash'],
    lesson: 'layer2',
    en: {
      short: 'A short cryptographic proof that a computation was done correctly, checkable far faster than redoing it.',
      long: `A validity proof convinces a verifier that a statement such as "running these transactions on that state gives this state" is true, without the verifier running them. A [[zk-rollup]] attaches one to every batch.

Two properties matter. It is succinct: small and quick to check however large the computation. And it is sound: producing a proof of a false statement is computationally infeasible.

The two main families are SNARKs, with very small proofs that are cheap to verify on [[ethereum]] but often need a trusted setup, and STARKs, which need no trusted setup and rest only on hash functions but are larger. Many systems combine them. Generating a proof is far more work than the computation it proves.`,
    },
    tr: {
      short: 'Bir hesaplamanın doğru yapıldığına dair, onu baştan yapmaktan çok daha hızlı denetlenebilen kısa kriptografik kanıt.',
      long: `[[validity-proof]], bir doğrulayıcıyı "bu [[transaction]]'ları şu durum üzerinde çalıştırmak bu durumu verir" gibi bir önermenin doğru olduğuna, onları çalıştırmasına gerek kalmadan ikna eder. [[zk-rollup]] her "batch"'e bir tane ekler.

İki özellik önemlidir. "Succinct"'tir: hesaplama ne kadar büyük olursa olsun küçüktür ve çabuk denetlenir. Ve "sound"'dur: yanlış bir önermenin kanıtını üretmek hesaplama açısından olanaksızdır.

İki ana aile vardır: SNARK'lar çok küçük kanıtlar üretir ve Ethereum'da doğrulaması ucuzdur, ama çoğu zaman bir "trusted setup" ister; STARK'lar "trusted setup" istemez ve yalnızca [[hash]] fonksiyonlarına dayanır, ama daha büyüktür. Birçok sistem ikisini birleştirir. Bir kanıt üretmek, kanıtladığı hesaplamadan çok daha fazla iş gerektirir.`,
    },
  },
];

export default terms;
