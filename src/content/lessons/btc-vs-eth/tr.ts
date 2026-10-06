import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token.
// Chain names (Bitcoin, Ethereum) are proper nouns: written plainly, without [[ ]] and without quotes.

const content: LessonContent = {
  labels: {
    btcGoal: 'kıt dijital para',
    ethGoal: 'ortak bir bilgisayar',
    btcSince: '2009’dan beri\nproof of work',
    ethSince: '2015’ten beri\nproof of stake (2022 →)',
    alice: 'Ayşe',
    bob: 'Ben',
    change: 'para üstü',
    fee: 'ücret',
    utxoIn: 'coin’ler bütün olarak girer',
    utxoOut: 'yeni coin’ler çıkar',
    inPlace: 'bakiyeler yerinde değişir',
    locked: 'kilitli',
    unlocked: 'açıldı',
    stack: 'sırayla kontroller',
    btcProg: 'küçük harcama kuralları',
    contract: 'contract',
    storage: 'contract storage',
    gas: 'gas',
    ethProg: 'her program, ölçülerek',
    nextBlock: 'sıradaki block',
    blockFull: 'block doldu',
    waiting: 'bekliyor',
    btcFee: 'önce en yüksek ücret oranı',
    burned: 'yakıldı',
    baseBurn: 'base fee: yakılır',
    tip: 'bahşiş',
    tipTo: 'priority fee\n→ validator',
    ethFee: 'bir kısmı yakılır,\nbir kısmı bahşiş',
    btcPace: 'yavaş, düzenli block’lar',
    btcTime: 'block başına ≈ 10 dk',
    ethPace: 'hızlı block’lar',
    ethTime: 'slot başına 12 sn',
    halves: 'yeni coin miktarı\n~4 yılda bir yarılanır',
    halvesNum: '50 → 25 → 12.5\n→ 6.25 → 3.125 BTC',
    btcCap: 'asla 21 milyondan fazla değil',
    issuance: '+ yeni basım',
    burn: '− yakım',
    ethCap: 'sabit üst sınır yok',
    btc0b: 'nakit gibi\ncoin’ler',
    btc0i: 'UTXO modeli',
    btc0e: 'UTXO set\n(txid, vout)',
    btc1b: 'basit harcama\nkuralları',
    btc1i: 'Script:\nkilit koşulları',
    btc1e: 'stack tabanlı,\ndöngü yok',
    btc2b: 'sabit arz:\n21 milyon',
    btc2i: '21M sınır\n≈ 10 dk block',
    btc2e: '50 >> (h/210000)\n4M weight unit',
    eth0b: 'banka uygulaması\ngibi bakiyeler',
    eth0i: 'account modeli',
    eth0e: 'state trie\n(Merkle Patricia)',
    eth1b: 'her programı\nçalıştırır',
    eth1i: 'EVM +\nsmart contract',
    eth1e: '256 bit stack VM\ngas ile ölçülür',
    eth2b: 'sınır yok,\nücretler yakılır',
    eth2i: 'basım − yakım\n12 sn slot',
    eth2e: 'EIP-1559 yakımı\nPoS basımı',
  },
  steps: {
    goals: {
      title: 'İki zincir, iki amaç',
      alt: 'İkiye bölünmüş bir platform. Bitcoin tarafında bir kasa coin tutuyor ve bir coin bir kişiden diğerine geçiyor. Ethereum tarafında uygulama ekranları, çalışan bir makineye istek gönderiyor.',
      body: {
        beginner: `Bitcoin de Ethereum da birer [[blockchain]], ama farklı işler için tasarlandılar.

Bitcoin **kimsenin kontrol etmediği bir para** olmak ister: sayısı sınırlı, kendi elinde tutabildiğin ve istediğine gönderebildiğin coin'ler. Çoğu zaman dijital altına benzetilir. Tek bir işi yapar ve bilerek çok yavaş değişir.

Ethereum ise **kimsenin kontrol etmediği bir bilgisayar** olmak ister. Onun da bir parası var, [[ether]]; ama bu para en çok program çalıştırmanın bedelini ödemek için kullanılır. Bu programlara [[smart-contract]] denir ve kursun geri kalanı insanların bunlarla neler kurduğunu anlatıyor.`,
        intermediate: `Bitcoin 2009'da başladı. Tasarım amacı, arzı sabit bir ödeme sistemi ve değer saklama aracı olmak. Güvenliğini [[proof-of-work]] sağlar; kuralları nadiren ve çok temkinli değişir.

Ethereum 2015'te başladı. Amacı genel bir platform olmak: isteyen herkes zincirde yaşayan ve para tutabilen bir program, yani bir [[smart-contract]] yayınlayabilir, isteyen herkes de onu çağırabilir. 2022'den beri Ethereum'un güvenliğini [[proof-of-stake]] sağlıyor.

Amaçtaki bu fark, bundan sonra göreceğin bütün farkları açıklar:

- [[ledger]]'ın kimin neye sahip olduğunu nasıl kaydettiği;
- bir [[transaction]]'ın ne kadar mantık taşıyabildiği;
- ücretlerin nasıl fiyatlandığı;
- yeni coin'lerin nasıl yaratıldığı.`,
        expert: `İki sistem de çoğaltılmış birer durum makinesi; ama durum ve geçiş fonksiyonu farklı.

Bitcoin'de durum [[utxo]] kümesidir: harcanmamış bütün [[transaction]] çıktıları. Bir [[transaction]], her girdisi var olan bir çıktıyı gösteriyorsa ve o çıktının [[bitcoin-script]] ile yazılmış kilidini açıyorsa geçerlidir. Doğrulama bu küme dışında durumsuzdur; [[block-header]] yalnızca [[transaction]]'ları taahhüt eder ([[merkle-root]] ile), durumu değil.

Ethereum'da durum, [[address]]'ten hesaba giden bir eşlemedir (\`nonce\`, \`balance\`, \`storageRoot\`, \`codeHash\`) ve [[state-trie]] üzerinden her [[block-header]]'da \`stateRoot\` olarak taahhüt edilir. Geçiş fonksiyonu [[evm]] içindeki çalıştırmadır.

[[consensus]] da farklıdır: bir yanda olasılıksal [[finality]] veren, en uzun zincir kuralına dayalı Nakamoto tipi [[proof-of-work]]; öbür yanda iki [[epoch]] sonra ekonomik [[finality]] veren Gasper ([[casper-ffg]] ve [[lmd-ghost]]). Bitcoin küçük ve denetlenebilir bir taban katmanı tercih eder; Ethereum ise taban katmanda ifade gücünü.`,
      },
    },
    ledger: {
      title: 'Coin mi, bakiye mi: "UTXO" ve hesaplar',
      alt: 'Bitcoin tarafında iki coin pulu bir tablaya kayıyor, yok oluyor ve üç yeni pul çıkıyor: biri Ben için, biri para üstü olarak Ayşe’ye, küçücük biri de ücret. Ethereum tarafında iki hesap sütunu yerinde duruyor: Ayşe’ninki kısalıyor, Ben’inki uzuyor.',
      body: {
        beginner: `Bitcoin **nakit** gibi çalışır. "Bakiyen" diye tek bir sayı yoktur; cüzdandaki banknotlar gibi, farklı büyüklükte ayrı ayrı coin'lerin vardır. Ödeme yaparken coin'leri bütün olarak verirsin ve para üstünü geri alırsın. Verdiğin coin'ler yok olur; alıcı için ve senin para üstün için yepyeni coin'ler yaratılır. Bu coin'lerin her birine [[utxo]] denir.

Ethereum bir **banka uygulaması** gibi çalışır. Her kullanıcının tek bir hesabı ve o hesapta tek bir sayı vardır. Birine ödeme yapmak, senin sayını azaltıp onunkini artırmaktan ibarettir. Buna [[account-model]] denir.

İkisinde de sonuç aynı: Ben'in parası artar, Ayşe'ninki azalır. Yalnızca defteri farklı tutarlar.`,
        intermediate: `Bitcoin'de bir [[transaction]]'ın **girdileri** ("input") ve **çıktıları** ("output") vardır. Her girdi daha önceki bir çıktıyı tamamen harcar; her çıktı, bir miktarı ve bir kilidi olan yeni bir [[utxo]] yaratır. Sahnede Ayşe iki coin harcıyor (0.5 ve 0.3 BTC), Ben için 0.6, kendisi için 0.19 BTC'lik çıktı yaratıyor. Eksik kalan 0.01 hiçbir yere yazılmaz: girdilerden çıktılar düşülünce artan miktar [[miner]]'ın ücretidir.

Bitcoin'deki "bakiyen", [[wallet]]'ının kilidini açabildiği bütün [[utxo]]'ların toplamıdır.

Ethereum'un [[account-model]] yaklaşımında her [[address]]'in bakiyesi zincirin durumunda saklanır. Bir transfer gönderenden düşer, alıcıya ekler. Aynı [[transaction]] tekrar tekrar işlenmesin diye her hesabın bir [[account-nonce]] değeri vardır ve gönderdiği her [[transaction]] ile bir artar.

Artılar ve eksiler: [[utxo]]'lar paralel doğrulamaya uygundur ve her seferinde yeni bir [[address]] kullanırsan coin'leri birbirine bağlamak zorlaşır. Hesaplar ise programlar için daha basittir, çünkü bir "contract" bakiyeyi doğrudan okuyup güncelleyebilir.`,
        expert: `Bitcoin'de bir girdi, bir "outpoint" \`(txid, vout)\` ile kilidi açan veriden (\`scriptSig\` ve/veya "witness") oluşur. Bir çıktı \`(value, scriptPubKey)\` çiftidir; \`value\` [[satoshi]] cinsindendir. Geçerlilik için \`Σ girdi ≥ Σ çıktı\` gerekir; aradaki fark ücrettir. Her "outpoint" yalnızca bir kez harcanabilir; yani çifte harcama kontrolü bir kümede arama ve ardından silmedir. [[full-node]]'lar [[utxo]] kümesini yerel bir veritabanında tutar (2026 itibarıyla kabaca yüz milyon kayıt mertebesinde ya da üstünde); bu küme [[block-header]]'da taahhüt **edilmez**.

Sonuçları: farklı çıktılara dokunan [[transaction]]'lar birbirinden bağımsızdır ve paralel doğrulanabilir; hesap "nonce" değeri yoktur, bir "outpoint" yalnızca bir kez var olduğu için "replay" mümkün değildir; ücret artırma, aynı girdileri yeniden harcayarak (RBF) ya da bir alt çıktıyı harcayarak (CPFP) yapılır.

Ethereum'un durumu \`address → (nonce, balance, storageRoot, codeHash)\` eşlemesidir ve \`keccak256(address)\` ile anahtarlanan bir "Merkle Patricia trie" olan [[state-trie]] içinde saklanır. Her "contract"'ın kendi "storage trie"'si vardır. Kök her [[block-header]]'da bulunur; böylece bir [[light-node]] tek bir hesabı Merkle kanıtıyla doğrulayabilir (\`eth_getProof\`).

Sonuçları: aynı göndericinin [[transaction]]'ları [[account-nonce]] ile tam sıralıdır; aynı "contract storage" alanına dokunan iki [[transaction]] çakışır, bu yüzden çalıştırma varsayılan olarak sıralıdır; durum, doğal bir budama kuralı olmadan büyür. "State expiry" ve "statelessness" önerilerinin çıkış noktası budur.`,
      },
    },
    programs: {
      title: 'Küçük kilitler mi, tam programlar mı: "Script" ve "EVM"',
      alt: 'Bitcoin tarafında kilitli bir coin, büyüyüp küçülen küçük bir levha yığınının yanında duruyor; sonunda tek bir yeşil levha kalıyor ve asma kilit açılıyor. Ethereum tarafında bir çağrı contract makinesine giriyor, bir storage gözü değişiyor ve her işlemde gas göstergesi biraz daha boşalıyor.',
      body: {
        beginner: `Her Bitcoin coin'inin üzerinde küçük bir **kilit** vardır. En yaygın kilit şunu söyler: "beni yalnızca bu anahtarın sahibi harcayabilir". Başka kilitler "şu üç kişiden ikisi onaylamalı" ya da "gelecek yıldan önce olmaz" diyebilir. Bilerek, bundan çok da ileri gidilmez. Bu kilitlerin yazıldığı küçücük dile [[bitcoin-script]] denir.

Ethereum ise zincire **koca bir program** koymana izin verir: bir [[smart-contract]]. Para tutabilir, bir şeyleri hatırlayabilir ve yazarının koyduğu her kuralı uygulayabilir: bir borsa, bir kredi, bir oyun. Ethereum'un bu programları çalıştıran parçasına [[evm]] denir.

Program çalıştırmak ağdaki her bilgisayara iş çıkarır; bu yüzden her adımın bir bedeli vardır ve bu bedel [[gas]] ile ödenir. [[gas]] bitince program durur.`,
        intermediate: `[[bitcoin-script]], her birine [[opcode]] denen basit komutların bir listesidir ve bir değer yığını ("stack") üzerinde çalışır. Bir coin'i harcamak için veri sunarsın (genellikle bir [[digital-signature]] ve bir [[public-key]]); [[node]] betiği çalıştırır ve sonuç doğruysa harcama geçerli sayılır.

Bu dilde **döngü yoktur** ve [[transaction]]'lar arasında veri saklanamaz. Bu bilinçli bir sınırdır: her betik çabuk biter, kontrol maliyeti önceden bellidir ve hataya az yer kalır. Ödemeler, çok imzalı [[wallet]]'lar, zaman kilitleri ve ödeme kanalları için yeterlidir.

[[evm]] ise tam bir sanal makinedir. Bir [[smart-contract]], bir [[address]]'te saklanan koddur ve kendine ait kalıcı bir depolama alanı ("storage") vardır. Bir [[transaction]] onu çağırabilir, o başka "contract"'ları çağırabilir ve döngü kurabilir. Böyle dillere [[turing-complete]] denir.

Bir program sonsuza kadar çalışabileceği için her [[opcode]]'un bir [[gas]] maliyeti vardır. Gönderen bir [[gas]] sınırı belirler; çalıştırma bu sınırı aşarsa bütün değişiklikler geri alınır ama ücret yine de ödenir.`,
        expert: `[[bitcoin-script]], her girdi için bir kez değerlendirilen, "stack" tabanlı, Forth benzeri bir dildir. "Pay-to-public-key-hash" önce \`<sig> <pubKey>\`, ardından \`OP_DUP OP_HASH160 <pkh> OP_EQUALVERIFY OP_CHECKSIG\` çalıştırır. Bilerek [[turing-complete]] değildir: geriye atlama yoktur, betik boyutu ve işlem sayısı sınırlıdır, doğrulanan [[transaction]] ve onun "lock-time" alanları dışında küresel duruma erişim yoktur. Bu yüzden maliyet statik olarak sınırlanır (imza işlemi ve "weight" sınırları). Taproot (2021) Schnorr imzalarını ve alternatif betiklerden oluşan Merkle ağaçlarını ekledi; yalnızca kullanılan dal açığa çıkar.

[[evm]], 256 bitlik kelimelerle çalışan bir "stack" makinesidir: en fazla 1024 öğelik bir "stack", bayt adresli geçici bir "memory" ve 256 bitlik anahtarları 256 bitlik değerlere eşleyen, "contract" başına kalıcı bir "storage". Kod değiştirilemez "bytecode"'dur ve \`codeHash\` ile adreslenir.

Her [[opcode]]'un bir [[gas]] maliyeti vardır. Sahnede: [[transaction]] için 21.000 "intrinsic gas", soğuk bir \`SLOAD\` için 2.100, \`ADD\` için 3, daha önce yüklenmiş ve sıfır olmayan bir gözü değiştiren \`SSTORE\` için 2.900 (EIP-2929/2200 fiyatlaması; "calldata" ve diğer [[opcode]]'lar sadelik için atlandı). [[gas]] sıfıra inince o çerçeve "out-of-gas" ile durur ve yaptığı durum değişiklikleri geri alınır. Komut kümesi olarak [[evm]] [[turing-complete]]'tir, ama her çalıştırma "block gas limit" ile sınırlıdır.

"Contract"'lar arası çağrılar (\`CALL\`, \`DELEGATECALL\`, \`STATICCALL\`) tek bir [[transaction]] içinde eşzamanlı ve atomiktir. Birleştirilebilirliği de "reentrancy" hatalarını da mümkün kılan budur.`,
      },
      code: {
        lang: 'Bitcoin Script / Solidity',
        source: `# Bitcoin: bir coin'i public key hash'e kilitle (P2PKH)
scriptPubKey: OP_DUP OP_HASH160 <pubKeyHash>
              OP_EQUALVERIFY OP_CHECKSIG
scriptSig:    <signature> <pubKey>

// Ethereum: kendi storage alanı olan bir program
contract Counter {
    uint256 public count;        // storage slot 0

    function add(uint256 n) external {
        count = count + n;       // SLOAD, ADD, SSTORE
    }
}`,
      },
    },
    fees: {
      title: 'Yer için ödemek, iş için ödemek',
      alt: 'Bitcoin tarafında bekleyen beş işlemin üstünde farklı yükseklikte coin yığınları var; en yüksek yığınlı üçü sıradaki block’a geçiyor, diğerleri bekliyor. Ethereum tarafında bir işlem block’a giriyor, sonra ücreti ikiye ayrılıyor: çoğu yanan bir çukura düşüyor, bir coin de validator’a gidiyor.',
      body: {
        beginner: `Bir [[block]]'taki yer sınırlıdır; içeri girmek için kullanıcılar ücret öder.

Bitcoin'de bu bir **yer açık artırması** gibidir. Her [[transaction]] bir ücret teklif eder. Sıradaki [[block]]'u hazırlayan [[miner]], kapladığı yere göre en çok ödeyenleri seçer. Ağ yoğunsa ve teklifin düşükse beklersin.

Ethereum'da ise **yapılan iş** için ödersin: [[transaction]]'ın ne kadar çok hesaplama gerektiriyorsa o kadar çok [[gas]] harcar. Birim [[gas]] fiyatının iki parçası vardır. Ana parçayı ağ belirler ve bu parça **yok edilir**; kimseye gitmez. Üstüne eklenen küçük bahşiş ise [[transaction]]'ını [[block]]'a koyan [[validator]]'a gider.`,
        intermediate: `Bitcoin'de ücret, girdilerle çıktılar arasındaki farktır. Bir [[miner]] için önemli olan **ücret oranıdır** ("fee rate"): ücretin [[transaction]] boyutuna bölümü. Sanal bayt başına [[satoshi]] (sat/vB) olarak söylenir. [[miner]]'lar [[block]]'u [[mempool]]'daki en yüksek ücret oranından başlayarak doldurur. Basit bir ödeme 140–220 vB civarındadır; 10 sat/vB ile birkaç bin [[satoshi]] tutar.

Ethereum'da [[gas-fee]] \`harcanan gas × gas başına fiyat\` şeklinde hesaplanır. Düz bir transfer 21.000 [[gas]] harcar; bir token takası bunun birkaç katını. [[eip-1559]] güncellemesinden (2021) beri fiyat iki parçadır:

- **"base fee"**: bir [[block]]'taki herkes için aynıdır; [[block]]'lar yarıdan fazla doluysa artar, daha boşsa düşer. Yakılır;
- **"priority fee"** (bahşiş): [[block]]'un [[proposer]]'ına gider.

Yani Bitcoin baytı, Ethereum hesaplamayı ve depolamayı fiyatlar. İkisinde de [[block]] alanına talep artınca ücretler yükselir.`,
        expert: `Bitcoin [[block]]'ları 4.000.000 "weight unit" ile sınırlıdır; \`vsize = weight / 4\` ve "witness" verisi indirimlidir. [[miner]]'lar ücreti "ancestor fee rate" üzerinden en çoklar ("child-pays-for-parent" bu sayede işler); [[node]]'lar da daha çok ödeyen yenilemeleri iletir (RBF). Ücret piyasası "first-price" türündedir: ne teklif ettiysen onu ödersin. [[miner]], "coinbase" [[transaction]]'ı üzerinden \`subsidy + Σ ücret\` alır; bu yüzden her [[halving]] ile ücretlerin güvenlikteki payı büyür.

[[eip-1559]] ile bir [[transaction]] \`maxFeePerGas\` ve \`maxPriorityFeePerGas\` değerlerini belirler. Ödediği tutar \`gasUsed × (baseFee + tip)\` olur; burada \`tip = min(maxPriorityFeePerGas, maxFeePerGas − baseFee)\`. Protokol "base fee" değerini her [[block]]'ta günceller:

\`baseFee' = baseFee × (1 + (gasUsed − gasTarget) / gasTarget / 8)\`

Yani [[block]] başına en fazla %12,5 değişir; hedef "gas limit" değerinin yarısıdır. \`baseFee × gasUsed\` yakılır; [[proposer]]'a yalnızca bahşiş ulaşır. Böylece [[proposer]]'ın kendi [[block]]'unu şişirmesinin bir getirisi kalmaz. Kullanılmayan [[gas]] tam fiyatından iade edilir.

"Rollup"'ların kullandığı "blob" verisinin kendi "base fee" değeri olan ayrı bir ücret piyasası vardır (EIP-4844). Protokolün dışında, bir [[block]] içindeki sıralama ayrıca "block builder" açık artırmalarıyla satılır (MEV); iki zincirin taban ücreti de bunu kapsamaz.`,
      },
      code: {
        lang: 'Python (EIP-1559 base fee)',
        source: `def next_base_fee(base_fee, gas_used, gas_limit):
    target = gas_limit // 2          # hedef: block'lar yarı dolu
    if gas_used == target:
        return base_fee
    delta = base_fee * abs(gas_used - target) // target // 8
    if gas_used > target:
        return base_fee + max(delta, 1)   # en fazla +%12,5
    return base_fee - delta               # en fazla -%12,5

def fee_paid(gas_used, base_fee, max_fee, max_priority):
    tip = min(max_priority, max_fee - base_fee)
    burned = gas_used * base_fee          # yok edilir
    to_proposer = gas_used * tip
    return burned + to_proposer`,
      },
    },
    supply: {
      title: '"Block" ritmi ve yeni coin\'ler',
      alt: 'Her iki tarafın arkasında block’lar bir banttan çıkıyor: Bitcoin’de yavaş, Ethereum’da hızlı. Önde Bitcoin, her biri bir öncekinin yarısı kadar olan çubuklardan bir merdiven gösteriyor. Ethereum ise bir tank gösteriyor: yukarıdan coin’ler düşüyor, bazıları da yanan bir çukura gidiyor.',
      body: {
        beginner: `Bitcoin yaklaşık **10 dakikada** bir [[block]] ekler. Ethereum **12 saniyede** bir. Hızlı [[block]]'lar ödemeni daha çabuk görmeni sağlar; yavaş [[block]]'lar ise bütün dünyaya aynı adımda kalmak için daha çok zaman tanır.

Her [[block]] ile yeni bitcoin'ler yaratılır, ama bu miktar yaklaşık dört yılda bir yarıya iner. Buna [[halving]] denir. Bu yüzden hiçbir zaman **21 milyondan** fazla bitcoin olmayacak.

Ethereum'da böyle bir tavan yok. Yeni [[ether]], ağı güvende tutan [[validator]]'lara ödenir; aynı anda her ücretin bir kısmı yok edilir. Toplamın nasıl değişeceği, bu ikisinden hangisinin büyük olduğuna bağlıdır.`,
        intermediate: `**"Block" süresi.** Bitcoin'de [[difficulty]], ortalamayı 10 dakika civarında tutmak için her 2.016 [[block]]'ta bir ayarlanır. Ethereum zamanı 12 saniyelik sabit [[slot]]'lara böler; her birinde seçilmiş tek bir [[proposer]] vardır.

**Arz.** Bitcoin'de [[block-reward]] 50 BTC ile başladı ve her 210.000 [[block]]'ta yarılanıyor: 25, 12.5, 6.25 ve Nisan 2024'ten beri 3.125 BTC. Bunların hepsini toplarsan 21 milyonun hemen altında bir sayı çıkar; bu sayıya 2140 yılı civarında ulaşılacak. Ondan sonra [[miner]]'lar yalnızca ücretlerle ödeme alacak.

Ethereum, [[validator]]'lara [[staking]] ödülü olarak yeni [[ether]] basar. Miktar ne kadar [[stake]] olduğuna bağlıdır ve yılda arzın %1'inin biraz altındadır (kabaca, 2026 itibarıyla). Öbür tarafta [[eip-1559]] her [[transaction]]'ın "base fee" kısmını yakar. Ağ yoğunken yakılan miktar basılanı geçebilir ve arz azalır; ağ sakinken arz yavaşça artar.

Birinin politikası önceden sabitlenmiştir ve kullanımdan bağımsızdır. Diğerininki, kaç kişinin [[stake]] ettiğine ve zincirin ne kadar kullanıldığına göre değişir.`,
        expert: `Bitcoin'de \`h\` yüksekliğindeki "subsidy" \`50 BTC >> ⌊h / 210.000⌋\` kadardır ve tam sayı [[satoshi]] cinsinden hesaplanır (1 BTC = 10^8). Bu yüzden toplam 20.999.999,9769 BTC'ye yakınsar ve "subsidy" 33 [[halving]] sonra sıfıra iner. [[block]] aralıkları 10 dakikalık hedefin etrafında üstel dağılır; [[target]] her 2.016 [[block]]'ta bir, ayar başına en çok 4 katla sınırlı olarak yeniden belirlenir. Kesinleşme olasılıksaldır: bir [[reorg]] ihtimali derinlikle geometrik olarak düşer; 6 [[confirmation]] alışkanlığı buradan gelir.

Ethereum'un 12 saniyelik [[slot]]'u bir ortalama değil, bir takvimdir: kaçırılan bir [[slot]]'ta [[block]] olmaz. [[finality]], art arda iki [[epoch]] "justified" olduğunda [[casper-ffg]] ile gelir; normal işleyişte yaklaşık 12,8 dakika.

Basım, toplam [[stake]]'in kareköküyle ölçeklenir: [[stake]] edilen [[ether]] başına taban ödül \`1 / √(toplam stake)\` ile orantılıdır, dolayısıyla toplam basım \`√(toplam stake)\` ile büyür. Bütün [[ether]]'in üçte birinden biraz fazlası [[stake]] edilmişken (2026 itibarıyla) bu, yılda bir milyon ETH mertebesindedir. Net değişim:

\`Δarz = basım − Σ (baseFee × gasUsed) − blob ücreti yakımı\`

Protokol düzeyinde bir üst sınır yoktur; politika daha önce "hard fork"'larla değişti ([[proof-of-work]] dönemindeki ödül 5 → 3 → 2 ETH oldu) ve yine değişebilir. Bitcoin'in takvimi de ancak bir [[consensus]] kuralı değişikliğiyle değişebilir; topluluğu bunu masada bile görmüyor.`,
      },
    },
    summary: {
      title: 'Yan yana',
      alt: 'Her iki tarafta arkadan öne üç küçük model var. Bitcoin: birkaç ayrı coin pulu, asma kilitli kısa bir yığın, yarılanma merdiveni. Ethereum: bir hesap sütunu, bir contract makinesi, yanan bir çukurun yanında bir arz tankı.',
      body: {
        beginner: `Aklında kalması gereken üç fark:

- **Sahiplik nasıl kaydediliyor.** Bitcoin: nakit gibi ayrı ayrı coin'ler. Ethereum: banka uygulaması gibi, hesap başına tek bir bakiye.
- **Ne programlanabiliyor.** Bitcoin: bir coin'i kimin harcayabileceğine dair basit kurallar. Ethereum: her türlü program; bedeli adım adım [[gas]] ile ödenir.
- **Kaç coin var.** Bitcoin: asla 21 milyondan fazla değil. Ethereum: sabit bir sınır yok; yeni coin basılır, ücretler yakılır.

Hiçbiri "daha iyi" değil. Bitcoin işini küçük tutar ki güvenmesi kolay olsun. Ethereum, üzerine uygulama kurulabilsin diye daha fazla karmaşıklığı kabul eder. Sonraki derslerde önce başka zincirlere, sonra o uygulamalara bakacağız.`,
        intermediate: `- **Defter:** [[utxo]] modeli ve [[account-model]]. Bir yanda harcanıp yeniden yaratılan coin'ler, öbür yanda yerinde güncellenen bakiyeler.
- **Programlar:** döngüsü olmayan küçük bir dil olan [[bitcoin-script]] ve her [[smart-contract]]'ı çalıştıran [[evm]].
- **Ücretler:** bayt başına ücret oranı, tamamı [[miner]]'a; karşısında yakılan "base fee" ve bahşişten oluşan [[gas]] ücreti.
- **"Block" süresi:** yaklaşık 10 dakika ve 12 saniyelik [[slot]]'lar.
- **Mutabakat:** [[proof-of-work]] ve [[proof-of-stake]].
- **Arz:** 21 milyon sınırı ve her 210.000 [[block]]'ta bir [[halving]]; karşısında [[stake]] edenlere basım eksi yakım.

Her tercih amaçtan doğar. Sağlam para olmak isteyen bir zincir kuralları az ve öngörülebilir tutar. Uygulama barındırmak isteyen bir zincirin ise zengin bir duruma ve hesaplamayı ücretlendirmenin bir yoluna ihtiyacı vardır.`,
        expert: `- **Durum:** yerelde tutulan, [[block-header]]'da taahhüt edilmeyen [[utxo]] kümesi; karşısında her [[block-header]]'da \`stateRoot\` bulunan hesap tabanlı [[state-trie]].
- **Doğrulama:** girdi başına betik değerlendirmesi, doğal olarak paralel; karşısında ortak durum üzerinde sıralı [[evm]] çalıştırması.
- **Dil:** [[turing-complete]] olmayan, maliyeti statik olarak sınırlı [[bitcoin-script]]; karşısında çalışma anında [[gas]] ile sınırlanan 256 bitlik "stack" makinesi.
- **Ücret piyasası:** 4M "weight unit" sınırı altında ücret oranına göre "first-price"; karşısında "gas limit" altında [[eip-1559]] "base fee" (yakılır) artı "priority fee".
- **Kesinlik:** biriken işe dayalı, olasılıksal [[finality]]; karşısında [[casper-ffg]] ile [[stake]]'in üçte ikisine dayalı, ekonomik [[finality]].
- **Para politikası:** \`50 >> ⌊h / 210.000⌋\` ve \`basım(√stake) − yakım\`.

Bu çizgiler mutlak değil. Bitcoin, üzerine kurulan katmanlarla (ödeme kanalları, "sidechain"'ler, zincir dışında doğrulanan kanıt sistemleri) programlanabilirlik kazanıyor; Ethereum da çalıştırmanın büyük kısmını taban zincirde mutabakata varan "rollup"'lara taşıyor. İki eğilim de taban katmanı temkinli tutuyor ve hareketi yukarı itiyor.`,
      },
    },
  },
};

export default content;
