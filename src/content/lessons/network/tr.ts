import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[node]]'lar -> "node"'lar.
// English technical words without a glossary entry are quoted by hand: "peer".

const content: LessonContent = {
  labels: {
    sameCopy: "Her node'da aynı ledger",
    noBoss: 'merkezi sunucu yok',
    fullNode: 'full node',
    lightNode: 'light node',
    fullDetail: "her block'u doğrular",
    lightDetail: 'header + kanıt',
    biggest: 'en büyük node',
    biggestDown: 'en büyük node: kapalı',
    offlineShort: 'kapalı',
    stillWhole: 'ledger hâlâ eksiksiz',
    lost: 'tam kopya kalmadı',
    newTx: 'yeni transaction',
    peers: "her node peer'larına iletir",
    everyone: 'herkese ulaştı',
    hop: 'adım',
    hopsUnit: 'adım',
    newBlock: 'yeni block',
    check1: 'imzalar',
    check2: 'bakiyeler',
    check3: "önceki block'a bağ",
    accepted: 'geçerli: ilet',
    gotIt: 'ona ulaşır',
    cheater: 'hileci node',
    rejected: 'reddedildi',
    notForwarded: 'iletilmedi',
    unaware: 'ona hiç ulaşmaz',
    badCount: 'kötü block:',
    score: 'peer score',
    standingOk: 'hâlâ dinliyorlar',
    standingPruned: 'daha az güveniyorlar',
    standingCut: 'bağlantı kesildi',
    ignored: 'artık dinlemiyor',
    tie: 'aynı anda iki block',
    tieHold: 'beraberlik: kimse dal değiştirmez',
    allOnA: "A daha ağır: herkes A'yı izliyor",
    allOnB: "B daha ağır: herkes B'yi izliyor",
    work: 'iş',
    stale: 'stale',
    reorg: 'reorg · derinlik',
    nodesUnit: 'node',
    finalized: 'finalized',
    tryCopies: "Dene: node'ları kapat",
    offlineCount: 'Kapalı node',
    shutBig: "En büyük node'u kapat",
    fullLeft: 'Açık full node',
    lightLeft: 'Açık light node',
    ledgerState: 'Ledger',
    available: 'eksiksiz',
    unavailable: 'tam kopya yok',
    tryGossip: 'Dene: haberin nereden başlayacağını seç',
    originNode: 'Başlangıç',
    nodeName: 'Node',
    lightTag: 'light',
    fanout: 'Node başına peer',
    sendTx: 'Transaction gönder',
    hopsNeeded: 'Adım',
    afterEachHop: 'Adım adım ulaşılan node',
    links: 'bağlantı',
    tryVerify: 'Dene: block hangi kuralı çiğnesin?',
    blockIs: 'Block',
    defectNone: 'Hiçbiri',
    defectSignature: 'İmza',
    defectBalance: 'Bakiye',
    defectParent: 'Ebeveyn bağı',
    decision: 'Karar',
    forwards: "iletildiği peer:",
    drops: 'atıldı',
    evidence: 'Karşılaştırılan',
    sigMismatch: 'imza ≠ gönderenin anahtarı',
    tryReject: 'Dene: kötü block göndermeyi sürdür',
    sendBad: 'Bir kötü block daha gönder',
    reset: 'Sıfırla',
    badSentStat: 'Gönderilen',
    neighbours: 'Komşuları',
    tryForks: 'Dene: sıradaki block nereye düşsün?',
    landA: "A'ya block ekle",
    landB: "B'ye block ekle",
    nodesOn: 'İzleyen',
    workStat: 'İş',
    reorgDepth: 'Reorg derinliği',
    staleStat: 'Stale',
  },
  steps: {
    copies: {
      title: 'Çok kopya var, merkez yok',
      alt: 'Bir haritanın üzerine dağılmış dokuz node kulesi kesikli çizgilerle birbirine bağlı; biri diğerlerinden uzun. Her birinin üstünde aynı küçük block zinciri süzülüyor; iki küçük kule bunun daha ince bir halini taşıyor. Kapatılan kuleler soluk bir siluete dönüşüyor.',
      body: {
        beginner: `Bir banka [[ledger]]'ını kendi bilgisayarlarında tutar. O bilgisayarlar çökerse ya da banka bir rakamı değiştirmeye karar verirse senin elinden bir şey gelmez.

[[blockchain]]'de böyle bir merkez yoktur. Dünyanın dört bir yanındaki binlerce bilgisayar, yani [[node]]'lar, defterin tamamını ayrı ayrı tutar. Farklı ülkelerdeki farklı insanlara aittirler ve hiçbiri patron değildir.

Birini kapatırsan diğerleri devam eder. Kontrolün böyle dağıtılmasına [[decentralization]] denir. İsteyen herkes kendi [[node]]'unu kurabilir: bir bilgisayar, ücretsiz yazılım ve internet bağlantısı yeter.

**Dene:** kaydırıcıyla [[node]]'ları birer birer kapat ya da kutuyu işaretleyip haritadaki en büyük makineyi kapat. Tam kopya sayısını izle: bir tane bile kaldıkça defterin tamamı hâlâ oradadır.`,
        intermediate: `[[node]], zincirin yazılımını çalıştıran bir bilgisayardır. Hepsi aynı ağırlıkta değildir:

- [[full-node]] her [[block]]'u indirir ve her [[transaction]]'ı kendisi kontrol eder. Kimsenin sözüne güvenmez.
- [[light-node]] yalnızca küçük [[block-header]]'ları tutar ve ilgilendiği birkaç şeyin kanıtını [[full-node]]'lardan ister. Telefona sığan budur.

[[full-node]] çalıştırmak bilerek ulaşılabilir tutulur: sıradan bir bilgisayar, bir iki terabaytlık hızlı bir disk ve düzgün bir bağlantı yeter. Bitcoin'in de Ethereum'un da açık internette erişilebilen binlerce [[full-node]]'u vardır.

Yalnızca doğrulama yapan bir [[node]], yeni [[block]] da öneren bir [[miner]] ya da [[validator]] ile aynı şey değildir. Ama her [[block]] üreticisinin bir [[node]]'a ihtiyacı vardır ve her [[node]] üreticilerin işini denetler.

**Dene:** kaydırıcıyla [[node]]'ları devre dışı bırak. Panel tam ve hafif [[node]]'ları ayrı sayar, çünkü [[ledger]]'ın tamamını yalnızca [[full-node]] tutar. Dokuz [[node]]'un sekizi gitse bile kalan tek [[node]], ağa yeniden katılan herkese bütün [[block]]'ları verebilir.`,
        expert: `Ağ, izin gerektirmeyen bir [[p2p]] katmanıdır: sabit sunucu yoktur, hesap yoktur ve her "peer"'ın kötü niyetli olabileceği varsayılır.

Neyi tuttuklarına ve neyi doğruladıklarına göre [[node]] türleri:

- [[full-node]]: [[genesis-block]]'tan ya da güvenilen yakın bir "checkpoint"'ten başlayarak her [[block]]'u doğrular ve güncel "state"'i tutar. Eski [[block]] gövdelerini silebilir ("pruning").
- "Archive node": geçmişteki bütün "state"'leri de saklayan bir [[full-node]]; eski bir [[block]]'taki bakiye gibi sorgular için gerekir.
- [[light-node]]: yalnızca [[block-header]]'ları ve kanıtları doğrular. Bitcoin'de bir SPV istemcisi 80 baytlık her [[block-header]]'ın [[proof-of-work]]'ünü kontrol eder ve bir [[transaction]]'ın dahil olduğunu [[merkle-root]]'a uzanan bir Merkle dalıyla kanıtlar. Ethereum'da "light client", yaklaşık 27 saatte bir değişen 512 [[validator]]'lık bir "sync committee"'yi izler; yakın tarihli [[block-header]]'lara onların imzaları kefil olur.

"Light client" güvenliği belirli bir noktada daha zayıftır: bir şeyin, çoğunluğun kurduğu bir [[block]]'ta *bulunduğunu* doğrulayabilir ama o [[block]]'un bütün kurallara uyduğunu doğrulayamaz. Bunu yalnızca tam doğrulama sağlar.

"Peer"'lar bir rehber olmadan bulunur. Bitcoin [[node]]'ları DNS "seed"'leriyle başlar, sonra birbirlerine \`addr\` mesajları yollar; Ethereum, Kademlia benzeri bir DHT kullanır (discv4 ve discv5). Bitcoin Core varsayılan olarak 8 tam ve 2 yalnızca [[block]] ileten giden bağlantı açar; gelenlerle birlikte varsayılan olarak toplam 125 bağlantıya kadar kabul eder (32. sürümden itibaren 200).

**Dene:** panelde erişilebilirlik yalnızca açık [[full-node]] sayısına bağlıdır: dürüst tek bir [[full-node]], herkesin ondan eşitlenip zincirin tamamını yeniden doğrulamasına yeter. Kapattığın her [[node]] ile azalan şey, bağımsız doğrulayıcıların ve seçilebilecek "peer"'ların sayısıdır; sansürü ve "eclipse" saldırısını kolaylaştıran da budur.`,
      },
    },
    gossip: {
      title: '"Gossip": haber nasıl yayılır?',
      alt: 'Bir wallet, transaction\'ını seçilen node\'a veriyor. Paketler bağlantılar boyunca node\'dan node\'a atlıyor; mesajı alan numaralı her kule turuncuya dönüyor ve sonunda hepsine ulaşıyor.',
      body: {
        beginner: `Bütün [[node]]'lara aynı anda seslenen bir hoparlör yoktur. Haber, tıpkı bir dedikodu gibi yayılır.

Yeni bir şey duyan [[node]], bağlı olduğu birkaç [[node]]'a söyler. Onların her biri kendi komşularına söyler ve böyle sürer. Buna [[gossip]] denir.

Kulağa yavaş gelir ama haberi bilenlerin sayısı her adımda katlanır. Yeni bir [[transaction]] ya da [[block]] birkaç saniyede neredeyse bütün dünyaya ulaşır. Üstelik bunu durdurmak için kapatılabilecek merkezi bir nokta yoktur.

**Dene:** haberin başlayacağı [[node]]'u seç ve **Transaction gönder** düğmesine bas. Sonra *Node başına peer* kaydırıcısını oynat: her [[node]]'un komşusu arttıkça haberin herkese ulaşması için gereken adım azalır.`,
        intermediate: `Her [[node]] birkaç başka [[node]]'a bağlı kalır; bunlara onun "peer"'ları denir. Sayıları genellikle sekiz ile birkaç düzine arasındadır. Hep birlikte, ortasında bir merkez bulunmayan bir [[p2p]] ağı oluştururlar.

[[gossip]] turlar halinde işler. Bir [[node]] bir [[transaction]] ya da [[block]] alır, kontrol eder ve "peer"'larına iletir; onlar da aynısını yapar. Her turda haberi duyanların sayısı katlandığı için on bin [[node]]'a bile birkaç adımda ulaşılır.

Bir [[node]] aynı haberi çoğu zaman birkaç "peer"'dan birden duyar. Bu bilerek böyledir: tekrarlar biraz bant genişliğine mal olur, karşılığında bozuk ya da hileci tek bir "peer" bir [[node]]'u habersiz bırakamaz.

Hız önemlidir. Bir Bitcoin [[block]]'u birkaç saniye içinde ağın çoğuna ulaşır. Ethereum'da bir [[block]]'un, [[validator]]'lar onun için oy vermeden önce ulaşmak için yaklaşık 4 saniyesi vardır.

**Dene:** bir başlangıç [[node]]'u ve "peer" sayısı seç, sonra gönder. Panel, tam da bu haritada her adımdan sonra mesajı almış [[node]]'ları sayar. Herkesin tek "peer"'ı varken haber [[node]]'dan [[node]]'a sürünür; dört "peer" ile iki adımda her yerdedir.`,
        expert: `Her şeyi herkese göndermek bant genişliğini boşa harcardı; gerçek protokoller önce duyurur, isteyene gönderir.

- **Bitcoin**: bir [[node]] yeni [[transaction]]'ları \`inv\` ile duyurur; elinde olmayan "peer" \`getdata\` ile ister ve \`tx\` mesajını alır. [[block]]'lar için "compact block relay" kullanılır (BIP 152): \`cmpctblock\` mesajı [[block-header]]'ı ve kısa [[transaction]] kimliklerini taşır; alıcı [[block]]'u kendi [[mempool]]'undan yeniden kurar, yalnızca eksik olanları ister.
- **Ethereum, "execution layer"**: [[transaction]]'lar devp2p üzerinden yayılır (\`eth\` protokolü); birkaç "peer"'a tam olarak, geri kalanına [[hash]] duyurusu olarak gider.
- **Ethereum, "consensus layer"**: [[block]]'lar ve [[attestation]]'lar libp2p gossipsub üzerinden yayılır. Her "topic" tam mesajlar için yaklaşık 8 "peer"'lık bir "mesh" tutar (\`D = 8\`); diğerlerine yalnızca mesaj kimliklerini duyurur, onlar da kaçırdıklarını ister.

Mesajlar iletilmeden önce kontrol edilir. Kontrolden geçemeyen mesaj atılır ve onu gönderen "peer"'ın hanesine eksi yazılır; böylece çöp veri uzağa gidemez.

Ağın yapısı bir saldırı yüzeyidir. "Eclipse" saldırısında saldırgan, kurbanın bütün bağlantılarını ele geçirir ve ona zincirin kendi kurguladığı bir görüntüsünü sunar. "Peer"'ların birçok farklı adres aralığından rastgele seçilmesi bunu pahalı kılmak içindir.

Yayılma gecikmesi performansı da sınırlar: bir [[block]]'un yayılması [[block]] aralığına göre ne kadar uzun sürerse, birbiriyle yarışan [[block]]'lar o kadar sık ortaya çıkar.

**Dene:** buradaki deneme, her [[node]]'un en yakın *k* komşusuna bağlandığı dokuz [[node]]'luk bir grafı kullanır ve seçtiğin başlangıçtan itibaren genişlik öncelikli turları sayar. *n* [[node]]'lu, her birinin *d* "peer"'ı olan rastgele bir grafta bu sayı kabaca \`log n / log d\` gibi büyür; on binlerce [[node]] için birkaç düzine "peer"'ın yetmesi bundandır. *k* = 8 olduğunda herkes herkesin doğrudan "peer"'ıdır ve tek adım yeter; bedeli 9 [[node]] için 36 bağlantıdır: \`n(n − 1) / 2\` ölçeklenmez.`,
      },
    },
    verify: {
      title: 'Her "node" kuralları kendisi kontrol eder',
      alt: 'Yeni bir block haritanın ortasındaki node\'a geliyor. Node\'un üstündeki kontrol listesi satır satır yanıyor: geçen her kontrol yeşil, takılan kontrol kırmızı oluyor. Geçerli block\'un kopyaları sonraki node\'lara gidiyor; geçersiz block orada kalıyor.',
      body: {
        beginner: `Bir [[node]] kendisine söylenene inanmaz. Yeni bir [[block]]'u kabul etmeden önce onu baştan sona, kendi başına kontrol eder.

Her ödemeyi gerçek sahibi mi imzalamış? Olmayan parayı harcayan ya da aynı parayı iki kez harcayan var mı? Bu [[block]] bir öncekine düzgün bağlanıyor mu?

[[node]], ancak her şey doğruysa [[block]]'u kendi kopyasına ekler ve başkalarına iletir. Her [[node]] bunu her [[block]] için yapar. Göndereni tanıman ya da ona güvenmen gerekmez, çünkü kendin kontrol edersin.

**Dene:** düğmelerle [[node]]'a sahte imzalı, gönderenin bakiyesinden büyük bir ödeme içeren ya da yanlış önceki [[block]]'a bağlanan bir [[block]] ver (tamamen geçerli olan *Hiçbiri* seçeneğidir). Kontrol listesi onu hangi kontrolün yakaladığını gösterir; [[block]] daha ileri gidemez.`,
        intermediate: `Her [[full-node]] her [[block]]'u bağımsız olarak doğrular. Başlıca kontroller:

- [[block]], [[hash]] aracılığıyla bilinen bir ebeveyni gösteriyor mu;
- [[block]] kurallara uygun üretilmiş mi: yeterli [[proof-of-work]] ya da doğru [[validator]]'ın imzası var mı;
- her [[transaction]] geçerli bir [[digital-signature]] taşıyor mu;
- kimse elindekinden fazlasını ya da aynı şeyi iki kez harcamış mı;
- [[block]], boyut ya da [[gas]] sınırını aşıyor mu, izin verilenden fazla yeni coin yaratıyor mu.

Kurallar yazılımın içinde sabittir ve her [[node]] aynı kuralları uygular. Birbirini tanımayan binlerce bilgisayarın hiç konuşmadan aynı [[ledger]]'a ulaşması böyle olur: aynı girdi, aynı kurallarla kontrol edilince aynı sonucu verir.

Geçerli [[block]]'lardan **hangisinin** sıradaki olacağını seçmek ise ayrı bir iştir. O işin adı [[consensus]].

**Dene:** gelen [[block]]'u düğmelerle kendin hazırla. [[node]] kontrollerini sırayla yapar ve ilk başarısız olanda durur. Panel o kontrolün adını, [[node]]'un neyi karşılaştırdığını ve [[block]]'un iletilip iletilmediğini gösterir. Sonraki [[node]]'lara yalnızca tamamen geçerli [[block]] ulaşır.`,
        expert: `Doğrulama, [[block]]'un ve ebeveyn "state"'in deterministik bir fonksiyonudur: \`valid(block, state_parent) → state' | ⊥\`. Aynı kuralları çalıştıran iki dürüst [[node]] bu konuda farklı sonuca varamaz.

Bitcoin'in kontrol ettiklerinden bazıları: [[block-header]]'ın [[hash]]'i [[target]]'ın altında mı; zaman damgası önceki 11 [[block]]'un medyanından büyük ve en fazla 2 saat ileride mi; [[block]] ağırlığı ≤ 4.000.000 mi; her girdi harcanmamış bir çıktıyı harcıyor ve onun "script"'ini sağlıyor mu; girdiler ≥ çıktılar mı; "coinbase" en fazla "subsidy" artı ücretler kadar mı talep ediyor.

Ethereum, [[block-header]]'ı ebeveynine göre kontrol eder (\`parentHash\`, \`gasLimit\` sınırları, [[eip-1559]] gereği \`baseFeePerGas\`), [[proposer]]'ın imzasına ve [[slot]]'a bakar; ardından her [[transaction]]'ı [[evm]]'de yeniden çalıştırır ve \`stateRoot\`, \`receiptsRoot\` ile \`gasUsed\` değerlerini [[block-header]]'dakilerle karşılaştırır. Tek bir bit farklıysa [[block]] geçersizdir.

İletme işi bunların hepsini beklemez. [[node]]'lar, [[block]]'lar hızlı yayılsın diye ucuz kontrollerden sonra iletir ([[block-header]] üzerindeki [[proof-of-work]] ya da [[proposer]]'ın imzası); tam kontrol ise [[node]]'un o [[block]]'un üstüne inşa edip etmeyeceğini belirler.

[[block]] üretenler kuralları değiştiremez. [[miner]]'ların ya da [[validator]]'ların çoğunluğu, geçerli [[block]]'lardan *hangilerinin* üstüne inşa edeceğini seçebilir; yani sansürleyebilir ya da sırayı değiştirebilir. Ama [[full-node]]'lara sahte bir imzayı ya da yoktan yaratılmış coin'leri kabul ettiremez.

**Dene:** buradaki [[block]] gerçekten kontrol edilir. Ebeveyn bağı iki [[sha-256]] [[hash]]'ini karşılaştırır; imza, gönderenin [[public-key]]'ine karşı doğrulanan bir secp256k1 [[ecdsa]] imzasıdır; bakiye kontrolü de tutarı gönderenin sahip olduğu 5 coin ile karşılaştırır. Sahte sürüm başka bir [[private-key]] ile imzalanmıştır; ödeme metni aynı kaldığı halde doğrulama bu yüzden başarısız olur.`,
      },
      code: {
        lang: 'Python (basitleştirilmiş block doğrulama)',
        source: `def validate(block, parent, state):
    assert block.parent_hash == hash(parent.header)
    assert block.gas_used <= block.gas_limit
    assert block.base_fee == next_base_fee(parent)
    for tx in block.transactions:
        sender = recover_signer(tx)            # ECDSA
        assert tx.nonce == state.nonce(sender)
        assert state.balance(sender) >= tx.gas_limit * tx.max_fee + tx.value
        state = execute(state, tx)             # EVM
    assert state.root() == block.state_root    # üreticiyle aynı sonuç
    return state`,
      },
    },
    reject: {
      title: 'Kötü bir "block" hiçbir yere varamaz',
      alt: 'Kırmızıyla işaretli bir node kırmızı bir block gönderiyor. Ortadaki node\'da kontrol listesinin bir satırı kırmızıya dönüyor. Block her komşuda reddediliyor ve daha ileri gidemiyor; kötü block\'lar tekrarlandıkça kırmızı node\'un bağlantıları kayboluyor.',
      body: {
        beginner: `Hileci bir [[node]]'un, kendisine yoktan para yazan bir [[block]] hazırlayıp ağa yolladığını düşün.

Komşuları her zamanki kontrollerini yapar ve kontrollerden biri tutmaz. [[block]]'u çöpe atarlar ve başkasına **iletmezler**. Yalan, karşılaştığı ilk dürüst [[node]]'larda durur; ağın geri kalanı onu duymaz bile.

Hilecinin ne kadar güçlü olduğu ya da [[block]]'un ne kadar resmi göründüğü fark etmez. Kuralları herkes kontrol ettiği için kuralı çiğneyen yalnızca görmezden gelinir.

**Dene:** **Bir kötü block daha gönder** düğmesine bas. Komşuları hileciye her seferinde biraz daha az güvenir ve üçüncüden sonra bağlantıyı keser. Yalan söylemeyi sürdüren bir [[node]] sonunda kimseyle konuşamaz.`,
        intermediate: `Geçersiz bir [[block]], kim üretmiş olursa olsun aynı muameleyi görür:

- onu alan [[full-node]] kontrollerini yapar ve biri başarısız olur;
- [[block]] atılır: saklanmaz, üstüne inşa edilmez, iletilmez;
- onu gönderen "peer" ile bağlantı kesilebilir.

Yani geçersiz bir [[block]], üretene harcadığı emeğe mal olur ve hiçbir şey kazandırmaz. Bitcoin'de [[miner]], kimsenin kabul etmediği bir [[block]] için elektrik yakmış olur.

Güçlü bir saldırganın yapabileceklerinin sınırı da buradadır. Madencilik gücünün çoğu elinde olsa bile bir [[digital-signature]]'ı taklit edemez ya da yoktan coin yaratamaz, çünkü her [[full-node]] o [[block]]'u reddeder. Çoğunluğun *yapabildiği* şey, geçerli geçmişler arasında seçim yapmaktır; nasıl olduğunu sonraki adım gösteriyor.

[[light-node]] bu kontrollerin hepsini yapmaz; kimi dinlediğine daha çok dikkat etmek zorunda olması bu yüzdendir.

**Dene:** kötü [[block]] göndermeyi sürdür ve hilecinin komşuları gözündeki puanının düşüşünü izle. Buradaki denemede üçüncüden sonra onu dinlemeyi bırakırlar; Bitcoin Core o kadar beklemez, ilkinde bağlantıyı keser. Hangi kuralı çiğnersen çiğne sonuç aynıdır: [[block]] iletilmez.`,
        expert: `Reddetme yerel ve anlıktır; kimse oylama yapmaz. Bitcoin Core'da [[consensus]] kontrollerinden geçemeyen bir [[block]] geçersiz olarak işaretlenir, ondan türeyen hiçbir [[block]] kabul edilmez ve onu ileten "peer" ile bağlantı kesilip "peer" "discouraged" olarak işaretlenir. Gossipsub'da doğrulamadan geçemeyen mesajın sonucu \`REJECT\` olur: iletilmez ve gönderenin "peer score" değeri, "mesh"'ten çıkarılana kadar düşer.

Hizmet engelleme saldırılarını sınırlamak için ucuz kontroller önce yapılır. Bir Bitcoin [[node]]'u gövdeyi indirmeden önce [[block-header]]'ın [[proof-of-work]]'ünü kontrol eder; dolayısıyla bir [[node]]'a pahalı iş yaptırmak saldırgana gerçek [[hashrate]]'e mal olur. Ethereum [[node]]'ları, iletmeden ve çalıştırmadan önce [[proposer]]'ın imzasına ve [[slot]]'a bakar.

[[block]] üretenlerin çoğunluğu neyi yapabilir, neyi yapamaz:

- **yapamaz**: geçerli imza olmadan harcama, ihraç kuralının ötesinde coin yaratma ya da [[full-node]]'ların uyguladığı başka herhangi bir kuralı çiğneme;
- **yapabilir**: [[transaction]]'ları dışarıda bırakma ve yakın geçmişi geri alan daha ağır bir alternatif dal kurma ([[51-attack]]).

Dürüst [[node]]'ların kurallar konusunda ayrışması ise başka bir sorundur. Bir istemcide hata varsa ve geçerli bir [[block]]'u geçersiz sayıyorsa, ağ istemci çizgisinden ikiye bölünür. Ethereum'da istemci çeşitliliğinin savunulmasının nedeni budur.

"Light client"'lar, çoğunluğun desteklediği geçersiz bir zincire karşı korumasız kalır; "fraud proof" ve "validity proof" çalışmaları bu açığı kapatmaya yöneliktir.

**Dene:** buradaki deneme hileciye, gönderdiği geçersiz [[block]] sayısının karesinin eksilisi kadar puan verir (gossipsub'ın geçersiz mesaj cezası da bu biçimdedir) ve −9'da bağlantıyı keser. Bu eşik denemeye özgüdür: gerçek ağlar kendi eşiklerini seçer ve gossipsub'da "mesh"'ten çıkarılmak için puanın eksiye düşmesi yeter.`,
      },
    },
    forks: {
      title: '"Fork" ve en ağır zincir',
      alt: 'Haritanın önünde bir zincir mavi A ve turkuaz B diye iki dala ayrılıyor; her node izlediği dalın rengini gösteriyor. Dallardan biri öne geçince bütün node\'lar ona geçiyor ve öteki daldaki block\'lar gri stale block\'lara dönüşüyor.',
      body: {
        beginner: `Bazen iki dürüst üretici neredeyse aynı anda geçerli birer [[block]] çıkarır. [[node]]'ların bir kısmı önce birini, geri kalanı önce ötekini duyar. Bir an için [[ledger]]'ın son sayfasının iki ayrı hali vardır. Buna [[fork]] denir.

Kimse bunu çözmek için toplantı yapmaz. Her [[node]], ilk gördüğü [[block]]'un üstüne devam eder ve bekler. Çok geçmeden dallardan birine yeni bir [[block]] eklenir ve o dal öne geçer.

Ardından herkes tek bir basit kurala uyar: **arkasında en çok iş olan dal kazanır**. Öteki daldaki [[node]]'lar bu dala geçer; geride bıraktıkları [[block]] atılır. İçindeki ödemeler bekleme odasına döner ve sonraki bir [[block]]'a girer. En son sayfaların "henüz tam kesinleşmemiş" sayılması bundandır.

**Dene:** **A'ya block ekle** ya da **B'ye block ekle** düğmesine bas. [[node]]'ların üstündeki küçük küpler her birinin hangi dalı izlediğini gösterir. Hangi dal öne geçerse herkes ona geçer ve öteki daldaki [[block]]'lar griye döner.`,
        intermediate: `Bu türden bir [[fork]], iki geçerli [[block]] aynı ebeveyne bağlandığında ortaya çıkar. İkisi de kurallara uyar; yani doğrulama aralarında seçim yapamaz. Seçimi [[fork-choice]] kuralı yapar:

- **Bitcoin**: en çok birikmiş [[proof-of-work]] taşıyan zinciri izle; bu çoğu zaman en uzun zincirdir ama her zaman değil;
- **Ethereum**: o anda en çok [[validator]] oyunun desteklediği dalı izle.

Bir [[node]] dal değiştirdiğinde [[reorg]] yapar: eski dalındaki [[block]]'ları geri alır, yenilerini uygular. Yalnızca bırakılan [[block]]'ta bulunan [[transaction]]'lar [[mempool]]'a döner. Tek [[block]]'luk [[reorg]]'lar olağandır; derin olanlar ise nadirdir ve alarm verir.

[[finality]], bir [[block]]'un artık [[reorg]] ile geri alınmayacağı noktadır. Bitcoin'de bu, her [[confirmation]] ile artan bir güven meselesidir. Ethereum ise [[block]]'ları ortaya çıktıktan yaklaşık on beş dakika sonra açıkça kesinleştirir.

[[fork]] kelimesi kuralların kendisinin değiştirilmesi için de kullanılır; o durumda yazılımını güncelleyen ve güncellemeyen [[node]]'ların yolları ayrılabilir. Bu, buradaki kısa ömürlü beraberlikten farklı bir şeydir.

**Dene:** her yeni [[block]]'un nereye düşeceğine sen karar ver. Beraberlik kimseyi yerinden oynatmaz: [[node]]'lar zaten izledikleri dalda kalır. Beraberliği bozduğunda kaybeden taraf [[reorg]] yapar; panel bunun derinliğini ve kaç [[block]]'un "stale" olduğunu gösterir. Sonra sırayla A, B, B dene: geriden gelen bir dal herkesi daha derin bir [[reorg]]'a zorlar; bir saldırganın başarması gereken de tam olarak budur.`,
        expert: `[[fork-choice]] kuralı, bir [[node]]'un gördüğü [[block]] ağacını tek bir "head"'e indirger.

- **"Nakamoto consensus"**: "head", toplam işi en büyük olan geçerli zincirin ucudur; toplam iş, zincirdeki her [[block]] için \`2^256 / (target + 1)\` değerlerinin toplamıdır. Eşitlikte ilk görülen [[block]] tercih edilir. [[finality]] olasılıksaldır: saldırganın [[hashrate]] payı yarının altında kaldıkça, \`z\` [[block]]'tan derin bir [[reorg]] olasılığı \`z\` ile üstel olarak düşer.
- **Ethereum (Gasper)**: [[lmd-ghost]], en son "justified checkpoint"'ten başlar ve her çatalda, alt ağacı en çok [[stake]] taşıyan çocuğa iner; bunu yaparken her [[validator]]'ın yalnızca en son [[attestation]]'ını sayar. Bunun üstünde [[casper-ffg]] çalışır ve [[stake]]'in üçte ikisi bir "checkpoint"'i hemen ardından gelene bağladığında onu "finalized" yapar. [[fork-choice]] hiçbir zaman "finalized" bir "checkpoint"'in gerisine gitmez; yani "finalized" bir [[block]]'u geri almak, [[stake]]'in en az üçte birinin [[slashing]] gerektiren bir ihlalde bulunmasını gerektirir.

GHOST türü kurallar, ana zincirin *dışında* kalan oyları ya da [[block]]'ları da atalarına verilmiş destek olarak sayar; bu, "stale block"'ların sık görüldüğü kısa [[block]] aralıklarında güvenliği korur.

[[consensus]] iki şey vaat eder: **"safety"** (dürüst [[node]]'lar birbiriyle çelişen [[block]]'ları kesinleştirmez) ve **"liveness"** (zincir büyümeye devam eder). Ağ ikiye bölündüğünde bir protokol bunlardan birinden vazgeçmek zorundadır. Bitcoin "liveness"'ı korur: iki taraf da büyür, sonra biri [[reorg]] ile geri alınır. Ethereum'da [[stake]]'in üçte ikisinden azı çevrimiçiyse kesinleştirme durur, [[lmd-ghost]] ise [[block]] üretmeyi sürdürür.

Bir [[reorg]] "state"'i yeniden uygular: eski dalı ortak ataya kadar geri al, yeni dalı uygula ve açıkta kalan [[transaction]]'ları hâlâ geçerlilerse havuza geri koy.

**Dene:** buradaki denemede her [[block]] aynı işi taşır; yani birikmiş iş doğrudan [[block]] sayısıdır. [[node]]'lar ancak öteki dal kesin olarak daha ağır olduğunda dal değiştirir; [[reorg]] derinliği de ortak ataya kadar geri aldıkları [[block]] sayısıdır. Dürüst [[miner]]'lar izledikleri dalın üstüne inşa eder; düğmelerin izin verdiği gibi terk edilmiş dala [[block]] eklemeyi sürdürmek ise gizli zinciri olan bir [[miner]]'ın yaptığı şeydir.`,
      },
      code: {
        lang: 'Python (fork choice, basitleştirilmiş)',
        source: `# Bitcoin: toplam işi en büyük olan uç
def best_tip(tips):
    return max(tips, key=lambda b: b.chain_work)  # 2**256 // (target + 1) toplamı

# Ethereum: justified checkpoint'ten başlayan LMD-GHOST
def head(store):
    block = store.justified_root
    while children(block):
        # weight = son oyu c'nin alt ağacında olan validator'ların stake'i
        block = max(children(block), key=lambda c: weight(store, c))
    return block`,
      },
    },
  },
};

export default content;
