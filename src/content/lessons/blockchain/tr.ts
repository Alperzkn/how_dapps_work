import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[block]]'lar -> "block"'lar.
// English technical words without a glossary entry are quoted by hand: "light client".

const content: LessonContent = {
  title: '"Blockchain" nedir?',
  summary: 'Herkesin kontrol edebildiği, kimsenin gizlice değiştiremediği ortak bir kayıt.',
  labels: {
    sharedLedger: 'Ortak defter',
    copy: 'kendi kopyası',
    block: 'Block',
    genesis: 'Block 1 · genesis',
    prev: 'prev',
    hash: 'hash',
    edited: 'değiştirildi',
    broken: 'bağ koptu',
    newBlock: 'yeni block',
    honest: 'Dürüst zincir',
    attacker: 'Saldırganın kopyası',
    redo: 'baştan yapılmalı',
    editPrompt: 'Block 2 içindeki veriyi değiştir',
    hashOf: 'Block 2 hash',
    reset: 'Sıfırla',
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
      alt: 'Dört block artık zincir halkalarıyla birbirine bağlı. Her block kendi hash değerini ve bir önceki block\'un hash değerini gösteriyor.',
      body: {
        beginner: `Her [[block]]'un bir parmak izi vardır: içinde yazan her şeyden hesaplanan kısa bir kod. Tek bir harfi değiştirirsen parmak izi bambaşka çıkar. Bu parmak izine [[hash]] denir.

İşin püf noktası şu: her yeni [[block]], **kendinden önceki sayfanın parmak izini içine yazar**.

[[blockchain]] adındaki "chain" (zincir) budur. [[block]]'lar parmak izleriyle birbirine bağlanır; her biri bir öncekini gösterir.`,
        intermediate: `Bir [[hash]] fonksiyonu, herhangi bir veriyi sabit uzunlukta bir koda çevirir. Bitcoin, her zaman 256 bit (64 "hex" karakter) üreten [[sha-256]] kullanır.

İşe yarayan özellikleri:

- aynı girdi her zaman aynı [[hash]]'i verir;
- çok küçük bir değişiklik tamamen farklı bir [[hash]] verir;
- [[hash]]'ten geriye doğru veriye ulaşamazsın.

Her [[block-header]], bir önceki [[block-header]]'ın [[hash]]'ini içerir. Yani bir [[block]]'un kendi [[hash]]'i hem içeriğine **hem de** ebeveynine, ebeveyn üzerinden de önceki tüm [[block]]'lara bağlıdır.`,
        expert: `[[block]]'lar [[hash]] ile bağlı bir liste oluşturur: \`header.prevHash = H(parentHeader)\`. Bitcoin 80 baytlık [[block-header]] üzerinde çift [[sha-256]] kullanır; Ethereum ise RLP ile kodlanmış [[block-header]] üzerinde Keccak-256 kullanır.

Güvenlik, [[hash]] fonksiyonunun "collision" ve "second-preimage" dirençli olmasına dayanır: aynı [[hash]]'e sahip farklı bir [[block]] bulmak "second preimage" için yaklaşık 2^256, "collision" için 2^128 iş gerektirmelidir.

Her [[block-header]] ebeveynine bağlandığı için uçtaki [[hash]] **tüm** geçmişi taahhüt eder. Yakın tarihli tek bir [[hash]]'e güvenen bir [[light-node]], bağları izleyerek daha eski herhangi bir [[block]]'u doğrulayabilir.`,
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
      alt: 'Block 2 değiştirilmiş ve parlıyor. Ondan sonraki bağ kopmuş; block 3 ve 4, içlerinde saklı parmak izi artık uyuşmadığı için kırmızıya dönmüş.',
      body: {
        beginner: `Dene: sahnenin altındaki kutuyu kullanarak 2 numaralı [[block]]'a farklı bir şey yaz.

Değiştirdiğin anda 2 numara yeni bir parmak izi alır. Ama 3 numaranın içinde hâlâ **eski** parmak izi yazıyor. Artık uyuşmuyorlar; bağ kopar ve sonraki bütün [[block]]'lar şüpheli hale gelir.

Kopyaları karşılaştıran herkes bir şeyin değiştirildiğini hemen görür.`,
        intermediate: `Aşağıdan 2 numaralı [[block]]'un verisini değiştir ve [[hash]] değerinin nasıl değiştiğini izle.

3 numaralı [[block]], 2 numaranın önceki [[hash]]'ini saklar. Senin değişikliğinden sonra bu saklı değer artık var olmayan bir [[block]]'u gösterir; dolayısıyla 3 numara geçersizdir. 4 numara da 3'ü gösterdiği için o da geçersizdir.

Değişikliği gizlemek için 3 numarayı yeni [[hash]] ile yeniden hesaplaman gerekir; bu onun [[hash]]'ini değiştirir, bu da seni 4 numarayı yeniden hesaplamaya zorlar ve zincirin ucuna kadar böyle sürer. Bu özelliğe [[immutability]] denir.`,
        expert: `Bu sahnedeki [[hash]]'ler, her tuş vuruşunda tarayıcında hesaplanan gerçek [[sha-256]] özetleridir.

*i* numaralı [[block]]'u değiştirmek \`H(block_i)\` değerini değiştirir. *i+1* numara hâlâ eski özete bağlıdır, bu yüzden doğrulama *i+1* yüksekliğinde başarısız olur: \`block[i+1].prevHash != H(block[i])\`. Onarmak, sonraki her [[block]]'ta \`prevHash\` alanını yeniden yazmak ve sırayla her birinin [[hash]]'ini değiştirmek demektir.

Tek başına bu ucuzdur: [[sha-256]] bir dizüstü bilgisayarda saniyede milyonlarca kez hesaplanır. Bağlı liste, değişikliği **pahalı** değil, **görünür** kılar. Pahalılığı ekleyen, her [[block]]'un üretimini maliyetli hale getiren [[proof-of-work]] ya da [[proof-of-stake]] mekanizmasıdır.`,
      },
    },
    history: {
      title: 'Geçmişi yeniden yazmak neden zor?',
      alt: 'Arkadaki dürüst zincire yeni block\'lar eklenmeye devam ediyor. Önde, saldırganın bir block\'u değiştirilmiş kopyası duruyor ve saldırgan sonraki block\'ları baştan yapmakla uğraşıyor.',
      body: {
        beginner: `Bir hilekârın kendi kopyasındaki eski bir [[block]]'u değiştirdiğini düşün. Geçerli görünmesi için ondan sonraki her [[block]]'u baştan yapması gerekir.

Bu arada herkes gerçek zincire yeni [[block]]'lar eklemeye devam eder. Hilekâr hep geride kalır; binlerce kişi asıl kitaba sayfa eklerken kitabı baştan yazmaya çalışmak gibi.

Ağ, kısa kalan değiştirilmiş kopyayı görmezden gelir. [[blockchain]] üzerindeki kayıtların kalıcı sayılmasının nedeni budur.`,
        intermediate: `2 numaralı [[block]]'u değiştiren bir saldırgan 3, 4, 5… hepsini yeniden kurmalı ve üstüne büyümeye devam eden dürüst zincire yetişmelidir.

[[node]]'lar basit bir kural izler: arkasında en çok iş ya da [[stake]] bulunan geçerli zinciri kabul et. Geride kalan değiştirilmiş bir kopya yok sayılır.

Yani bir [[block]] ne kadar derine gömülürse o kadar güvenlidir. İnsanların bir ödemeyi kesin saymadan önce birkaç [[confirmation]] beklemesinin sebebi budur.`,
        expert: `[[proof-of-work]] ile her [[block]] maliyetli bir [[nonce]] araması gerektirir. *z* derinliğinden itibaren yeniden yazmak, *z* [[block]] boyunca dürüst ağdan daha hızlı üretmek demektir. [[hashrate]] payı *q* < 0.5 olan bir saldırgan için başarı olasılığı kabaca \`(q/p)^z\` şeklinde düşer; burada \`p = 1 − q\` (Nakamoto, bölüm 11). *q* = 0.1 ve *z* = 6 için bu %0.1'in altındadır.

[[proof-of-stake]] ile [[finality]] kazanmış bir [[block]]'u geri almak, toplam [[stake]]'in en az üçte birinin çelişen mesajlar imzalamasını gerektirir; protokol bunu tespit eder ve [[slashing]] ile o [[stake]]'i yok eder.

İki tasarımda da [[hash]] bağları "bir [[block]]'u değiştir" işini "o zamandan beri yapılan tüm işi baştan yap" haline getirir; [[consensus]] ise bu işi karşılanamayacak kadar pahalı kılar.`,
      },
    },
  },
};

export default content;
