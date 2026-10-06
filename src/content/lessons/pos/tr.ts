import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[validator]]'lar -> "validator"'lar.
// English technical words without a glossary entry are quoted by hand: "checkpoint".

const content: LessonContent = {
  labels: {
    validator: 'validator',
    deposit: 'teminatın',
    noMining: 'mining yok',
    chosen: 'sıra sende',
    picked: 'kurayla seçildi',
    newBlock: 'yeni block',
    proposer: 'proposer',
    committee: 'committee',
    votes: 'block için oylar',
    attestations: 'attestation\'lar',
    epoch: 'epoch',
    epochs: 'epoch',
    finalized: 'finalized',
    justified: 'justified',
    missed: 'justified değil',
    voting: 'oylanıyor',
    twoThirds: 'stake\'in 2/3\'ü',
    ofStake: 'stake',
    oneBlock: 'senin block\'un',
    twoBlocks: 'tek sıra, iki block',
    sameSlot: 'aynı slot, iki block',
    slashed: 'slashed',
    slashedEjected: 'slashed · atıldı',
    burned: 'yakıldı',
    powKeeps: 'makineler duruyor · yine saldırabilir',
    powExpert: 'bedel zincirin dışında · olasılıksal finality',
    posExpert: 'bedel zincirin içinde · ekonomik finality',
    you: 'sen',
    yourStake: 'Stake\'in',
    yourShare: 'payın',
    totalStake: 'Toplam stake',
    yourTurn: 'Sıran yaklaşık',
    everyN: '{n} slot\'ta 1',
    nextSlot: 'Sonraki slot',
    runEpoch: '32 slot çalıştır',
    reset: 'Sıfırla',
    slotsDrawn: 'Çekilen slot',
    yourBlocks: 'Senin block\'ların',
    expected: 'Beklenen pay',
    takeOffline: 'Çevrimdışı:',
    nextEpoch: 'Sonraki epoch',
    skip: '512 epoch atla',
    online: 'çevrimiçi',
    onlineStake: 'Oy veren stake',
    votingNeeded: 'Oy veren / gereken (2/3)',
    checkpoint: 'Checkpoint',
    noFinality: 'finality\'siz',
    leak: 'inactivity leak',
    signTwo: 'İki block imzala',
    undo: 'Slashing\'i geri al',
    slashedTogether: 'Birlikte slashed',
    initialPenalty: 'Hemen',
    correlationPenalty: 'Korelasyon cezası',
    youKeep: 'Sende kalan',
    design: 'Tasarım',
    attacker: 'saldırgan',
    canDo: 'Ne yapabilir',
    canRewrite: 'block\'ları yeniden yazar',
    cannot: 'güvenilir hiçbir şey',
    canFinalize: 'istediğini kesinleştirir',
    canStall: 'finality\'yi durdurur',
    cannotStall: 'kalıcı hiçbir şey',
    lostMachines: 'Makine kaybı',
    lostStake: 'Yakılan stake',
    leftOver: 'Kalan',
  },
  steps: {
    stake: {
      title: 'Elektrik yerine teminat',
      alt: 'Yedi sütun yan yana duruyor; her birinin üstünde teminatı kadar yüksek bir coin yığını var. Sütunlardan biri senin; önündeki kişi üstüne coin atıyor. Bir kenarda kapatılmış, üstü çizilmiş bir madencilik makinesi duruyor.',
      body: {
        beginner: `[[proof-of-work]], [[block]] üretecek olanı ne kadar elektrik yaktığına bakarak seçer. [[proof-of-stake]] ise başka bir soru sorar: **neyi kaybetmeyi göze alıyorsun?**

Katılmak için coin'lerini teminat olarak kilitlersin. Buna [[stake]] denir. Kurallara uyarsan teminatını, üstünde küçük bir ödülle geri alırsın. Hile yaparsan ağ bir kısmını yok eder.

Teminat kilitleyip yazılımı çalıştıran kişiye [[validator]] denir. Yarışan makineler de, devasa elektrik faturası da yok.

**Dene:** Kaydırıcıyı çekip daha fazla coin kilitle. Yığının büyür; tüm teminatlar içindeki payın da büyür. Bu pay, sıranın sana gelme sıklığıyla aynıdır.`,
        intermediate: `[[proof-of-stake]] sisteminde kıt kaynak hesaplama gücü değil, sermayedir. [[ethereum]]'da 32 ETH yatırıp istemci yazılımını çalıştıran herkes [[validator]] olur. Teminat, [[validator]] aktif kaldığı sürece kilitli durur.

[[validator]]'lar sırayla [[block]] önerir ve birbirlerinin [[block]]'larını oylar. Dürüst çalışmak yılda yüzde birkaç oranında ödül kazandırır; çevrimdışı kalmak küçük cezalara yol açar; kanıtlanabilen hile ise [[slashing]] ile sonuçlanır.

Çözülecek bir bulmaca olmadığından sıradan bir bilgisayar yeter. Ethereum Eylül 2022'de [[mining]]'den [[staking]]'e geçtiğinde ("the Merge") elektrik tüketimi %99,9'dan fazla düştü.

**Dene:** Bu örnek ağda yedi [[validator]] var; diğer altısının toplamı 3.840 ETH. Kendi [[stake]]'ini 32 ETH'den 2.048 ETH'ye çıkar ve toplam içindeki payını izle: önermeyi bekleyebileceğin [[block]]'ların oranı da tam olarak budur.`,
        expert: `Ethereum'un [[consensus]] protokolünün adı **Gasper**'dır: zincirin ucundaki [[block]]'u [[slot]] [[slot]] seçen [[lmd-ghost]] [[fork-choice]] kuralı ile zincirin uzun parçalarını geri alınamaz kılan [[casper-ffg]] kesinlik mekanizmasının birleşimi.

Bir [[validator]], "execution layer" üzerindeki "deposit contract"a 32 ETH ve bir BLS12-381 açık anahtarı gönderilerek oluşturulur. Aktivasyon kuyruğundan geçtikten sonra aktif olur ("churn limit", kümenin ne hızla değişebileceğini sınırlar). Oy ağırlığı \`effective_balance\` değeridir; bu değer 1 ETH'lik adımlarla ve histerezisle değişir. Pectra yükseltmesinden (EIP-7251) beri tek bir [[validator]] 2.048 ETH'ye kadar \`effective_balance\` taşıyabilir; aktivasyon için alt sınır yine 32 ETH'dir.

Güvenlik argümanının niteliği değişir. [[proof-of-work]] sisteminde saldırgan bedeli sistemin dışında, donanıma ve enerjiye öder. Burada teminat sistemin **içinde** durur; protokol suçlu anahtarları tespit edip [[stake]]'lerini yok edebilir.

**Dene:** Kaydırıcı senin \`effective_balance\` değerini 32 ETH'lik adımlarla ayarlar. Aşağıda görünen pay hem her oylamadaki ağırlığın hem de uzun vadede bir [[slot]]'u önerme olasılığındır. 2.048 ETH'de bu yedi [[validator]]'lı ağın üçte birinden biraz fazlasını tutarsın; bu sayıyı [[finality]] adımı için aklında tut.`,
      },
    },
    proposer: {
      title: 'Kimin önereceğini seçmek',
      alt: 'Bir spot ışığı, son slot için seçilen sütunun üstünde duruyor ve önünde yeni bir block beliriyor. Her sütunun üstündeki sayı, o sütunun kaç kez seçildiğini gösteriyor.',
      body: {
        beginner: `Zaman kısa sıralara bölünür. Her sıra için ağ kurayla tek bir [[validator]] seçer ve sıradaki [[block]]'u o yazar.

Kura teminata göre ağırlıklıdır: iki kat coin, iki kat şans. Ama kimin seçileceğini kimse çok önceden bilemez ve kimse parayla sıranın önüne geçemez.

Seçilen kişi uyuyorsa o sıra [[block]] olmadan geçer; bir sonraki sıra başkasınındır.

**Dene:** **Sonraki slot** düğmesine birkaç kez bas ve ışığın nasıl sıçradığını izle. Sonra **32 slot çalıştır** ile bütün bir tur dizisini birden çek ve sayaçları coin yığınlarının boyuyla karşılaştır. Teminatını artırıp yeniden dene.`,
        intermediate: `[[ethereum]] zamanı 12 saniyelik [[slot]]'lara böler; 32 [[slot]], 6,4 dakikalık bir [[epoch]] eder. Her [[slot]]'un tam olarak bir [[proposer]]'ı vardır ve bu kişi, [[stake]] ile orantılı bir olasılıkla sözde rastgele seçilir.

[[proposer]], [[transaction]]'ları toplar, bir [[block]] kurar ve [[slot]]'unun başında yayımlar. Karşılığında işlemlerin bahşişlerini ve protokolün verdiği ödülü alır.

[[proposer]] çevrimdışıysa o [[slot]] boş kalır. Bedeli bundan ibarettir: zincir bir sonraki [[slot]] ile devam eder. Bunu [[mining]] ile karşılaştır: orada her katılımcı her [[block]] için çalışır ve biri dışında bütün emek çöpe gider.

**Dene:** *Sonraki slot* ağırlıklı çekilişi bir kez, *32 slot çalıştır* ise bütün bir [[epoch]] boyunca yapar. Birkaç [[slot]]'ta şans baskındır; yüzlerce [[slot]]'ta her [[validator]]'ın [[block]] payı [[stake]] payına yaklaşır. 32 ETH ile tek bir [[block]] için pek çok [[epoch]] bekleyebilirsin.`,
        expert: `Rastgelelik **RANDAO**'dan gelir. Her [[proposer]], [[block]]'una bir \`randao_reveal\` koyar: içinde bulunulan [[epoch]] numarasının BLS imzası. Bu imzanın [[hash]] değeri "beacon state" içindeki karışıma XOR'lanır. Bir BLS imzası belirli bir anahtar ve mesaj için tek olduğundan [[proposer]] katkısını seçemez; yapabileceği tek şey [[block]]'u hiç yayımlamamaktır. Bu, bir [[epoch]]'un son [[proposer]]'larına kaçırılan ödül pahasına kişi başı yaklaşık bir bitlik etki verir.

Bir [[epoch]]'un tohumu, karışımın bir önceki [[epoch]] başlamadan önceki halinden alınır; yani görevler kısa bir süre önceden bilinir. "Committee"ler, aktif küme üzerinde "swap-or-not" karıştırmasıyla atanır. Bir [[slot]]'un [[proposer]]'ı ise bu karıştırmadan adaylar örneklenip her biri \`effective_balance / MAX_EFFECTIVE_BALANCE\` olasılıkla kabul edilerek bulunur.

Aynı [[slot]] için iki farklı [[block]] öneren [[validator]], [[slashing]] gerektiren bir suç işlemiş olur. Pratikte çoğu [[proposer]] [[block]]'u kendisi kurmaz: MEV-Boost üzerinden uzman bir "builder"ın sunduğu başlığı imzalar. Böylece öneri hakkı dağıtık kalırken [[block]] inşası birkaç elde toplanır.

**Dene:** Düğmeler bu kabul/ret döngüsünü gerçekten çalıştırır: bir aday eşit olasılıkla çekilir ve 16 bitlik bir \`random_value\` için \`effective_balance × 65535 ≥ MAX_EFFECTIVE_BALANCE × random_value\` ise kabul edilir. Modelin sadeleştirmesi: rastgelelik RANDAO tohumu ve SHA-256 yerine küçük, tohumlu bir üreteçten gelir ve adaylar karıştırılmaz. [[slot]] sayısı arttıkça gözlenen payını beklenen payla karşılaştır.`,
      },
    },
    attest: {
      title: 'Geri kalan herkes oy verir',
      alt: 'Yeni block zincire eklenmiş. Çevrimiçi her sütundan yeşil oy pulları ona doğru uçuyor; çevrimdışı sütunlar gri ve oy göndermiyor. Block\'un yanındaki sütun oy veren stake ile doluyor; üzerinde üçte iki çizgisi var.',
      body: {
        beginner: `[[block]]'u bir [[validator]] yazdı. Şimdi diğerleri onu kontrol edip oy veriyor: "evet, bu [[block]]'u gördüm ve kurallara uyuyor."

Böyle bir oya [[attestation]] denir. Her oyun ağırlığı, arkasındaki teminat kadardır.

Üstünde çok oy biriken [[block]], herkesin bir sonrakini üzerine kurduğu [[block]] olur. Görevini zamanında yapan biraz kazanır; ortada olmayan biraz kaybeder.

**Dene:** Düğmelerle bazı [[validator]]'ları kapat (her düğmede teminatı yazıyor). Oyları kesilir ve [[block]]'un yanındaki sütun alçalır. Sütun üçte iki çizgisinin altına inmeden önce ne kadarının eksik olabileceğini bul; sonraki adım tam bunu anlatıyor.`,
        intermediate: `Her [[epoch]]'ta her [[validator]] tam bir kez oy verir. [[validator]]'lar karıştırılıp her [[slot]] için bir grup olacak şekilde "committee"lere ayrılır ve bir [[slot]]'un "committee"si, zincirin ucunda gördüğü [[block]] için birer [[attestation]] yayımlar.

Bir [[attestation]] aynı anda iki şey söyler: [[validator]]'ın doğru saydığı en yeni [[block]]'un hangisi olduğunu ve hangi "checkpoint"in kesinleşmesini istediğini. Binlerce imza tek bir imzada sıkıştırılır; böylece [[block]]'lar küçük kalır.

İki [[block]] yarışıyorsa [[node]]'lar arkasında en çok [[stake]] olan dalı izler. Bir [[validator]]'ın gelirinin çoğu doğru ve zamanında oy vermekten gelir; kaçırılan bir oy, kazandıracağı kadar bir tutara mal olur.

**Dene:** [[validator]]'ları çevrimdışı yap ve oy veren [[stake]]'i izle. Sayılan şey kişi sayısı değil, [[stake]]'tir: 1.280 ETH'lik tek bir [[validator]], 160 ETH'lik sekiz tanesi kadar ağırlık taşır. Toplamın 2/3'ünün altına inildiğinde "checkpoint" oylaması başarısız olur; sonraki adım buradan devam ediyor.`,
        expert: `Bir \`AttestationData\` iki oy taşır. \`beacon_block_root\`, zincirin ucu için verilen [[lmd-ghost]] oyudur. \`source\` ve \`target\` ise [[casper-ffg]] oyunu oluşturan iki "checkpoint"tir. [[validator]]'lar bunu BLS ile imzalar; aynı mesaj üzerindeki BLS imzaları toplanabildiğinden bir "committee"nin oyları tek bir imza ve bir bit alanı halinde birleştirilir.

[[lmd-ghost]] ("Latest Message Driven, Greedy Heaviest Observed SubTree") en son "justified" olan "checkpoint"ten başlar ve her [[fork]]'ta, alt ağacında en çok [[stake]] bulunan çocuğa iner. Hesaba her [[validator]]'ın yalnızca en son [[attestation]]'ı katılır. Zamanında gelen bir [[block]], bir [[slot]]'luk "committee" ağırlığının %40'ı kadar geçici bir "proposer boost" alır; bu, dengeleme ve kısa [[reorg]] saldırılarını köreltir.

Zamanlama protokolün parçasıdır: [[block]]'un [[slot]] başında, [[attestation]]'ların 4. saniyede, birleştirilmiş oyların 8. saniyede gelmesi beklenir. Ödül; doğru ve zamanında verilmiş "source", "target" ve "head" oyları için ayrı ayrı paylaştırılır. Kaçırılan ya da yanlış verilen "source" ya da "target" oyu, kazandıracağı tutar kadar cezalandırılır; kaçırılan "head" oyu ise yalnızca ödül kazandırmaz.

**Dene:** Bir [[validator]]'ı kapatmak, onun \`effective_balance\` değerini oy veren ağırlıktan çıkarır. Panel bu ağırlığı, [[casper-ffg]]'nin gerektirdiği nitelikli çoğunluk olan \`2/3 × toplam aktif bakiye\` ile karşılaştırır; [[lmd-ghost]]'ta böyle bir eşik yoktur, gelen oylarla zincirin ucunu seçmeyi sürdürür. Model: çevrimiçi [[validator]]'lar her zaman zamanında ve doğru oy verir.`,
      },
      code: {
        lang: 'Python (consensus spec)',
        source: `class Checkpoint(Container):
    epoch: Epoch
    root: Root                 # o epoch'un başındaki block

class AttestationData(Container):
    slot: Slot
    index: CommitteeIndex
    beacon_block_root: Root    # LMD-GHOST oyu: gördüğüm zincir ucu
    source: Checkpoint         # FFG oyu: en son justified checkpoint
    target: Checkpoint         # FFG oyu: içinde bulunulan epoch'un checkpoint'i`,
      },
    },
    finality: {
      title: 'Kesinleşme: "finality"',
      alt: 'Yan yana altı block üç epoch halinde gruplanmış; her epoch finalized, justified, justified değil ya da oylanıyor olarak işaretli. Çevrimiçi sütunlardan en yeni epoch\'a oylar akıyor; yanındaki sütun oy veren stake\'i üçte iki çizgisine göre gösteriyor.',
      body: {
        beginner: `[[mining]] yapılan zincirlerde bir ödeme yalnızca "gittikçe daha büyük olasılıkla" kalıcı hale gelir. Burada ise kesinleştiği belli bir an vardır.

[[block]]'lar turlar halinde gruplanır. Bütün teminatların en az **üçte ikisini** elinde tutan [[validator]]'lar bir tura oy verince o tur onaylanır. Üzerine bir sonraki tur da onaylanınca önceki tur kilitlenir.

Kilitlenen bir [[block]] [[finality]] kazanmıştır: onu geri almak için çok büyük bir [[validator]] grubunun kuralları herkesin gözü önünde çiğnemesi ve teminatını kaybetmesi gerekir.

**Dene:** Üçte ikinin altına inecek kadar [[validator]]'ı kapat, sonra **Sonraki epoch** düğmesine birkaç kez bas. Turlar geçer ama hiçbiri onaylanmaz ve yeni hiçbir şey kilitlenmez. Onları yeniden aç ve asma kilidin tekrar görünmesi için kaç tur gerektiğini say.`,
        intermediate: `Her [[epoch]]'un ilk [[block]]'u bir **"checkpoint"** görevi görür. Her [[attestation]], bir "checkpoint"ten sonrakine uzanan bir bağa da oy verir.

- Toplam [[stake]]'in en az 2/3'ünün oyu bir "checkpoint"i destekliyorsa o "checkpoint" **"justified"** olur.
- "Justified" bir "checkpoint"in hemen ardından gelen de "justified" olursa önceki **"finalized"** olur.

Her şey yolundayken bu iki [[epoch]], yani yaklaşık 13 dakika sürer. "Finalized" bir [[block]], dürüst [[node]]'lar tarafından asla geri alınmaz. Onunla çelişen bir [[block]]'u kesinleştirmek için toplam [[stake]]'in en az 1/3'ünü elinde tutan [[validator]]'ların birbiriyle çelişen oylar imzalaması gerekir; bu imzalar da teminatlarının yok edilmesi için yeterli kanıttır.

**Dene:** [[stake]]'in üçte birinden fazlasını çevrimdışı yap ve *Sonraki epoch* düğmesine bas: [[epoch]]'lar geçer, hiçbiri "justified" olmaz ve [[finality]] olmadan geçen [[epoch]] sayısı artar. Dört [[epoch]] sonra "inactivity leak" çevrimdışı [[validator]]'ların bakiyesini eritmeye başlar. İşleyişini görmek için *512 epoch atla* düğmesini kullan (yaklaşık 2,3 gün): çevrimdışı [[stake]], çevrimiçi taraf yeniden 2/3'e ulaşacak kadar küçülünce [[finality]] kendiliğinden geri gelir. Model olağan ödül ve cezaları hesaba katmaz.`,
        expert: `[[casper-ffg]], \`(epoch, root)\` biçimindeki "checkpoint"ler üzerinde çalışır. Bir [[attestation]], \`source → target\` biçiminde bir bağ içerir. Zaten "justified" olan bir "source"tan çıkan bağlar, toplam aktif \`effective_balance\` değerinin en az 2/3'üne sahip [[validator]]'larca imzalanınca "target" *"justified"* olur. "Justified" bir "checkpoint", doğrudan çocuğu olan "checkpoint" ondan çıkan bir bağla "justified" olduğunda *"finalized"* olur (protokol bu kuralın iki [[epoch]]'luk bazı türevlerini de kabul eder).

Buradan iki özellik çıkar. **"Accountable safety"**: birbiriyle çelişen iki "finalized" "checkpoint" varsa [[stake]]'in en az 1/3'üne sahip [[validator]]'lar "double vote" ya da "surround vote" imzalamış demektir ve [[slashing]] cezası alabilirler. **"Plausible liveness"**: 2/3 protokole uyduğu sürece yeni bir "checkpoint" her zaman kesinleştirilebilir.

1/3'ten fazlası çevrimdışı kalırsa kesinleşme durur, ama [[lmd-ghost]] [[block]] üretmeyi sürdürür. [[finality]] olmadan dört [[epoch]] geçince "inactivity leak" başlar: oy vermeyen [[validator]]'ların bakiyesi giderek artan bir hızla erir, yani toplam kayıp zamanın karesiyle büyür; ta ki oy verenler yeniden 2/3'e ulaşana kadar. Zincir çalışır kalmayı seçer, kesinliği sonradan onarır.

**Dene:** Model her [[epoch]]'ta \`process_inactivity_updates\` kuralını uygular: çevrimdışı bir [[validator]]'ın \`inactivity_score\` değeri 4 artar ve \`effective_balance × inactivity_score / (4 × 2^24)\` kadar ceza öder; "leak" dışında skorlar [[epoch]] başına 16 düşer. \`effective_balance\`, gerçek bakiyeyi 1 ETH'lik adımlarla ve aşağı yönlü histerezisle izler; böylece çevrimiçi pay 2/3'ü geçene kadar yavaşça yükselir. Dışarıda bırakılanlar: [[attestation]] ödül ve cezaları, 16 ETH'de ağdan çıkarılma ve iki [[epoch]]'luk "finalization" varyantları.`,
      },
    },
    slashing: {
      title: 'Ceza: "slashing"',
      alt: 'Senin sütunun bir block öneriyor. Aynı slot için ikinci bir block imzalayınca iki block da kırmızıya dönüyor, sütun kızarıp sıradan dışarı çıkıyor ve coin\'leri karanlık bir çukura uçuyor. Onunla birlikte cezalandırılan diğer sütunlar da kırmızıya dönüyor.',
      body: {
        beginner: `Bir [[validator]]'ın, kandırmak istediği her gruba ayrı bir geçmiş imzalamasını ne engelliyor?

Her oy imzalıdır. Biri birbiriyle çelişen iki şey imzalarsa bu iki imza birlikte inkâr edilemez bir kanıt olur. Kanıtı herkes ağa gösterebilir.

Cezası [[slashing]]'dir: teminatın bir kısmı yok edilir ve [[validator]] dışarı atılır. Yalnızca çevrimdışı kalmak suç değildir; küçük kesintilere yol açar, o kadar.

**Dene:** Düğmeye basıp kendi [[validator]]'ına aynı tur için iki [[block]] imzalat. Yakalanır, kırmızıya döner ve coin kaybeder. Sonra kaydırıcıyı oynat: birlikte hile yapanlar ne kadar çoksa her biri o kadar çok kaybeder.`,
        intermediate: `Üç davranış [[slashing]] ile cezalandırılır:

- aynı [[slot]]'ta iki farklı [[block]] önermek;
- aynı hedef [[epoch]] için iki farklı [[attestation]] imzalamak;
- kendi önceki [[attestation]]'ını "saran" bir [[attestation]] imzalamak; bu, önceki oyunu yeniden yazmak anlamına gelir.

Kanıt, imzalı iki mesajın kendisidir; herhangi bir [[proposer]] bunu [[block]]'una koyabilir. Ceza alan [[validator]], [[stake]]'inin bir dilimini hemen kaybeder, kümeden çıkarılır ve kalanını çekebilmek için yaklaşık 36 gün bekler.

Bu bekleyiş sırasında ikinci bir ceza uygulanır ve bu ceza, aynı dönemde ceza alan [[validator]] sayısıyla birlikte büyür. Tek başına bir kaza ucuza atlatılır. [[stake]]'in üçte birinin eşgüdümlü saldırısı ise saldırganlara her şeylerini kaybettirir.

**Dene:** İki [[block]] imzala, sonra seninle birlikte cezalandırılan [[validator]] sayısını artır. Tek başınayken yalnızca küçük bir dilim kaybedersin. Cezalandırılanlar toplam [[stake]]'in üçte birini tuttuğunda her biri her şeyini kaybeder.`,
        expert: `[[slashing]], [[nothing-at-stake]] sorununun cevabıdır. İmzalamak bedavadır; bu yüzden [[stake]] ağırlıklı saf bir protokolde rasyonel bir [[validator]] bir [[fork]]'un her dalına oy verir ve [[consensus]] hiçbir zaman yakınsamaz. Gasper, çift imzayı kime ait olduğu kanıtlanabilir ve pahalı hale getirir.

Aynı [[validator]]'ın \`a\` ve \`b\` adlı iki [[attestation]]'ı için ceza koşulları şunlardır:

- **"double vote"**: \`a ≠ b\` ve \`a.target.epoch == b.target.epoch\`;
- **"surround vote"**: \`a.source.epoch < b.source.epoch\` ve \`b.target.epoch < a.target.epoch\`.

[[proposer]] için ceza koşulu, aynı [[slot]] için imzalanmış iki farklı başlıktır. Ceza alan [[validator]] bir başlangıç cezası öder, kümeden çıkarılır ve 8.192 [[epoch]] (yaklaşık 36 gün) sonra bakiyesini çekebilir hale gelir. Sürenin ortasında korelasyon cezası uygulanır: \`effective_balance × min(3 × S, T) / T\`. Burada \`S\`, çevredeki 8.192 [[epoch]]'luk pencerede ceza alan [[stake]], \`T\` ise toplam aktif [[stake]]'tir. [[stake]]'in üçte biri birlikte ceza alırsa her suçlu bakiyesinin tamamını kaybeder.

Bugüne kadarki cezaların çoğu işletmeci hatasıdır; tipik örnek aynı anahtarın iki makinede birden çalışmasıdır. İstemcilerin yerel bir "slashing protection" veritabanı tutmasının nedeni budur.

**Dene:** Panel iki cezayı da Electra'dan beri "spec"te olduğu gibi hesaplar: ilk ceza \`effective_balance / 4096\`, korelasyon cezası ise \`(min(3 × S, T) // (T // 1 ETH)) × (effective_balance // 1 ETH)\`. Kaydırıcı diğer [[validator]]'ları en küçük [[stake]]'ten başlayarak \`S\` değerine ekler. Sadeleştirme: \`T\`, cezalardan önceki toplam [[stake]]'tir.`,
      },
      code: {
        lang: 'Python (consensus spec)',
        source: `def is_slashable_attestation_data(data_1: AttestationData,
                                  data_2: AttestationData) -> bool:
    return (
        # double vote: aynı hedef epoch için iki farklı oy
        (data_1 != data_2 and data_1.target.epoch == data_2.target.epoch) or
        # surround vote: 1. oy, 2. oyu içine alıyor
        (data_1.source.epoch < data_2.source.epoch and
         data_2.target.epoch < data_1.target.epoch)
    )`,
      },
    },
    compare: {
      title: '"Proof of Work" ile "Proof of Stake" yan yana',
      alt: 'Her tasarım için bir platform. İkisinde de bir sütun, saldırganın payını eşik çizgilerine göre gösteriyor: proof of work\'te yarı, proof of stake\'te üçte bir ve üçte iki. Yanında madencilik makinesi sağlam kalırken stake sütunu coin\'lerini karanlık bir çukura kaybediyor.',
      body: {
        beginner: `İki sistem de aynı soruya cevap verir: sıradaki [[block]]'u kim ekleyebilir ve ona neden inanalım?

- [[proof-of-work]]: en çok elektriği harcayan. Dürüst olsan da olmasan da para gitmiştir.
- [[proof-of-stake]]: coin kilitleyen. Dürüst davrandıysan para geri gelir, davranmadıysan yok edilir.

İlki basittir ve 2009'dan beri Bitcoin'i korur. İkincisi çok daha az enerji harcar ve [[block]]'ları kesinleşmiş ilan edebilir, ama hareketli parçası daha fazladır.

**Dene:** Kaydırıcıyla saldırgana ağın giderek daha büyük bir parçasını ver ve iki tasarım arasında geçiş yap. Sonrasında elinde ne kaldığına bak: madenci bütün makinelerini korur ve yeniden deneyebilir; teminat yatıranın coin'leri yok edilir.`,
        intermediate: `**Güvenliğin bedeli.** Bir [[miner]] donanım ve elektrik için sürekli ödeme yapar; zincir de bu faturayı karşılamak için coin basmayı sürdürmek zorundadır. Bir [[validator]] ise yalnızca sermayesini kullanmaktan vazgeçer; bu yüzden [[ethereum]], "the Merge" öncesine göre çok daha az yeni coin basar.

**Kesinlik.** [[proof-of-work]] altında bir [[transaction]] her [[confirmation]] ile geri alınması biraz daha zor hale gelir, ama hiçbir zaman mutlak olmaz. [[proof-of-stake]] altında bir [[block]] yaklaşık 13 dakika sonra kesinleşir; onu geri almak toplam [[stake]]'in en az üçte birini yok eder.

**Saldırıdan sonra.** Çoğunluğu elinde tutan bir [[miner]]'ın makineleri yerinde durur; yarın yeniden saldırabilir. Saldıran bir [[validator]]'ın [[stake]]'i ise yok edilebilir; aynı coin'lerle ikinci kez saldırılamaz.

**Kaygılar.** [[mining]], elektriğin ve çipin ucuz olduğu yerlerde toplanır; [[staking]] ise büyük havuzlarda ve borsalarda. İkisi de kusursuz biçimde dağıtık değildir.

**Dene:** Saldırganın payını kaydır. [[proof-of-work]] tarafında [[hashrate]]'in yarısını geçene kadar pek bir şey olmaz; saldırıdan sonra da donanımın tamamı yerinde durur. [[proof-of-stake]] tarafında üçte bir [[finality]]'yi durdurmaya, üçte iki ise istediğini kesinleştirmeye yeter; ama çelişen oylar imzalayan [[stake]], tamamına varana kadar [[slashing]] ile yok edilir.`,
        expert: `**Eşikler.** Nakamoto [[consensus]]'u [[hashrate]]'in dürüst çoğunlukta olmasını ister ("selfish mining" hesaba katılınca daha fazlasını) ve yalnızca olasılıksal kesinlik sunar. Gasper'da iki eşik vardır: [[stake]]'in 1/3'üne sahip [[validator]]'lar [[finality]]'yi durdurabilir; birbiriyle çelişen iki "finalized" "checkpoint" ise en az 1/3'ün cezalandırılabilir olmasını gerektirir. 2/3'e sahip bir saldırgan istediğini kesinleştirir; geriye kalan savunma toplumsaldır: topluluk, saldırganın [[stake]]'ini dışarıda bırakan bir [[fork]] yapar.

**"Long-range" saldırılar.** [[proof-of-work]] nesneldir: yeni bir [[node]], yalnızca [[genesis-block]]'tan yola çıkarak en ağır zinciri seçebilir, çünkü eski iş ucuza taklit edilemez. [[proof-of-stake]] sisteminde ise çoktan çıkmış [[validator]]'lar uzak geçmişten başlayan alternatif bir tarihi bedavaya imzalayabilir; [[stake]]'leri çekilmiştir ve artık cezalandırılamaz. Savunma "weak subjectivity"dir: ağa yeni katılan ya da uzun süre sonra dönen bir [[node]], güvenilir ve yakın tarihli bir "checkpoint"ten başlamak zorundadır. Çıkışlar da hız sınırına tabidir; böylece [[validator]] kümesi "weak subjectivity" süresi içinde baştan sona değişemez.

**Karmaşıklık ve güven yüzeyi.** PoW'un kuralı tek satıra sığar: birikmiş işi en fazla olan zincir kazanır. Gasper iki protokolü birbirine bağlar; bu ikisinin etkileşimi yayımlanmış bir dizi saldırıya (dengeleme, "ex-ante reorg") ve "proposer boost" gibi yamalara yol açmıştır. Karşılığında açık bir [[finality]], faili belli hatalar ve sürekli enerji harcamasına bağlı olmayan bir güvenlik elde eder.

**Dene:** Panel yukarıdaki eşikleri seçilen paya uygular. Yakılan oran, saldırganın [[stake]]'ine uygulanan \`min(3 × pay, 1)\` korelasyon cezasıdır; tamamının çelişen oy verdiği ve tek bir pencere içinde cezalandırıldığı varsayılır. Yalnızca çevrimdışı kalan bir saldırgan [[stake]]'ini "inactivity leak" ile daha yavaş kaybeder. PoW tarafında model yalnızca donanımı sayar: saldırı sırasında harcanan enerji her durumda gitmiştir.`,
      },
    },
  },
};

export default content;
