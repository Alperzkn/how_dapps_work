import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'transaction',
    name: 'transaction',
    category: 'basics',
    related: ['digital-signature', 'mempool', 'account-nonce', 'gas-fee', 'block'],
    lesson: 'transactions',
    en: {
      short: 'A signed instruction that changes the ledger, such as "send 1 ETH from Alice to Bob".',
      long: `A transaction is the only way anything on a [[blockchain]] changes. It names what should happen, carries a [[digital-signature]] proving that the owner of the account approved it, and offers a fee.

After signing, it is sent to a [[node]], spreads through the network, waits in the [[mempool]] and takes effect once it is included in a [[block]].

Besides payments, a transaction can call a [[smart-contract]] or create one. Until it is in a block, nothing has happened.`,
    },
    tr: {
      short: '[[ledger]] üzerinde değişiklik yapan imzalı talimat; örneğin "Alice\'ten Bob\'a 1 ETH gönder".',
      long: `[[blockchain]] üzerinde bir şeyin değişmesinin tek yolu [[transaction]]'dır. Ne yapılacağını söyler, hesap sahibinin bunu onayladığını kanıtlayan bir [[digital-signature]] taşır ve bir ücret teklif eder.

İmzalandıktan sonra bir [[node]]'a gönderilir, ağda yayılır, [[mempool]]'da bekler ve bir [[block]]'a girdiği anda geçerlik kazanır.

Bir [[transaction]] ödeme yapmanın yanında bir [[smart-contract]] çağırabilir ya da yenisini oluşturabilir. Bir [[block]]'a girene kadar hiçbir şey olmuş sayılmaz.`,
    },
  },
  {
    id: 'wallet',
    name: 'wallet',
    category: 'basics',
    related: ['private-key', 'seed-phrase', 'address', 'digital-signature'],
    lesson: 'transactions',
    en: {
      short: 'Software or a device that keeps your private keys and signs transactions with them.',
      long: `A wallet does not contain coins. Balances are recorded on the chain under an [[address]]; the wallet holds the [[private-key]] that lets you spend from that address.

Its jobs are to generate and store keys (usually from one [[seed-phrase]]), show balances by asking a [[node]], build a [[transaction]] and sign it.

A hardware wallet keeps the keys on a separate device that never reveals them. A custodial wallet, such as an exchange account, keeps the keys for you, which means you are trusting the custodian.`,
    },
    tr: {
      short: '[[private-key]]\'lerini saklayan ve onlarla [[transaction]] imzalayan yazılım ya da cihaz.',
      long: `Bir [[wallet]] içinde coin durmaz. Bakiyeler zincirde bir [[address]] altında kayıtlıdır; [[wallet]] ise o [[address]]'ten harcama yapmanı sağlayan [[private-key]]'i tutar.

İşi şudur: anahtarları üretip saklamak (çoğunlukla tek bir [[seed-phrase]] üzerinden), bir [[node]]'a sorarak bakiyeyi göstermek, [[transaction]] hazırlamak ve onu imzalamak.

"Hardware wallet", anahtarları onları asla dışarı vermeyen ayrı bir cihazda tutar. Borsa hesabı gibi "custodial" bir [[wallet]] ise anahtarları senin yerine saklar; bu durumda saklayana güvenmiş olursun.`,
    },
  },
  {
    id: 'private-key',
    name: 'private key',
    category: 'crypto',
    related: ['public-key', 'digital-signature', 'seed-phrase', 'wallet'],
    lesson: 'transactions',
    en: {
      short: 'A secret 256-bit number. Whoever knows it can spend everything at the matching address.',
      long: `The private key is what you actually own on a [[blockchain]]. It is used to produce a [[digital-signature]], and the network accepts any [[transaction]] that carries a valid one.

On Bitcoin and Ethereum it is a random integer between 1 and just under 2^256. The space is so large that two people will never pick the same one by chance.

It cannot be reset or recovered. If it is lost, the funds are unreachable; if it is copied, the thief has the same power as the owner.`,
    },
    tr: {
      short: '256 bitlik gizli bir sayı. Onu bilen, karşılık gelen [[address]]\'teki her şeyi harcayabilir.',
      long: `Bir [[blockchain]] üzerinde gerçekten sahip olduğun şey [[private-key]]'dir. [[digital-signature]] üretmek için kullanılır ve ağ, geçerli bir imza taşıyan her [[transaction]]'ı kabul eder.

Bitcoin ve Ethereum'da 1 ile 2^256'nın hemen altı arasında rastgele bir tam sayıdır. Bu aralık o kadar büyüktür ki iki kişinin tesadüfen aynı sayıyı seçmesi beklenmez.

Sıfırlanamaz ve geri getirilemez. Kaybolursa paraya ulaşılamaz; kopyalanırsa hırsız, sahibiyle aynı yetkiye sahip olur.`,
    },
  },
  {
    id: 'public-key',
    name: 'public key',
    category: 'crypto',
    related: ['private-key', 'address', 'digital-signature', 'ecdsa'],
    lesson: 'transactions',
    en: {
      short: 'The public half of a key pair: computed from the private key and used to check signatures.',
      long: `A public key is derived from a [[private-key]] by a one-way calculation: easy in one direction, infeasible in the other. It can be shared freely.

Anyone holding it can verify that a [[digital-signature]] was made with the matching private key, without learning that key.

On Bitcoin and Ethereum the public key is a point on the curve secp256k1. An [[address]] is a shorter value derived from it.`,
    },
    tr: {
      short: 'Anahtar çiftinin açık yarısı: [[private-key]]\'den hesaplanır ve imzaları kontrol etmeye yarar.',
      long: `[[public-key]], bir [[private-key]]'den tek yönlü bir hesapla türetilir: bir yöne kolay, ters yöne pratikte imkânsızdır. Serbestçe paylaşılabilir.

Elinde [[public-key]] olan herkes, bir [[digital-signature]]'ın ona karşılık gelen [[private-key]] ile atıldığını, o anahtarı öğrenmeden doğrulayabilir.

Bitcoin ve Ethereum'da [[public-key]], secp256k1 eğrisi üzerindeki bir noktadır. [[address]] ise ondan türetilen daha kısa bir değerdir.`,
    },
  },
  {
    id: 'address',
    name: 'address',
    category: 'basics',
    related: ['public-key', 'wallet', 'transaction'],
    lesson: 'transactions',
    en: {
      short: 'The short identifier you give to others to receive funds, derived from a public key.',
      long: `An address works like an account number. It is safe to publish: it lets people send to you and look up your balance, but not spend.

On Ethereum it is the last 20 bytes of the Keccak-256 hash of the [[public-key]], written as \`0x\` plus 40 hex characters. Bitcoin addresses are hashes of a public key or of a script, in encodings that include a checksum.

Addresses are pseudonymous, not anonymous. Everything an address does is public forever, and a single link to a real identity exposes its whole history.`,
    },
    tr: {
      short: 'Ödeme alabilmek için başkalarına verdiğin, [[public-key]]\'den türetilen kısa kimlik.',
      long: `[[address]], hesap numarası gibi çalışır. Yayınlamak güvenlidir: insanlar sana gönderim yapabilir ve bakiyene bakabilir ama harcayamaz.

Ethereum'da [[public-key]]'in Keccak-256 [[hash]]'inin son 20 baytıdır; \`0x\` ve ardından 40 "hex" karakter olarak yazılır. Bitcoin adresleri bir [[public-key]]'in ya da bir "script"'in [[hash]]'idir ve sağlama toplamı içeren biçimlerde kodlanır.

Bir [[address]] anonim değil, takma adlıdır. Yaptığı her şey sonsuza kadar herkese açıktır; gerçek bir kimlikle kurulan tek bir bağ bütün geçmişini açığa çıkarır.`,
    },
  },
  {
    id: 'digital-signature',
    name: 'digital signature',
    category: 'crypto',
    related: ['private-key', 'public-key', 'ecdsa', 'transaction'],
    lesson: 'transactions',
    en: {
      short: 'A value made with a private key that proves who approved a message and that it was not altered.',
      long: `A digital signature is computed from two inputs: the message and the signer's [[private-key]]. Anyone can check it with the [[public-key]].

It gives two guarantees. **Authenticity**: only the key holder could have produced it. **Integrity**: it matches this exact message, so changing a single bit makes it invalid, and it cannot be moved to a different message.

Every [[transaction]] carries one. That is how a [[node]] knows a payment was authorised without anyone ever sending a password or the key itself.`,
    },
    tr: {
      short: '[[private-key]] ile üretilen; bir mesajı kimin onayladığını ve mesajın değişmediğini kanıtlayan değer.',
      long: `[[digital-signature]] iki girdiden hesaplanır: mesaj ve imzalayanın [[private-key]]'i. Onu [[public-key]] ile herkes kontrol edebilir.

İki güvence verir. **Kimlik**: onu yalnızca anahtarın sahibi üretebilir. **Bütünlük**: tam olarak bu mesaja uyar; tek bir bit değişirse geçersiz olur ve başka bir mesaja taşınamaz.

Her [[transaction]] bir imza taşır. Bir [[node]], kimse şifre ya da anahtarın kendisini göndermeden bir ödemenin yetkili kişiden geldiğini bu sayede bilir.`,
    },
  },
  {
    id: 'ecdsa',
    name: 'ECDSA',
    category: 'crypto',
    related: ['digital-signature', 'private-key', 'public-key'],
    lesson: 'transactions',
    en: {
      short: 'Elliptic Curve Digital Signature Algorithm: the signature scheme used by Bitcoin and Ethereum.',
      long: `ECDSA produces a [[digital-signature]] consisting of two numbers, \`r\` and \`s\`, from a message hash and a [[private-key]]. Bitcoin and Ethereum run it over the curve secp256k1.

Each signature needs a fresh secret number \`k\`. Reusing a \`k\`, or choosing it predictably, reveals the private key, which is why modern wallets derive it deterministically from the key and the message (RFC 6979).

Ethereum adds a recovery bit so that the [[public-key]], and from it the sender's [[address]], can be computed from the signature alone. Bitcoin's Taproot upgrade added Schnorr signatures as an alternative on the same curve.`,
    },
    tr: {
      short: '"Elliptic Curve Digital Signature Algorithm": Bitcoin ve Ethereum\'un kullandığı imza şeması.',
      long: `[[ecdsa]], bir mesaj [[hash]]'inden ve bir [[private-key]]'den \`r\` ve \`s\` adlı iki sayıdan oluşan bir [[digital-signature]] üretir. Bitcoin ve Ethereum bunu secp256k1 eğrisi üzerinde çalıştırır.

Her imza için yeni ve gizli bir \`k\` sayısı gerekir. Aynı \`k\`'yı tekrar kullanmak ya da tahmin edilebilir seçmek [[private-key]]'i açığa çıkarır; bu yüzden güncel [[wallet]]'lar onu anahtardan ve mesajdan deterministik olarak türetir (RFC 6979).

Ethereum imzaya bir kurtarma biti ekler; böylece [[public-key]], dolayısıyla gönderenin [[address]]'i yalnızca imzadan hesaplanabilir. Bitcoin'in Taproot güncellemesi aynı eğri üzerinde Schnorr imzalarını bir seçenek olarak eklemiştir.`,
    },
  },
  {
    id: 'mempool',
    name: 'mempool',
    category: 'basics',
    related: ['transaction', 'gas-fee', 'node', 'account-nonce'],
    lesson: 'transactions',
    en: {
      short: 'The waiting area where a node keeps valid transactions that are not in a block yet.',
      long: `Mempool is short for "memory pool". Every [[node]] has its own; there is no single global one, although [[gossip]] keeps them broadly similar.

Block producers pick from their mempool, normally the highest-paying [[transaction|transactions]] first. When demand exceeds the space in a [[block]], the lowest-paying ones wait, and may eventually be dropped.

The contents are public. Anyone can watch pending transactions before they execute, which is what makes front-running possible.`,
    },
    tr: {
      short: 'Bir [[node]]\'un, geçerli olan ama henüz bir [[block]]\'a girmemiş [[transaction]]\'ları tuttuğu bekleme alanı.',
      long: `[[mempool]], "memory pool" sözünün kısaltmasıdır. Her [[node]]'un kendi havuzu vardır; tek bir küresel havuz yoktur ama [[gossip]] sayesinde hepsi birbirine yakın kalır.

[[block]] üretenler kendi [[mempool]]'larından, genellikle en çok ödeyen [[transaction]]'lardan başlayarak seçim yapar. Talep bir [[block]]'taki yeri aştığında az ödeyenler bekler; sonunda havuzdan atılabilirler de.

İçeriği herkese açıktır. Bekleyen [[transaction]]'lar çalıştırılmadan önce herkes tarafından izlenebilir; "front-running" bu yüzden mümkündür.`,
    },
  },
  {
    id: 'account-nonce',
    name: 'account nonce',
    category: 'basics',
    related: ['transaction', 'mempool', 'digital-signature'],
    lesson: 'transactions',
    en: {
      short: 'A per-account counter: the number of transactions the account has sent. Each new one must use the next value.',
      long: `On Ethereum every account has a nonce that starts at 0 and goes up by one with each [[transaction]] it sends. A transaction is only valid if its nonce equals the account's current one.

This does two jobs. It prevents replay: a signed transaction cannot be included twice, because its nonce is used up. And it fixes the order of an account's transactions.

It also allows replacement: a pending transaction can be swapped for another with the same nonce and a higher fee. A gap in the sequence blocks everything after it.

This is unrelated to the nonce that miners search for in [[proof-of-work]].`,
    },
    tr: {
      short: 'Hesap başına tutulan sayaç: hesabın gönderdiği [[transaction]] sayısı. Her yenisi sıradaki değeri kullanmak zorundadır.',
      long: `Ethereum'da her hesabın 0'dan başlayan ve gönderdiği her [[transaction]] ile bir artan bir [[account-nonce]] değeri vardır. Bir [[transaction]] ancak taşıdığı sayı hesabın o anki değerine eşitse geçerlidir.

Bunun iki işlevi vardır. Tekrarı önler: imzalı bir [[transaction]] ikinci kez işlenemez, çünkü sayısı kullanılmıştır. Ayrıca bir hesabın [[transaction]]'larının sırasını kesinleştirir.

Değiştirmeye de olanak tanır: bekleyen bir [[transaction]], aynı sayıyı ve daha yüksek ücreti taşıyan bir başkasıyla değiştirilebilir. Sıradaki bir boşluk ise arkasından gelen her şeyi bekletir.

Bunun, [[proof-of-work]] sırasında aranan "nonce" ile bir ilgisi yoktur.`,
    },
  },
  {
    id: 'confirmation',
    name: 'confirmation',
    category: 'basics',
    related: ['block', 'finality', 'reorg', 'transaction'],
    lesson: 'transactions',
    en: {
      short: 'One block that contains a transaction or was built after it. More confirmations mean it is harder to undo.',
      long: `A [[transaction]] has one confirmation when it is included in a [[block]], and gains another with every block added on top.

Each confirmation makes a [[reorg]] that removes the transaction less likely, because an attacker would have to replace all of those blocks. For Bitcoin, six confirmations (about an hour) is the traditional threshold for large payments.

Chains with explicit [[finality]], such as Ethereum, also offer a stronger statement than a count: once a block is finalized, it cannot be reverted without destroying a large amount of staked funds.`,
    },
    tr: {
      short: 'Bir [[transaction]]\'ı içeren ya da ondan sonra kurulan her [[block]]. Sayı arttıkça geri almak zorlaşır.',
      long: `Bir [[transaction]], bir [[block]]'a girdiğinde bir [[confirmation]] almış olur; üstüne eklenen her [[block]] ile bir tane daha kazanır.

Her [[confirmation]], o [[transaction]]'ı zincirden çıkaracak bir [[reorg]] olasılığını azaltır, çünkü saldırganın o [[block]]'ların hepsini değiştirmesi gerekir. Bitcoin'de büyük ödemeler için geleneksel eşik altı [[confirmation]], yani yaklaşık bir saattir.

Ethereum gibi açık [[finality]] sunan zincirler, sayıdan daha güçlü bir güvence de verir: "finalized" olan bir [[block]], büyük miktarda teminat yok edilmeden geri alınamaz.`,
    },
  },
  {
    id: 'gas',
    name: 'gas',
    category: 'chains',
    related: ['gas-fee', 'eip-1559', 'transaction'],
    lesson: 'transactions',
    en: {
      short: 'The unit that measures how much computation and storage an Ethereum transaction uses.',
      long: `Every operation the Ethereum network performs has a fixed cost in gas. A plain transfer costs 21,000 gas; calling a [[smart-contract]] costs more, depending on what it does.

A [[transaction]] states a gas limit: the most it may use. If execution runs out of gas, its changes are undone, yet the fee for the gas consumed is still paid. Unused gas is not charged.

Gas is a quantity, not a price. Separating the two lets the cost of an operation stay fixed while the price per unit of gas follows demand. Each [[block]] has a gas limit too, which caps how much work fits into it.`,
    },
    tr: {
      short: 'Bir Ethereum [[transaction]]\'ının ne kadar hesaplama ve depolama kullandığını ölçen birim.',
      long: `Ethereum ağının yaptığı her işlemin [[gas]] cinsinden sabit bir maliyeti vardır. Düz bir transfer 21.000 [[gas]] tutar; bir [[smart-contract]] çağrısı, yaptığı işe göre daha fazlasını harcar.

Bir [[transaction]] bir "gas limit" belirtir: en fazla ne kadar kullanabileceğini. Çalışma sırasında [[gas]] biterse yaptığı değişiklikler geri alınır ama harcanan kısmın ücreti yine de ödenir. Kullanılmayan kısım için ücret alınmaz.

[[gas]] bir fiyat değil, bir miktardır. İkisinin ayrı tutulması sayesinde bir işlemin maliyeti sabit kalırken birim fiyat talebe göre değişebilir. Her [[block]]'un da bir "gas limit"'i vardır; içine ne kadar iş sığacağını bu belirler.`,
    },
  },
  {
    id: 'gas-fee',
    name: 'gas fee',
    category: 'chains',
    related: ['gas', 'eip-1559', 'mempool', 'transaction'],
    lesson: 'transactions',
    en: {
      short: 'What a transaction pays to be included: the gas it used multiplied by the price per unit of gas.',
      long: `The fee is \`gas used × price per gas\`. The price is quoted in gwei, one billionth of an ETH. A transfer using 21,000 gas at 22 gwei costs 462,000 gwei, or 0.000462 ETH.

Fees exist for two reasons. Space in a [[block]] is scarce, so a price decides who gets in. And computation costs every [[node]] real resources, so without a fee the network could be flooded for free.

The fee depends on how busy the network is, not on how much money is being moved. Sending 1 ETH and sending 1,000 ETH cost the same.`,
    },
    tr: {
      short: 'Bir [[transaction]]\'ın [[block]]\'a girmek için ödediği tutar: harcadığı [[gas]] çarpı birim fiyat.',
      long: `Ücret \`harcanan gas × gas başına fiyat\` kadardır. Fiyat gwei ile söylenir; bir gwei, bir ETH'nin milyarda biridir. 21.000 [[gas]] harcayan bir transfer 22 gwei fiyatla 462.000 gwei, yani 0,000462 ETH tutar.

Ücretin iki nedeni vardır. Bir [[block]]'taki yer kıttır; kimin gireceğine fiyat karar verir. Ayrıca hesaplama her [[node]]'a gerçek kaynağa mal olur; ücret olmasaydı ağ bedavaya doldurulabilirdi.

[[gas-fee]], taşınan paranın miktarına değil ağın yoğunluğuna bağlıdır. 1 ETH göndermek de 1.000 ETH göndermek de aynı tutar.`,
    },
  },
  {
    id: 'eip-1559',
    name: 'EIP-1559',
    category: 'chains',
    related: ['gas-fee', 'gas', 'mempool'],
    lesson: 'transactions',
    en: {
      short: "Ethereum's fee mechanism since 2021: a protocol-set base fee that is burned, plus a tip for the block producer.",
      long: `Before EIP-1559, users bid a single [[gas]] price in a blind auction and often overpaid. Since the London upgrade of August 2021, each [[block]] has a **base fee** computed by the protocol.

The base fee goes up by as much as 12.5% when the previous block used more than its target, which is half the gas limit, and down when it used less. It is burned: removed from circulation rather than paid to anyone.

A [[transaction]] sets two limits: \`maxFeePerGas\`, the most it will pay per gas in total, and \`maxPriorityFeePerGas\`, the tip for the producer. The sender pays the base fee plus the tip and never more than the first limit.`,
    },
    tr: {
      short: 'Ethereum\'un 2021\'den beri kullandığı ücret mekanizması: protokolün belirlediği ve yakılan bir "base fee" ile [[block]] üreticisine giden bir "tip".',
      long: `[[eip-1559]] öncesinde kullanıcılar kapalı bir açık artırmada tek bir [[gas]] fiyatı teklif eder ve sık sık gereğinden fazla öderdi. Ağustos 2021'deki London güncellemesinden beri her [[block]]'un protokol tarafından hesaplanan bir **"base fee"** değeri vardır.

Önceki [[block]] hedefinden, yani "gas limit"'in yarısından fazlasını kullandıysa "base fee" en çok %12,5 artar; azını kullandıysa düşer. Bu tutar yakılır: kimseye ödenmez, dolaşımdan çıkarılır.

Bir [[transaction]] iki sınır belirler: [[gas]] başına toplamda en fazla ödeyeceği \`maxFeePerGas\` ve üreticiye gidecek \`maxPriorityFeePerGas\`. Gönderen "base fee" artı "tip" öder ve hiçbir zaman ilk sınırı aşmaz.`,
    },
  },
  {
    id: 'seed-phrase',
    name: 'seed phrase',
    category: 'crypto',
    related: ['private-key', 'wallet'],
    lesson: 'transactions',
    en: {
      short: 'A list of 12 or 24 words from which a wallet derives all of its private keys.',
      long: `Instead of backing up each [[private-key]], a [[wallet]] generates one random secret and shows it as ordinary words. Every key the wallet will ever use is derived from it, so writing the words down once backs up everything.

The usual standard is BIP-39: the words come from a fixed list of 2048, and the last one includes a checksum. Twelve words encode 128 bits of randomness, twenty-four encode 256.

Anyone who sees the phrase controls all of the accounts. It should be kept offline, and no legitimate service will ever ask for it.`,
    },
    tr: {
      short: 'Bir [[wallet]]\'ın bütün [[private-key]]\'lerini türettiği 12 ya da 24 kelimelik liste.',
      long: `Bir [[wallet]], her [[private-key]]'i ayrı ayrı yedeklemek yerine tek bir rastgele sır üretir ve onu sıradan kelimeler halinde gösterir. Kullanacağı bütün anahtarlar bu sırdan türetilir; kelimeleri bir kez yazmak her şeyi yedeklemek demektir.

Yaygın standart BIP-39'dur: kelimeler 2048 kelimelik sabit bir listeden seçilir ve sonuncusu bir sağlama toplamı içerir. On iki kelime 128 bit, yirmi dört kelime 256 bit rastgelelik taşır.

[[seed-phrase]]'i gören kişi hesapların hepsini kontrol eder. Çevrimdışı saklanmalıdır; güvenilir hiçbir hizmet onu senden istemez.`,
    },
  },
];

export default terms;
