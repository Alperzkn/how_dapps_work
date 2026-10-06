import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'blockchain',
    name: 'blockchain',
    category: 'basics',
    related: ['block', 'ledger', 'hash', 'consensus'],
    lesson: 'blockchain',
    en: {
      short: 'A shared record made of blocks, each linked to the one before it by a hash.',
      long: `A blockchain is a [[ledger]] stored by many computers at once. New entries are grouped into a [[block]], and every block contains the [[hash]] of the previous block, forming a chain.

Because of those links, changing an old entry would change every hash after it, so tampering is obvious. A [[consensus]] mechanism decides which block comes next, so all copies stay identical without a central authority.`,
    },
    tr: {
      short: 'Her biri bir öncekine [[hash]] ile bağlanan [[block]]\'lardan oluşan ortak kayıt.',
      long: `[[blockchain]], aynı anda çok sayıda bilgisayarın sakladığı bir [[ledger]] yapısıdır. Yeni kayıtlar bir [[block]] içinde toplanır ve her [[block]] bir öncekinin [[hash]] değerini içerir; böylece bir zincir oluşur.

Bu bağlar yüzünden eski bir kaydı değiştirmek sonraki bütün [[hash]] değerlerini değiştirir ve müdahale hemen fark edilir. Sıradaki [[block]]'un hangisi olacağına bir [[consensus]] mekanizması karar verir; böylece merkezi bir otorite olmadan tüm kopyalar aynı kalır.`,
    },
  },
  {
    id: 'block',
    name: 'block',
    category: 'basics',
    related: ['block-header', 'transaction', 'genesis-block'],
    lesson: 'blockchain',
    en: {
      short: 'A batch of transactions added to the chain together, like one page of the ledger.',
      long: `A block bundles a set of [[transaction|transactions]] with a [[block-header]] that summarises them and points to the previous block.

Blocks are produced at a steady rhythm: about every 10 minutes on Bitcoin and every 12 seconds on Ethereum. Each block has a limited capacity, which is why busy networks have fees.`,
    },
    tr: {
      short: 'Zincire birlikte eklenen bir [[transaction]] demeti; defterin bir sayfası gibi.',
      long: `Bir [[block]], bir grup [[transaction]] ile onları özetleyen ve önceki [[block]]'u gösteren bir [[block-header]]'ı bir araya getirir.

[[block]]'lar sabit bir ritimle üretilir: Bitcoin'de yaklaşık 10 dakikada, Ethereum'da 12 saniyede bir. Her [[block]]'un kapasitesi sınırlıdır; yoğun ağlarda ücret oluşmasının nedeni budur.`,
    },
  },
  {
    id: 'hash',
    name: 'hash',
    category: 'crypto',
    related: ['sha-256', 'merkle-root', 'block-header'],
    lesson: 'blockchain',
    en: {
      short: 'A fixed-length fingerprint of some data. Any change to the data gives a completely different hash.',
      long: `A hash function takes input of any size and returns a short, fixed-size output. Good cryptographic hash functions have three properties:

- **Deterministic**: the same input always gives the same output.
- **One-way**: you cannot recover the input from the output.
- **Collision resistant**: you cannot find two inputs with the same output.

Blockchains use hashes to link blocks, to identify transactions, to build a [[merkle-root]], and as the puzzle in [[proof-of-work]].`,
    },
    tr: {
      short: 'Bir verinin sabit uzunluktaki parmak izi. Veride en küçük değişiklik bambaşka bir [[hash]] üretir.',
      long: `Bir [[hash]] fonksiyonu her boyutta girdi alır ve kısa, sabit boyutlu bir çıktı verir. İyi bir kriptografik [[hash]] fonksiyonunun üç özelliği vardır:

- **Deterministik**: aynı girdi her zaman aynı çıktıyı verir.
- **Tek yönlü**: çıktıdan girdiyi geri elde edemezsin.
- **"Collision" dirençli**: aynı çıktıyı veren iki farklı girdi bulamazsın.

[[blockchain]]'ler [[hash]] değerlerini [[block]]'ları bağlamak, [[transaction]]'ları tanımlamak, [[merkle-root]] kurmak ve [[proof-of-work]] bulmacası olarak kullanır.`,
    },
  },
  {
    id: 'sha-256',
    name: 'SHA-256',
    category: 'crypto',
    related: ['hash', 'proof-of-work'],
    lesson: 'blockchain',
    en: {
      short: 'The hash function Bitcoin uses. It always outputs 256 bits, written as 64 hex characters.',
      long: `SHA-256 belongs to the SHA-2 family standardised by NIST. It processes data in 512-bit chunks through 64 rounds of bit mixing and returns a 256-bit digest.

Bitcoin applies it twice ("double SHA-256") to block headers and transactions. Ethereum uses a different function, Keccak-256, for the same jobs.`,
    },
    tr: {
      short: 'Bitcoin\'in kullandığı [[hash]] fonksiyonu. Her zaman 256 bit üretir; 64 "hex" karakter olarak yazılır.',
      long: `[[sha-256]], NIST tarafından standartlaştırılan SHA-2 ailesindendir. Veriyi 512 bitlik parçalar halinde 64 tur bit karıştırma işleminden geçirir ve 256 bitlik bir özet döndürür.

Bitcoin bunu [[block-header]] ve [[transaction]]'lara iki kez uygular ("double SHA-256"). Ethereum aynı işler için farklı bir fonksiyon, Keccak-256 kullanır.`,
    },
  },
  {
    id: 'ledger',
    name: 'ledger',
    category: 'basics',
    related: ['blockchain', 'transaction'],
    lesson: 'blockchain',
    en: {
      short: 'A record of who owns what and every transfer that has happened.',
      long: `A ledger is an accounting book. A bank keeps a private ledger of its customers' balances. A [[blockchain]] is a public ledger: anyone can hold a copy and check every entry.

The term "distributed ledger" stresses that the copies live on many independent computers rather than in one company's database.`,
    },
    tr: {
      short: 'Kimin neye sahip olduğunun ve yapılmış her transferin kaydı.',
      long: `[[ledger]] bir muhasebe defteridir. Bir banka, müşterilerinin bakiyelerini özel bir [[ledger]] içinde tutar. [[blockchain]] ise herkese açık bir [[ledger]]'dır: herkes bir kopyasını tutabilir ve her kaydı kontrol edebilir.

"Distributed ledger" ifadesi, kopyaların tek bir şirketin veritabanında değil, birbirinden bağımsız çok sayıda bilgisayarda durduğunu vurgular.`,
    },
  },
  {
    id: 'block-header',
    name: 'block header',
    category: 'basics',
    related: ['block', 'hash', 'merkle-root', 'timestamp'],
    lesson: 'blockchain',
    en: {
      short: 'The small summary at the top of a block: previous hash, time, and a fingerprint of all its transactions.',
      long: `The header is the part of a [[block]] that gets hashed to produce the block's identity. It contains the previous block's [[hash]], a [[timestamp]], a [[merkle-root]] committing to the transactions, and consensus data such as the [[nonce]].

Headers are tiny (80 bytes in Bitcoin), so a device can follow the chain by downloading headers only.`,
    },
    tr: {
      short: 'Bir [[block]]\'un başındaki küçük özet: önceki [[hash]], zaman ve tüm [[transaction]]\'ların parmak izi.',
      long: `[[block-header]], bir [[block]]'un kimliğini üretmek için [[hash]] fonksiyonundan geçirilen kısmıdır. Önceki [[block]]'un [[hash]] değerini, bir [[timestamp]] değerini, [[transaction]]'ları taahhüt eden bir [[merkle-root]] değerini ve [[nonce]] gibi [[consensus]] verilerini içerir.

Çok küçüktür (Bitcoin'de 80 bayt); bu sayede bir cihaz yalnızca [[block-header]]'ları indirerek zinciri takip edebilir.`,
    },
  },
  {
    id: 'merkle-root',
    name: 'Merkle root',
    category: 'crypto',
    related: ['hash', 'block-header', 'light-node'],
    lesson: 'blockchain',
    en: {
      short: 'A single hash that summarises every transaction in a block.',
      long: `Transactions are hashed in pairs, then the results are hashed in pairs, and so on until one hash remains: the Merkle root. It is stored in the [[block-header]].

The tree shape allows a short proof that one transaction is included: you only need the sibling hashes along its path, about log2(n) of them, rather than the whole block.`,
    },
    tr: {
      short: 'Bir [[block]] içindeki tüm [[transaction]]\'ları özetleyen tek bir [[hash]].',
      long: `[[transaction]]'lar ikişer ikişer [[hash]] fonksiyonundan geçirilir, sonra sonuçlar yine ikişer ikişer birleştirilir ve tek bir [[hash]] kalana kadar devam edilir: bu [[merkle-root]]'tur ve [[block-header]] içinde saklanır.

Ağaç yapısı sayesinde bir [[transaction]]'ın dahil olduğu kısa bir kanıtla gösterilebilir: tüm [[block]] yerine yalnızca yol üzerindeki kardeş [[hash]] değerleri, yani yaklaşık log2(n) tanesi yeter.`,
    },
  },
  {
    id: 'genesis-block',
    name: 'genesis block',
    category: 'basics',
    related: ['block', 'blockchain'],
    lesson: 'blockchain',
    en: {
      short: 'The very first block of a chain. It has no previous block.',
      long: `Every chain starts from a genesis block that is written directly into the software. All later blocks trace back to it.

Bitcoin's genesis block was created on 3 January 2009 and includes a newspaper headline of that day as proof it was not made earlier.`,
    },
    tr: {
      short: 'Bir zincirin en ilk [[block]]\'u. Kendinden önce [[block]] yoktur.',
      long: `Her zincir, doğrudan yazılımın içine yazılmış bir [[genesis-block]] ile başlar. Sonraki tüm [[block]]'lar geriye doğru ona dayanır.

Bitcoin'in [[genesis-block]]'u 3 Ocak 2009'da oluşturuldu ve daha önce yapılmadığının kanıtı olarak o günün bir gazete manşetini içerir.`,
    },
  },
  {
    id: 'immutability',
    name: 'immutability',
    category: 'basics',
    related: ['hash', 'finality', 'blockchain'],
    lesson: 'blockchain',
    en: {
      short: 'Once data is buried in the chain, changing it is practically impossible.',
      long: `Immutability is not absolute; it is economic. Altering an old block means redoing all the work or stake behind every block since, faster than the rest of the network adds new ones.

The deeper a block, the more it would cost to rewrite. See also [[finality]].`,
    },
    tr: {
      short: 'Veri zincirin derinine gömüldükten sonra onu değiştirmek pratikte imkânsızdır.',
      long: `[[immutability]] mutlak değil, ekonomiktir. Eski bir [[block]]'u değiştirmek, o zamandan beri eklenen her [[block]]'un arkasındaki işi ya da [[stake]]'i, ağın geri kalanı yenilerini eklerken ondan daha hızlı baştan yapmak demektir.

Bir [[block]] ne kadar derindeyse yeniden yazmak o kadar pahalıdır. Ayrıca bkz. [[finality]].`,
    },
  },
  {
    id: 'timestamp',
    name: 'timestamp',
    category: 'basics',
    related: ['block-header'],
    lesson: 'blockchain',
    en: {
      short: 'The time recorded in a block header, saying roughly when the block was made.',
      long: `Block producers write the current time into the [[block-header]]. Other nodes accept it only if it falls within allowed bounds, so it is approximate, not exact.

Protocols use timestamps to adjust [[difficulty]] and to schedule [[slot|slots]] in proof of stake.`,
    },
    tr: {
      short: '[[block-header]] içine yazılan ve [[block]]\'un yaklaşık ne zaman üretildiğini söyleyen zaman bilgisi.',
      long: `[[block]] üreticileri o anki zamanı [[block-header]] içine yazar. Diğer [[node]]'lar bunu yalnızca izin verilen sınırlar içindeyse kabul eder; yani kesin değil, yaklaşıktır.

Protokoller [[timestamp]] değerlerini [[difficulty]] ayarı için ve [[proof-of-stake]] içinde [[slot]]'ları planlamak için kullanır.`,
    },
  },
];

export default terms;
