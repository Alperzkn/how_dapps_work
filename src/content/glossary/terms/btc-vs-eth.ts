import type { GlossaryTerm } from '../../../types';

// Turkish: chain names (Bitcoin, Ethereum) are proper nouns and are written
// plainly, never as [[bitcoin]] / [[ethereum]], which would add quotes.

const terms: GlossaryTerm[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    proper: true,
    category: 'chains',
    related: ['utxo', 'bitcoin-script', 'satoshi', 'ethereum'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'The first blockchain (2009): a network for holding and sending a coin with a fixed maximum supply.',
      long: `Bitcoin is a [[blockchain]] launched in 2009 by the pseudonymous Satoshi Nakamoto. Its purpose is narrow: let anyone hold and transfer value without a bank, with a supply that can never exceed 21 million coins.

It is secured by [[proof-of-work]], produces a [[block]] about every 10 minutes, and records ownership as a set of unspent coins, each one a [[utxo]]. Spending conditions are written in a deliberately small language, [[bitcoin-script]].

The name refers both to the network and to its coin (ticker BTC). The smallest unit is the [[satoshi]].`,
    },
    tr: {
      short: 'İlk [[blockchain]] (2009): azami arzı sabit bir coin\'i tutmak ve göndermek için kurulmuş ağ.',
      long: `Bitcoin, 2009'da Satoshi Nakamoto takma adlı kişi ya da kişilerce başlatılan bir [[blockchain]] ağıdır. Amacı dardır: herkesin banka olmadan değer tutup aktarabilmesi ve arzın hiçbir zaman 21 milyon coin'i geçmemesi.

Güvenliğini [[proof-of-work]] sağlar, yaklaşık 10 dakikada bir [[block]] üretir ve sahipliği harcanmamış coin'lerin bir kümesi olarak kaydeder; bunların her biri bir [[utxo]]'dur. Harcama koşulları, bilerek küçük tutulmuş bir dille, [[bitcoin-script]] ile yazılır.

Bu ad hem ağı hem de coin'ini (kısaltması BTC) anlatır. En küçük birimi [[satoshi]]'dir.`,
    },
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    proper: true,
    category: 'chains',
    related: ['evm', 'smart-contract', 'account-model', 'ether', 'bitcoin'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'A blockchain (2015) designed to run programs, called smart contracts, that anyone can deploy and call.',
      long: `Ethereum is a [[blockchain]] launched in 2015. Instead of only tracking coins, it keeps a shared state that programs can read and change. Those programs are [[smart-contract|smart contracts]], executed by the [[evm]] on every node.

Ownership is recorded with the [[account-model]]: each address has a balance, and contracts have code and storage as well. Users pay for computation in [[gas]], priced in the native coin, [[ether]].

Since 2022 Ethereum is secured by [[proof-of-stake]], with a new [[block]] possible every 12 seconds. Most decentralised apps covered later in this course run on Ethereum or on chains that reuse its design.`,
    },
    tr: {
      short: 'Herkesin yayınlayıp çağırabildiği, [[smart-contract]] denen programları çalıştırmak için tasarlanmış [[blockchain]] (2015).',
      long: `Ethereum, 2015'te başlatılan bir [[blockchain]] ağıdır. Yalnızca coin'leri takip etmek yerine, programların okuyup değiştirebildiği ortak bir durum tutar. Bu programlara [[smart-contract]] denir ve her [[node]] üzerinde [[evm]] tarafından çalıştırılırlar.

Sahiplik [[account-model]] ile kaydedilir: her adresin bir bakiyesi vardır; "contract"'ların ayrıca kodu ve depolama alanı bulunur. Kullanıcılar hesaplamanın bedelini [[gas]] ile öder; fiyatı ağın kendi parası olan [[ether]] cinsindendir.

2022'den beri Ethereum'un güvenliğini [[proof-of-stake]] sağlıyor ve her 12 saniyede yeni bir [[block]] üretilebiliyor. Bu kursta ileride anlatılan merkeziyetsiz uygulamaların çoğu Ethereum'da ya da onun tasarımını kullanan zincirlerde çalışır.`,
    },
  },
  {
    id: 'utxo',
    name: 'UTXO',
    category: 'chains',
    related: ['bitcoin', 'account-model', 'bitcoin-script', 'satoshi'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'Unspent transaction output: one discrete coin of a fixed amount that can be spent exactly once, as a whole.',
      long: `UTXO stands for "unspent transaction output". In [[bitcoin]], money does not sit in accounts. Every [[transaction]] consumes some existing outputs and creates new ones; the outputs nobody has spent yet are the UTXOs. Your balance is the sum of the UTXOs your keys can unlock.

A UTXO is always spent whole. To pay 0.6 from a 0.8 coin you create two outputs: 0.6 for the receiver and the rest back to yourself as change. Whatever is not assigned to an output becomes the fee.

Each UTXO is identified by the transaction that created it and its position in that transaction, \`(txid, vout)\`, and carries a locking script written in [[bitcoin-script]]. Nodes keep the full set of UTXOs so they can check quickly that a coin exists and has not been spent before.`,
    },
    tr: {
      short: '"Unspent transaction output": miktarı sabit, tam olarak bir kez ve bütün halinde harcanabilen tek bir coin.',
      long: `[[utxo]], "unspent transaction output" yani harcanmamış [[transaction]] çıktısı demektir. Bitcoin'de para hesaplarda durmaz. Her [[transaction]] var olan bazı çıktıları tüketir ve yenilerini yaratır; henüz kimsenin harcamadığı çıktılar [[utxo]]'lardır. Bakiyen, anahtarlarının kilidini açabildiği [[utxo]]'ların toplamıdır.

Bir [[utxo]] her zaman bütün olarak harcanır. 0.8'lik bir coin'den 0.6 ödemek için iki çıktı yaratırsın: alıcıya 0.6, kalanı da para üstü olarak kendine. Hiçbir çıktıya yazılmayan miktar ücret olur.

Her [[utxo]], onu yaratan [[transaction]] ve o [[transaction]] içindeki sırasıyla, yani \`(txid, vout)\` ile tanımlanır ve [[bitcoin-script]] ile yazılmış bir kilit taşır. [[node]]'lar, bir coin'in var olduğunu ve daha önce harcanmadığını hızlıca kontrol edebilmek için bütün [[utxo]] kümesini tutar.`,
    },
  },
  {
    id: 'account-model',
    name: 'account model',
    category: 'chains',
    related: ['ethereum', 'utxo', 'state-trie', 'ether'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'A ledger design where each address has one balance that is updated in place, like a bank account.',
      long: `In the account model the chain stores, for every [[address]], a small record: its balance and a counter of transactions sent, the [[account-nonce]]. A transfer subtracts from one record and adds to another.

[[ethereum]] uses this model and has two kinds of account. An externally owned account is controlled by a [[private-key]]. A contract account is controlled by its code and also has its own storage.

Compared with the [[utxo]] model, accounts are simpler for programs to work with, because a [[smart-contract]] can read and update a balance directly. The cost is that transactions touching the same account must be processed in order.`,
    },
    tr: {
      short: 'Her adresin, banka hesabı gibi yerinde güncellenen tek bir bakiyesinin olduğu defter tasarımı.',
      long: `[[account-model]] yaklaşımında zincir her [[address]] için küçük bir kayıt tutar: bakiyesi ve gönderdiği [[transaction]]'ların sayacı olan [[account-nonce]]. Bir transfer, bir kayıttan düşer ve bir diğerine ekler.

Ethereum bu modeli kullanır ve iki tür hesabı vardır. "Externally owned account" bir [[private-key]] ile kontrol edilir. "Contract account" ise kendi koduyla kontrol edilir ve ayrıca kendine ait bir depolama alanı vardır.

[[utxo]] modeliyle karşılaştırıldığında hesaplar programlar için daha basittir, çünkü bir [[smart-contract]] bakiyeyi doğrudan okuyup güncelleyebilir. Bedeli ise aynı hesaba dokunan [[transaction]]'ların sırayla işlenmek zorunda olmasıdır.`,
    },
  },
  {
    id: 'smart-contract',
    name: 'smart contract',
    category: 'dapps',
    related: ['evm', 'ethereum', 'opcode', 'turing-complete'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'A program stored on a blockchain that runs exactly as written whenever a transaction calls it.',
      long: `A smart contract is code deployed to a blockchain at its own [[address]]. It can hold coins and tokens, keep data in its own storage, and expose functions that anyone can call by sending a [[transaction]].

Every node runs the same code with the same inputs and must get the same result, so nobody, including the author, can make it behave differently from what is written. Once deployed the code normally cannot be changed.

That is both the strength and the risk: there is no operator to trust, and no operator to fix a bug. On [[ethereum]] contracts run inside the [[evm]], and each step is paid for with [[gas]].`,
    },
    tr: {
      short: 'Bir [[blockchain]] üzerinde saklanan ve bir [[transaction]] onu çağırdığında tam yazıldığı gibi çalışan program.',
      long: `[[smart-contract]], bir [[blockchain]]'e kendi [[address]]'i ile yerleştirilen koddur. Coin ve token tutabilir, kendi depolama alanında veri saklayabilir ve herkesin bir [[transaction]] göndererek çağırabileceği fonksiyonlar sunar.

Her [[node]] aynı kodu aynı girdilerle çalıştırır ve aynı sonuca varmak zorundadır; bu yüzden yazarı dahil hiç kimse onu yazılandan farklı davranmaya zorlayamaz. Yayınlandıktan sonra kod normalde değiştirilemez.

Bu hem gücü hem de riskidir: güvenmen gereken bir işletmeci yoktur, ama bir hatayı düzeltecek bir işletmeci de yoktur. Ethereum'da bu programlar [[evm]] içinde çalışır ve her adımın bedeli [[gas]] ile ödenir.`,
    },
  },
  {
    id: 'evm',
    name: 'EVM',
    category: 'chains',
    related: ['ethereum', 'smart-contract', 'opcode', 'turing-complete', 'state-trie'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'Ethereum Virtual Machine: the engine inside every Ethereum node that executes smart contract code.',
      long: `The EVM is the virtual computer that runs every [[smart-contract]] on [[ethereum]]. Each node contains one, and all of them must produce identical results for the same transaction.

It is a stack machine that works on 256-bit values. Contract code is a sequence of low-level instructions; each one is an [[opcode]] with a fixed [[gas]] price. A contract also has permanent storage, which only its own code can write.

Many other chains reuse the EVM so that the same contracts and tools work there. These are called EVM-compatible chains.`,
    },
    tr: {
      short: '"Ethereum Virtual Machine": her Ethereum [[node]]\'unun içinde [[smart-contract]] kodunu çalıştıran motor.',
      long: `[[evm]], Ethereum'daki her [[smart-contract]]'ı çalıştıran sanal bilgisayardır. Her [[node]]'un içinde bir tane bulunur ve hepsi aynı [[transaction]] için birebir aynı sonucu üretmek zorundadır.

256 bitlik değerler üzerinde çalışan bir "stack" makinesidir. Kod, düşük seviyeli komutların bir dizisidir; her komut, sabit bir [[gas]] fiyatı olan bir [[opcode]]'dur. Her "contract"'ın ayrıca kalıcı bir depolama alanı vardır ve buraya yalnızca kendi kodu yazabilir.

Birçok başka zincir, aynı "contract"'lar ve araçlar orada da çalışsın diye [[evm]]'i yeniden kullanır. Bunlara "EVM-compatible" zincirler denir.`,
    },
  },
  {
    id: 'bitcoin-script',
    name: 'Bitcoin Script',
    category: 'chains',
    related: ['bitcoin', 'utxo', 'opcode', 'turing-complete'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'Bitcoin’s small, loop-free language for writing the condition under which a coin may be spent.',
      long: `Every [[utxo]] carries a locking script, and whoever wants to spend it must supply data that makes the script succeed. The most common lock asks for a [[digital-signature]] matching a given [[public-key]].

Script is stack-based: each [[opcode]] pushes values onto a stack or operates on the top ones. It has no loops and cannot read anything outside the transaction being checked, so every script finishes quickly and its cost is known in advance. It is deliberately not [[turing-complete]].

Within those limits it still expresses multi-signature wallets, time locks and hash locks, which are the building blocks of payment channels such as the Lightning Network.`,
    },
    tr: {
      short: 'Bir coin\'in hangi koşulda harcanabileceğini yazmak için kullanılan, döngüsü olmayan küçük Bitcoin dili.',
      long: `Her [[utxo]] bir kilit betiği taşır; onu harcamak isteyen, betiği başarıyla sonuçlandıran veriyi sunmak zorundadır. En yaygın kilit, belirli bir [[public-key]] ile eşleşen bir [[digital-signature]] ister.

Bu dil "stack" tabanlıdır: her [[opcode]] yığına değer koyar ya da en üstteki değerler üzerinde işlem yapar. Döngüsü yoktur ve kontrol edilen [[transaction]] dışında hiçbir şeyi okuyamaz; bu yüzden her betik çabuk biter ve maliyeti önceden bilinir. Bilerek [[turing-complete]] yapılmamıştır.

Bu sınırlar içinde yine de çok imzalı cüzdanları, zaman kilitlerini ve [[hash]] kilitlerini ifade edebilir; bunlar Lightning Network gibi ödeme kanallarının yapı taşlarıdır.`,
    },
  },
  {
    id: 'opcode',
    name: 'opcode',
    category: 'chains',
    related: ['evm', 'bitcoin-script', 'smart-contract'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'One low-level instruction of a virtual machine, such as "add two numbers" or "check this signature".',
      long: `An opcode ("operation code") is the smallest step a virtual machine can perform. Programs written in a language like Solidity are compiled down to a long list of opcodes.

In [[bitcoin-script]], examples are \`OP_DUP\` (copy the top stack item), \`OP_HASH160\` (hash it) and \`OP_CHECKSIG\` (verify a signature). In the [[evm]], examples are \`ADD\`, \`SLOAD\` (read storage), \`SSTORE\` (write storage) and \`CALL\` (call another contract).

In the EVM every opcode has a [[gas]] cost that reflects how much work it causes for nodes. Writing to storage is among the most expensive; simple arithmetic is among the cheapest.`,
    },
    tr: {
      short: 'Bir sanal makinenin tek bir düşük seviyeli komutu; örneğin "iki sayıyı topla" ya da "bu imzayı doğrula".',
      long: `[[opcode]] ("operation code"), bir sanal makinenin atabileceği en küçük adımdır. Solidity gibi bir dilde yazılan programlar derlenince uzun bir [[opcode]] listesine dönüşür.

[[bitcoin-script]] içinde örnekler: \`OP_DUP\` (yığının en üstündeki öğeyi kopyala), \`OP_HASH160\` (onun [[hash]] değerini al) ve \`OP_CHECKSIG\` (bir imzayı doğrula). [[evm]] içinde örnekler: \`ADD\`, \`SLOAD\` (depolamadan oku), \`SSTORE\` (depolamaya yaz) ve \`CALL\` (başka bir "contract"'ı çağır).

[[evm]]'de her [[opcode]]'un, [[node]]'lara ne kadar iş çıkardığını yansıtan bir [[gas]] maliyeti vardır. Depolamaya yazmak en pahalılar arasındadır; basit aritmetik ise en ucuzlar arasında.`,
    },
  },
  {
    id: 'state-trie',
    name: 'state trie',
    category: 'chains',
    related: ['ethereum', 'account-model', 'merkle-root', 'hash'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'The tree-shaped structure in which Ethereum stores every account, summarised by one hash in each block header.',
      long: `[[ethereum]] has to commit to the balance, code and storage of every account in every block. It does so with the state trie: a Merkle Patricia trie, a tree in which the path to a leaf is derived from the account's [[address]] and every node is identified by the [[hash]] of its contents.

The hash at the top, the \`stateRoot\`, is written into the [[block-header]]. Changing any account changes the hashes along its path and therefore the root, in the same way a [[merkle-root]] reacts to a changed transaction.

This lets anyone prove a single balance or storage value against a trusted header with a short proof, without downloading the whole state. Each contract has its own storage trie whose root is stored in its account record.`,
    },
    tr: {
      short: 'Ethereum\'un bütün hesapları sakladığı ağaç biçimli yapı; her [[block-header]]\'da tek bir [[hash]] ile özetlenir.',
      long: `Ethereum, her [[block]]'ta bütün hesapların bakiyesini, kodunu ve depolama alanını taahhüt etmek zorundadır. Bunu [[state-trie]] ile yapar: bir "Merkle Patricia trie", yani yaprağa giden yolun hesabın [[address]]'inden türetildiği ve her düğümün içeriğinin [[hash]] değeriyle tanımlandığı bir ağaç.

En tepedeki [[hash]], yani \`stateRoot\`, [[block-header]]'a yazılır. Herhangi bir hesabı değiştirmek, yolu üzerindeki [[hash]]'leri ve dolayısıyla kökü değiştirir; tıpkı bir [[merkle-root]]'un değişen bir [[transaction]]'a tepki vermesi gibi.

Bu sayede herkes, bütün durumu indirmeden, tek bir bakiyeyi ya da depolama değerini güvenilen bir [[block-header]]'a karşı kısa bir kanıtla doğrulayabilir. Her "contract"'ın kendi "storage trie"'si vardır ve bunun kökü hesap kaydında saklanır.`,
    },
  },
  {
    id: 'ether',
    name: 'ether',
    category: 'chains',
    related: ['ethereum', 'satoshi', 'account-model'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'The native coin of Ethereum (ticker ETH), used to pay for gas and as stake by validators.',
      long: `Ether is the currency built into [[ethereum]]. Every [[gas-fee]] is paid in it, validators lock it up as [[stake]], and it is the default asset that accounts and contracts hold.

One ether is divided into 10^18 units called wei. Gas prices are usually quoted in gwei, which is 10^9 wei, or one billionth of an ether.

Ether has no fixed maximum supply. New ether is issued to validators, and the base fee of every transaction is burned, so the total can grow or shrink depending on how busy the network is.`,
    },
    tr: {
      short: 'Ethereum\'un kendi coin\'i (kısaltması ETH); [[gas]] ödemek için ve [[validator]]\'ların [[stake]]\'i olarak kullanılır.',
      long: `[[ether]], Ethereum'un içine yerleşik para birimidir. Her [[gas-fee]] onunla ödenir, [[validator]]'lar onu [[stake]] olarak kilitler ve hesapların ve "contract"'ların tuttuğu varsayılan varlıktır.

Bir [[ether]], wei adı verilen 10^18 birime bölünür. [[gas]] fiyatları genellikle gwei ile söylenir; bir gwei 10^9 wei, yani bir [[ether]]'in milyarda biridir.

[[ether]]'in sabit bir azami arzı yoktur. [[validator]]'lara yeni [[ether]] basılır ve her [[transaction]]'ın "base fee" kısmı yakılır; bu yüzden toplam miktar ağın yoğunluğuna göre artabilir ya da azalabilir.`,
    },
  },
  {
    id: 'satoshi',
    name: 'satoshi',
    category: 'chains',
    related: ['bitcoin', 'utxo', 'ether'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'The smallest unit of bitcoin: one hundred-millionth of a coin (0.00000001 BTC).',
      long: `A satoshi, often shortened to "sat", is the smallest amount of [[bitcoin]] the protocol can represent. One bitcoin is 100,000,000 satoshis. It is named after Bitcoin's creator, Satoshi Nakamoto.

Inside the protocol all amounts are whole numbers of satoshis; the decimal point in "0.5 BTC" is only a display convention.

Fees are usually quoted in satoshis per virtual byte (sat/vB): how much you pay for each unit of [[block]] space your transaction occupies.`,
    },
    tr: {
      short: 'Bitcoin\'in en küçük birimi: bir coin\'in yüz milyonda biri (0.00000001 BTC).',
      long: `[[satoshi]], çoğu zaman kısaca "sat", protokolün ifade edebildiği en küçük bitcoin miktarıdır. Bir bitcoin 100.000.000 [[satoshi]] eder. Adını Bitcoin'in yaratıcısı Satoshi Nakamoto'dan alır.

Protokolün içinde bütün tutarlar tam sayı [[satoshi]] olarak tutulur; "0.5 BTC" yazarkenki ondalık nokta yalnızca bir gösterim alışkanlığıdır.

Ücretler genellikle sanal bayt başına [[satoshi]] (sat/vB) olarak söylenir: [[transaction]]'ının kapladığı her birim [[block]] alanı için ne kadar ödediğin.`,
    },
  },
  {
    id: 'turing-complete',
    name: 'Turing-complete',
    category: 'chains',
    related: ['evm', 'bitcoin-script', 'smart-contract', 'opcode'],
    lesson: 'btc-vs-eth',
    en: {
      short: 'Able to express any computation, including loops that repeat an unknown number of times.',
      long: `A language is Turing-complete if, given enough time and memory, it can compute anything that any other programming language can. The key ingredient is the ability to loop or jump back, so a program's running time is not fixed in advance.

The [[evm]] is Turing-complete, which is why a [[smart-contract]] can implement an exchange, a lending market or a game. The danger is a program that never stops, so every step costs [[gas]] and execution halts when the gas runs out.

[[bitcoin-script]] is deliberately not Turing-complete. With no loops, every script is guaranteed to end and is cheap to check, at the price of being far less expressive.`,
    },
    tr: {
      short: 'Kaç kez döneceği önceden bilinmeyen döngüler dahil, her hesaplamayı ifade edebilen.',
      long: `Bir dil, yeterli zaman ve bellek verildiğinde başka herhangi bir programlama dilinin hesaplayabildiği her şeyi hesaplayabiliyorsa [[turing-complete]] sayılır. İşin anahtarı döngü kurabilmek ya da geriye atlayabilmektir; böylece bir programın ne kadar süreceği önceden belli olmaz.

[[evm]] [[turing-complete]]'tir; bir [[smart-contract]]'ın bir borsayı, bir kredi piyasasını ya da bir oyunu hayata geçirebilmesinin nedeni budur. Tehlikesi hiç durmayan bir programdır; bu yüzden her adım [[gas]] harcar ve [[gas]] bitince çalışma durur.

[[bitcoin-script]] ise bilerek [[turing-complete]] yapılmamıştır. Döngü olmadığı için her betiğin biteceği kesindir ve kontrol etmesi ucuzdur; bedeli ise ifade gücünün çok daha az olmasıdır.`,
    },
  },
];

export default terms;
