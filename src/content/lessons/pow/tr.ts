import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[miner]]'lar -> "miner"'lar.
// English technical words without a glossary entry are quoted by hand: "pool".

const content: LessonContent = {
  labels: {
    nextBlock: 'Bunu kim ekleyecek?',
    emptySlot: 'sıradaki block',
    chain: 'şimdiye kadarki zincir',
    miner: 'Miner',
    you: 'Sen',
    yourBlock: 'senin block',
    pressMine: 'Mine\'a bas',
    attempt: 'deneme',
    gaugeTop: 'parmak izi',
    hashValue: 'hash değeri',
    winZone: 'kazandın',
    belowTarget: 'target altında',
    reward: 'ödül',
    rewardAmount: '3,125 BTC + ücretler',
    startOver: 'baştan başla',
    newBlock: 'yeni block',
    verifyOnce: 'doğrulamak için tek hash',
    fewMiners: 'birkaç miner',
    moreMiners: 'yeni miner\'lar katılıyor',
    steady: 'düzenli tempo',
    tooFast: 'fazla hızlı',
    difficulty: 'difficulty',
    harder: 'bulmaca zorlaştı',
    honestChain: 'Geri kalan herkes',
    attackerChain: 'Gizli zincir',
    publicChain: 'Açık zincir',
    cost: 'elektrik faturası',
    zeros: 'Baştaki sıfır',
    average: 'ort. deneme',
    mine: 'Mine',
    mineAgain: 'Tekrar',
    resume: 'Devam et',
    stop: 'Durdur',
    reset: 'Sıfırla',
    attempts: 'Deneme',
    time: 'Süre',
    nonce: 'Nonce',
    winningNonce: 'Kazanan nonce',
    lastHash: 'Son hash',
    winningHash: 'Kazanan hash',
    limit: 'limit doldu',
    ready: 'hazır',
    searching: 'aranıyor…',
    paused: 'durdu',
    found: 'geçerli block bulundu',
    capped: 'şans yok: deneme limitinde durduruldu',
    seconds: 'sn',
    lateTag: "block'un ona ulaşmıştı",
    rivalTag: '{n} sn sonra o da buldu',
    staleTag: 'stale: emek boşa gitti',
    sameHeight: 'aynı yükseklik',
    builtOn: 'sıradaki block',
    tooSlow: 'fazla yavaş',
    pace: 'block başına ≈ {n} dk',
    minersLeave: "miner'lar ayrılıyor",
    hashrateWord: 'hashrate',
    easier: 'bulmaca kolaylaştı',
    clampTag: '(4× sınırı)',
    honestPct: 'geri kalan herkes · {n}',
    attackerPct: 'saldırgan · {n}',
    caught: 'yetişti: geçmiş yeniden yazıldı',
    gaveUp: 'geride kaldı: vazgeçti',
    tryOdds: 'Dene: payını ayarla, sonra block üret',
    yourShare: 'Hashrate payın',
    runBlocks: '{n} block üret',
    blocksMined: 'Block',
    youWon: 'Kazandığın',
    expected: 'Beklenen',
    tryCast: 'Dene: ağı yavaşlat',
    delayLabel: 'Yayılma gecikmesi',
    rivalFinds: 'Miner C de bulsun (+{n} sn)',
    nextBlockBtn: "Sıradaki block'u bul",
    startOverBtn: 'Baştan başla',
    staleStat: 'Rakip block olasılığı',
    outcome: 'Sonuç',
    outNone: '—',
    outLate: 'fork yok',
    outFork: 'fork: iki block',
    outYou: "C'ninki stale",
    outRival: 'seninki stale',
    tryRetarget: "Dene: hashrate'i değiştir, sonra bir dönem üret",
    hashrateSlider: 'Hashrate',
    minePeriod: "Sonraki 2016 block'u üret",
    blockTimeStat: 'Block süresi',
    min: 'dk',
    periodTakes: '2016 block süresi',
    days: 'gün',
    diffNext: 'Difficulty şimdi → sonra',
    tryAttack: 'Dene: saldırganı ve bekleme süresini ayarla',
    attackerSlider: 'Saldırganın payı',
    confSlider: 'Confirmation',
    raceBtn: 'Yarıştır',
    successStat: 'Başarı',
    atRisk: 'Vazgeçilen ödül',
    noRisk: 'yok: kazanıyor',
    attemptsWon: 'Kazanılan',
  },
  steps: {
    who: {
      title: 'Sıradaki "block"\'u kim ekleyecek?',
      alt: 'Üç block\'luk bir zincirin ucunda boş bir yer var. Önünde üç madencilik makinesi duruyor; her birinin elinde henüz tamamlanmamış kendi aday block\'u var.',
      body: {
        beginner: `Zincirin bir kopyası herkeste var ve pek çok kişi sıradaki sayfayı yazmak istiyor. Herkes canı istediğinde bir [[block]] ekleyebilseydi, bir dakika içinde binlerce farklı sürüm ortaya çıkardı.

Bu yüzden ağın her seferinde **tek** bir yazar seçmesi gerekiyor. Üstelik seçimi yapacak bir patron da, aralarından seçim yapılacak bir üye listesi de yok.

[[proof-of-work]] bu sorunu bir çekilişle çözer. Çekilişe herkes katılabilir, ama her biletin bedeli gerçek elektrikle ödenir. Bilet alan makinelere [[miner]] denir.`,
        intermediate: `Herkese açık bir ağda oylama yapılamaz: bin tane sahte kimlik yaratmak bedavadır, yani "her bilgisayara bir oy" kuralı kolayca kandırılır. Buna "Sybil attack" denir.

[[proof-of-work]], söz hakkını taklit edilemeyen bir şeye, yani hesaplama gücüne bağlar. Her [[miner]], [[mempool]] içinde bekleyen [[transaction]]'ları bir aday [[block]] içinde toplar ve onu yayımlama hakkı için yarışır.

Kazanma olasılığı, [[miner]]'ın ağdaki toplam [[hashrate]] içindeki payıyla orantılıdır. Makinelerin yüzde onuna sahip olan, [[block]]'ların aşağı yukarı yüzde onunu bulur.`,
        expert: `Nakamoto [[consensus]]'u, kimliğe dayalı oylamanın yerine kaynağa dayalı bir lider seçimi koyar. Bir üye kümesi yoktur: bir katılımcının ağırlığı, toplam [[hashrate]]'e yaptığı katkının oranıdır. Protokol bu sayede hem Sybil saldırılarına dayanıklı hem de izinsizdir.

Her [[miner]] bir [[block]] şablonu kurar: önceki [[block]]'un [[hash]] değeri, seçtiği [[transaction]]'lar üzerinden hesaplanan [[merkle-root]], bir [[timestamp]] ve güncel \`nBits\`. Listedeki ilk [[transaction]] "coinbase"dir; girdisi yoktur ve [[block-reward]] ile ücretleri [[miner]]'a öder. Her [[miner]]'ın "coinbase"i farklı olduğundan herkes farklı bir bulmacayı çözmeye çalışır.

[[block]] bulma bir Poisson sürecidir. Hedef aralık 600 saniye olduğunda bir sonraki [[block]]'a kadar geçen süre üstel dağılır ve hafızasızdır: dokuz dakikadır sonuç alamamış olmak, sıradaki [[block]]'u bir saniye bile yaklaştırmaz.`,
      },
    },
    puzzle: {
      title: 'Bulmaca',
      alt: 'Bir madencilik makinesi ve aday block\'u. Block\'un üstündeki sayaç sayıları hızla çeviriyor; yanındaki gösterge her denemenin küçük yeşil kazanma bölgesinin üstüne düştüğünü gösteriyor.',
      body: {
        beginner: `Buradaki piyango bileti bir tahmindir. [[miner]], [[block]]'un içine bir sayı ekler ve [[block]]'un [[hash]] değerini, yani parmak izini alır. Çıkan parmak izi tamamen rastgele görünür.

Kural şu: parmak izi yeterince sıfırla başlamalı. Bunu tutturmanın bir hilesi yok. Tek yol, [[nonce]] denen o sayıyı değiştirip tekrar denemek, sonra bir daha, bir daha.

Kaydırıcıyı ayarla ve **Mine** düğmesine bas. Bu aramayı cihazın gerçekten yapıyor. Eklenen her sıfır işi yaklaşık 16 kat zorlaştırır.`,
        intermediate: `Bulmaca şu: öyle bir [[nonce]] bul ki [[block-header]]'ın [[hash]] değeri, [[target]] denen sayının altında kalsın. Küçük bir [[target]], baştaki sıfırların artması ve bulmacanın zorlaşması demektir; [[difficulty]] de aslında [[target]] değerinin ne kadar küçük olduğunu söyler.

Bir [[hash]] fonksiyonu hangi girdinin işe yarayacağına dair hiçbir ipucu vermez; geriye tek strateji kalır: kaba kuvvet. [[nonce]] olarak 0, 1, 2, … dene ve her seferinde [[hash]] al. Çözümü bulmak ortalamada devasa sayıda deneme ister. Çözümü **kontrol etmek** ise tek bir [[hash]] hesabıdır; yapılan işi herkes anında doğrulayabilir.

Aşağıdaki denemede her onaltılık sıfır, ortalama deneme sayısını 16'ya katlar: 3 sıfır için yaklaşık 4.096, 5 sıfır için yaklaşık bir milyon deneme gerekir. Bitcoin'in gerçek [[target]] değeri 2026 itibarıyla baştan en az 19 onaltılık sıfır ister.`,
        expert: `Bitcoin'de geçerlilik koşulu \`SHA256d(header) ≤ target\` biçimindedir. Burada \`SHA256d(x) = SHA-256(SHA-256(x))\`, 80 baytlık [[block-header]] üzerinde hesaplanır ve çıkan özet 256 bitlik "little-endian" bir tam sayı olarak okunur.

[[target]], [[block-header]] içinde sıkıştırılmış biçimde durur: \`nBits = 0xEEMMMMMM\` ise \`target = mantissa × 256^(exponent − 3)\`. İzin verilen en büyük [[target]] \`0x1d00ffff\` değeridir ve [[difficulty]], \`max_target / target\` olarak tanımlanır. Bir [[block]] için beklenen iş yaklaşık \`difficulty × 2^32\` [[hash]] hesabıdır.

[[block-header]]'daki [[nonce]] yalnızca 32 bittir; modern bir ASIC bunu bir saniyeden çok daha kısa sürede tüketir. Bunun üzerine [[miner]], "coinbase" içindeki \`extraNonce\` alanını değiştirerek (bu, [[merkle-root]]'u da değiştirir) ya da \`nTime\` alanını oynatarak yeni bir arama uzayı açar.

Aşağıdaki deneme, metin biçimindeki bir başlık üzerinde tek [[sha-256]] kullanır ve baştaki onaltılık sıfırları sayar. Fikir aynıdır, yalnızca [[target]] daha kaba adımlarla ayarlanır: \`k\` sıfır, \`target = 2^(256 − 4k)\` demektir.`,
      },
      code: {
        lang: 'pseudocode',
        source: `// her miner'ın saniyede milyarlarca kez yaptığı şey
header = { version, prevBlockHash, merkleRoot, time, bits, nonce: 0 }
target = decodeCompact(header.bits)

loop:
  h = sha256(sha256(serialize(header)))   // 80 bayt girer, 32 bayt çıkar
  if uint256_le(h) <= target: broadcast(block)
  header.nonce += 1
  if header.nonce 2^32 sınırını aşarsa:
    coinbase.extraNonce += 1              // yeni merkle root, yeni arama uzayı
    header.merkleRoot = merkle(txs)`,
      },
    },
    race: {
      title: 'Yarış',
      alt: 'Fanları dönen üç madencilik makinesi aynı anda çalışıyor. Her birinin aday block\'unun üstünde bir sayaç dönüyor; zincirin ucundaki yer hâlâ boş.',
      body: {
        beginner: `Dünyadaki bütün [[miner]]'lar aynı anda tahmin yürütüyor; her biri sıradaki [[block]]'un kendi sürümü üzerinde çalışıyor. Fanlar dönüyor, elektrik yanıyor, sayaçlar yarışıyor.

Daha çok makinesi olan saniyede daha çok tahmin yapar ve daha sık kazanır. Ama iş yine de şansa kalır: küçük bir [[miner]], sıradaki [[block]]'u bir devden önce bulabilir.

**Mine** düğmesine basarak kendi cihazınla yarışa katıl.`,
        intermediate: `Bütün [[miner]]'ların toplam tahmin hızına ağın [[hashrate]] değeri denir. Bitcoin'de bu değer 2026 itibarıyla saniyede bin "exahash" dolayındadır; bir "exahash" 10^18 [[hash]] demektir.

[[hashrate]]'in *p* kadarına sahip bir [[miner]], ortalamada bütün [[block]]'ların *p* kadarını bulur. Tek başına çalışan küçük bir [[miner]] bir kez kazanmak için yıllarca bekleyebileceğinden çoğu, işini birleştirip ödülü emeğe göre paylaştıran "pool"lara katılır.

Bazen iki [[miner]] birkaç saniye arayla birer [[block]] bulur ve zincir kısa süreliğine ikiye ayrılır; buna [[fork]] denir. Herkes ilk gördüğü [[block]]'un üzerinde çalışmayı sürdürür ve beraberliği, bir sonraki [[block]]'u kim bulursa o bozar.`,
        expert: `Madencilikte birikmiş ilerleme diye bir şey yoktur: her [[hash]] denemesi, başarı olasılığı \`target / 2^256\` olan bağımsız bir Bernoulli denemesidir. [[hashrate]] payı *p* olan bir [[miner]], ne kadar süredir aradığından bağımsız olarak her [[block]]'u *p* olasılıkla kazanır. Ödülün işle orantılı olmasını sağlayan ve "önde olmanın" avantajını ortadan kaldıran şey budur.

"Pool"lar üyelerine "share" dağıtır: çok daha kolay bir [[target]] değerini tutturan başlıklar. "Share"ler yapılan işi istatistiksel olarak kanıtlar ve "pool"un, üyelerin beyanına güvenmeden ödülü bölüştürmesini sağlar (PPS, FPPS, PPLNS yöntemleri). [[transaction]]'ları çoğunlukla makineyi çalıştıran değil "pool" işletmecisi seçer; bu da [[block]] şablonu üzerindeki kontrolü birkaç elde toplar.

Aynı yükseklikte iki geçerli [[block]] aynı anda yayılırsa [[node]]'lar ilk gördüklerini tutar, diğerini rakip uç olarak saklar. [[fork-choice]] kuralı en çok [[block]] içeren zinciri değil, **birikmiş işi** en fazla olan zinciri seçer ([[block]]'lar üzerinden \`2^256 / (target + 1)\` toplamı). Kaybeden [[block]] "stale" olur ve içindeki [[transaction]]'lar [[mempool]]'a geri döner.`,
      },
    },
    odds: {
      title: 'Şans ve payın',
      alt: 'Üç madencilik makinesi yan yana duruyor; her birinin önünde kazandığı block\'lardan bir yığın var. Yığınların yüksekliği her miner\'ın hashrate payına yakın, ama birebir aynı değil.',
      body: {
        beginner: `Daha çok makinen olması kazanmanı garanti etmez; **daha sık** kazanmanı sağlar. Her [[block]] yeni bir çekiliştir ve her [[miner]]'ın elinde tahmin gücü kadar bilet vardır.

Birkaç [[block]] boyunca işi şans belirler: küçük bir [[miner]] üst üste iki kez kazanabilir, büyük biri eli boş kalabilir. Yüzlerce [[block]] sonra şans dengelenir ve her [[miner]]'ın yığını, makinelerdeki payına yaklaşır.

**Dene:** kaydırıcıyla payını ayarla ve **100 block üret** düğmesine birkaç kez bas. Kazandığın [[block]] sayısını beklenen sayıyla karşılaştır.`,
        intermediate: `[[hashrate]]'in *p* kadarına sahip bir [[miner]], her [[block]]'u öncekilerden bağımsız olarak *p* olasılıkla kazanır. *n* [[block]] boyunca *n × p* kazanç bekleyebilir.

Gerçekte eline geçen, bu sayının çevresinde oynar. [[hashrate]]'in %10'uyla sıradaki 100 [[block]]'un 10'unu beklersin, ama 6 ya da 14 çıkması hiç şaşırtıcı olmaz. Bitcoin günde yaklaşık 144 [[block]] üretir; [[hashrate]]'in %0,1'ine sahip bir [[miner]] ortalamada haftada bir [[block]] bulur ve aşağı yukarı yirmi seferde bir, üç hafta ya da daha uzun bekler. "Pool"ların var olma nedeni bu düzensiz gelirdir.

**Dene:** kaydırıcıyı oynat ve **100 block üret** düğmesine art arda bas. Ne kadar çok [[block]] üretilirse kazandığın yüzde, payına o kadar yaklaşır.`,
        expert: `Bir [[miner]]'ın *n* [[block]] içinden kazandıklarının sayısı binom dağılır: \`X ~ B(n, p)\`; ortalaması \`n·p\`, standart sapması \`√(n·p·(1 − p))\`. Göreli yayılım \`σ / (n·p) = √((1 − p) / (n·p))\`, [[block]] sayısının yalnızca kareköküyle küçülür; küçük bir [[miner]]'ın geliri bu yüzden uzun süre oynak kalır.

*p* = 0,001 ve bir günün 144 [[block]]'u için hiç [[block]] bulamama olasılığı \`(1 − p)^144 ≈ %87\` olur. "Pool" beklenen değeri değiştirmez; bir ücret karşılığında, çok sayıda üyenin ortalamasını alarak varyansı düşürür.

Buradaki denemede diğer iki [[miner]] kalan [[hashrate]]'i 5 : 6 oranında paylaşır. Her turda bir kazanan, payına eşit olasılıkla çekilir; bu tam olarak yukarıdaki modeldir. "Stale" [[block]]'lar ve büyük [[miner]]'ların yayılım avantajı modelin dışındadır.

**Dene:** panel beklenen sayıyı ± bir standart sapma ile gösterir. Birkaç tur çalıştır ve sonucun bu aralığa ne sıklıkla düştüğüne bak (yaklaşık üç seferde iki).`,
      },
    },
    broadcast: {
      title: 'Kazanan herkese duyurur',
      alt: 'Kazanan aday block yeşile dönmüş ve zincirin ucuna eklenmiş. Kopyaları diğer iki miner\'a doğru uçuyor; kazananın makinesinin üstünde bir yığın coin beliriyor. İlk block ulaşmadan ikinci bir miner de block bulursa zincirin ucunda iki block yan yana durur; sıradaki block biri griye dönene kadar.',
      body: {
        beginner: `[[miner]]'lardan biri kazanan sayıyı bulur ve [[block]]'unu hemen herkese gönderir.

Kontrol etmek kolaydır: her bilgisayar parmak izini bir kez alır ve sıfırları görür. [[block]] kurallara uyuyorsa kendi zincirine ekler. Diğer [[miner]]'lar yarım kalan denemelerini çöpe atar ve bir sonraki [[block]] için işe koyulur.

Kazanan [[block-reward]] alır: yepyeni coin'ler ve içerideki işlemlerin ödediği ücretler. Elektrik faturasını ödemeye değmesinin nedeni bu ödüldür.

**Dene:** bir [[block]]'un herkese ulaşması bir an sürer. Kaydırıcıyla bu süreyi uzat, sonra Miner C'nin seninkinden 5 saniye sonra kendi [[block]]'unu bulmasını sağla. Senin [[block]]'un C'ye henüz ulaşmadıysa aynı yer için birden iki [[block]] olur ve biri çöpe gider.`,
        intermediate: `Kazanan, [[block]]'u [[p2p]] ağı üzerinden duyurur. Her [[node]] onu bağımsız olarak kontrol eder: [[hash]] değeri [[target]]'in altında mı, her [[transaction]] geçerli mi, ödül tutarı doğru mu? Tek bir ayrıntı yanlışsa [[block]] reddedilir ve ona harcanan elektrik boşa gider.

[[block-reward]] iki parçadan oluşur: [[block]] ile birlikte yaratılan yeni coin'ler ("subsidy") ve içindeki [[transaction]]'ların ücretleri. Bitcoin'de "subsidy" 50 BTC ile başladı ve her 210.000 [[block]]'ta, yani yaklaşık dört yılda bir yarıya iniyor. Nisan 2024'teki [[halving]]'den beri 3,125 BTC.

Hiçbir zaman 21 milyondan fazla bitcoin olmayacak olmasının nedeni bu takvimdir. "Subsidy" küçüldükçe güvenlik bütçesinin daha büyük kısmını ücretlerin karşılaması gerekir.

**Dene:** yayılma gecikmesini, yani [[block]]'unun diğer [[miner]]'lara ulaşma süresini ayarla, sonra düğmeye bas: Miner C senden 5 saniye sonra bir [[block]] bulur. Seninki hâlâ yoldaysa iki [[block]] da geçerlidir ve zincirde [[fork]] oluşur; sıradaki [[block]]'u bulmak için tekrar bas ve ikisinden hangisinin "stale" olarak geride kaldığını gör. Panel, bu gecikmede her [[block]] için rakip bir [[block]] çıkma olasılığını gösterir.`,
        expert: `Yayılım \`inv\`/\`headers\` duyuruları ve ardından [[block]] indirme ile yapılır; "compact block relay" (BIP 152) yalnızca kısa [[transaction]] kimliklerini gönderir ve karşı taraf [[block]]'u kendi [[mempool]]'undan yeniden kurar. Hızlı yayılım önemlidir: gecikmenin her saniyesi "stale" oranını yükseltir ve büyük, iyi bağlantılı [[miner]]'ların lehine çalışır.

Doğrulama bilerek asimetrik tasarlanmıştır: tek bir \`SHA256d\` yapılan işi kontrol eder, ardından tam "script" ve UTXO doğrulaması içeriği kontrol eder. [[block-header]]'daki [[timestamp]], önceki 11 [[block]]'un medyanından büyük olmalı ve kontrolü yapan [[node]]'un kendi saatinin en fazla iki saat ilerisinde olabilir.

"Coinbase" çıktısı en fazla \`subsidy + fees\` kadar talep edebilir; burada \`subsidy = 50 BTC >> (height / 210000)\` olup [[satoshi]] cinsinden tam sayı kaydırmasıyla hesaplanır. Toplam arz 21 milyon BTC'nin hemen altına yakınsar ve "subsidy" 2140 yılı civarında sıfıra iner. "Coinbase" çıktıları 100 [[block]] boyunca harcanamaz; böylece bir [[reorg]], silinmiş bir ödülden türeyen coin'leri dolaşımda bırakamaz.

**Dene:** buradaki modelde, [[hashrate]]'in geri kalanı bir [[block]]'u *D* saniye geç duyuyorsa bu sürede bir başkasının rakip bir [[block]] bulma olasılığı \`1 − e^(−D/600)\` olur: 2 saniyede yaklaşık %0,3, 20 saniyede %3,3. [[fork]] çözülürken sıradaki [[block]], senin [[block]]'unun üstünde çalışan [[miner]]'ların toplam payı kadar olasılıkla (sen ve Miner A, %70) seninkine, aksi halde Miner C'ninkine eklenir. "Stale" bir [[block]] hiçbir şey kazandırmaz; yavaş yayılım [[miner]]'a para, ağa güvenlik kaybettirir, çünkü "stale" [[block]]'lara harcanan iş hiçbir şeyi korumaz.`,
      },
    },
    retarget: {
      title: 'Zorluk kendini ayarlar',
      alt: 'Bir sıra madencilik makinesi ve altında bir sıra block. Makine arttıkça block\'lar birbirine yaklaşıyor, azaldıkça seyreliyor; ayarlamadan sonra zorluk sütunu yükseliyor ya da alçalıyor ve aralık normale dönüyor.',
      body: {
        beginner: `Binlerce yeni makine katılırsa ne olur? Saniyede daha çok tahmin, kazananın daha çabuk çıkması demektir; [[block]]'lar düzenli bir tempoyla değil, birkaç dakikada bir gelmeye başlardı.

Bu yüzden bulmaca kendi ayarını değiştirir. [[block]]'lar fazla hızlı geldiyse gereken sıfır sayısı artar. Makineler ayrılır ve [[block]]'lar yavaşlarsa bulmaca kolaylaşır.

Buna kimse karar vermez. Her bilgisayar yeni [[difficulty]] değerini zincirin kendi geçmişinden hesaplar ve hepsi aynı sonuca varır.

**Dene:** kaydırıcıyla [[hashrate]]'i artır ya da azalt; [[block]]'ların sıkıştığını ya da seyreldiğini izle. Sonra **Sonraki 2016 block'u üret** düğmesine bas: zorluk sütunu değişir ve [[block]]'lar düzenli tempolarına döner.`,
        intermediate: `Bitcoin 10 dakikada bir [[block]] hedefler. Her 2.016 [[block]]'ta bir, yani bu tempoda iki haftada bir, her [[node]] bu [[block]]'ların gerçekte ne kadar sürdüğüne bakar.

- İki hafta yerine bir hafta mı sürdü? [[hashrate]] iki katına çıkmış demektir; [[difficulty]] de iki katına çıkar.
- Dört hafta mı sürdü? [[difficulty]] yarıya iner.

Tek bir ayarlama, her iki yönde de en fazla 4 kat olabilir. Sonuç: ağa ne kadar donanım girip çıkarsa çıksın tempo yeniden 10 dakika civarına oturur ve coin'ler öngörülebilir bir takvimle basılır.

**Dene:** [[hashrate]] ×2 iken [[block]] süresine bak: 5 dakika. Sonraki 2.016 [[block]]'u ürettiğinde [[difficulty]] iki katına çıkar ve süre yeniden 10 dakikaya döner. Şimdi [[hashrate]]'i ×0,25'e indir ve [[difficulty]] tepki verebilene kadar sonraki dönemin ne kadar sürdüğünü gör.`,
        expert: `2016'ya bölünebilen her yükseklikte yeni [[target]] şöyle hesaplanır:

\`new_target = old_target × actual_timespan / 1.209.600 s\`

Burada \`actual_timespan\`, \`[302.400 s, 4.838.400 s]\` aralığına (iki haftanın dörtte biri ve dört katı) sıkıştırılır ve sonuç \`powLimit\` ile sınırlanır. İki ayarlama arasında \`nBits\` birebir aynı kalmak zorundadır.

Bilinen iki tuhaflık var. Süre, dönemin ilk [[block]]'u ile son [[block]]'u arasında ölçülür; yani 2.016 değil 2.015 aralığı kapsar ("off-by-one" hatası, [[block]]'ları çok az yavaşlatır). Ayrıca girdiler [[miner]]'ların yazdığı [[timestamp]] değerleridir ve yalnızca "median-time-past" ile iki saatlik ileri sınırıyla kısıtlanır; çoğunluğu elinde tutan bir [[miner]] bunları çarpıtabilir. "Time-warp" saldırısının temeli budur.

Ayarlama gerçeği en fazla bir dönem geriden izler. [[hashrate]] aniden düşerse 2.016'ncı [[block]] bulunana kadar tempo yavaş kalır; [[hashrate]]'i düşük zincirler bundan zarar görmüş ve her [[block]]'ta ayar yapan algoritmalara geçmiştir.

**Dene:** buradaki deneme kuralı yazıldığı gibi uygular; 2.015 aralıklık süre ölçümü de buna dahildir: sabit [[hashrate]]'te [[difficulty]] her dönem 2016/2015 katına çıkar. [[difficulty]] ×1 iken [[hashrate]]'i ×4'e çıkarırsan ölçülen süre 302.400 saniyenin hemen altına düşer ve 4 kat sınırı devreye girer. Sonra ×0,25'e indir: [[block]] süresi 160 dakika olur, dönem yaklaşık 224 gün sürer ve tek bir ayarlama [[difficulty]]'yi en fazla 4'e bölebilir. Buradaki [[difficulty]] başlangıç değerine görelidir; bu yüzden \`powLimit\` devreye girmez.`,
      },
      code: {
        lang: 'C++ (Bitcoin Core, sadeleştirilmiş)',
        source: `// her 2016 block'ta bir kez çağrılır
unsigned int CalculateNextWorkRequired(const CBlockIndex* last, int64_t firstBlockTime) {
  const int64_t targetTimespan = 14 * 24 * 60 * 60;         // iki hafta
  int64_t actual = last->GetBlockTime() - firstBlockTime;

  // adımı her iki yönde 4 katla sınırla
  if (actual < targetTimespan / 4) actual = targetTimespan / 4;
  if (actual > targetTimespan * 4) actual = targetTimespan * 4;

  arith_uint256 next;
  next.SetCompact(last->nBits);                             // eski target
  next *= actual;
  next /= targetTimespan;
  if (next > powLimit) next = powLimit;                     // difficulty 1'den kolay olamaz
  return next.GetCompact();                                 // yeni nBits
}`,
      },
    },
    attack: {
      title: 'Saldırmanın bedeli',
      alt: 'Ortak bir block\'tan iki zincir ayrılıyor. Üç makinenin desteklediği üstteki zincir herkesin gördüğü zincir. Alttaki gizli zinciri tek bir kırmızı makine kuruyor ve yanındaki coin\'ler eriyip gidiyor; gizli zincirin öbürüne göre uzunluğu saldırganın yetiştiğini ya da geride kaldığını gösteriyor.',
      body: {
        beginner: `Eski bir sayfayı yeniden yazmak isteyen bir hilekâr, çekilişi hem o sayfa için hem de ondan sonraki **bütün** sayfalar için baştan kazanmak zorundadır. Üstelik bunu, dünyanın geri kalanı yeni sayfalar eklemeyi sürdürürken onlardan hızlı yapmalıdır.

Makinesi diğer herkesin toplamından azsa her [[block]] ile biraz daha geride kalır. Yaktığı bütün elektrik boşa gider.

[[proof-of-work]] aslında bu demektir: zinciri, kimsenin ödemek istemeyeceği bir fatura korur. Bir ödeme ne kadar derine gömülürse o kadar güvende olur.

**Dene:** hilekâra daha çok ya da daha az makine ver ve dükkânın malı teslim etmeden önce kaç [[block]] bekleyeceğine karar ver. **Yarıştır** düğmesine birkaç kez bas: payı küçükken gizli zincir neredeyse hiç yetişemez ve beklenen her ek [[block]] bunu daha da seyrekleştirir.`,
        intermediate: `Saldırganın numarası "double spend"tir: birine ödeme yapar, sonra gizlice o ödemenin hiç olmadığı daha uzun bir zincir kurar ve bunu yayımlar. [[node]]'lar en çok iş içeren zinciri izlediğinden gizli zincir, bir [[reorg]] ile herkesin gördüğü zincirin yerini alır.

[[hashrate]]'in yarısından azına sahipse gizli zincir dürüst zincirden yavaş büyür ve arayı kapatma olasılığı her [[confirmation]] ile hızla küçülür. Satıcıların beklemesinin nedeni budur: Bitcoin'de geleneksel ölçü 6 [[confirmation]]'dır.

Yarısından fazlasına sahipse saldırgan er geç her yarışı kazanır. Buna [[51-attack]] denir. Bu saldırı "double spend" yapmaya ve işlemleri sansürlemeye yarar; ama başkasının adresindeki coin'leri çalmaya ya da yoktan coin yaratmaya yaramaz, çünkü her [[node]] kuralları yine de kontrol eder.

**Dene:** saldırganın payını ve [[confirmation]] sayısını ayarla, başarı olasılığını oku. %10 pay ve 6 [[confirmation]] ile yaklaşık %0,02'dir; %30 ile %13; %50'den itibaren kesindir. **Yarıştır** tek bir denemeyi oynatır. Panel ayrıca saldırganın gizlice [[block]] üretirken vazgeçtiği [[block-reward]] gelirini tahmin eder; deneme başarısız olursa bu gelir yanar.`,
        expert: `Yarışı rastgele yürüyüş olarak modelle. Saldırganın payı *q*, dürüst tarafın payı *p = 1 − q* ise *z* [[block]] geriden arayı bir gün kapatma olasılığı *q < p* iken \`(q/p)^z\`, aksi halde 1'dir. Nakamoto'nun makalesi bunu, satıcı beklerken saldırganın kaydettiği ilerlemenin Poisson tahminiyle birleştirir: *q* = %10 iken altı [[confirmation]] sonrasında başarı olasılığı %0,1'in altında kalır. Yani [[proof-of-work]] altında [[finality]] yalnızca olasılıksaldır.

Bir [[51-attack]]'ın iki maliyeti vardır: [[hashrate]] çoğunluğunu ele geçirmek (başka işe yaramayan ASIC'ler ya da küçük zincirlerde kiralık güç) ve saldırı coin'in değerini yok ederse vazgeçilen [[block-reward]] geliri. Kendinden büyük bir zincirle aynı [[hash]] algoritmasını paylaşan küçük zincirler, kiralık güçle defalarca [[reorg]]'a uğratılmıştır.

Kârlı biçimde hile yapmak için çoğunluk da gerekmez. "Selfish mining" (Eyal ve Sirer, 2013) stratejisinde bir [[miner]] bulduğu [[block]]'ları saklar ve dürüst emeği boşa harcatacak anlarda yayımlar. [[hashrate]]'in 1/3'ünün üzerinde, yayılım yarışlarının yarısını kazanabiliyorsa 1/4'ünün üzerinde, payına düşenden fazlasını kazanır. Yani "dürüst çoğunluk" varsayımı "%50"den daha zayıftır.

**Dene:** panel makaledeki formülü hesaplar: \`P = 1 − Σ_{k=0..z} (λ^k e^(−λ) / k!) · (1 − (q/p)^(z−k))\`, burada \`λ = z·q/p\`. *λ* aynı zamanda dürüst zincir *z* [[block]] eklerken saldırganın gizlice bulması beklenen [[block]] sayısıdır; her biri 3,125 BTC artı ücretler üzerinden, başarısız bir denemede çöpe giden gelir budur. Tek bir yarış, baştaki farkı [[block]] [[block]] çeker, sonra saldırganı \`(q/p)^fark\` olasılıkla yetiştirir; çok sayıda denemede kazanma oranı formüle çok yaklaşır (makaledeki Poisson tahmini de bir yaklaşıklıktır).`,
      },
    },
  },
};

export default content;
