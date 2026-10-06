import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[block]]'lar -> "block"'lar.
// English technical words without a glossary entry are quoted by hand: "light client".

const content: LessonContent = {
  labels: {
    sharedLedger: 'Ortak defter',
    copy: 'kendi kopyası',
    block: 'Block',
    genesis: 'Block 1 · genesis',
    prev: 'prev',
    hash: 'hash',
    edited: 'değiştirildi',
    broken: 'bağ koptu',
    redone: 'onarıldı',
    honest: 'Dürüst zincir',
    attacker: 'Saldırganın kopyası',
    pickBlock: 'Düzenlenecek block',
    editPrompt: 'Block {n} içindeki veriyi değiştir',
    hashOf: 'Block {n} hash',
    reset: 'Sıfırla',
    redoBlock: 'Onar: block {n}',
    nothingToRedo: 'Onarılacak yok',
    toRedo: 'block daha onarılmalı',
    toRedoOne: 'block daha onarılmalı',
    repaired: 'yeniden tutarlı, ama bütün hash değerleri yeni',
    tipWas: 'son hash eskiden',
    tipNow: 'son hash şimdi',
    sampleText: 'Merhaba',
    typePrompt: 'Bir şeyler yaz',
    fingerprint: 'parmak izi',
    fullHash: 'Yazdığın metnin SHA-256 değeri',
    changed: 'Değişen karakter',
    changedShort: 'değişti',
    shareLabel: 'Saldırganın gücü',
    depthLabel: 'Üstündeki block',
    catchUp: 'Yetişme olasılığı',
    fromBehind: 'z geriden: (q/p)^z',
    blockOnTop: 'block üstte',
    blocksOnTop: 'block üstte',
    blocksMade: 'block',
    usePrompt: 'Tek bir zincir başka neleri kaydedebilir?',
    use_payments: 'Ödemeler',
    use_ownership: 'Sahiplik',
    use_identity: 'Kimlik',
    use_supply: 'Tedarik zinciri',
    use_votes: 'Oylar',
    use_games: 'Oyun eşyaları',
    ex_payments: 'Ayşe → Ben: 5 coin',
    ex_ownership: 'bilet #42 → sahibi: Cem',
    ex_identity: 'diploma hash: 3fa1…',
    ex_supply: 'sandık 17: çiftlik → liman',
    ex_votes: 'öneri 12 · Ben: evet',
    ex_games: 'kılıç #7 → oyuncu: Ayşe',
    why_payments: 'Kim kime ödedi. İlk kullanım alanı; bu kurs da bu yolu izliyor.',
    why_ownership: 'Eşsiz bir şeyin kime ait olduğu; bir token (NFT) olarak kaydedilir.',
    why_identity: 'Bir diplomanın ya da lisansın parmak izi; gerçek olup olmadığını herkes kontrol edebilir.',
    why_supply: 'Bir sevkiyatın her el değiştirmesi; teslim eden tarafından imzalanır.',
    why_votes: 'Herkesin yeniden sayabildiği imzalı oylar.',
    why_games: "Oyunun sunucusunda değil, oyuncunun kendi key'inde duran eşyalar.",
    oneChain: 'tek zincir',
    coursePath: 'bu kurs bu yoldan gidiyor',
  },
  steps: {
    ledger: {
      title: 'Herkesin paylaştığı bir defter',
      alt: 'Masada bir defter sayfası duruyor. Etrafındaki üç kişinin her biri aynı sayfanın kendi kopyasını tutuyor.',
      body: {
        beginner: `Kimin kime ne kadar ödediğini yazan bir defter düşün. Bu defteri tek bir banka tutmuyor; **herkes** aynı defterin birebir kopyasını tutuyor.

Deftere yeni bir satır yazıldığında bütün kopyalara aynı satır eklenir. Kimse kendi kopyasını gizlice değiştiremez, çünkü diğerleriyle uyuşmaz.

Bu ortak deftere [[ledger]] denir. [[blockchain]] ise böyle bir defteri kurmanın özel bir yoludur.`,
        intermediate: `[[blockchain]], [[node]] adı verilen çok sayıda bilgisayarın her birinin tamamını sakladığı bir [[ledger]] yapısıdır. "Asıl kopya" diye merkezi bir kopya yoktur.

Her kayıt bir [[transaction]]'dır: "A'dan B'ye 5 coin gönder" gibi imzalı bir talimat. [[node]]'lar yeni [[transaction]]'ları birbirine iletir ve hepsi aynı kayıtları aynı sırayla tutar.

Zor olan, bir patron olmadan bu sıra üzerinde anlaşmaktır. Kursun geri kalanı adım adım buna varıyor.`,
        expert: `[[blockchain]] çoğaltılmış bir durum makinesidir ("replicated state machine"): her [[full-node]], [[ledger]]'ın tamamını tutar ve aynı sıralı [[transaction]] listesini uygulayarak aynı duruma ulaşır.

Onu kullanışlı yapan üç özellik:

- **Çoğaltma**: binlerce bağımsız kopya vardır; tek bir operatör veriyi saklayamaz ya da değiştiremez.
- **Deterministik doğrulama**: her [[node]] her şeyi yeniden çalıştırır ve protokol kurallarını bozan her şeyi reddeder.
- **Düşmanca koşullarda tam sıralama**: katılımcıların bir kısmı yalan söylese bile bir [[consensus]] mekanizması tek bir geçmiş seçer.

Veri yapısının kendisi, yani [[hash]] ile bağlı [[block]] listesi, yalnızca değişikliğin **fark edilmesini** sağlar. Değişikliğe karşı **direnç** ise ileride anlatılan [[consensus]]'tan gelir.`,
      },
    },
    blocks: {
      title: 'Sayfalar "block" olur',
      alt: 'Küp şeklinde dört block yan yana duruyor; her birinin üstünde birkaç küçük işlem paketi var.',
      body: {
        beginner: `Binlerce deftere her seferinde tek satır yazmak kargaşa olurdu. Bu yüzden satırlar sayfalarda toplanır.

Dolan her sayfaya [[block]] denir. Bir [[block]], aynı sıralarda gerçekleşen ödemelerin bir demetini tutar.

[[block]]'lar numaralanır ve bir kitabın sayfaları gibi art arda dizilir. En baştaki ilk sayfaya [[genesis-block]] denir.`,
        intermediate: `[[transaction]]'lar bir [[block]] içinde gruplanır. Bir [[block]] iki parçadan oluşur:

- **gövde**: [[transaction]] listesi;
- [[block-header]]: sıra numarasını, bir [[timestamp]] değerini ve önceki [[block]]'a referansı içeren küçük bir özet.

Bitcoin yaklaşık 10 dakikada bir, Ethereum 12 saniyede bir [[block]] üretir. Her zincirin ilk halkası olan [[genesis-block]] yazılımın içine sabitlenmiştir.`,
        expert: `Bir [[block]], bir [[block-header]] ile sıralı bir [[transaction]] listesinden oluşur. [[block-header]], gövdeye bir [[merkle-root]] üzerinden bağlanır; böylece yalnızca [[block-header]] (Bitcoin'de 80 bayt), belirli bir [[transaction]]'ın o [[block]]'a ait olduğunu logaritmik boyutlu bir kanıtla doğrulamaya yeter.

Bitcoin'deki alanlar: \`version\`, \`prevBlockHash\`, \`merkleRoot\`, \`timestamp\`, \`bits\` (kodlanmış [[target]]) ve \`nonce\`. Ethereum daha fazla taahhüt taşır: \`stateRoot\`, \`transactionsRoot\`, \`receiptsRoot\`, \`baseFeePerGas\` ve diğerleri.

[[genesis-block]]'un ebeveyni yoktur ve her istemcinin koduna gömülüdür.`,
      },
      code: {
        lang: 'C++ (Bitcoin block header)',
        source: `struct BlockHeader {
  int32_t  nVersion;
  uint256  hashPrevBlock;   // ebeveyne bağ
  uint256  hashMerkleRoot;  // tüm tx'leri taahhüt eder
  uint32_t nTime;
  uint32_t nBits;           // sıkıştırılmış target
  uint32_t nNonce;
};                          // serileştirilmiş hali 80 bayt`,
      },
    },
    fingerprint: {
      title: 'Her "block" bir öncekinin parmak izini taşır',
      alt: 'Dört block artık zincir halkalarıyla birbirine bağlı. Her block kendi hash değerini ve bir önceki block\'un hash değerini gösteriyor. Arkalarındaki tezgâhta yazılan bir metin ve 32 çubuk olarak çizilmiş hash değeri duruyor.',
      body: {
        beginner: `Her [[block]]'un bir parmak izi vardır: içinde yazan her şeyden hesaplanan kısa bir kod. Tek bir harfi değiştirirsen parmak izi bambaşka çıkar. Bu parmak izine [[hash]] denir.

İşin püf noktası şu: her yeni [[block]], **kendinden önceki sayfanın parmak izini içine yazar**.

[[blockchain]] adındaki "chain" (zincir) budur. [[block]]'lar parmak izleriyle birbirine bağlanır; her biri bir öncekini gösterir.

**Dene:** sahnenin altındaki kutuya istediğini yaz. Zincirin arkasındaki çubuk sırası, yazdığın metnin parmak izidir. Tek bir harf ekle ya da sil; çubukların neredeyse hepsi yer değiştirir. Panel, 64 karakterden kaçının değiştiğini sayar.`,
        intermediate: `Bir [[hash]] fonksiyonu, herhangi bir veriyi sabit uzunlukta bir koda çevirir. Bitcoin, her zaman 256 bit (64 "hex" karakter) üreten [[sha-256]] kullanır.

İşe yarayan özellikleri:

- aynı girdi her zaman aynı [[hash]]'i verir;
- çok küçük bir değişiklik tamamen farklı bir [[hash]] verir;
- [[hash]]'ten geriye doğru veriye ulaşamazsın.

Her [[block-header]], bir önceki [[block-header]]'ın [[hash]]'ini içerir. Yani bir [[block]]'un kendi [[hash]]'i hem içeriğine **hem de** ebeveynine, ebeveyn üzerinden de önceki tüm [[block]]'lara bağlıdır.

**Dene:** sahnenin altındaki kutu, her tuş vuruşunda yazdığın metin üzerinde gerçek [[sha-256]] çalıştırır ve değişen karakterleri vurgular. Her "hex" karakter 16 farklı değer alabildiği için en küçük değişiklik bile 64 karakterin yaklaşık 60'ını değiştirir.`,
        expert: `[[block]]'lar [[hash]] ile bağlı bir liste oluşturur: \`header.prevHash = H(parentHeader)\`. Bitcoin 80 baytlık [[block-header]] üzerinde çift [[sha-256]] kullanır; Ethereum ise RLP ile kodlanmış [[block-header]] üzerinde Keccak-256 kullanır.

Güvenlik, [[hash]] fonksiyonunun "collision" ve "second-preimage" dirençli olmasına dayanır: aynı [[hash]]'e sahip farklı bir [[block]] bulmak "second preimage" için yaklaşık 2^256, "collision" için 2^128 iş gerektirmelidir.

Her [[block-header]] ebeveynine bağlandığı için uçtaki [[hash]] **tüm** geçmişi taahhüt eder. Yakın tarihli tek bir [[hash]]'e güvenen bir [[light-node]], bağları izleyerek daha eski herhangi bir [[block]]'u doğrulayabilir.

Sahnenin altındaki kutu, her tuş vuruşunda metnini [[sha-256]] ile özetler; 32 çubuk, çıktının 32 baytıdır. İyi bir [[hash]] fonksiyonu "avalanche effect" gösterir: girdideki tek bir biti çevirmek, çıktıdaki her biti yarı yarıya olasılıkla çevirir. Bu yüzden her değişiklikten sonra 256 bitin yaklaşık 128'inin, 64 "hex" karakterin de yaklaşık 60'ının farklı çıkmasını bekle.`,
      },
      code: {
        lang: 'Python',
        source: `import hashlib

def block_hash(index, prev_hash, data):
    payload = f"{index}|{prev_hash}|{data}".encode()
    return hashlib.sha256(payload).hexdigest()

prev = "0" * 64
for i, data in enumerate(["Genesis", "A->B: 5", "B->C: 2"]):
    prev = block_hash(i, prev, data)   # sonraki block bunu saklar`,
      },
    },
    tamper: {
      title: 'Tek bir şeyi değiştir, zincir kırılsın',
      alt: "Bir block (başka biri seçilmediyse block 2) değiştirilmiş ve parlıyor. Ondan sonraki bağ kopmuş; sonraki block'lar, içlerinde saklı parmak izi artık uyuşmadığı için kırmızıya dönmüş. Baştan yapılan block'lar yeşile döner.",
      body: {
        beginner: `Dene: sahnenin altındaki kutuyu kullanarak 2 numaralı [[block]]'a farklı bir şey yaz.

Değiştirdiğin anda 2 numara yeni bir parmak izi alır. Ama 3 numaranın içinde hâlâ **eski** parmak izi yazıyor. Artık uyuşmuyorlar; bağ kopar ve sonraki bütün [[block]]'lar şüpheli hale gelir.

Kopyaları karşılaştıran herkes bir şeyin değiştirildiğini hemen görür.

**Şimdi izini örtmeyi dene:** **Onar: block 3** düğmesine bas. 3 numaranın bağı onarılır, ama bu ona yeni bir parmak izi verir ve bu kez 4 numarayla arasındaki bağ kopar. Zincirin sonuna kadar her [[block]]'u baştan yapman gerekir. 1–4 düğmeleriyle başka bir [[block]] seç ve kaç tanesini baştan yapman gerektiğini say.`,
        intermediate: `Aşağıdan 2 numaralı [[block]]'un verisini değiştir ve [[hash]] değerinin nasıl değiştiğini izle.

3 numaralı [[block]], 2 numaranın önceki [[hash]]'ini saklar. Senin değişikliğinden sonra bu saklı değer artık var olmayan bir [[block]]'u gösterir; dolayısıyla 3 numara geçersizdir. 4 numara da 3'ü gösterdiği için o da geçersizdir.

Değişikliği gizlemek için 3 numarayı yeni [[hash]] ile yeniden hesaplaman gerekir; bu onun [[hash]]'ini değiştirir, bu da seni 4 numarayı yeniden hesaplamaya zorlar ve zincirin ucuna kadar böyle sürer. Bu özelliğe [[immutability]] denir.

**Elinle yap:** **Onar** düğmesine her basışın ilk bozuk bağı onarır ve bir sonrakini koparır. Son [[block]] da bitince zincir yeniden tutarlıdır, ama son [[hash]] değeri artık diğer bütün [[node]]'ların elindekinden farklıdır. 1–4 düğmeleriyle daha baştaki ya da daha sondaki bir [[block]]'u değiştir ve baştan yapılması gereken miktarı karşılaştır.`,
        expert: `Bu sahnedeki [[hash]]'ler, her tuş vuruşunda tarayıcında hesaplanan gerçek [[sha-256]] özetleridir.

*i* numaralı [[block]]'u değiştirmek \`H(block_i)\` değerini değiştirir. *i+1* numara hâlâ eski özete bağlıdır, bu yüzden doğrulama *i+1* yüksekliğinde başarısız olur: \`block[i+1].prevHash != H(block[i])\`. Onarmak, sonraki her [[block]]'ta \`prevHash\` alanını yeniden yazmak ve sırayla her birinin [[hash]]'ini değiştirmek demektir.

Tek başına bu ucuzdur: [[sha-256]] bir dizüstü bilgisayarda saniyede milyonlarca kez hesaplanır. Bağlı liste, değişikliği **pahalı** değil, **görünür** kılar. Pahalılığı ekleyen, her [[block]]'un üretimini maliyetli hale getiren [[proof-of-work]] ya da [[proof-of-stake]] mekanizmasıdır.

**Onar** düğmesi tek bir onarım yapar: geçersiz ilk [[block]]'un \`prevHash\` alanına ebeveyninin yeni özetini yazar ve [[hash]]'ini yeniden hesaplar. Dolayısıyla *n* [[block]]'luk bir zincirde *i* numarayı değiştirmek *n − i* yeniden hesaplamaya mal olur. Onarılmış zincirin uçtaki [[hash]]'i de eskisiyle aynı değildir; uçları karşılaştıran her eş yine farklı bir zincir görür.`,
      },
    },
    history: {
      title: 'Geçmişi yeniden yazmak neden zor?',
      alt: "Yan yana iki sıra block. Solda dürüst zincir, ödemeyi içeren block'u birkaç yeni block'un altına gömmüş. Sağda saldırganın kopyası değiştirilmiş bir block ile başlıyor ve üstüne çok daha az block eklenebilmiş.",
      body: {
        beginner: `Bir hilekârın kendi kopyasındaki eski bir [[block]]'u değiştirdiğini düşün. Geçerli görünmesi için ondan sonraki her [[block]]'u baştan yapması gerekir.

Bu arada herkes gerçek zincire yeni [[block]]'lar eklemeye devam eder. Hilekâr hep geride kalır; binlerce kişi asıl kitaba sayfa eklerken kitabı baştan yazmaya çalışmak gibi.

Ağ, kısa kalan değiştirilmiş kopyayı görmezden gelir. [[blockchain]] üzerindeki kayıtların kalıcı sayılmasının nedeni budur.

**Dene:** ilk kaydırıcı hilekâra ağın işlem gücünden daha büyük bir pay verir; ikincisi ödemeyi daha çok [[block]]'un altına gömer. Aynı sürede hilekârın sırasının nereye kadar gelebildiğine ve her yeni [[block]] ile yetişme olasılığının nasıl küçüldüğüne bak.`,
        intermediate: `2 numaralı [[block]]'u değiştiren bir saldırgan 3, 4, 5… hepsini yeniden kurmalı ve üstüne büyümeye devam eden dürüst zincire yetişmelidir.

[[node]]'lar basit bir kural izler: arkasında en çok iş ya da [[stake]] bulunan geçerli zinciri kabul et. Geride kalan değiştirilmiş bir kopya yok sayılır.

Yani bir [[block]] ne kadar derine gömülürse o kadar güvenlidir. İnsanların bir ödemeyi kesin saymadan önce birkaç [[confirmation]] beklemesinin sebebi budur.

Bunu [[proof-of-work]] kullanan bir zincir için **dene**. Madencilik gücünün %10'una sahip bir saldırganın, üstüne 6 [[block]] eklenmiş bir kaydı yakalama olasılığı yaklaşık %0,02'dir. Payı %49'a doğru kaydır ya da derinliği 1'e indir; olasılık hızla yükselir.`,
        expert: `[[proof-of-work]] ile her [[block]] maliyetli bir [[nonce]] araması gerektirir. *z* derinliğinden itibaren yeniden yazmak, *z* [[block]] boyunca dürüst ağdan daha hızlı üretmek demektir. [[hashrate]] payı *q* < 0.5 olan bir saldırgan için başarı olasılığı kabaca \`(q/p)^z\` şeklinde düşer; burada \`p = 1 − q\` (Nakamoto, bölüm 11). *q* = 0.1 ve *z* = 6 için bu %0.1'in altındadır.

[[proof-of-stake]] ile [[finality]] kazanmış bir [[block]]'u geri almak, toplam [[stake]]'in en az üçte birinin çelişen mesajlar imzalamasını gerektirir; protokol bunu tespit eder ve [[slashing]] ile o [[stake]]'i yok eder.

İki tasarımda da [[hash]] bağları "bir [[block]]'u değiştir" işini "o zamandan beri yapılan tüm işi baştan yap" haline getirir; [[consensus]] ise bu işi karşılanamayacak kadar pahalı kılar.

Kaydırıcılar Nakamoto'nun tam hesabını kullanır. Dürüst ağ *z* [[block]] bulurken saldırganın kendi ilerlemesi, ortalaması \`λ = z·q/p\` olan bir Poisson dağılımına uyar. *k* [[block]] bulmuş bir saldırganın kapatması gereken fark *z − k* olur ve bunu \`(q/p)^(z−k)\` olasılıkla başarır. *k* üzerinden toplayınca \`P = 1 − Σ (λ^k e^−λ / k!)·(1 − (q/p)^(z−k))\` çıkar: *q* = 0.1 ve *z* = 6 için %0,024. *P*'yi %0,1'in altına indirmek için *q* = 0.1'de *z* = 5 yeter, *q* = 0.3'te ise *z* = 24 gerekir.`,
      },
      code: {
        lang: 'C (Bitcoin whitepaper, bölüm 11)',
        source: `double AttackerSuccessProbability(double q, int z)
{
    double p = 1.0 - q;
    double lambda = z * (q / p);
    double sum = 1.0;
    int i, k;
    for (k = 0; k <= z; k++)
    {
        double poisson = exp(-lambda);
        for (i = 1; i <= k; i++)
            poisson *= lambda / i;
        sum -= poisson * (1 - pow(q / p, z - k));
    }
    return sum;
}`,
      },
    },
    uses: {
      title: 'Yalnızca para değil',
      alt: "Dört block'luk zincir önde duruyor. Arkasında altı küçük model var: madeni paralar, çerçeveli bir resim, bir kimlik kartı, palet üstünde sandıklar, bir oy sandığı ve kalkanlı bir kılıç. Seçili olan parlıyor ve zincire bir paket gönderiyor.",
      body: {
        beginner: `[[blockchain]] ortak bir defterdir ve defter, içine ne yazdığına karışmaz. İlki olan [[bitcoin]] ödemeleri kaydetti. Aynı fikir, birçok kişinin üzerinde anlaşması gereken ve kimsenin sessizce değiştirememesi gereken her kayıt için işe yarar.

Birkaçına bakmak için sahnenin altındaki düğmelere dokun:

- **Sahiplik**: bir konser biletinin ya da dijital bir sanat eserinin kime ait olduğu.
- **Kimlik**: bir diplomanın ya da lisansın gerçek olduğunun kanıtı.
- **Tedarik zinciri**: bir sevkiyatın geçtiği her el.
- **Oylar**: herkesin yeniden kontrol edebildiği bir sayım.
- **Oyun eşyaları**: oyun şirketine değil, oyuncuya ait bir kılıç.

Hepsi, az önce gördüğün aynı [[block]]'ları ve aynı parmak izlerini kullanır.

Bu kurs buradan sonra **para** yolunu izliyor. İlk kullanım alanı paraydı; kalan dersler de onun için kurulan araçları anlatıyor: coin'ler, borsalar, borç verme, yani topluca "DeFi". Buradaki fikirler diğer bütün kullanım alanlarına da taşınır.`,
        intermediate: `Bir zincirin gerçekte sakladığı şey, imzalı [[transaction]]'ların sıralı bir listesidir. Bunlardan birinin "5 coin öde" mi yoksa "bu bilet artık Cem'in" mi demek olduğuna, onu okuyan kurallar karar verir.

[[ethereum]] ve benzeri zincirlerde bu kurallar, [[smart-contract]] adı verilen programlardır:

- bir [[token]] sözleşmesi bir bakiye tablosu tutar: para, puan, hisse;
- bir "NFT" sözleşmesi, eşya numarasından sahibine giden bir tablo tutar: sanat eseri, bilet, oyun eşyası;
- bir kayıt sözleşmesi bir belgenin [[hash]]'ini saklar; böylece bir diplomanın ya da sevkiyat kaydının sonradan değiştirilmediğini herkes kontrol edebilir;
- bir oylama sözleşmesi, oy hakkı olan hesapların imzalı oylarını sayar.

Hepsi için iki sınır geçerlidir. Herkese açık bir zincire yazılan her şeyi herkes görür; bu yüzden kişisel veri zincirin dışında kalır, zincire yalnızca [[hash]]'i yazılır. Ayrıca zincir **kimin, neyi, ne zaman yazdığını** kanıtlar. Sandığın içinde gerçekten kayıtta yazan şeyin bulunduğunu kanıtlayamaz.

Sahnenin altından her kullanım alanını tek tek seç. Bir sonraki dersten itibaren bu kurs finans yolunu izliyor: para, borsalar ve "DeFi".`,
        expert: `Soyut bakınca [[blockchain]], herkese açık, sıralı ve imzalı bir girdi kaydı olan çoğaltılmış bir durum makinesidir. Bir uygulama, bu kayıt üzerinde çalışan bir durum geçiş fonksiyonudur. Ödemeler bu fonksiyonlardan yalnızca biridir; [[consensus]] katmanında paraya özgü hiçbir şey yoktur.

[[ethereum]] üzerinde yaygın uygulama standartları:

- [[erc-20]]: birbirinin yerine geçebilen bakiyeler, \`balanceOf(address) → uint256\`.
- ERC-721: eşsiz varlıklar ("NFT"), \`ownerOf(tokenId) → address\`.
- ERC-1155: tek sözleşmede hem "fungible" hem "non-fungible" birçok [[token]] türü; oyun eşyalarında yaygın kullanılır.
- Kimlik belgeleri: zincir kullanan sistemler imzalı belgeyi genellikle zincir dışında tutar; zincire yalnızca belgeyi verenin tanımlayıcısı, [[hash]]'ler ya da iptal durumu yazılır.
- Yönetişim: OpenZeppelin'in Governor sözleşmesi gibi oylama sözleşmeleri, [[token]] miktarıyla ağırlıklandırılmış oyları sayar ve sonucu zincir üzerinde uygular.

Zincirin kattığı şey sıralama, erişilebilirlik ve her kayıttaki [[digital-signature]]'dır. Katamadığı şey dış dünya hakkındaki doğruluktur: "17 numaralı sandıkta 200 kg kahve var" diyen bir kayıt, ancak onu imzalayan kadar güvenilirdir. Buna "oracle problem" denir. Depolama da hem herkese açık hem pahalıdır: Ethereum'da 32 baytlık yeni bir alan yazmak en az 20.000 [[gas]] tutar; bu yüzden uygulamalar bir [[hash]] ya da [[merkle-root]] yazar ve veriyi başka yerde tutar.

Kursun geri kalanı finans kolunu izliyor: [[transaction]]'lar ve ücretler, [[consensus]], ardından [[token]]'lar, [[dex]]'ler ve "DeFi".`,
      },
      code: {
        lang: 'Solidity (örnek)',
        source: `// Tek zincir, dört tür kayıt.
mapping(address => uint256) public balanceOf;  // para (ERC-20)
mapping(uint256 => address) public ownerOf;    // tek eşya, tek sahip (ERC-721)
mapping(bytes32 => uint64)  public anchoredAt; // belge hash'i -> kaydedildiği an
mapping(uint256 => mapping(address => bool)) public hasVoted; // öneri -> oy veren`,
      },
    },
  },
};

export default content;
