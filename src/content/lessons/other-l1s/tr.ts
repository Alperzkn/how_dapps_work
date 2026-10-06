import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token.
// Chain names (Solana, Avalanche, Cosmos, Bitcoin, Ethereum) are proper nouns:
// written plainly, without [[ ]] and without quotes.
// Every performance figure in this lesson is approximate and dated "2026 itibarıyla".

const content: LessonContent = {
  labels: {
    security: 'Güvenlik',
    securityI: 'saldırının maliyeti',
    securityE: 'hata eşiği · saldırı maliyeti',
    decentral: 'Merkeziyetsizlik',
    decentralI: 'kim node çalıştırabilir',
    decentralE: 'node maliyeti · node sayısı',
    scalable: 'Ölçeklenebilirlik',
    scalableI: 'saniyedeki işlem sayısı',
    scalableE: 'TPS ≈ boyut / aralık',
    weakSec: 'saldırmak ucuzlar',
    weakDec: 'az sayıda, büyük node',
    weakSca: 'yavaşlar',
    design: 'bir tasarım',
    poh: 'PoH saati',
    slot: 'slot ≈ 250 ms',
    leader: 'leader',
    parallel: 'farklı hesaplar:\naynı anda',
    parallelE: 'ayrık write set\n→ paralel',
    serial: 'aynı hesap:\nsırayla',
    serialE: 'aynı hesapta write lock\n→ sıralı',
    accepted: 'kabul edildi',
    sampleB: 'rastgele birkaç node’a sor,\nçoğunluğa uy, tekrarla',
    sampleI: 'her turda k node örnekle\n(gerçek ağda k = 20)',
    sampleE: 'k node’a sor · ≥ α aynıysa dön\nart arda β turdan sonra karar',
    primary: 'Primary Network',
    subnet: 'kendi zinciri',
    subnetOwn: 'L1 (subnet):\nkendi validator’ları',
    propose: 'propose',
    prevote: 'prevote',
    precommit: 'precommit',
    commit: 'commit · kesin',
    chainA: 'borsa zinciri',
    chainB: 'token zinciri',
    chainC: 'contract zinciri',
    lightClient: 'A’nın light client’ı',
    relayer: 'relayer',
    solB: 'çok hızlı tek zincir\ngüçlü makine ister',
    solI: 'block ≈ 0,25 sn\nkesinlik ≈ 8 sn',
    solE: 'PoH + Tower BFT\nSealevel: paralel',
    avaB: 'hızlı yoklamayla anlaşma\nçok sayıda özel zincir',
    avaI: 'block ≈ 1–2 sn\nkesinlik ≈ 1–2 sn',
    avaE: 'Snowman (Snow ailesi)\nC-Chain üzerinde EVM',
    cosB: 'her uygulamaya bir zincir\nIBC ile bağlı',
    cosI: 'block ≈ 1–6 sn\ntek block’ta kesinlik',
    cosE: 'CometBFT · ABCI\nIBC light client',
    approx: 'yaklaşık değerler, 2026 itibarıyla',
  },
  steps: {
    trilemma: {
      title: 'İkisini mi seçeceksin? "Scalability trilemma"',
      alt: 'Yerde bir üçgen var: bir köşesinde güvenliği temsil eden bir kule, bir köşesinde merkeziyetsizliği temsil eden küçük bilgisayarlar, üçüncü köşesinde ölçeklenebilirliği temsil eden, paketlerin aktığı şeritler. İçeride parlayan bir işaret dolaşıyor; hangi köşeden uzaklaşırsa o köşe küçülüyor.',
      body: {
        beginner: `Bitcoin ve Ethereum bilerek yavaştır. [[block]]'ları küçük ve acelesiz tutarlar ki sıradan insanlar yazılımı çalıştırıp her şeyi kendileri kontrol edebilsin.

Daha yeni zincirler daha hızlı ve daha ucuz olmak ister. Ama bir engel var; adına [[scalability-trilemma]] deniyor. Bir [[blockchain]] üç şey ister:

- **Güvenlik**: ona saldırmak aşırı pahalı olmalı.
- **Merkeziyetsizlik**: onu bir avuç şirket değil, birbirinden bağımsız çok sayıda insan çalıştırmalı.
- **Ölçeklenebilirlik**: çok sayıda işlemi hızlı ve ucuz halledebilmeli.

Üçünü birden elde etmek çok zordur. İkisine fazla yüklenirsen üçüncüsü geriler. Sahnedeki işareti izle: her tasarım o üçgenin içinde bir noktadır.`,
        intermediate: `[[layer-1]], kendi [[transaction]]'larını kendi [[consensus]] mekanizmasıyla sıralayan ve kesinleştiren taban zincirdir. Ham kapasitesi [[tps]] ile, yani saniyedeki [[transaction]] sayısıyla ölçülür. Bitcoin kabaca 7, Ethereum'un taban zinciri birkaç on [[tps]] yapabilir (yaklaşık, 2026 itibarıyla). Bir kart ağı ise binlercesini işler.

Peki [[block]]'ları neden büyütüp hızlandırmıyoruz?

- Daha büyük, daha hızlı [[block]]'lar daha fazla bant genişliği, depolama ve işlem gücü ister. Bir [[full-node]] çalıştırmayı daha az kişi karşılayabilir; **merkeziyetsizlik** azalır.
- Daha küçük bir [[validator]] grubu daha hızlı anlaşır, ama ona rüşvet vermek, baskı yapmak ya da onu devre dışı bırakmak daha kolaydır; **güvenlik** azalır.
- Binlerce ucuz [[node]]'u ve yüksek saldırı maliyetini korumak, her [[block]]'un taşıyabileceği veriyi sınırlar; **ölçeklenebilirlik** azalır.

[[scalability-trilemma]] bir doğa yasası değil, pratik bir kuraldır. Bu dersteki her zincir ona farklı bir cevap veriyor. Her biri için şunu sormak işe yarar: kim [[node]] çalıştırabilir, kaç kişinin anlaşması gerekir ve bunun maliyeti nedir?`,
        expert: `İş hacminin üst sınırı \`block kapasitesi / block aralığı\` kadardır. Kapasiteyi artırmak ya da aralığı kısaltmak, yayılma ve çalıştırma süresini aralığa oranla büyütür. En uzun zincir protokollerinde bu, "stale block" oranını artırır ve etkin dürüst çoğunluğu düşürür; [[bft]] protokollerinde ise "timeout" değerlerini ya da donanım gereksinimini yukarı iter.

Farklı kaynaklar ayrı ayrı sınır koyar:

- **Bant genişliği ve yayılma**: bir [[block]], tek bir aralığın epey içinde [[validator]]'ların çoğuna ulaşmalıdır.
- **Çalıştırma**: sıralı sanal makinelerde sınır tek iş parçacıklı durum erişimidir; [[parallel-execution]] sınırı belleğe ve disk G/Ç'sine taşır.
- **Durum büyümesi**: saniyede daha çok [[transaction]], her [[full-node]]'un tutmak zorunda olduğu durumun daha hızlı büyümesi demektir; bu da zamanla senkronizasyon süresine ve donanım maliyetine hâkim olur.
- **Mutabakat mesajları**: klasik [[bft]]'de her [[validator]] diğerlerinin üçte ikisinden fazlasını duymak zorundadır; imzalar birleştirilmezse O(n²) mesaj gerekir ve bu, pratikteki [[validator]] sayısını sınırlar.

Aşağıdaki tasarımlar farklı seçimler yapar: donanım gereksinimini yükseltip paralelleştirmek (Solana), herkesin herkesle oylaşmasını rastgele örneklemeyle değiştirmek (Avalanche) ya da uygulamaları, bir mesajlaşma protokolüyle birbirine bağlanan küçük komiteli çok sayıda zincire dağıtmak (Cosmos). Ethereum'un kendi cevabı, taban katmanı mütevazı tutup çalıştırmayı veriyi oraya yazan "rollup"'lara taşımaktır. [[scalability-trilemma]], Vitalik Buterin'in ortaya attığı sezgisel bir kuraldır, bir teorem değil; "data availability sampling" ve "validity proof" gibi teknikler onu gevşetmeyi hedefler.`,
      },
    },
    solana: {
      title: 'Solana: çok hızlı tek bir şerit',
      alt: 'Uzun bir adada dört şerit boyunca paketler, soldaki leader’dan sağdaki hesap kutularına doğru hızla akıyor. İki şerit kendi kutusunda bitiyor; diğer ikisi tek bir kutuyu paylaşıyor ve sırayla ilerliyor. Şeritlerin arkasında bir saat tıkırdıyor, yanında birbirine bağlı boncuklar sırayla parlıyor.',
      body: {
        beginner: `Solana tek bir zinciri olabildiğince hızlı yapmaya çalışır.

Bunun için alışılmadık iki şey yapar. Birincisi, içinde bir **saat** vardır. Herkes, başka herhangi bir konuda anlaşmadan önce olayların hangi sırayla gerçekleştiğini zaten görebilir; böylece konuşmaya daha az zaman harcanır. Bu saate [[proof-of-history]] denir.

İkincisi, birçok işi **aynı anda** yapar. Bir ödeme Ayşe ile Ben arasında, bir diğeri Cem ile Deniz arasındaysa birbirleriyle ilgileri yoktur ve ayrı şeritlerdeki arabalar gibi yan yana ilerleyebilirler. Aynı hesaba dokunan iki ödeme ise yine birbirini beklemek zorundadır.

Bu hızın bedeli, Solana'yı çalıştıran bilgisayarların güçlü ve iyi bağlantılı olması gerekmesidir; evdeki bir dizüstünden çok daha fazlası.`,
        intermediate: `Solana kabaca 250 milisaniyede bir [[block]] üretir (Ekim 2026 itibarıyla; Ağustos 2026'ya kadar 400 milisaniyeydi ve aşamalı olarak 200'e indiriliyor). Zaman [[slot]]'lara bölünür ve önceden yayınlanan bir takvim, her [[slot]]'ta hangi [[validator]]'ın "leader" olacağını söyler.

**Saat.** [[proof-of-history]], "leader"'ın saatidir. Bir [[hash]] fonksiyonunu tekrar tekrar çalıştırır; her çıktı bir sonrakinin girdisi olur ve gelen [[transaction]]'lar bu diziye karıştırılır. Bu [[hash]] zinciri ancak adım adım üretilebildiği için zamanın geçtiğini kanıtlar ve [[transaction]]'ların [[block]] içindeki sırasını sabitler.

**Şeritler.** [[parallel-execution]] şöyle işler: her Solana [[transaction]]'ı hangi hesapları okuyacağını ve hangilerine yazacağını baştan bildirir. Çalışma ortamı bu listeyi kullanarak aynı hesaplara dokunmayan [[transaction]]'ları farklı işlemci çekirdeklerinde çalıştırır.

Kabaca değerler, 2026 itibarıyla: pratikte saniyede kabaca bin ile birkaç bin arası kullanıcı [[transaction]]'ı (teorik tavan çok daha yüksek); birkaç yüz [[validator]]; ücretler genellikle bir sentin küçük bir kesri. [[validator]]'lar sunucu sınıfı donanıma ihtiyaç duyar: çok çekirdekli işlemci, yüzlerce gigabayt RAM ve çok hızlı bir bağlantı. Ağ ayrıca geçmişinde birkaç kez tamamen durdu (en son Şubat 2024'te) ve [[validator]]'ları tarafından yeniden başlatıldı.`,
        expert: `[[proof-of-history]], sıralı bir [[sha-256]] zinciridir: \`hₙ = SHA-256(hₙ₋₁)\`; [[transaction]] [[hash]]'leri geldikleri noktada diziye karıştırılır. Üretimi doğası gereği sıralıdır, ama doğrulaması öyle değildir: doğrulayan taraf diziyi parçalara böler ve bunları birçok çekirdekte kontrol eder. Bu, [[validator]]'ların önce mesajlaşmadan sıra ve geçen süre üzerinde anlaşmasını sağlayan doğrulanabilir bir saattir. [[consensus]] mekanizmasının kendisi değildir ve "Sybil" direnci sağlamaz; onu [[proof-of-stake]] sağlar.

[[consensus]], PoH'u saat olarak kullanan, PBFT'den türetilmiş **Tower BFT**'dir. Bir "fork" üzerindeki her oy, üstüne verilen her ardışık oyla iki katına çıkan bir "lockout" taşır; bir [[block]], bir [[validator]]'ın oy kulesinde 32 onaya ulaşınca "root" olur. [[stake]]'in üçte ikisinden fazlası oy verdiğinde gelen "optimistic confirmation" genellikle bir saniye civarında gerçekleşir; tam [[finality]] yaklaşık 32 [[slot]] sürer: 250 milisaniyelik [[slot]]'larla kabaca 8 saniye ([[slot]]'lar 400 milisaniyeyken yaklaşık 13 saniyeydi). [[validator]]'lar 2025'te Alpenglow adlı bir yeniden tasarımı onayladı; bu tasarım Tower BFT'yi ve PoH'u, yaklaşık 150 milisaniyede [[finality]] hedefleyen bir protokolle değiştiriyor. Ekim 2026 itibarıyla "mainnet"'te henüz devreye alınmadı.

Çalışma ortamı **Sealevel**, her [[transaction]]'ın bildirdiği hesaplara okuma ve yazma kilitleri koyarak [[transaction]]'ları paralel çalıştırır. Programların kendi durumu yoktur; bütün durum, çağıranın verdiği hesaplarda yaşar. Çekişmeli hesaplar yerel ücret piyasaları oluşturur: "priority fee" hesaplama birimi başına teklif edilir ve yalnızca aynı yazma kilidi için yarışanları ilgilendirir.

Destekleyici parçalar: "leader"'lar art arda 4 [[slot]] alır; küresel bir [[mempool]] yoktur, [[transaction]]'lar sıradaki "leader"'lara iletilir; [[block]]'lar "erasure coding" ile parçalanıp [[stake]] ağırlıklı bir ağaç üzerinden akıtılır. Bedelleri: yüksek [[validator]] donanımı ve bant genişliği gereksinimi, çok hızlı büyüyen bir kayıt (tam arşiv yüzlerce terabayt mertebesinde) ve bileşenler arasında, geçmişteki duruşlarda payı olan sıkı bağlılık.`,
      },
      code: {
        lang: 'Python (Proof of History, sadeleştirilmiş)',
        source: `from hashlib import sha256

def poh_stream(seed, transactions, ticks):
    h = seed
    for n in range(ticks):
        tx = transactions.get(n)       # bu noktada gelen bir tx
        if tx:
            h = sha256(h + sha256(tx).digest()).digest()   # diziye karıştır
        else:
            h = sha256(h).digest()     # yalnızca zaman geçsin
        yield n, h                     # n. kayıt "n-1'den sonra"yı kanıtlar

# 1.000.000 kayıt üretmek 1.000.000 sıralı hash gerektirir.
# Doğrulama çekirdeklere bölünebilir: her parça için yalnızca
# başlangıç hash'i gerekir; 8 çekirdek yaklaşık 8 kat hızlı doğrular.`,
      },
    },
    avalanche: {
      title: 'Avalanche: birkaç kişiye sor, tekrarla; bir de çok sayıda zincir',
      alt: 'Yuvarlak bir adada halka şeklinde dizilmiş sekiz küçük bilgisayar var; bazıları mavi, bazıları turuncu. Sırayla her biri üç başka bilgisayara kesikli çizgiler çekiyor ve çoğunluğun rengini alıyor; sonunda hepsi mavi oluyor ve ortadaki block yeşile dönüyor. Ana adanın çevresine üç küçük ada bağlı; her birinin kendi block’u ve iki validator’ı var.',
      body: {
        beginner: `Avalanche, kalabalıkta yayılan bir dedikoduya benzeyen bir yolla anlaşmaya varır.

Bir [[node]] herkesten haber beklemez. **Rastgele seçtiği birkaç** [[node]]'a ne düşündüklerini sorar. Çoğu aynı şeyi söylüyorsa o cevabı benimser, sonra yeni bir rastgele grup seçip tekrar sorar; bunu defalarca yapar. Bir iki saniye içinde bütün kalabalık aynı yöne devrilir; birkaç taşla başlayan bir çığ gibi.

Avalanche ayrıca bir projenin, ana zincirin yanında, kendi kurallarıyla **kendi zincirini** başlatmasına izin verir. Bunlara eskiden [[subnet]] deniyordu, artık Avalanche L1 deniyor. Bir oyunun bir zinciri, bir bankanın başka bir zinciri olabilir ve yer için yarışmazlar.`,
        intermediate: `Klasik [[bft]] protokollerinde her [[validator]] diğerlerinin üçte ikisinden fazlasını duymak zorundadır; bu yüzden konuşma miktarı [[validator]] sayısıyla birlikte hızla artar. Avalanche bunun yerine **tekrarlı rastgele örnekleme** kullanır.

Her turda bir [[validator]], ([[stake]] ağırlıklı) küçük bir rastgele gruba hangi [[block]]'u tercih ettiklerini sorar. Örneklemin yeterince büyük bir çoğunluğu aynı fikirdeyse [[validator]] o tercihi benimser. Aynı sonuçla yeterince ardışık turdan sonra [[block]]'u kesinleşmiş sayar. Ağ ne kadar büyük olursa olsun [[validator]] başına düşen iş aşağı yukarı aynı kalır.

Kabaca değerler, 2026 itibarıyla: yaklaşık 1–2 saniyede [[finality]] ve ana ağda, her biri en az 2.000 AVAX [[stake]] eden, birkaç yüz [[validator]] (kabaca 600).

Ana ağ farklı işleri olan üç zincir çalıştırır; C-Chain üzerinde [[evm]] çalışır, yani Ethereum "contract"'ları ve [[wallet]]'ları orada da işler. Bunun ötesinde herkes kendi [[validator]]'ları, kendi ücret token'ı ve kendi kuralları olan ayrı bir zincir, yani bir [[subnet]] (2024 sonundan beri adıyla Avalanche L1) başlatabilir. Kapasite, tek bir zinciri büyüterek değil, zincir ekleyerek artırılır.`,
        expert: `Snow ailesi (Slush, Snowflake, Snowball ve üretimde kullanılan, zincir sıralayan türev **Snowman**) "leader"'sız, olasılıksal bir [[consensus]] ailesidir. Her turda bir [[node]], [[stake]]'e göre \`k\` [[validator]] örnekler; bunların en az \`α\` tanesi aynı değeri tercih ediyorsa yoklama başarılıdır: [[node]]'un o değere güveni artar, gerekiyorsa tercihini değiştirir. Art arda \`β\` başarılı yoklamadan sonra karar verir. Ana ağda \`k = 20\`, \`α = 15\`, \`β = 20\` civarında değerler kullanıldı (yaklaşık; güncellemelerle ayarlandı).

Ağ "metastable"'dır: tercihlerdeki herhangi bir dengesizlik, herkes aynı noktaya varana kadar örneklemeyle büyür. Güvenlik olasılıksaldır; parametreler, saldırganın [[stake]]'i parametreye bağlı bir sınırın altında kaldıkça iki dürüst [[node]]'un farklı karar verme ihtimali ihmal edilebilir olacak şekilde seçilir. Karar başına [[node]] başına mesaj maliyeti O(k·β)'dır ve ağ büyüklüğünden bağımsızdır; büyük [[validator]] kümelerini mümkün kılan budur. Oylama için bir "leader" yoktur; yumuşak bir "proposer" takvimi yarışan [[block]] önerilerini sınırlar. [[slashing]] yoktur: fazla çevrimdışı kalan [[validator]]'lar yalnızca [[staking]] ödülünü kaybeder.

Primary Network'te üç zincir vardır: P-Chain ([[validator]]'lar, [[staking]], L1 kaydı), C-Chain ([[evm]]) ve X-Chain ([[utxo]] modeliyle varlık transferi). Üçü de artık Snowman kullanır.

Bir [[subnet]], kendi sanal makinesiyle bir ya da daha fazla zincir çalıştıran bir [[validator]] kümesidir. Etna güncellemesinden (Aralık 2024) beri bunlar "Avalanche L1" adını taşır: [[validator]]'ları artık Primary Network'ü doğrulamak ya da 2.000 AVAX [[stake]] etmek zorunda değildir; bunun yerine P-Chain üzerinde sürekli bir ücret öderler. L1'ler, kaynak zincirin [[validator]] kümesinden toplanan birleştirilmiş imzalarla (BLS "multi-signature") mesajlaşır; bu imzalar P-Chain'de kayıtlı [[validator]] kümesine karşı doğrulanır. Bedeli: her L1 ancak kendi, çoğu zaman çok daha küçük, [[validator]] kümesi kadar güvenlidir.`,
      },
      code: {
        lang: 'Python (Snowflake döngüsü, sadeleştirilmiş)',
        source: `def snowflake(node, peers, k=20, alpha=15, beta=20):
    preference = node.initial_choice
    streak = 0                         # art arda başarılı yoklama sayısı
    while streak < beta:
        sample = stake_weighted_sample(peers, k)
        votes = count(p.preference for p in sample)
        choice, n = votes.most_common(1)[0]
        if n >= alpha:                 # örneklemde güçlü çoğunluk
            if choice == preference:
                streak += 1
            else:
                preference, streak = choice, 1
        else:
            streak = 0                 # sonuçsuz yoklama: baştan say
    return preference                  # karar verildi`,
      },
    },
    cosmos: {
      title: 'Cosmos: her uygulamaya bir zincir, "IBC" ile bağlı',
      alt: 'Altıgen üç ada var; her biri kendi dört validator’ı olan ayrı bir zincir. İlk adada dört validator’dan üçü propose, prevote ve precommit için sırayla yanıyor, sonra bir block yeşile dönüyor; dördüncü karanlık kalıyor. Adaları yürüme yolları bağlıyor ve üzerlerinde paketler gidip geliyor; birinin yanında bir relayer duruyor.',
      body: {
        beginner: `Cosmos yaklaşımı farklı bir fikirden yola çıkar: herkes için tek bir büyük zincir yerine **her uygulamaya kendi zincirini** ver. Bir borsanın bir zinciri, bir oyunun başka bir zinciri olur ve her biri kendine uyan kuralları seçebilir.

Bu zincirlerin her birini kendi [[validator]] grubu çalıştırır. Her [[block]] üzerinde **oylayarak** anlaşırlar: biri bir [[block]] önerir, diğerleri iki kez oy verir ve üçte ikiden fazlası evet dediği anda [[block]] kesinleşir. Bu oylama yöntemine [[tendermint]] denir.

Ayrı zincirler birer ada olurdu; bu yüzden [[ibc]] adlı bir tür posta servisiyle birbirlerine bağlanırlar. [[ibc]], bir zincirin diğerine coin ve mesaj göndermesini, alan zincirin de mesajın gerçek olduğunu kendisinin kontrol etmesini sağlar.`,
        intermediate: `Cosmos ekosisteminde ekipler **"app chain"** kurar: her biri kendi [[validator]] kümesi, kendi token'ı ve kendi yönetişimi olan bağımsız bir [[layer-1]]; genellikle aynı araç setiyle (Cosmos SDK) yazılır.

[[consensus]] mekanizması, bugün CometBFT adıyla sürdürülen [[tendermint]]'tir. Her [[block]] turlardan geçer:

- **"propose"**: sırayla seçilen bir [[validator]] bir [[block]] önerir;
- **"prevote"** ve **"precommit"**: [[validator]]'lar iki aşamada oy verir;
- **"commit"**: [[stake]]'in üçte ikisinden fazlasını elinde tutan [[validator]]'lar "precommit" verdiğinde [[block]] kesinleşir.

Yarışan "fork"'lar ya da ek [[confirmation]] beklemek yoktur: [[finality]] anındadır; genellikle [[transaction]] gönderildikten birkaç saniye sonra. Sistem, [[stake]]'in üçte birinden azı hatalı olduğu sürece çalışmaya devam eder. Üçte birden fazlası çevrimdışı kalırsa zincir, geçmişin iki farklı sürümünü riske atmak yerine durur. Herkes her [[block]] için oy verdiğinden [[validator]] kümeleri küçük tutulur; genellikle 100 ile 200 arası (yaklaşık, 2026 itibarıyla).

Zincirleri [[ibc]] bağlar. Her zincir diğerinin bir [[light-node]]'unu ("light client") çalıştırır; böylece diğer zincirin durumu hakkındaki kanıtları doğrulayabilir. Paketleri "relayer" denen bağımsız programlar taşır, ama onları taklit edemezler.`,
        expert: `[[tendermint]] (CometBFT), PBFT ailesinden, kısmi eşzamanlılık varsayan bir [[bft]] protokolüdür. \`h\` yüksekliği ve \`r\` turu için "proposer" (oy gücüne göre ağırlıklı "round-robin") bir [[block]] yayınlar; [[validator]]'lar "prevote" verir; oy gücünün ⅔'ünden fazlasından "prevote" gördüklerinde (bir "polka") o [[block]]'a kilitlenir ve "precommit" verirler; ⅔'ten fazla "precommit" [[block]]'u kesinleştirir. Tur zaman aşımına uğrarsa \`r\` artar ve yeni bir "proposer" gelir; kilitleme kuralları aynı yükseklikte iki farklı [[block]]'un kesinleşmesini engeller. Bizans oy gücü ⅓'ün altında kaldıkça güvenlik korunur; canlılık için ayrıca ⅔'ten fazlasının çevrimiçi olması gerekir, yani zincir "fork" etmek yerine durur. Çift imza kanıtlanabilir ve [[slashing]] ile cezalandırılır.

[[consensus]], uygulamayla ABCI üzerinden konuşur: motor baytları sıralar, uygulama (herhangi bir dilde, çoğunlukla Cosmos SDK ile) bunların ne anlama geldiğini tanımlar. Her [[block-header]], uygulamanın durum kökünü (\`AppHash\`) ve bir sonraki [[validator]] kümesinin [[hash]]'ini taşır; ucuz "light client"'ları mümkün kılan budur.

[[ibc]] katmanlıdır: zincir üstündeki "light client"'lar karşı tarafın [[consensus]] durumunu izler; "connection" ve "channel"'lar el sıkışmalarla açılır; bir paket gönderenin durumunda taahhüt edilir ve alıcı onu ancak "light client"'ının doğruladığı bir [[block-header]]'a karşı verilen Merkle kanıtıyla kabul eder. Paketlerin zaman aşımı ve alındı bildirimi vardır; yani bir transfer ya tamamlanır ya da iade edilir. "Relayer"'lar izinsizdir ve onlara güvenmek gerekmez. Token'lar için (ICS-20) kaynak zincir coin'leri emanete alır, hedef zincir de birimi izlediği yolu kodlayan bir "voucher" basar.

Artılar ve eksiler: bir transferde güvenilen şey üçüncü taraf bir köprü değil, ilgili iki zincirin [[validator]] kümeleridir. Öte yandan her "app chain" kendi güvenliğini kendisi toplamak ve finanse etmek zorundadır, likidite zincirlere dağılır ve zincirler arası bir çağrı, aynı zincirdeki iki "contract" arasındaki çağrının aksine asenkrondur.`,
      },
    },
    tradeoffs: {
      title: 'Aynı sorun, farklı cevaplar',
      alt: 'Önceki adımlardaki üç model küçültülmüş ve zikzak şeklinde dizilmiş: Solana’nın tek hızlı adası, Avalanche’ın uydularıyla yuvarlak adası ve birbirine bağlı üç Cosmos adası. Her birinin yanındaki kart başlıca özelliklerini sıralıyor.',
      body: {
        beginner: `Üç zincir, üç ayrı bahis:

- Solana: olabildiğince hızlandırılmış tek bir zincir. Her şey tek yerde olduğu için kullanması basit. Çalıştırmak için güçlü makineler gerekir.
- Avalanche: etrafa sorarak çok hızlı anlaşma; ayrıca kendi zincirini isteyen projeler için ek zincir seçeneği.
- Cosmos: her uygulamaya bir tane düşen, [[ibc]] ile bağlı çok sayıda bağımsız zincir. Esnek, ama her zincir kendi güvenliğine kendisi bakmak zorunda.

Hiçbiri ilk adımdaki üçgenden kurtulmadı. Her biri hangi köşeden ne kadar uzaklaşacağına karar verdi. Bir zincirin "daha hızlı" ya da "daha ucuz" olduğunu duyduğunda sorulacak asıl soru şu: **oraya varmak için neden vazgeçti?**`,
        intermediate: `Yaklaşık değerler, 2026 itibarıyla:

- Solana: yaklaşık 0,25 saniyede bir [[block]]; tam [[finality]] kabaca 8 saniye (daha hızlı bir onay genellikle bir saniye civarında gelir); birkaç yüz [[validator]]; sunucu sınıfı donanım.
- Avalanche: yaklaşık 1–2 saniyede [[finality]]; ana ağda birkaç yüz [[validator]]; mütevazı donanım; ek kapasite, her biri kendi [[validator]]'larına sahip ayrı L1'lerle sağlanır.
- Cosmos zincirleri: 1–6 saniyede bir [[block]], anında kesin; zincir başına genellikle 100–200 [[validator]]; mütevazı donanım; zincirler [[ibc]] ile bağlı.
- Karşılaştırma için Ethereum: 12 saniyelik [[slot]]'lar, yaklaşık 13 dakika sonra [[finality]], yüz binlerce [[validator]] anahtarı, tüketici sınıfı donanım.

Ham [[tps]] rakamları zincirleri karşılaştırmanın en güvenilmez yoludur: neyin [[transaction]] sayıldığına ve test koşullarına bağlıdır. [[finality]] süresi, [[validator]] sayısı, donanım maliyeti ve bir kesinti sırasında ne olduğu, bir tasarım hakkında daha çok şey söyler.`,
        expert: `- **Mutabakat ailesi.** Solana: [[stake]] ağırlıklı "leader" takvimi, PoH saati, üstel "lockout"'lu Tower BFT. Avalanche: tekrarlı alt örneklemeyle "leader"'sız Snowman, olasılıksal güvenlik. Cosmos: tek [[block]]'ta deterministik [[finality]] veren [[tendermint]] tarzı [[bft]]. Kıyas için Ethereum: [[lmd-ghost]] ve [[casper-ffg]].
- **Arıza biçimi.** [[tendermint]] zincirleri oy gücünün ⅓'ünden fazlası çevrimdışı olunca durur (canlılık yerine güvenlik). Solana, işlem hattı aşırı yüklendiğinde ya da bir hataya takıldığında durdu ve koordineli bir yeniden başlatma gerekti. En uzun zincir tasarımları ise [[block]] üretmeye devam eder, onun yerine [[finality]] kaybeder.
- **Çalıştırma modeli.** Solana: hesaplar baştan bildirilir, [[parallel-execution]] (Sealevel). Avalanche C-Chain: [[evm]], sıralı; L1 başına başka sanal makineler. Cosmos: ABCI'nin arkasında uygulamanın tanımladığı durum makinesi, çoğu zaman bir WebAssembly "contract" modülüyle.
- **Ölçekleme yönü.** Solana için dikey (tek zincir, daha büyük makineler); Avalanche L1'leri ve Cosmos için yatay (çok sayıda zincir); Ethereum için katmanlı (temkinli bir taban üzerinde "rollup"'lar).
- **Durum büyümesi.** Tek zincirde yüksek iş hacmi, durumu ve geçmişi her [[validator]]'da toplar; çok sayıda zincir bunu dağıtır ama likiditeyi ve güvenliği böler.
- **Zincirler arası güven.** Tek bir zincirin içinde çağrılar atomiktir. Zincirler arasında: [[ibc]], "light client"'lar üzerinden iki [[validator]] kümesine dayanır; Avalanche mesajlaşması kaynak L1'in [[validator]]'larından toplanan birleştirilmiş imzalara dayanır.

Bu dersteki bütün rakamlar yaklaşıktır ve 2026 itibarıyladır; bu ağlar güncellemelerle parametrelerini, hatta [[consensus]] protokollerini değiştirir.`,
      },
    },
  },
};

export default content;
