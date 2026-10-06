import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'proof-of-work',
    name: 'Proof of Work',
    category: 'consensus',
    related: ['miner', 'mining', 'difficulty', 'proof-of-stake', '51-attack'],
    lesson: 'pow',
    en: {
      short: 'A way to choose who adds the next block: whoever first solves a costly hash puzzle.',
      long: `Proof of Work (PoW) lets a network without members or managers agree on one history. To add a [[block]], a [[miner]] must find a [[nonce]] that makes the block's [[hash]] fall below a [[target]]. Finding it takes enormous numbers of tries; checking it takes one.

Because the work costs electricity and hardware, influence over the chain cannot be faked with fake identities, and rewriting old blocks means redoing all their work faster than everyone else combined.

Bitcoin uses Proof of Work. Ethereum used it until September 2022, when it switched to [[proof-of-stake]].`,
    },
    tr: {
      short: 'Sıradaki [[block]]\'u kimin ekleyeceğini seçme yöntemi: maliyetli bir [[hash]] bulmacasını ilk çözen kazanır.',
      long: `[[proof-of-work]] (PoW), üyesi ve yöneticisi olmayan bir ağın tek bir geçmiş üzerinde anlaşmasını sağlar. Bir [[block]] eklemek için [[miner]], [[block]]'un [[hash]] değerini [[target]]'in altına düşüren bir [[nonce]] bulmak zorundadır. Bunu bulmak devasa sayıda deneme ister; kontrol etmek ise tek bir hesaptır.

Yapılan iş elektrik ve donanım gerektirdiğinden zincir üzerindeki söz hakkı sahte kimliklerle taklit edilemez. Eski [[block]]'ları yeniden yazmak da onların bütün işini, geri kalan herkesin toplamından hızlı biçimde baştan yapmak demektir.

Bitcoin [[proof-of-work]] kullanır. Ethereum da Eylül 2022'ye kadar kullandı, sonra [[proof-of-stake]]'e geçti.`,
    },
  },
  {
    id: 'miner',
    name: 'miner',
    category: 'consensus',
    related: ['mining', 'hashrate', 'block-reward', 'proof-of-work'],
    lesson: 'pow',
    en: {
      short: 'A machine (or its operator) that competes to add blocks by doing Proof of Work.',
      long: `A miner gathers pending transactions into a candidate [[block]] and searches for a [[nonce]] that makes it valid. The first miner to succeed publishes the block and earns the [[block-reward]].

On Bitcoin, mining is done with ASICs: chips built to do nothing but [[sha-256]]. Most miners join pools, which combine their [[hashrate]] and share rewards in proportion to the work each one contributed.`,
    },
    tr: {
      short: '[[proof-of-work]] yaparak [[block]] eklemek için yarışan makine ya da onu işleten kişi.',
      long: `Bir [[miner]], bekleyen işlemleri aday bir [[block]] içinde toplar ve onu geçerli kılacak [[nonce]] değerini arar. İlk başaran [[block]]'u yayımlar ve [[block-reward]] kazanır.

Bitcoin'de bu iş ASIC'lerle yapılır: [[sha-256]] hesaplamaktan başka bir şey yapmayan özel çipler. Çoğu [[miner]] bir "pool"a katılır; "pool" üyelerin [[hashrate]]'ini birleştirir ve ödülü herkesin yaptığı işle orantılı olarak paylaştırır.`,
    },
  },
  {
    id: 'mining',
    name: 'mining',
    category: 'consensus',
    related: ['miner', 'nonce', 'target', 'proof-of-work'],
    lesson: 'pow',
    en: {
      short: 'The repeated guessing of nonces to find a valid block and earn the reward.',
      long: `Mining is the search at the heart of [[proof-of-work]]: change the [[nonce]], hash the [[block-header]], compare the result with the [[target]], repeat. There is no shortcut, so the number of tries per second ([[hashrate]]) decides how often a [[miner]] wins.

Mining does two jobs at once. It selects who writes each block without any central authority, and it releases new coins on a fixed schedule through the [[block-reward]].`,
    },
    tr: {
      short: 'Geçerli bir [[block]] bulup ödülü kazanmak için art arda [[nonce]] deneme işi.',
      long: `[[mining]], [[proof-of-work]]'ün merkezindeki aramadır: [[nonce]]'u değiştir, [[block-header]]'ın [[hash]] değerini al, sonucu [[target]] ile karşılaştır, tekrarla. Kestirme bir yolu yoktur; bu yüzden bir [[miner]]'ın ne sıklıkla kazanacağını saniyedeki deneme sayısı, yani [[hashrate]] belirler.

[[mining]] iki işi birden görür. Merkezi bir otorite olmadan her [[block]]'u kimin yazacağını seçer ve [[block-reward]] aracılığıyla yeni coin'leri sabit bir takvimle dolaşıma sokar.`,
    },
  },
  {
    id: 'nonce',
    name: 'nonce',
    category: 'consensus',
    related: ['mining', 'target', 'hash', 'block-header'],
    lesson: 'pow',
    en: {
      short: 'The number a miner keeps changing until the block\'s hash is low enough.',
      long: `"Nonce" means "number used once". In [[mining]] it is a field of the [[block-header]] with no meaning of its own: its only purpose is to change the [[hash]]. Each new value is one more lottery ticket.

Bitcoin's header nonce is 32 bits, about 4.3 billion values. Modern machines run through all of them in a fraction of a second, so miners also vary other parts of the block to keep searching.

Do not confuse it with the [[account-nonce]], the per-account transaction counter on Ethereum.`,
    },
    tr: {
      short: '[[block]]\'un [[hash]] değeri yeterince küçük çıkana kadar [[miner]]\'ın değiştirip durduğu sayı.',
      long: `"Nonce", "bir kez kullanılan sayı" demektir. [[mining]] sırasında [[block-header]] içindeki bu alanın kendi başına bir anlamı yoktur; tek görevi [[hash]] değerini değiştirmektir. Her yeni değer bir piyango bileti daha demektir.

Bitcoin'de [[block-header]]'daki [[nonce]] 32 bittir, yani yaklaşık 4,3 milyar değer alabilir. Modern makineler bunların hepsini saniyenin küçük bir bölümünde tükettiğinden [[miner]]'lar aramayı sürdürmek için [[block]]'un başka kısımlarını da değiştirir.

Ethereum'da her hesabın işlem sayacı olan [[account-nonce]] ile karıştırma.`,
    },
  },
  {
    id: 'difficulty',
    name: 'difficulty',
    category: 'consensus',
    related: ['target', 'hashrate', 'mining'],
    lesson: 'pow',
    en: {
      short: 'How hard the mining puzzle currently is; it rises and falls with the network\'s total power.',
      long: `Difficulty measures how many tries are needed, on average, to find a valid [[block]]. It is the inverse of the [[target]]: a smaller target means a higher difficulty.

The protocol adjusts it automatically so blocks keep arriving at a steady pace. Bitcoin recalculates it every 2,016 blocks (about two weeks) to hold the average at 10 minutes per block: if blocks came faster than that, difficulty goes up; if slower, down. One adjustment can change it by at most a factor of 4.`,
    },
    tr: {
      short: '[[mining]] bulmacasının o anki zorluğu; ağın toplam gücüyle birlikte artar ve azalır.',
      long: `[[difficulty]], geçerli bir [[block]] bulmak için ortalamada kaç deneme gerektiğini ölçer. [[target]]'in tersidir: [[target]] küçüldükçe [[difficulty]] büyür.

Protokol, [[block]]'lar düzenli bir tempoyla gelsin diye bu değeri kendiliğinden ayarlar. Bitcoin, ortalamayı [[block]] başına 10 dakikada tutmak için değeri her 2.016 [[block]]'ta bir (yaklaşık iki hafta) yeniden hesaplar: [[block]]'lar bundan hızlı geldiyse [[difficulty]] artar, yavaş geldiyse azalır. Tek bir ayarlama değeri en fazla 4 kat değiştirebilir.`,
    },
  },
  {
    id: 'target',
    name: 'target',
    category: 'consensus',
    related: ['difficulty', 'nonce', 'hash', 'block-header'],
    lesson: 'pow',
    en: {
      short: 'The number a block\'s hash must not exceed for the block to be valid.',
      long: `A [[hash]] can be read as a very large number. A [[block]] is valid under [[proof-of-work]] only if its hash is at or below the target. Since hashes look random, a lower target means fewer winning values and more tries on average.

Written in hexadecimal, a low number starts with zeros, which is why valid block hashes begin with a long run of zeros.

In Bitcoin the target is stored inside each [[block-header]] in a compact 4-byte form called \`nBits\`, and [[difficulty]] is the largest allowed target divided by the current one.`,
    },
    tr: {
      short: 'Bir [[block]]\'un geçerli sayılması için [[hash]] değerinin aşmaması gereken sayı.',
      long: `Bir [[hash]] çok büyük bir sayı olarak okunabilir. [[proof-of-work]] kurallarına göre bir [[block]], ancak [[hash]] değeri [[target]]'e eşit ya da ondan küçükse geçerlidir. [[hash]] değerleri rastgele göründüğünden daha küçük bir [[target]], daha az kazanan değer ve ortalamada daha çok deneme demektir.

Onaltılık yazımda küçük bir sayı sıfırlarla başlar; geçerli [[block]]'ların [[hash]] değerlerinin uzun bir sıfır dizisiyle başlamasının nedeni budur.

Bitcoin'de [[target]], her [[block-header]]'ın içinde \`nBits\` adlı 4 baytlık sıkıştırılmış biçimde saklanır; [[difficulty]] ise izin verilen en büyük [[target]]'in güncel olana bölümüdür.`,
    },
  },
  {
    id: 'block-reward',
    name: 'block reward',
    category: 'consensus',
    related: ['halving', 'miner', 'mining'],
    lesson: 'pow',
    en: {
      short: 'What the creator of a block earns: newly created coins plus the transaction fees.',
      long: `The block reward pays for the chain's security. It has two parts: the subsidy, coins that come into existence with the [[block]], and the fees attached to the transactions in it.

Bitcoin's subsidy began at 50 BTC and is cut in half at every [[halving]]; since April 2024 it is 3.125 BTC. A [[miner]] claims the reward through a special first transaction in the block, called the coinbase.

A block that breaks any rule is rejected by the network, so its reward never exists. That is what makes following the rules the profitable choice.`,
    },
    tr: {
      short: 'Bir [[block]]\'u üretenin kazancı: yeni yaratılan coin\'ler ve işlem ücretleri.',
      long: `[[block-reward]], zincirin güvenliğinin bedelini öder. İki parçadan oluşur: [[block]] ile birlikte var olan yeni coin'ler ("subsidy") ve içindeki işlemlere eklenmiş ücretler.

Bitcoin'de "subsidy" 50 BTC ile başladı ve her [[halving]]'de yarıya iniyor; Nisan 2024'ten beri 3,125 BTC. [[miner]] ödülü, [[block]]'un "coinbase" denen özel ilk işlemiyle alır.

Herhangi bir kuralı çiğneyen [[block]] ağ tarafından reddedilir, dolayısıyla ödülü de hiç var olmaz. Kurallara uymayı kârlı seçenek yapan şey budur.`,
    },
  },
  {
    id: 'halving',
    name: 'halving',
    category: 'consensus',
    related: ['block-reward', 'mining'],
    lesson: 'pow',
    en: {
      short: 'The scheduled cut of Bitcoin\'s new-coin reward to half, every 210,000 blocks.',
      long: `Every 210,000 blocks, roughly every four years, the number of new coins in Bitcoin's [[block-reward]] halves: 50, 25, 12.5, 6.25, and 3.125 BTC since April 2024.

Adding up all those shrinking rewards gives a total just under 21 million BTC, which is where Bitcoin's supply limit comes from. New issuance ends around the year 2140; after that, miners are paid by fees alone.`,
    },
    tr: {
      short: 'Bitcoin\'de yeni coin ödülünün her 210.000 [[block]]\'ta bir, planlı olarak yarıya inmesi.',
      long: `Her 210.000 [[block]]'ta, yani yaklaşık dört yılda bir, Bitcoin'in [[block-reward]] içindeki yeni coin miktarı yarıya iner: 50, 25, 12,5, 6,25 ve Nisan 2024'ten beri 3,125 BTC.

Giderek küçülen bu ödüllerin toplamı 21 milyon BTC'nin hemen altında kalır; Bitcoin'in arz sınırı buradan gelir. Yeni coin üretimi 2140 yılı civarında sona erer; ondan sonra [[miner]]'ların geliri yalnızca ücretlerdir.`,
    },
  },
  {
    id: 'hashrate',
    name: 'hashrate',
    category: 'consensus',
    related: ['miner', 'difficulty', '51-attack', 'hash'],
    lesson: 'pow',
    en: {
      short: 'How many hashes per second a miner, or the whole network, can compute.',
      long: `Hashrate is the speed of [[mining]]: tries per second. A [[miner]]'s chance of finding the next [[block]] equals its share of the network's total hashrate.

Bitcoin's network hashrate is counted in exahashes per second (1 EH/s = 10^18 hashes per second). The higher the total, the more it would cost an attacker to out-work everyone else, and the higher the [[difficulty]] climbs to keep blocks 10 minutes apart.`,
    },
    tr: {
      short: 'Bir [[miner]]\'ın ya da bütün ağın saniyede hesaplayabildiği [[hash]] sayısı.',
      long: `[[hashrate]], [[mining]] hızıdır: saniyedeki deneme sayısı. Bir [[miner]]'ın sıradaki [[block]]'u bulma olasılığı, ağın toplam [[hashrate]]'i içindeki payına eşittir.

Bitcoin ağının [[hashrate]]'i saniyede "exahash" ile sayılır (1 EH/s = saniyede 10^18 [[hash]]). Toplam ne kadar yüksekse bir saldırganın geri kalan herkesten çok iş yapması o kadar pahalıya patlar; [[block]]'ları 10 dakika arayla tutmak için [[difficulty]] de o kadar yükselir.`,
    },
  },
  {
    id: '51-attack',
    name: '51% attack',
    category: 'consensus',
    related: ['hashrate', 'proof-of-work', 'miner'],
    lesson: 'pow',
    en: {
      short: 'Controlling most of a chain\'s mining power, which lets you rewrite recent history.',
      long: `Whoever controls more than half of the [[hashrate]] can build blocks faster than everyone else combined. Their private chain will eventually overtake the public one and replace it, which lets them reverse their own recent payments (a double spend) and keep chosen transactions out of blocks.

It does not let them take coins from other people's addresses, create extra coins, or change the rules: every node still verifies every block.

The defence is cost. Out-working a large network requires hardware and electricity on a scale that makes the attack more expensive than anything it could gain. Small [[proof-of-work]] chains, where hashrate can be rented, have been attacked this way.`,
    },
    tr: {
      short: 'Bir zincirin [[mining]] gücünün çoğunu ele geçirmek; yakın geçmişi yeniden yazmaya olanak verir.',
      long: `[[hashrate]]'in yarısından fazlasını elinde tutan, geri kalan herkesin toplamından daha hızlı [[block]] üretebilir. Gizlice kurduğu zincir er geç herkesin gördüğü zinciri geçer ve onun yerini alır. Böylece kendi yaptığı yakın tarihli ödemeleri geri alabilir ("double spend") ve seçtiği işlemleri [[block]]'ların dışında tutabilir.

Ama başkalarının adresindeki coin'leri alamaz, fazladan coin yaratamaz, kuralları da değiştiremez: her bilgisayar her [[block]]'u yine de doğrular.

Savunma, maliyettir. Büyük bir ağdan çok iş yapmak öyle bir donanım ve elektrik ister ki saldırı, kazandırabileceği her şeyden pahalıya gelir. [[hashrate]]'in kiralanabildiği küçük [[proof-of-work]] zincirleri ise bu yolla saldırıya uğramıştır.`,
    },
  },
];

export default terms;
