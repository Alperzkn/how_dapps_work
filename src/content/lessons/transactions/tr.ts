import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[wallet]]'ı -> "wallet"'ı.
// English technical words without a glossary entry are quoted by hand: "base fee".

const content: LessonContent = {
  labels: {
    alice: "Alice'in wallet'ı",
    keyStays: 'key burada kalır',
    privateKey: 'private key',
    privateKeyNote: '256 bit, gizli',
    publicKey: 'public key',
    verify: 'imza geçerli',
    address: 'address',
    transaction: 'transaction',
    txSummary: 'alıcı Bob · 1 ETH',
    signature: 'signature',
    signedTx: 'imzalı transaction',
    firstNode: 'ilk node (RPC)',
    relay: "node'lar birbirine iletir",
    mempool: 'mempool',
    yourTx: "Alice'in tx'i",
    highFee: 'çok ödeyen önce girer',
    lowFee: 'az ödeyen bekler',
    tip: 'tip',
    newBlock: 'yeni block',
    producer: 'block üreticisi',
    burned: 'base fee: yakılır',
    tipTo: 'tip → üretici',
    confirmation: 'confirmation',
    confirmations: 'confirmation',
    bob: 'Bob',
  },
  steps: {
    keys: {
      title: '"Wallet" bir anahtar çiftidir',
      alt: 'Alice\'in wallet\'ının önünde parlayan bir anahtar duruyor. Anahtardan bir asma kilide, asma kilitten de bir isim levhasına ok çıkıyor: private key, public key, address.',
      body: {
        beginner: `Bir [[wallet]] içinde coin durmaz. Coin dediğin şey ortak [[ledger]] üzerindeki satırlardır. [[wallet]]'ın sakladığı şey, o satırların sana ait olduğunu kanıtlayan bir sırdır.

Bu sırrın adı [[private-key]]: posta kutunu açan tek anahtar gibi düşün. [[wallet]] bundan bir [[public-key]] hesaplar; o da kutunun kilidi gibidir. Ondan da bir [[address]] çıkar; bu, sana ödeme yapsınlar diye insanlara verdiğin kutu numarasıdır.

Oklar tek yönlüdür. [[address]]'ini herkes görebilir ama kimse ondan geriye gidip anahtarını bulamaz. [[private-key]]'i kaybedersen coin'lerine bir daha ulaşamazsın; başkasının eline geçerse artık onundur.`,
        intermediate: `[[wallet]], anahtarları saklayan ve onlarla imza atan bir yazılım ya da cihazdır. Bakiyeler ise zincirin üzerinde, bir [[address]] altında durur.

- [[private-key]], rastgele seçilmiş 256 bitlik bir sayıdır.
- [[public-key]] ondan hesaplanır. Tersine gitmek pratikte mümkün değildir.
- [[address]], [[public-key]]'in kısa halidir: Ethereum'da 20 bayt; \`0x\` ile başlar, ardından 40 "hex" karakter gelir.

Çoğu [[wallet]] her anahtarı tek tek yedeklemeni istemez. 12 ya da 24 kelimelik tek bir [[seed-phrase]] üretir ve bütün anahtarları ondan türetir; yani asıl sır o kelimelerdir. "Şifremi unuttum" bağlantısı yoktur, çünkü kopyası senden başka kimsede durmaz.`,
        expert: `Bitcoin de Ethereum da secp256k1 eliptik eğrisini kullanır (256 bitlik bir asal cisim üzerinde \`y² = x³ + 7\`); eğrinin taban noktası \`G\`'nin mertebesi \`n\` asaldır.

- [[private-key]]: \`1 ≤ d < n\` aralığında bir \`d\` tam sayısı.
- [[public-key]]: \`Q = d·G\` eğri noktası; \`X ‖ Y\` olarak 64 bayt, sıkıştırılmış halde 33 bayt. \`Q\`'dan \`d\`'yi bulmak eliptik eğri ayrık logaritma problemidir; bilinen en iyi saldırılar yaklaşık 2^128 işlem gerektirir.
- Ethereum'da [[address]]: \`keccak256(X ‖ Y)\` çıktısının son 20 baytı. Bitcoin'in P2PKH ve P2WPKH adresleri [[public-key]]'i önce SHA-256, sonra RIPEMD-160 ile özetler ve sonucu Base58Check ya da Bech32 ile kodlar.

[[seed-phrase]], BIP-39'u izler: 128 ile 256 bit arası entropi ve bir sağlama toplamı, 2048 kelimelik bir listeden kelimelere eşlenir; ardından PBKDF2-HMAC-SHA512 (2048 tur) ile 512 bitlik bir "seed" elde edilir. BIP-32 bu "seed"'den bir anahtar ağacı türetir; ilk Ethereum hesabı genellikle \`m/44'/60'/0'/0/0\` yolundadır.

Buraya kadar anlatılan, dışarıdan sahipli hesaptır ("externally owned account"). Bir [[smart-contract]] hesabının [[address]]'i vardır ama [[private-key]]'i yoktur.`,
      },
      code: {
        lang: 'JavaScript (ethers v6)',
        source: `import { Wallet, keccak256, dataSlice, getAddress } from "ethers";

const wallet = Wallet.createRandom();      // BIP-39 kelimeleri -> BIP-32 anahtarı
wallet.mnemonic.phrase;                    // 12 kelime
wallet.privateKey;                         // d, 32 bayt

const Q = wallet.signingKey.publicKey;     // 0x04 ‖ X ‖ Y, 65 bayt
const hash = keccak256(dataSlice(Q, 1));   // baştaki 0x04 atılır
getAddress(dataSlice(hash, 12));           // son 20 bayt == wallet.address`,
      },
    },
    sign: {
      title: '"Transaction" imzalamak',
      alt: 'Wallet\'ın önünde bir transaction formu duruyor. Anahtar formun üstüne bir mühür basıyor; yanındaki asma kilit yeşil ışık yakıyor: imza geçerli.',
      body: {
        beginner: `Alice Bob'a ödeme yapmak istiyor. [[wallet]]'ı kısa bir form doldurur: para kime gidecek, ne kadar gidecek. Bu formun adı [[transaction]].

Sonra [[wallet]] formu Alice'in [[private-key]]'iyle mühürler. Bu mühre [[digital-signature]] denir. Yalnızca Alice'te bulunan bir yüzükle basılmış mum mühür gibidir, ama bir farkla: mühür *tam bu form için* üretilir. Tek bir rakamı değiştirirsen mühür artık uymaz; söküp başka bir forma da yapıştıramazsın.

Mührü Alice'in [[public-key]]'iyle herkes kontrol edebilir. Ama [[private-key]] olmadan kimse aynısını basamaz. Anahtar [[wallet]]'tan hiç çıkmaz; dışarı çıkan yalnızca mühürlü formdur.`,
        intermediate: `[[transaction]], imzalanmış küçük bir mesajdır. Ethereum'da şunları söyler:

- **to**: alıcının [[address]]'i;
- **value**: gönderilecek miktar;
- **nonce**: birazdan anlatılan bir sayaç;
- **ücret sınırları**: gönderenin en fazla ne kadar ödemeye razı olduğu.

[[wallet]] bu alanların [[hash]]'ini alır ve o [[hash]]'i [[private-key]] ile imzalar. [[digital-signature]] iki şeyi kanıtlar: mesajı o anahtarın sahibi onaylamıştır ve imzadan sonra içinde hiçbir şey değişmemiştir.

[[account-nonce]], bu hesabın o güne kadar gönderdiği [[transaction]] sayısıdır. Her yeni [[transaction]] sıradaki sayıyı kullanmak zorundadır: 0, 1, 2 diye gider. Böylece sıraları kesinleşir ve kimse imzalı bir ödemeyi kopyalayıp ikinci kez gönderemez.`,
        expert: `Bir [[eip-1559]] [[transaction]]'ı (tip \`0x02\`) şu alanları taşır: \`chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList\` ve imza \`yParity, r, s\`. İmzalanan özet \`h = keccak256(0x02 ‖ rlp([chainId, …, accessList]))\` değeridir.

\`d\` anahtarıyla [[ecdsa]] imzası şöyle atılır: gizli bir \`k\` sayısı seçilir, \`R = k·G\` hesaplanır; \`r = R.x mod n\` ve \`s = k⁻¹(h + r·d) mod n\`. Doğrulayan taraf \`R' = (h·s⁻¹)·G + (r·s⁻¹)·Q\` değerini hesaplar ve \`R'.x ≡ r (mod n)\` ise imzayı kabul eder.

Önemli ayrıntılar:

- \`k\` gizli kalmalı ve asla tekrar etmemelidir. Aynı \`k\` ile atılmış iki imza \`d\`'yi açığa çıkarır. Bu yüzden \`k\` deterministik olarak türetilir (RFC 6979).
- [[transaction]] içinde gönderen alanı yoktur. [[node]]'lar \`(h, r, s, yParity)\` değerlerinden \`Q\`'yu geri çıkarır, ondan da [[address]]'i türetir.
- \`(r, n − s)\` de geçerli bir imzadır; bu yüzden Ethereum yalnızca \`s ≤ n/2\` olanı kabul eder (EIP-2). Aksi halde üçüncü bir kişi [[transaction]]'ın [[hash]]'ini değiştirebilirdi.
- \`chainId\` özetin içindedir (EIP-155 ile gelen tekrar koruması); dolayısıyla bir imza başka bir zincirde yeniden kullanılamaz.

[[account-nonce]], [[transaction]] çalıştırıldığı anda gönderenin "state" içindeki "nonce" değerine eşit olmalıdır. Daha küçüğü reddedilir, daha büyüğü sırasını bekler.`,
      },
      code: {
        lang: 'EIP-1559 transaction (tip 0x02)',
        source: `0x02 ‖ rlp([
  chainId,               // 1 = Ethereum mainnet
  nonce,                 // 7: gönderenin 8. transaction'ı
  maxPriorityFeePerGas,  // 2 gwei tip
  maxFeePerGas,          // 30 gwei üst sınır
  gasLimit,              // düz bir transfer için 21000
  to,                    // 20 baytlık address
  value,                 // wei cinsinden: 1 ETH = 10^18 wei
  data,                  // düz transferde boş
  accessList,
  yParity, r, s          // imza
])`,
      },
    },
    broadcast: {
      title: 'Ağa duyurmak',
      alt: 'İmzalı transaction küçük bir paket olarak Alice\'in wallet\'ından çıkıyor, ilk node\'a atlıyor; o node da kopyalarını yanındaki node\'lara iletiyor. Anahtar wallet\'ta kalıyor.',
      body: {
        beginner: `Mühürlü formun artık [[ledger]]'ı tutanlara ulaşması gerekiyor. [[wallet]] onu ağdaki bilgisayarlardan birine, yani bir [[node]]'a verir.

O [[node]] mührü kontrol eder. Mühür sağlamsa bağlı olduğu [[node]]'lara haber verir; onlar da kontrol edip kendi komşularına iletir. Bir iki saniye içinde dünyanın dört bir yanındaki bilgisayarlar Alice'in ödemesinden haberdar olur.

Yola çıkanın ne olduğuna dikkat et: yalnızca imzalı [[transaction]]. [[private-key]] ise [[wallet]]'ta kaldı. Güvenmediğin bilgisayarlar üzerinden ödeme gönderebilmenin sırrı budur.`,
        intermediate: `[[wallet]] çoğu zaman kendisi bir [[node]] değildir. İmzalı [[transaction]]'ı, [[rpc]] denen bir arayüz üzerinden bir [[node]]'a yollar; hangi [[node]] olacağını [[wallet]]'ın ağ ayarları belirler.

Bu ilk [[node]] bir şeyi kabul etmeden önce temel kontrolleri yapar:

- [[digital-signature]] geçerli mi?
- [[account-nonce]] daha önce kullanılmış mı?
- hesap, gönderilen miktarı ve en yüksek ücreti karşılayabiliyor mu?

Her şey yolundaysa [[transaction]]'ı saklar ve "peer"'larına duyurur; onlar da aynı kontrolleri yapıp iletir. Haberin bu şekilde yayılmasına [[gossip]] denir.

[[ledger]] üzerinde henüz hiçbir şey değişmedi. Ağ bu [[transaction]]'ı biliyor ama o daha bir [[block]] içinde değil.`,
        expert: `[[wallet]], imzalı ham baytları [[json-rpc]] metodu \`eth_sendRawTransaction\` ile gönderir; dönen değer [[transaction]]'ın [[hash]]'idir, yani imzalı kodlamanın tamamının \`keccak256\` özeti. Bu [[hash]] daha [[block]]'a girmeden bilinir; "receipt" ise ancak girdikten sonra oluşur.

Ethereum'un "execution layer" katmanında [[transaction]]'lar devp2p üzerinden yayılır (\`eth\` protokolü). Bir [[node]], [[transaction]]'ın tamamını "peer"'larının küçük bir kısmına yollar; geri kalanına yalnızca \`NewPooledTransactionHashes\` ile [[hash]]'ini duyurur. Elinde olmayan "peer", \`GetPooledTransactions\` ile ister. Bitcoin her [[transaction]]'ı \`inv\` ile duyurur; elinde olmayan "peer" \`getdata\` ile yanıt verir ve \`tx\` mesajını alır.

Bir [[node]]'un [[transaction]]'ı kabul edip iletmeden önce baktıkları: kodlama düzgün mü, imzadan gönderen çıkarılabiliyor mu, \`nonce ≥\` hesabın "nonce" değeri mi, \`balance ≥ gasLimit × maxFeePerGas + value\` mı, \`gasLimit ≥\` "intrinsic" [[gas]] mı (düz bir transfer için 21000) ve ücret o [[node]]'un kendi alt sınırını geçiyor mu.

Herkese açık havuzdaki bir [[transaction]], çalıştırılmadan önce herkes tarafından görülür. "Front-running" ve "sandwich" saldırılarını mümkün kılan budur; bazı kullanıcıların [[transaction]]'larını özel bir "relay"'e ya da doğrudan "block builder"'lara göndermesinin nedeni de budur.`,
      },
      code: {
        lang: 'JSON-RPC',
        source: `// istek: imzalı tip-2 transaction baytları
{ "jsonrpc": "2.0", "id": 1,
  "method": "eth_sendRawTransaction",
  "params": ["0x02f8…"] }

// yanıt: transaction hash
{ "jsonrpc": "2.0", "id": 1, "result": "0x9fc7…" }`,
      },
    },
    mempool: {
      title: '"Mempool" içinde beklemek',
      alt: 'Açık bir tepside altı transaction yan yana bekliyor; her biri, teklif ettiği tip kadar yüksek bir ayağın üstünde. Alice\'in transaction\'ı üçüncü sırada parlıyor.',
      body: {
        beginner: `Alice'in ödemesi henüz [[ledger]]'a yazılmadı. Herkesin ödemesiyle birlikte bir bekleme odasında duruyor. Bu bekleme odasının adı [[mempool]].

Her yeni [[block]]'ta yer sınırlıdır; herkes aynı anda giremez. Her [[transaction]] küçük bir ücret teklif eder ve çok teklif edenler önce seçilir. Bahşişi yüksek olanın öne geçtiği bir kuyruk gibi.

Ağ sakinken küçük bir ücretle hemen girersin. Yoğunken ya daha fazla ödersin ya da daha uzun beklersin.`,
        intermediate: `Her [[node]] kendi [[mempool]]'unu tutar: duyduğu, geçerli olan ama henüz bir [[block]]'a girmemiş [[transaction]]'lar. Tek bir resmi liste yoktur; iki [[node]]'un elindeki küme birbirinden biraz farklı olabilir.

Ethereum'da yapılan iş [[gas]] ile ölçülür. Düz bir transfer 21.000 [[gas]] harcar. [[gas-fee]], harcanan [[gas]] miktarı çarpı birim fiyattır; fiyat gwei ile söylenir (bir ETH'nin milyarda biri). [[eip-1559]] ile birlikte bu fiyat iki parçadan oluşur:

- protokolün belirlediği **"base fee"**: [[block]]'lar doluyken yükselir, boşken düşer;
- [[block]]'u üretene giden **"tip"**.

[[block]] üretenler "tip"'e göre sıralar; yani yüksek "tip" kısa bekleyiş demektir. Düşük ücret yüzünden takılan bir [[transaction]] değiştirilebilir: **aynı** [[account-nonce]] ve daha yüksek bir ücretle yenisini imzalarsın; ikisinden yalnızca biri [[block]]'a girebilir.`,
        expert: `[[mempool]], [[consensus]]'un parçası değil, her [[node]]'un kendi politikasıdır. Neyi tutacağına, ne kadar tutacağına ve neyi atacağına her [[node]] kendi karar verir; Bitcoin Core'da varsayılan sınır 300 MB, bekleme süresi 14 gündür.

[[gas]] birimi başına [[eip-1559]] fiyatlaması:

- \`baseFeePerGas\`, her [[block]] için protokol tarafından belirlenir. Hedef, "gas limit"'in yarısıdır ve \`baseFee' = baseFee × (1 + (gasUsed − target) / target / 8)\` olur; yani bir [[block]]'ta en fazla %12,5 değişir.
- [[proposer]], [[gas]] başına \`min(maxPriorityFeePerGas, maxFeePerGas − baseFee)\` alır.
- \`maxFeePerGas < baseFee\` olan bir [[transaction]], "base fee" düşene kadar [[block]]'a giremez.

Havuzun yapısını "nonce" kuralları belirler. Geth, hemen çalıştırılabilir olan "pending" [[transaction]]'ları, [[account-nonce]] sırasında boşluk bulunan "queued" olanlardan ayrı tutar; boşluk dolmadan "queued" bir [[transaction]] çalışamaz. Aynı "nonce" ile gönderilen yenisi, Geth'in varsayılan ayarlarında iki ücret alanını da en az %10 artırmalıdır.

Sıralama [[block]]'u kuranın tercihidir. Etkin "tip"'e göre sıralamak işin basit halidir; pratikte Ethereum [[block]]'larının çoğunu, MEV elde edecek şekilde sıralama yapan ve [[proposer]]'ın [[slot]]'u için teklif veren uzman "builder"'lar kurar.`,
      },
      code: {
        lang: 'Python (EIP-1559 base fee)',
        source: `ELASTICITY = 2
MAX_CHANGE_DENOMINATOR = 8

def next_base_fee(base_fee, gas_used, gas_limit):
    target = gas_limit // ELASTICITY
    if gas_used == target:
        return base_fee
    delta = base_fee * abs(gas_used - target) // target // MAX_CHANGE_DENOMINATOR
    if gas_used > target:
        return base_fee + max(delta, 1)   # dolu block: en fazla +%12,5
    return base_fee - delta               # boş block: en fazla -%12,5`,
      },
    },
    included: {
      title: 'Bir "block" içine girmek',
      alt: 'En yüksek tip veren üç transaction, Alice\'inki de dahil, tepsiden çıkıp zincirin ucundaki yeni block\'un üstüne geçmiş. Yanında block üreticisi duruyor; diğer transaction\'lar sonraki block için tepside bekliyor.',
      body: {
        beginner: `Belli aralıklarla katılımcılardan biri [[ledger]]'ın sıradaki sayfasını yazma hakkı kazanır. Bekleme odasından, ücreti yüksek olandan başlayarak [[transaction]]'ları seçer ve yeni bir [[block]]'a yerleştirir.

Alice'in ödemesi içeri girdi. [[block]] herkese gönderilir, her [[node]] onu kontrol eder ve kendi kopyasını günceller: Alice'in bakiyesi azalır, Bob'unki artar.

Alice'in ödediği ücret, [[block]]'taki o yerin bedelidir. Sığmayan ödemeler bekleme odasında kalır ve bir sonraki sefere yeniden şansını dener.`,
        intermediate: `[[block]] üreticisi (Bitcoin'de bir [[miner]], Ethereum'da bir [[validator]]) kendi [[mempool]]'undan [[transaction]]'ları seçer, sırayla çalıştırır ve ortaya çıkan [[block]]'u yayınlar. Ethereum 12 saniyede bir, Bitcoin yaklaşık 10 dakikada bir [[block]] üretir.

Alice'in [[transaction]]'ı çalışınca aynı anda üç şey olur:

- 1 ETH onun hesabından Bob'un hesabına geçer;
- [[account-nonce]] 7'den 8'e çıkar;
- [[gas-fee]] kesilir: 21.000 [[gas]] × ("base fee" + "tip").

"Base fee" 20 gwei, "tip" 2 gwei ise bu 21.000 × 22 = 462.000 gwei, yani 0,000462 ETH eder. "Base fee" kısmı yok edilir ("burn"); üreticiye yalnızca "tip" kalır.

Diğer bütün [[node]]'lar [[block]]'u baştan çalıştırır ve aynı bakiyelere ulaşmak zorundadır; ulaşamayan [[block]]'u reddeder.`,
        expert: `Bir [[transaction]] çalıştırılırken istemci şunları kontrol eder: \`tx.nonce == account.nonce\`, \`maxFeePerGas ≥ baseFeePerGas\` ve \`balance ≥ gasLimit × maxFeePerGas + value\`. Ardından \`gasLimit × effectiveGasPrice\` tutarını peşin keser; burada \`effectiveGasPrice = baseFeePerGas + min(maxPriorityFeePerGas, maxFeePerGas − baseFeePerGas)\`.

Çalışma bitince kullanılmayan [[gas]] iade edilir; yani nihai [[gas-fee]] \`gasUsed × effectiveGasPrice\` olur. Bunun \`gasUsed × baseFeePerGas\` kadarı yakılır, kalanı [[block]]'un \`feeRecipient\` adresine yazılır.

Çalışma "revert" etse bile "nonce" artar ve ücret ödenir. "Revert", çağrının "state" üzerindeki değişikliklerini geri alır; [[transaction]]'ın [[block]]'a girmiş olduğu gerçeğini değil.

RPC üzerinden dönen "receipt" şunları içerir: \`status\`, \`gasUsed\`, \`cumulativeGasUsed\`, \`effectiveGasPrice\` ve \`logs\`. [[block-header]] sonucu \`stateRoot\`, \`transactionsRoot\` ve \`receiptsRoot\` ile taahhüt eder; [[block]]'u baştan çalıştırıp farklı bir kök bulan [[full-node]] onu reddeder. \`eth_getTransactionReceipt\`, [[transaction]] bir [[block]]'a girene kadar \`null\` döner.`,
      },
      code: {
        lang: 'Örnek hesap',
        source: `gasUsed              = 21000
baseFeePerGas        = 20 gwei
maxPriorityFeePerGas =  2 gwei
maxFeePerGas         = 30 gwei

priorityFee = min(2, 30 - 20)   =      2 gwei
ücret       = 21000 × (20 + 2)  = 462000 gwei   // 0,000462 ETH
yakılan     = 21000 × 20        = 420000 gwei
proposer'a  = 21000 × 2         =  42000 gwei`,
      },
    },
    confirmations: {
      title: '"Confirmation": ödeme ne zaman kesinleşir?',
      alt: 'Alice\'in transaction\'ını içeren block\'un ardına yeni block\'lar birer birer ekleniyor; her biri bir confirmation daha olarak numaralanmış. Bob\'un wallet\'ı parlıyor ve yanında coin\'ler duruyor.',
      body: {
        beginner: `[[block]] ulaşır ulaşmaz Bob ödemeyi görebilir. Ama [[ledger]]'ın en yeni sayfası aynı zamanda geri alınması en kolay olan sayfadır; bu yüzden değerli bir şey söz konusuysa Bob biraz bekler.

Alice'in [[block]]'undan sonra eklenen her [[block]] bir [[confirmation]] daha demektir. Her biri ödemeyi biraz daha derine gömer: onu geri almak isteyen, üstündeki bütün [[block]]'ları da baştan yapmak zorunda kalır.

Bir kahve için tek [[confirmation]] fazlasıyla yeter. Bir ev için daha fazlasını beklersin.`,
        intermediate: `En yeni [[block]]'taki bir [[transaction]]'ın 1 [[confirmation]]'ı vardır. Üstüne kurulan her [[block]] bir tane daha ekler.

Neden beklenir? Arada bir aynı yükseklikte iki [[block]] ortaya çıkar ve ağ bunlardan yalnızca birini tutar. Bırakılan [[block]]'taki [[transaction]], [[mempool]]'a geri döner ve çoğunlukla sonraki bir [[block]]'a girer; ama bir an için onaylanmış görünmüş, sonra bu onay geri alınmıştır.

Ne kadar bekleneceği zincire göre değişir:

- **Bitcoin**: yaygın kural 6 [[confirmation]], yani yaklaşık bir saat.
- **Ethereum**: bir [[block]], ortaya çıktıktan yaklaşık on beş dakika sonra "finalized" olur. O andan sonra geri alınması, saldırganların çok büyük bir teminatı gözden çıkarmasını gerektirir.

Borsalar kendi eşiklerini belirler; küçük ya da daha az güvenli zincirlerde bu eşiği yükseltirler.`,
        expert: `[[proof-of-work]] ile [[finality]] olasılıksaldır. [[hashrate]] payı \`q\` olan ve \`z\` [[block]] geride kalan bir saldırganın yetişme olasılığı yaklaşık \`(q/p)^z\` kadardır; burada \`p = 1 − q\`. \`q = 0.1\` ve \`z = 6\` için bu %0,1'in altındadır. Hiçbir zaman sıfıra inmez; \`q ≥ 0.5\` için ise 1'dir.

Ethereum'un [[proof-of-stake]] tasarımı buna açık bir [[finality]] ekler. Zaman 12 saniyelik [[slot]]'lara ve 32 [[slot]]'luk [[epoch]]'lara (6,4 dakika) bölünür. [[casper-ffg]], toplam [[stake]]'in üçte ikisini elinde tutan [[validator]]'lar oy verdiğinde bir [[epoch]]'un "checkpoint"'ini "justified" sayar; hemen üstündeki "checkpoint" de "justified" olunca onu "finalized" yapar. Dolayısıyla bir [[block]], ortaya çıktıktan iki ila üç [[epoch]] sonra, yani kabaca 13 ile 19 dakika arasında kesinleşir. Onu geri almak, [[stake]]'in en az üçte birinin çelişen oylar imzalamasını ve bu [[stake]]'i [[slashing]] ile kaybetmesini gerektirir.

Uygulamalar göze alacakları riski RPC arayüzündeki [[block]] etiketleriyle seçer: \`latest\` (hâlâ geri alınabilir), \`safe\` ("justified") ve \`finalized\`.

Bir [[reorg]] o [[block]]'u zincirden çıkarırsa [[transaction]] kaybolmaz. [[mempool]]'a geri döner ve [[account-nonce]] başka bir [[transaction]] tarafından kullanılmadığı sürece geçerli kalır.`,
      },
      code: {
        lang: 'JavaScript (ethers v6)',
        source: `const tx = await wallet.sendTransaction({ to: bob, value: parseEther("1") });

const receipt = await tx.wait(1);   // 1 confirmation: artık bir block içinde
await tx.wait(6);                   // 6 block derinde

const final = await provider.getBlock("finalized");
if (receipt.blockNumber <= final.number) {
  // finalized checkpoint'in gerisinde: ancak slashing gerektiren bir hata geri alabilir
}`,
      },
    },
  },
};

export default content;
