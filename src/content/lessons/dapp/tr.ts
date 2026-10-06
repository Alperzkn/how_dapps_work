import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[token]]'lar -> "token"'lar.
// English technical words without a glossary entry are quoted by hand: "backend".

const content: LessonContent = {
  labels: {
    normalApp: 'Normal uygulama',
    companyServer: 'Şirket sunucusu',
    privateApi: 'HTTPS · özel API',
    dapp: 'Dapp',
    website: 'Web sitesi',
    uiUpdates: 'Sayfada görünen',
    wallet: 'Wallet',
    rpcNode: 'RPC node',
    contract: 'Smart contract',
    network: 'ağdaki node\'lar',
    everyNode: 'her node çalıştırır',
    publicRpc: 'JSON-RPC · açık state',
    staticHost: 'Statik sunucu',
    keyStays: 'anahtar içeride kalır',
    request: 'İstek',
    signed: 'imzalı',
    read: 'okuma · ücretsiz',
    write: 'yazma · gas öder',
    balances: 'bakiyeler',
    indexer: 'Indexer',
    event: 'event',
    tryCompare: 'Dene: sunucuları kapat',
    shutDown: 'Şirket sunucularını kapatır',
    openOther: 'Başka bir frontend aç',
    closeOther: 'Kapat',
    works: 'çalışıyor',
    offline: 'kapalı',
    noSite: 'site yok, kontrat çalışıyor',
    viaOther: 'başka bir frontend ile çalışıyor',
    serverOff: 'Sunucu: kapalı',
    siteOff: 'Resmî site: kapalı',
    stillRunning: 'çalışmaya devam ediyor',
    otherFrontend: 'Başka bir frontend',
    down: 'çöktü',
    reqA: 'İstek A',
    reqB: 'İstek B',
    confirm: 'Onayla',
    reject: 'Reddet',
    askAgain: 'Yeniden sor',
    reqTo: 'Kime',
    reqFn: 'Fonksiyon',
    recipient: 'Alıcı',
    spender: 'Spender',
    account: 'Hesap',
    amount: 'Miktar',
    unlimited: 'sınırsız',
    tokenContract: 'Token',
    unknown: 'tanımadığın',
    status: 'Durum',
    waiting: 'kararını bekliyor',
    signedOk: 'imzalandı ve gönderildi',
    signedBad: 'imzalandı: o adres artık bütün token\'larını alabilir',
    rejectedMsg: 'reddedildi: hiçbir şey imzalanmadı',
    signature: 'İmza',
    askTransfer: 'Ben\'e 10 token gönder',
    askApprove: 'bir yabancı token\'larını harcasın',
    rejectedTag: 'reddedildi',
    modeRead: 'Oku',
    modeWrite: 'Yaz',
    providerDown: 'Sağlayıcı çöktü',
    switchProvider: 'Sağlayıcı değiştir',
    switchBack: 'Geri dön',
    method: 'Metot',
    gasStat: 'Gas',
    free: 'ücretsiz',
    paysGas: 'ücret öder',
    required: 'gerekli',
    notNeeded: 'gerekmez',
    answer: 'Cevap',
    instant: 'anında, tek node\'dan',
    nextBlock: 'sonraki block ile (~12 sn)',
    noAnswer: 'cevap yok',
    otherProvider: 'Başka bir sağlayıcı',
    nextBlockTag: 'sonraki block',
    tryContract: 'Dene: Ayşe\'nin bakiyesinden fazlasını gönder',
    sendCall: 'Çağrıyı gönder',
    resultStat: 'Sonuç',
    notRun: 'henüz gönderilmedi',
    resTransferred: 'tamam: bakiyeler değişti',
    resApproved: 'tamam: allowance ayarlandı',
    resRead: 'dönen değer',
    resReverted: 'revert: bakiye yetersiz',
    capFn: 'fonksiyon',
    capTo: 'kime',
    capAmount: 'miktar',
    tryEvents: 'Dene: bir transfer gönder, sonra log\'ları filtrele',
    filter: 'Filtre',
    filter_all: 'Hepsi',
    filter_from: 'Gönderen',
    filter_to: 'Alan',
    address: 'Adres',
    sendAgain: 'Transfer gönder',
    returned: 'Dönen log',
    lastCall: 'Gönderilecek',
  },
  steps: {
    compare: {
      title: 'Normal uygulama ve "dapp"',
      alt: 'İki şerit var. Arkada bir ekran tek bir şirket sunucusuyla konuşuyor. Önde bir ekran, bir wallet ve bir RPC node üzerinden, blockchain platformunda duran kontrat makinesine bağlı; çevresinde başka node\'lar var. Sunucular kapatıldığında arka şerit ve öndeki ekran kararıyor, kontrat makinesi ise dönmeye devam ediyor; ardından ikinci bir ekran belirip aynı wallet üzerinden kontrata ulaşabiliyor.',
      body: {
        beginner: `Normal bir uygulama kullanırken telefonun tek bir şirkete ait bir bilgisayarla konuşur. Verilerini o bilgisayar saklar, kuralları da o koyar. Şirket isterse kuralları değiştirir, hesabını dondurur ya da hizmeti tümden kapatır.

Bir [[dapp]] (merkeziyetsiz uygulama) ekranında aynı görünür. Farkı arka taraftadır: veriyi saklayan ve kuralları uygulayan şey bir şirket bilgisayarı değil, bir [[blockchain]] üzerinde duran bir programdır.

O programı ya da tuttuğu kayıtları kimse gizlice değiştiremez. Neyin olacağına karar veren, sahibinin yönettiği bir sunucu yoktur; kurallar, programı yazanlar dahil herkes için aynıdır.

**Dene:** kutuyu işaretle ve şirket sunucularını kapatsın. Normal uygulama kararır ve iş orada biter. [[dapp]]'in kendi web sitesi de kararır, ama [[blockchain]] üzerindeki program çalışmaya devam eder. *Başka bir frontend aç* düğmesine bas: bambaşka bir web sitesi aynı programa ulaşır ve her şey yeniden çalışır.`,
        intermediate: `Normal bir web uygulamasının iki yüzü vardır: tarayıcında çalışan [[frontend]] ve şirketin kontrol ettiği sunucularla veritabanından oluşan "backend".

Bir [[dapp]], [[frontend]]'i korur ama "backend" yerine bir [[smart-contract]] koyar: Ethereum gibi bir zincire yüklenmiş kod. Verisi zincirin durumunda yaşar ve her [[full-node]] bunun bir kopyasını tutar.

Bu ikisini iki parça daha birbirine bağlar:

- anahtarlarını saklayan ve onayladığın şeyi imzalayan bir [[wallet]];
- ağa açılan kapı olan bir [[rpc]] sunucusu.

Dersin geri kalanında tek bir tıklamayı bu dört katman boyunca gidip gelirken izleyeceğiz.

**Dene.** Sunucuları kapat. Normal uygulamada sunucu uygulamanın *kendisidir*; geriye hiçbir şey kalmaz. [[dapp]] tarafında ise yalnızca [[frontend]] gitmiştir: [[smart-contract]] ve verisi hâlâ her [[full-node]]'un üzerindedir. Başka bir [[frontend]] aç. Kontratın [[address]] değerini ve [[abi]] tanımını bilen herkes böyle bir site yapabilir; aynı [[wallet]] da eskisi gibi aynı türden [[transaction]]'ı imzalar.`,
        expert: `Asıl fark güven modelindedir. "Web2" bir sistemde operatörün veritabanına yazma yetkisi vardır ve API'yi istediği gibi değiştirebilir. Bir [[dapp]] içinde her durum geçişi, [[evm]] tarafından her [[full-node]] üzerinde deterministik olarak çalıştırılan imzalı bir [[transaction]]'dır; [[frontend]]'i işleten kişinin kontrat durumu üzerinde herhangi bir [[address]]'ten fazla yetkisi yoktur.

Katmanlar ve aralarındaki arayüzler:

- **Frontend ↔ wallet**: \`request({ method, params })\` sunan bir EIP-1193 "provider" nesnesi (\`window.ethereum\`).
- **Wallet / frontend ↔ node**: HTTPS ya da WebSocket üzerinden [[json-rpc]].
- **Node ↔ kontrat**: kontratın [[abi]] tanımına göre kodlanmış, [[evm]]'in çalıştırdığı [[calldata]].

"Merkeziyetsizlik" her katman için ayrı ayrı sorulması gereken bir özelliktir. Yönetici anahtarı ya da yükseltilebilir "proxy" taşıyan bir kontrat, tek bir alan adından sunulan bir [[frontend]] ya da tek bir barındırılan [[rpc]] uç noktası birer merkezileşme noktasıdır; ciddi bir inceleme bunların her birine bakar.

Bu anahtar bir operatör kesintisini modeller. Ayakta kalan, [[consensus]]'ın kapsadığı şeydir: kontrat kodu ve durumu. Kalmayan ise operatörün kendi altyapısından sunulan her şeydir: resmî [[frontend]] ve çoğu zaman sayfanın bağımlı olduğu barındırılan bir [[rpc]] uç noktası ya da bir [[indexer]]. İkinci bir [[frontend]]'in ilkinden hiçbir şeye ihtiyacı yoktur; kullanıcı kontratı bir betikten ya da bir "block explorer"'ın kontrat sayfasından da çağırabilir.`,
      },
    },
    frontend: {
      title: '"Frontend" sadece bir web sitesidir',
      alt: 'Statik bir sunucu tarayıcı ekranına dosyalar gönderiyor. Ekranın yanında kontratın fonksiyonlarını listeleyen bir kart duruyor: ABI. Sağda wallet bekliyor.',
      body: {
        beginner: `Bir [[dapp]]'in gördüğün kısmı sıradan bir web sitesidir: düğmeler, sayılar, formlar. Buna [[frontend]] denir.

Web sitesi para tutmaz, hiçbir şeye de karar vermez. Bir bankamatiğin ekranı gibidir: kasada ne olduğunu gösterir ve isteğini yazmana izin verir, ama kasa başka yerdedir.

Bu yüzden aynı [[dapp]]'in birden fazla web sitesi olabilir; biri ortadan kalksa da [[dapp]] çalışmaya devam eder. Asıl olan, [[blockchain]] üzerindeki programdır.`,
        intermediate: `[[frontend]] HTML, CSS ve JavaScript'ten oluşur; çoğunlukla statik dosyalar olarak sunulur. Bir [[smart-contract]] ile konuşabilmesi için iki şeye ihtiyacı vardır:

- kontratın zincirdeki [[address]] değeri;
- kontratın [[abi]] dosyası: fonksiyonların ve "event"'lerin argüman tipleriyle birlikte listesi. Site bir çağrıyı nasıl kuracağını ve cevabı nasıl okuyacağını buradan öğrenir.

Site kendi başına hiçbir şey imzalayamaz. Bunu senin [[wallet]]'ından istemek zorundadır; MetaMask gibi tarayıcı cüzdanları kendilerini sayfaya açar.

[[frontend]] değiştirilebilir olduğu için saldırıya en açık parça da odur: sahte ya da ele geçirilmiş bir site, [[wallet]]'ından zararlı bir şeyi imzalamasını isteyebilir. Kontrat aradaki farkı anlayamaz.`,
        expert: `[[frontend]] genellikle viem ya da ethers.js gibi bir kütüphaneyi, her "chain id" için kontrat [[address]] değerlerini ve [[solidity]] derleyicisinin JSON olarak ürettiği [[abi]] dosyasını paketler.

[[wallet]]'a erişim EIP-1193 "provider" üzerinden olur: \`provider.request({ method: 'eth_requestAccounts' })\` kullanıcıdan bağlanmasını ister ve seçilen [[address]] değerlerini döndürür. Tarayıcıya gömülü cüzdanlar bunu \`window.ethereum\` olarak sunar; EIP-6963 ise sayfanın, o tek global değişken için yarışmak yerine kurulu birden fazla cüzdanı keşfetmesini sağlar.

Okuma için [[wallet]] hiç gerekmez: sayfa herhangi bir [[json-rpc]] uç noktasını doğrudan çağırabilir. Kullanıcının anahtarına yalnızca imza için ihtiyaç vardır.

[[frontend]], [[consensus]] açısından kritik yolun dışındadır; bütünlüğü sıradan web güvenliğine dayanır: DNS, TLS, derleme hattı ve bağımlılıklar. Bir derlemeyi içerik özetine sabitlemek (örneğin IPFS üzerinde) yayını doğrulanabilir kılar; yine de kullanıcının, [[wallet]]'ın imzalatmak istediği şeyi kontrol etmesi gerekir.`,
      },
      code: {
        lang: 'JSON (ABI parçası)',
        source: `[
  {
    "type": "function",
    "name": "transfer",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "type": "event",
    "name": "Transfer",
    "anonymous": false,
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  }
]`,
      },
    },
    wallet: {
      title: '"Wallet" imzalar',
      alt: 'Bir istek paketi ekrandan wallet\'a gidip orada bekliyor; wallet\'ın üstünde bir anahtar süzülüyor. Panel isteğin ne istediğini gösteriyor; altında Onayla ve Reddet düğmeleri var. Onayla\'dan sonra paket wallet\'tan üzerinde yeşil bir mühürle çıkıyor: artık imzalı. Reddet\'ten sonra paket kırmızı halde yerde kalıyor ve wallet\'tan hiçbir şey çıkmıyor.',
      body: {
        beginner: `"Gönder" düğmesine bastın. Web sitesi paranı hareket ettiremez; bu yüzden isteği [[wallet]]'ına uzatır: "bu kişi Ben'e 10 token göndermek istiyor".

[[wallet]] isteği sana gösterir ve bekler. Onaylarsan isteği gizli anahtarınla mühürler. Bu mühür bir [[digital-signature]]'dır: tam olarak bu isteği **senin** onayladığının kanıtı.

Anahtar [[wallet]]'tan hiç çıkmaz. Web sitesine yalnızca mühürlenmiş istek geri döner, anahtar değil. Onaylamadan önce [[wallet]]'ın gösterdiğini mutlaka oku; imzalanıp gönderildikten sonra geri al düğmesi yoktur.

**Dene:** sahnenin altındaki panel, [[wallet]]'ın sana sorduğu sorudur. İsteğin nereye gittiğini ve ne yaptığını oku, sonra *Onayla* ya da *Reddet* düğmesine bas. Reddedersen [[wallet]]'tan hiçbir şey çıkmaz. Şimdi *İstek B*'ye geç. Tanımadığın bir adresin senin [[token]]'larını sınırsız harcamasına izin istiyor. Bir web sitesinde iki istek de aynı sevimli düğmenin arkasına saklanabilir; aradaki farkı görebileceğin tek yer [[wallet]]'ın ekranıdır.`,
        intermediate: `[[frontend]] bir [[transaction]] hazırlar: hangi kontrat çağrılacak, hangi fonksiyon, hangi argümanlarla ve yanında ne kadar [[ether]] gidecek. Bunu [[wallet]]'a iletir.

[[wallet]] gerisini doldurur ([[account-nonce]] değerin, bir [[gas]] limiti ve ücret), bir onay ekranı gösterir ve [[private-key]] ile imzalar. Bu [[digital-signature]]'ı herkes senin [[address]] değerine karşı doğrulayabilir, ama kimse taklit edemez.

Sık göreceğin isteklerden biri [[token-approval]]'dır. Bir kontrat senin "token"'larını kendiliğinden alamaz; önce o kontratın belirli bir [[token]]'dan seçtiğin miktara kadar harcamasına izin veren bir onay imzalarsın. Birçok site sınırsız miktar ister. Bu pratiktir, ama sen iptal edene kadar geçerli kalır; o yüzden yalnızca güvendiğin kontratlara onay ver.

**Dene.** Panel, bir [[wallet]] penceresinin gösterdiğini gösterir: çağrılan kontrat, fonksiyon ve argümanları. İstek A, [[token]] kontratında \`transfer\` çağırır: Ben'e 10 [[token]]. İstek B ise hiç görmediğin bir "spender" ve mümkün olan en büyük miktarla \`approve\` çağırır. Birini onayla; [[wallet]] istek üzerinde gerçek bir [[digital-signature]] üretir ve panel bunun başını gösterir. Reddedersen ortada imza yoktur; yani bir [[node]]'un kabul edeceği hiçbir şey yoktur.`,
        expert: `Sayfa "provider" üzerinde \`{ from, to, data, value }\` ile \`eth_sendTransaction\` çağırır. [[wallet]], [[gas]] miktarını \`eth_estimateGas\` ile tahmin eder, [[account-nonce]] değerini \`eth_getTransactionCount(address, "pending")\` ile okur, [[eip-1559]] ücret alanlarını doldurur ve çoğu zaman etkisini gösterebilmek için çağrıyı simüle eder.

Tip 2 bir işlem şudur: \`0x02 ‖ rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList])\`. [[wallet]] bu verinin keccak256 özetini secp256k1 üzerinde [[ecdsa]] ile imzalar ve sonuna \`yParity, r, s\` ekler. Gönderen ayrı bir alan değildir: [[node]]'lar onu imzadan geri elde eder. İmzalanan verinin içindeki \`chainId\`, aynı işlemin başka bir zincirde tekrar oynatılmasını ("replay") engeller.

[[wallet]]'lar zincir dışı mesajlar da imzalar: \`personal_sign\` ve EIP-712 tipli veri (\`eth_signTypedData_v4\`). EIP-2612 \`permit\`, ayrı bir [[token-approval]] işlemi göndermeden, tipli bir imzayla [[erc-20]] "allowance" değeri ayarlar. İmzalı mesajlar [[gas]] harcamaz ama gerçek transferlere yetki verebilir; aynı dikkati hak ederler.

Bu örnekte [[wallet]], \`to:… value:0 data:…\` metnini herkesçe bilinen açık bir test anahtarıyla imzalar: metnin keccak256 özeti üzerinde, secp256k1 eğrisinde [[ecdsa]]. Panelde \`r\` değerini görürsün; gerçek bir [[wallet]] ise yukarıda anlatılan RLP yükünü imzalar. İstek B'nin [[calldata]]'sı \`0x095ea7b3\`, ardından "spender", ardından 32 bayt \`ff\` olarak \`2²⁵⁶ − 1\`'dir: bilinen "sınırsız" onay. Onay kendi başına hiçbir şeyi hareket ettirmez; zararsız görünmesinin nedeni budur. Ama "spender"'a, "allowance" yeniden 0 yapılana kadar, istediği an istediği miktar için \`transferFrom\` çağırma yetkisi verir.`,
      },
      code: {
        lang: 'TypeScript (EIP-1193)',
        source: `const [from] = await window.ethereum.request({
  method: 'eth_requestAccounts',
});

// Wallet onay ekranı gösterir, imzalar ve gönderir.
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from,
    to: TOKEN_ADDRESS,   // alıcı değil, kontrat
    data: calldata,      // ABI ile kodlanmış transfer(to, amount)
    value: '0x0',
  }],
});`,
      },
    },
    rpc: {
      title: 'Çağrıyı "RPC" taşır',
      alt: 'Okuma modunda küçük bir paket, kesikli bir yol boyunca ekrandan doğrudan RPC node\'a gidip geri dönüyor; başka hiçbir node işe karışmıyor. Yazma modunda imzalı işlem wallet\'tan RPC node\'a gidiyor; o da kopyalarını diğer node\'lara ve zincire iletiyor, ardından bir block beliriyor. Sağlayıcı çöktü olarak işaretlenince node kararıyor ve paketler orada kalıyor; sağlayıcı değiştirilince aynı trafiği ikinci bir node taşıyor.',
      body: {
        beginner: `Tarayıcın [[blockchain]] ağının bir parçası değildir. Ağa ulaşmak için uygulama, ağın parçası olan bir bilgisayarla konuşur: bir [[node]]. Bu [[node]] ile konuşma yöntemine [[rpc]] denir.

[[node]]'u bir postane gişesi gibi düşün. Gişeye iki türlü gidilir:

- **soru sormak** ("bakiyem ne kadar?"): görevli bakar ve hemen, ücretsiz cevap verir;
- **mektup göndermek** (imzalı isteğin): görevli mektubu bütün ağa iletir; mektup bir [[block]]'a girdiğinde geçerlilik kazanır.

Görevli mektubunu değiştiremez. Mektup senin imzanla mühürlüdür; değiştirilmiş bir kopya doğrudan reddedilir.

**Dene:** *Oku* ile *Yaz* arasında geçiş yap ve işe kimlerin karıştığına bak. Soru tek bir [[node]]'a gider ve hemen geri döner. İmzalı istek ise bütün diğerlerine iletilir, sonra da bir sonraki [[block]]'u beklemek zorundadır. Ardından *Sağlayıcı çöktü* kutusunu işaretle: kullandığın gişe kapandı. *Sağlayıcı değiştir* düğmesine bas; uygulama aynı şeyi başka bir gişeye sorar. [[blockchain]]'in kendisi hiç durmadı.`,
        intermediate: `[[rpc]] sunucusu, uygulamalardan gelen isteklere cevap veren bir [[node]]'dur. Çoğu [[dapp]] ve [[wallet]] hazır bir sağlayıcı kullanır; istersen kendininkini de çalıştırabilirsin.

Birbirinden çok farklı iki istek türü vardır:

- **Okuma çağrısı**, bir kontrat fonksiyonunu [[node]]'un elindeki güncel durum kopyası üzerinde çalıştırır ve sonucu döndürür. Hiçbir şey kaydedilmez, [[gas-fee]] ödenmez, imza gerekmez.
- **İşlem** ise durumu değiştirir. İmzalı [[transaction]] önce [[node]]'a, oradan [[mempool]]'a gider ve bir [[validator]] onu bir [[block]]'a koyana kadar [[node]]'dan [[node]]'a yayılır. [[gas-fee]] öder ve milisaniyeler değil, saniyeler sürer.

Yani tipik bir sayfa bakiyeleri ve fiyatları okuma çağrılarıyla sürekli okur; [[transaction]]'ı ise yalnızca sen bir düğmeye basıp [[wallet]]'ta onayladığında gönderir.

**Dene.** *Oku* bir \`eth_call\` gönderir: tek bir [[node]], kendi durum kopyasından anında cevap verir; [[gas-fee]] de imza da gerekmez. *Yaz* ise imzalı [[transaction]]'ı \`eth_sendRawTransaction\` ile gönderir: işlem diğer [[node]]'lara iletilir ve ancak bir [[validator]] onu bir [[block]]'a koyduğunda etkisini gösterir; Ethereum'da bu yaklaşık 12 saniyede bir olur.

Şimdi sağlayıcıyı çökmüş olarak işaretle. Hiçbir şey geçmez, ama kontrat çökmüş değildir. Başka bir sağlayıcıya geç; aynı çağrı çalışır. Bir [[rpc]] sağlayıcısı ağa açılan bir kapıdır ve kapı tek değildir.`,
        expert: `Tel üzerindeki biçim [[json-rpc]] 2.0'dır: HTTPS ya da WebSocket üzerinden \`{ jsonrpc, id, method, params }\`. Bir [[dapp]]'in en çok kullandığı metotlar:

- \`eth_call\`: bir mesaj çağrısını, [[transaction]] oluşturmadan, verilen bir [[block]]'un (çoğunlukla \`"latest"\`) durumu üzerinde çalıştırır. \`view\` fonksiyonları ve durum değiştiren fonksiyonların simülasyonu için kullanılır.
- \`eth_estimateGas\`: çağrının başarıyla tamamlanmasına yeten bir [[gas]] limiti arar.
- \`eth_sendRawTransaction\`: imzalı, serileştirilmiş işlemi gönderir; işlem bir [[block]]'a girmeden çok önce, hemen [[hash]] değerini döndürür.
- \`eth_getTransactionReceipt\`: işlem bir [[block]]'a girene kadar \`null\`, sonra \`status\`, \`gasUsed\`, \`logs\`.
- \`eth_getLogs\`, \`eth_subscribe\`: [[event-log]] kayıtlarını okur.

Sağlayıcı, okumalar için güvenilen bir taraftır: eski ya da yanlış veri döndürebilir, [[address]] değerlerini ve IP'ni görebilir, bir [[transaction]]'ı iletmeyi reddedebilir. Ama sahtesini üretemez. Bir \`eth_call\` sonucu ancak [[node]] kadar dürüst olduğu için önemli her şey bir okumaya güvenerek değil, kontratın içinde zorunlu kılınmalıdır (örneğin asgari çıktı miktarı).

\`eth_sendRawTransaction\`'ın döndürdüğü [[hash]] bir onay değildir. İşlem [[mempool]]'da bekleyebilir, aynı [[account-nonce]] ve daha yüksek ücretli bir başkasıyla değiştirilebilir ya da sonradan bir [[reorg]] ile düşen bir [[block]]'a girmiş olabilir.

Kontrol iki yolu karşılaştırır. Bir \`eth_call\`, onu alan [[node]]'dan dışarı çıkmaz: [[mempool]] yok, [[gossip]] yok, durum değişikliği yok; cevap da o [[node]]'un hangi [[block]]'u \`latest\` saydığına bağlıdır. \`eth_sendRawTransaction\` ise her [[node]]'un yalnızca imzaya bakarak doğrulayabileceği baytları teslim eder. Sağlayıcı değiştirmenin yeni bir imza gerektirmemesi bundandır: aynı ham işlem birden fazla uç noktaya gönderilebilir ve [[account-nonce]] onun en fazla bir kez çalışmasını garanti eder. Bir sağlayıcı kesintisi güvenlik sorunu değil, erişilebilirlik sorunudur.`,
      },
      code: {
        lang: 'JSON-RPC',
        source: `// Okuma: balanceOf(0x1111…1111). Ücretsiz, imza yok.
{ "jsonrpc": "2.0", "id": 1, "method": "eth_call",
  "params": [{
    "to": "0xTOKEN…",
    "data": "0x70a082310000000000000000000000001111111111111111111111111111111111111111"
  }, "latest"] }

// Yazma: imzalı işlemin baytları. Gas öder.
{ "jsonrpc": "2.0", "id": 2, "method": "eth_sendRawTransaction",
  "params": ["0x02f8b2…"] }`,
      },
    },
    contract: {
      title: 'Kontrat çalışır',
      alt: 'Kontrat makinesinin üstünde bir kısa ve bir ya da iki uzun parçadan oluşan bir şerit süzülüyor: calldata. Üzerinde, paneldeki girdilerden üretilen baytlar yazıyor. Makinenin yanında Ayşe, Ben ve Cem için üç bakiye sütunu duruyor. Çağrı gönderilince makineye bir paket düşüyor ve sütunlar değişiyor; miktar bakiyeden büyükse makine kırmızıya dönüyor ve hiçbir şey değişmiyor.',
      body: {
        beginner: `İstek [[blockchain]] üzerindeki programa, yani [[smart-contract]]'a ulaştı. Bu program bir otomat gibi çalışır: isteği verirsin, sabit kurallarını uygular, sonuç çıkar. Arkasında duruma göre karar veren biri yoktur.

Buradaki istek şunu söylüyor: "Ayşe'den Ben'e 10 token aktar". Kontrat Ayşe'nin gerçekten 10 "token"'ı olup olmadığına bakar, onları Ayşe'nin bakiyesinden düşer ve Ben'inkine ekler.

Ağdaki her bilgisayar aynı programı aynı istekle çalıştırır ve aynı sonuca varmak zorundadır. Kontrol başarısız olursa hiçbir şey değişmez. Sonucu hakemsiz güvenilir kılan budur.

**Dene:** [[token]]'ları kimin alacağını ve kaç tane gideceğini seç, sonra *Çağrıyı gönder* düğmesine bas. Makinenin yanındaki bakiye sütunları değişir. Şimdi Ayşe'nin elindekinden fazlasını göndermeyi dene: makine reddeder ve bütün bakiyeler olduğu gibi kalır.`,
        intermediate: `[[transaction]]'ın içinde [[calldata]] bulunur: hangi fonksiyonun hangi argümanlarla çalışacağını söyleyen baytlar. Bu baytların nasıl dizileceğini kontratın [[abi]] tanımı belirler.

[[token]] iyi bir örnektir. Bir [[erc-20]] "token"'ı, bir bakiye tablosu tutan kontrattan ibarettir. "Token göndermek", onun \`transfer\` fonksiyonunu çağırmak demektir; bu fonksiyon bir satırı azaltır, bir diğerini artırır. Bir yerden bir yere giden bir para yoktur; kontratın deposundaki bir sayı değişir.

Kodun her adımı [[gas]] harcar. Kod başarısız bir kontrole takılırsa ya da [[gas]] biterse çağrının tamamı **geri alınır** ("revert"): bütün değişiklikler silinir, ama o ana kadar yapılan iş için [[gas-fee]] yine ödenir.

Bir [[dapp]] senin "token"'larını alması gerektiğinde ("swap", yatırma), daha önce verdiğin [[token-approval]]'ı kullanır: \`transferFrom\` çağırır ve [[token]] kontratı herhangi bir şeyi taşımadan önce izni kontrol eder.

**Dene.** Makinenin üstündeki şerit, girdilerin için üretilen gerçek [[calldata]]'dır. Miktarı değiştir; yalnızca son kelime değişir. Alıcıyı değiştir; yalnızca ortadaki değişir. Fonksiyonu \`approve\` ya da \`balanceOf\` yap; bu kez ilk dört bayt, yani "selector" değişir: \`0xa9059cbb\`, \`0x095ea7b3\`, \`0x70a08231\`. \`balanceOf\` tek argüman alır, bu yüzden şerit kısalır; yalnızca okur, bu yüzden hiçbir şey değişmez. Sonra Ayşe'de 100 [[token]] varken 101 gönder: çağrı "revert" olur.`,
        expert: `Bir fonksiyon çağrısının [[calldata]]'sı, 4 baytlık "selector" ile onu izleyen [[abi]] kodlu argümanlardan oluşur. "Selector", kanonik imzanın \`keccak256\` özetinin ilk 4 baytıdır: \`keccak256("transfer(address,uint256)")\`, \`0xa9059cbb\` ile başlar. Statik argümanların her biri 32 baytlık bir kelimeye tamamlanır (\`address\` ve tam sayılar soldan sıfırla doldurulur); dinamik tipler (\`bytes\`, \`string\`, diziler) baş kısma bir "offset", kuyruk kısma ise uzunluklarını ve verilerini koyar.

[[solidity]] derleyicisi, "selector"'ı karşılaştırıp ilgili fonksiyon gövdesine atlayan bir "dispatcher" üretir; bilinmeyen bir "selector" \`fallback\`'e düşer ya da "revert" olur. Depolama, her kontrat için 256 bitlik bir anahtar → değer eşlemesidir; \`balanceOf[a]\` kaydı \`keccak256(abi.encode(a, p))\` slotunda durur, burada \`p\` o "mapping"'in tanımlandığı slottur.

Çoğu [[dapp]]'in dayandığı [[erc-20]] "allowance" akışı:

- kullanıcı [[token]] üzerinde \`approve(spender, amount)\` çağırır ve \`allowance[user][spender]\` değerini ayarlar;
- [[dapp]] kontratı \`token.transferFrom(user, to, amount)\` çağırır; bu fonksiyon "allowance"'ı kontrol edip azaltır, sonra bakiyeyi taşır.

Bilinmesi gereken uç durumlar: bazı "token"'lar \`bool\` döndürmez ("safe transfer" sarmalayıcısı kullan), bazıları transferden ücret keser ve alınan miktar \`amount\`'tan düşük olur, sıfırdan farklı bir "allowance"'ı doğrudan değiştirmek ise "front-run" edilebilir. "Revert", başarısız çağrı çerçevesindeki durum değişikliklerini ve "log"'ları geri alır, ama gönderen harcanan [[gas]] için yine öder.

Sahnedeki "selector" ve 32 baytlık kelimeler senin girdilerinden hesaplanır: \`selector ‖ word(address) ‖ word(amount)\`. Miktar, [[token]]'ın en küçük birimi cinsindendir (18 ondalıkla 10 [[token]], \`10 · 10¹⁸ = 0x8ac7230489e80000\` eder). Sahnedeki [[token]] aşağıdaki kod parçasını izler: \`transfer\` alttan taşmada "revert" olur, 0 miktarlı bir transfer başarılıdır ve yine \`Transfer\` yayınlar, \`approve\` \`allowance[msg.sender][spender]\` değerini yazar ve \`Approval\` yayınlar, \`balanceOf\` ise derleyicinin \`public\` "mapping" için ürettiği okuma fonksiyonudur. Burada \`msg.sender\` her zaman Ayşe'dir: anahtarı imzayı atan hesap.`,
      },
      code: {
        lang: 'Solidity (sadeleştirilmiş ERC-20)',
        source: `// transfer(0x2222…2222, 10 * 10**18) için calldata:
// 0xa9059cbb                                                        selector
// 0000000000000000000000002222222222222222222222222222222222222222  to
// 0000000000000000000000000000000000000000000000008ac7230489e80000  amount

mapping(address => uint256) public balanceOf;
mapping(address => mapping(address => uint256)) public allowance;

function transfer(address to, uint256 amount) external returns (bool) {
    balanceOf[msg.sender] -= amount;          // eksiye düşerse revert (>= 0.8)
    balanceOf[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
}

function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    allowance[from][msg.sender] -= amount;    // spender onaylı olmalı
    balanceOf[from] -= amount;
    balanceOf[to] += amount;
    emit Transfer(from, to, amount);
    return true;
}`,
      },
    },
    events: {
      title: '"Event"\'ler ekrana geri döner',
      alt: 'Kontratın arkasında üst üste dizilmiş plakalar duruyor: her biri bir event log, en yenisi en üstte. Paneldeki filtreye uyan log\'lar yeşil parlıyor ve üzerlerinde gönderen, alan ve miktar yazıyor; diğerleri gri kalıyor. Yeşil paketler kontrattan çıkıp RPC node üzerinden ve veritabanı olan bir indexer üzerinden ekrana gidiyor; ekran yeşile dönüp kaç log aldığını gösteriyor.',
      body: {
        beginner: `Kontrat işini yaptı. Peki web sitesi bunu nereden öğrenecek?

Önemli bir şey olduğunda kontrat [[block]]'un içine bir not bırakır: "Ayşe'den Ben'e 10 token geçti". Bu nota "event" denir.

Web sitesi bu notları izler ve gördüğün şeyi yeniler: yeni bakiyen, yeşil bir onay işareti, geçmişine eklenen bir satır. Değişikliği sayfa yapmadı; sayfa yalnızca [[blockchain]]'in şu anda ne dediğini aktarıyor.

Sekmeyi istediğin an kapat, hiçbir şey kaybolmaz. Siteyi, hatta başka bir siteyi yeniden açtığında aynı notları okur ve aynı sonucu gösterir.

**Dene:** kontratın arkasındaki yığın onun notlarıdır; en yenisi en üsttedir. *Transfer gönder* düğmesine bas; yeni bir not belirir. Sonra filtreyi kullan: *Gönderen*, yalnızca seçtiğin kişinin [[token]] gönderdiği notları bırakır; *Alan* ise yalnızca aldıklarını. Sayfa tam olarak filtreye uyan notları gösterir, fazlasını değil.`,
        intermediate: `Bir kontrat çalışırken [[event-log]] **yayınlayabilir**: [[block]]'un içinde, [[transaction]]'ın makbuzuyla ("receipt") birlikte saklanan küçük bir kayıt. Bir [[erc-20]] transferi \`Transfer(from, to, value)\` yayınlar.

[[frontend]], [[transaction]]'ın bir [[block]]'a girmesini bekler, başarılı olup olmadığına bakar ve sayfayı günceller. Bunu [[rpc]] sunucusundan makbuzu isteyerek ya da kontratın "event"'lerine abone olarak öğrenir.

Durumu okumak sana yalnızca şimdiyi verir. Geçmiş için ("eski bütün işlemlerim") her [[block]]'u eşleşen "event"'ler için taramak gerekir. Bu yavaştır; bu yüzden çoğu [[dapp]] bir [[indexer]] kullanır: zinciri izleyen, çözülmüş "event"'leri bir veritabanına yazan ve sorgulara hızlı cevap veren bir servis.

Bir sonucu kesin saymadan önce birkaç [[block]] daha bekle; çok yeni bir [[block]] hâlâ değiştirilebilir.

**Dene.** Gönderdiğin her başarılı \`transfer\`, yığına bir \`Transfer\` [[event-log]]'u ekler; "revert" olan bir çağrı hiçbir şey eklemez. Filtre, bir [[frontend]]'in ya da bir [[indexer]]'ın [[node]]'a sorduğu sorudur: bu [[token]]'ın bütün transferleri, yalnızca belirli bir [[address]]'in gönderdikleri ya da yalnızca onun aldıkları. Gerçek bir sayfadaki "geçmişim" bölümü, senin [[address]] değerinle çalıştırılan bu sorgudur. Önceki adımda bir \`approve\` gönderdiysen onun kaydı da yığındadır; ama o bir \`Approval\`'dır, bu yüzden transfer sorgusu onu asla döndürmez.`,
        expert: `Bir "log" kaydı \`{ address, topics[0..3], data }\` biçimindedir ve \`LOG0\`–\`LOG4\` "opcode"'larıyla oluşturulur. Anonim olmayan bir "event" için \`topics[0]\`, "event" imzasının \`keccak256\` özetidir; \`Transfer(address,address,uint256)\` için bu \`0xddf252ad…f523b3ef\` değeridir. En fazla üç \`indexed\` parametre "topic" olarak onu izler; geri kalanlar [[abi]] ile kodlanıp \`data\` alanına yazılır. \`indexed\` dinamik değerlerin içeriği değil, özeti saklanır.

"Log"'lar işlem makbuzunda durur, [[block]]'un \`receiptsRoot\` alanı tarafından taahhüt edilir ve 2048 bitlik \`logsBloom\` içinde özetlenir. Kontratlar bunları **okuyamaz**: bir "log" yükleyen "opcode" yoktur. Maliyetleri 375 [[gas]], artı "topic" başına 375, artı veri baytı başına 8'dir; depolamadan çok daha ucuzdur.

Okuma yolları:

- \`eth_getLogs({ fromBlock, toBlock, address, topics })\`: "topic" filtreleri konuma bağlıdır, \`null\` her şeyi kabul eder, iç dizi VEYA anlamına gelir. Sağlayıcılar [[block]] aralığını ya da sonuç boyutunu sınırlar.
- Canlı akış için WebSocket üzerinden \`eth_subscribe("logs", filter)\`.

Bir [[indexer]], "log"'ları sorgulamaya uygun bir veritabanına aktarır. [[reorg]] durumunu ele almak zorundadır: düşen bir [[block]]'un "log"'ları \`removed: true\` ile yeniden iletilir ve bunlardan türetilen satırların geri alınması gerekir. Arayüz bir makbuzu yeterli [[confirmation]] ya da [[finality]] gelene kadar geçici saymalı, [[indexer]]'ı ise doğrunun kaynağı değil, zincirin bir önbelleği olarak görmelidir.

Filtre, \`eth_getLogs\` çağrısının \`topics\` dizisini kurar: bütün transferler için \`[topic0]\`, bir gönderen için \`[topic0, from]\`, bir alıcı için \`[topic0, null, to]\`. Burada \`topic0 = keccak256("Transfer(address,address,uint256)")\` olur; adres "topic"'i ise adresin soldan sıfırla 32 bayta tamamlanmış halidir. Eşleşme konuma göre ve birebirdir; bir [[node]]'un yalnızca \`indexed\` parametrelere göre filtreleyebilmesi bundandır. \`value\` üzerinden filtrelemek için kayıtları çekip \`data\` alanını kendin çözmen gerekir. \`Approval(address,address,uint256)\` farklı bir \`topic0\` değerine (\`0x8c5be1e5…\`) özetlenir; bu yüzden buradaki hiçbir sorguya girmez.`,
      },
      code: {
        lang: 'JSON-RPC',
        source: `// Bir token'ın 0x2222…2222 adresine GİDEN bütün Transfer event'leri
{ "jsonrpc": "2.0", "id": 3, "method": "eth_getLogs",
  "params": [{
    "address": "0xTOKEN…",
    "fromBlock": "0x1312D00",
    "toBlock": "latest",
    "topics": [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      null,                                  // from: herkes
      "0x0000000000000000000000002222222222222222222222222222222222222222"
    ]
  }] }

// Tek bir sonuç
{ "address": "0xTOKEN…", "blockNumber": "0x1312D2A",
  "topics": [ "0xddf252ad…", "0x000…1111", "0x000…2222" ],
  "data": "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
  "logIndex": "0x4", "removed": false }`,
      },
    },
  },
};

export default content;
