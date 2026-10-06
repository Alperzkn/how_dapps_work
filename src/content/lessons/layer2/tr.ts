import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token.
// Chain and product names (Ethereum, Arbitrum, Starknet...) are proper nouns: no quotes.
// Zamana bağlı değerler yaklaşıktır ve "2026 itibarıyla" diye tarihlenir.
// Kontrollerdeki dolar tutarları temsilî olarak 1 ETH = 2.000 $ ve transfer başına 100 bayt varsayar.

const content: LessonContent = {
  labels: {
    l1: 'Ethereum (L1)',
    l2: 'Rollup (L2)',
    dayShort: 'g',
    hourShort: 'sa',
    dayWord: 'gün',
    stepWord: 'adım',
    reset: 'Sıfırla',
    plusDay: '+1 gün',
    plusHour: '+1 saat',
    window: 'İtiraz süresi',

    // step 1
    blockFull: 'block dolu',
    blockUsed: 'block:',
    ofTarget: 'gas hedefine göre',
    leftOut: 'sığmıyor',
    transferCosts: 'bir transfer:',
    baseFee: 'Base fee',
    demand: 'Block alanına talep',
    nextBlock: 'Sıradaki block’u üret',
    tenBlocks: '×10',
    blocksMade: 'Block',
    oneTransfer: 'Bir transfer',
    leftOutStat: 'Dışarıda kalan',
    nobody: 'kimse',

    // step 2
    txsOnL2: 'transaction, L2’de',
    batch: 'batch',
    onL1B: 'veri + sonuç,\nEthereum’da saklanır',
    onL1: 'batch verisi +\nstate root',
    sameOnL1: 'Aynı transfer L1’de',
    eachPays: 'kişi başı:',
    batchSize: 'Batch boyutu',
    gasPrice: 'L1 gas fiyatı',
    batchOnL1: 'Batch’in L1 maliyeti',
    feePerUser: 'Kişi başı L1 ücreti',
    cheaper: 'L1’e göre ucuzluk',
    notCheaper: 'yok',

    // step 3
    sequencer: 'sequencer',
    sequencerOff: 'sequencer çevrimdışı',
    l2Chain: 'L2 block’ları',
    l1Inbox: 'L1 inbox contract’ı',
    seq_idle: 'gönderilmeye hazır',
    seq_stuck: 'cevap yok: takıldı',
    seq_soft: 'sequencer ön onay verdi',
    seq_batched: 'batch L1’e yazıldı',
    seq_final: 'L1’de kesinleşti',
    seq_queued: 'L1 inbox’ında bekliyor',
    seq_included: 'sequencer dahil etmek zorunda kaldı',
    seq_forced: 'sequencer olmadan zorla dahil edildi',
    waited: 'bekleme',
    dataOnL1: 'verisi L1’de',
    dataNotOnL1: 'henüz L1’de değil',
    seqOffline: 'Sequencer çevrimdışı',
    sendViaSeq: 'Sequencer ile gönder',
    sendViaL1: 'L1 üzerinden zorla',
    again: 'Baştan başla',
    wait4h: '4 saat bekle',
    nextStep: 'Sonraki adım',
    txStatus: 'Transaction',
    dataWhere: 'Verisi',
    inboxWait: 'Inbox',
    stOnline: 'çevrimiçi',
    stOffline: 'çevrimdışı',

    // step 4
    rollupContract: 'rollup contract’ı',
    opt_none: 'henüz öneri yok',
    opt_pending: 'state root önerildi',
    opt_disputed: 'itiraz edildi',
    opt_rejected: 'hatalı root reddedildi',
    opt_defended: 'itiraz boşa çıktı: root geçerli',
    opt_finalized: 'kesinleşti',
    opt_badFinal: 'hatalı root kesinleşti: fonlar riskte',
    trace: 'root’un arkasındaki çalıştırma',
    l1Ran: 'L1’in çalıştırdığı adım',
    wasWrong: 'proposer yalan söylemiş',
    wasRight: 'proposer haklıymış',
    oneStepLeft: 'tek adım kaldı:',
    inDispute: 'tartışmalı adımlar:',
    proposer: 'proposer + teminat',
    challenger: 'challenger',
    proposeHonest: 'Doğru root gönder',
    proposeBad: 'Hatalı root gönder',
    challenge: 'İtiraz et',
    bisect: 'İkiye böl',
    runStep: 'Adımı L1’de çalıştır',
    rootStatus: 'Root',
    disputed: 'Tartışma',
    bisections: 'Bölme',

    // step 5
    zkBatch: 'batch',
    prover: 'prover',
    proofMade: 'proof üretildi',
    noProof: 'geçerli proof üretilemez',
    verifier: 'verifier contract’ı',
    dataPosted: 'batch verisi',
    dataAltered: 'veri değiştirilmiş',
    rootClaimed: 'yeni state root',
    rootWrong: 'yanlış state root',
    rootAccepted: 'kabul edildi',
    rootRejected: 'reddedildi',
    zkHonest: 'Dürüst batch',
    zkBadRoot: 'Yanlış state root',
    zkBadData: 'Değiştirilmiş veri',
    zkWhat: 'Operatörün gönderdiği şey',
    proveVerify: 'Kanıtla ve doğrula',
    proofStat: 'Proof',
    l1Says: 'L1 verifier',
    verifyGas: 'Tx başı doğrulama gas’ı ({n} tx)',

    // step 6
    calldataIn: 'calldata: block’ta kalıcı',
    commitmentIn: 'commitment block’ta kalır',
    targetMax: 'hedef 14 · en çok 21 (2026 itibarıyla)',
    blobPruned: 'blob’lar ≈ 18 gün sonra silindi',
    full: 'dolu',
    canDownload: 'yeni node:\nveri erişilebilir',
    cantDownload: 'yeni node: veriyi bir\narşivden almak zorunda',
    perTx: 'kişi başı:',
    modeBlob: 'Blob',
    modeCalldata: 'Calldata',
    postAs: 'Veriyi şöyle yayımla',
    blobPrice: 'Blob fiyatı',
    daysLater: 'Gün',
    blobsUsed: 'Blob · doluluk',
    blobPaid: 'Blob gas fiyatı',
    dataStatus: 'L1’deki veri',
    stPruned: 'silindi',
    stForever: 'kalıcı',
    stAvailable: 'erişilebilir',

    batchShort: 'Batch',
    blobShort: 'Blob',

    // step 7
    zkRollup: 'zk rollup',
    optRollup: 'optimistic rollup',
    arrived: 'L1’de alınabilir',
    left: 'kalan:',
    you: 'sen',
    bridgeContract: 'bridge contract’ı:\ngerçek coin’ler burada',
    upgradeKeys: 'upgrade anahtarları:\nkuralları kim değiştirebilir?',
    startWithdraw: 'İkisinde de çekim başlat',
    restart: 'Baştan başla',
    elapsed: 'Geçen süre',
  },
  steps: {
    scarce: {
      title: 'Ethereum yoğunken neden pahalılaşır?',
      alt: 'Ethereum etiketli bir zemin şeridinde bir block zinciri duruyor. Sıradaki block, talep arttıkça dolan cam bir kutu; yarı yüksekliğindeki çizgi hedefi gösteriyor. Yanında bir paket kuyruğu bekliyor; sığmayanlar kırmızı. Önde bir kişi, ücret arttıkça yükselen bir coin yığınının yanında duruyor.',
      body: {
        beginner: `[[ethereum]]'daki her [[block]]'un sabit bir yeri vardır. Dünyanın dört bir yanındaki binlerce bilgisayar o [[block]]'taki her [[transaction]]'ı yeniden çalıştırır; yer bu yüzden bilerek küçük tutulur. Sıradan insanların zinciri kendi başına denetleyebilmesini sağlayan şey budur.

İçeri girmek isteyenler yerden fazla olduğunda bir yerin fiyatı artar; tıpkı yoğun saatte ücretli yol gibi. Bu fiyatı kimse elle belirlemez. [[block]]'lar yarıdan fazla doluyken kendiliğinden yükselir, daha boşken düşer.

**Dene.** Talep sürgüsünü yükselt ve **Sıradaki block'u üret**'e birkaç kez bas. Cam [[block]]'un dolmasını, dışarıda kalan kırmızı paketleri ve kişinin yanındaki coin yığınını izle: o yığın, basit bir ödemenin şu anki maliyetidir. Sonra talebi %100'ün altına indir ve fiyatın geri düşmesini izle.

[[layer-2]] bunun etrafından dolaşmak için vardır: işi daha ferah bir yerde yap, kalabalık zinciri yalnızca ona gerçekten ihtiyaç duyan şey için kullan.`,
        intermediate: `Ethereum her 12 saniyede bir [[block]] üretir ve her [[block]]'un bir [[gas]] limiti vardır. Limitin nedeni şu: her [[full-node]] her [[block]]'u indirip yeniden çalıştırmak ve büyüyen durumu diskte tutmak zorundadır. Limiti çok yükseltirsen daha az kişi [[node]] çalıştırabilir.

[[block]] alanının fiyatını [[eip-1559]] belirler. Her [[block]]'un, limitin yarısı kadar bir [[gas]] **hedefi** vardır. Bir [[block]] hedeften fazlasını kullanırsa sonraki [[block]]'un "base fee"'si en çok %12,5 artar; azını kullanırsa en çok %12,5 düşer. Art arda on dolu [[block]], yani iki dakika, ücreti kabaca üçe katlar.

Basit bir transfer 21.000 [[gas]] kullanır; bir token takası bunun birkaç katını. Bu yüzden aynı işlemin [[gas-fee]]'si sakin bir saat ile yoğun bir saat arasında kat kat değişebilir.

**Dene.** Talebi %200'ün üzerine çıkar ve [[block]] üret: [[block]] dolar, talebin bir kısmı sığmaz ve "base fee" her seferinde %12,5 tırmanır. Tam %100'de yerinde durur. Gerçekte yükselen ücret, [[block]]'lar yeniden yarı dolu olana kadar kullanıcıları kendiliğinden uzaklaştırır; burada mekanizmayı görebilmen için talep senin bıraktığın yerde kalır. Dolar değerleri temsilî olarak 1 ETH = 2.000 $ varsayar.`,
        expert: `"Base fee" güncelleme kuralı \`base_fee' = base_fee · (1 + (gas_used − gas_target) / gas_target / 8)\` şeklindedir; \`gas_target = gas_limit / 2\` (esneklik çarpanı 2, değişim paydası 8). Bu üstel bir denetleyicidir: süregelen talep fazlası, marjinal kullanıcılar fiyat yüzünden dışarıda kalana kadar [[block]] başına %12,5 bileşik büyür. Üzerine eklenen "priority fee" ise sıralama için ayrı bir açık artırmadır.

Limiti sınırlayan tek bir kaynak değil, birkaç kaynaktır: 12 saniyelik bir [[slot]] içinde [[block]]'un yayılması, mütevazı donanımda en kötü durumdaki çalıştırma süresi, durumun büyümesi ve geçmişin büyümesi. Hepsinin bedelini her [[full-node]] öder; limitin yalnızca küçük, sınanmış adımlarla artırılmasının nedeni budur.

Yani L1'de çalıştırma, bilerek kıt tutulan bir maldır. Ethereum'un seçtiği ölçekleme stratejisi, taban katmanı doğrulanabilir tutup onu başka sistemlerin üzerine kurabileceği iki şey olarak sunmaktır: **"settlement"** (zincir dışındaki hangi durumun geçerli sayılacağına karar veren, L1'deki bir contract) ve **[[data-availability]]** (o durumu denetlemek için gereken verinin yayımlandığına dair güvence). Bir [[rollup]] ikisini de satın alır; bu dersin geri kalanı tam olarak ne satın aldığını ve hâlâ hangi konularda güven gerektirdiğini anlatıyor.

**Dene.** Panel, talebinin ürettiği doluluk oranına gerçek güncelleme kuralını uygular. Hedefin %200'ünü aşan talep, ücreti dolu bir [[block]]'un yükselttiğinden hızlı yükseltemez; yalnızca kuyruğu uzatır.`,
      },
    },
    rollup: {
      title: '"Rollup" fikri: başka yerde hesapla, burada yayımla',
      alt: 'İki zemin şeridi var: arkada Ethereum, önde rollup. Rollup üzerindeki bir ızgara dolusu paket tek bir sandığa sıkıştırılıyor; bir ok onu Ethereum’daki bir block’a taşıyor. O block’un yanında küçük bir veri kutusu, üstünde bir state root duruyor. Sağda iki sütun, Ethereum’daki tek bir transferin maliyetini bir kullanıcının batch’teki payıyla karşılaştırıyor.',
      body: {
        beginner: `[[rollup]], fişlerini Ethereum'da saklayan ayrı ve daha hızlı bir zincirdir.

Kalabalık bir akşam yemeğini düşün. Herkes garsona ayrı ayrı ödeme yapmak yerine bir kişi bütün siparişleri toplar, tek hesap öder ve masa bu hesabı bölüşür. Restoran yirmi ödeme yerine tek ödemeyle uğraşır.

[[rollup]] aynı şeyi [[transaction]]'larla yapar. Yüzlercesini kendi zincirinde, yani [[layer-2]]'de çalıştırır, hepsini "batch" denen tek bir pakete sıkıştırır ve bu paketi, sonucun kısa bir parmak iziyle birlikte Ethereum'a yazar. Ethereum işi baştan yapmaz. Yalnızca paketi saklar; böylece isteyen herkes sonradan denetleyebilir.

**Dene.** **Batch boyutu** sürgüsünü oynat. "Batch"'te bir [[transaction]] de olsa bin [[transaction]] da olsa Ethereum'a yazmanın maliyeti neredeyse aynıdır; bu yüzden "batch" büyüdükçe her kullanıcının payı küçülür. Yeşil sütunu maviyle karşılaştır: mavi, aynı ödemenin doğrudan Ethereum'da gönderilmiş hâlidir.`,
        intermediate: `[[rollup]], **çalıştırmayı** [[layer-1]]'in dışına taşır ve orada iki şey bırakır:

- her "batch"'in sıkıştırılmış **[[transaction]] verisi**; böylece herkes operatöre sormadan [[rollup]]'ın durumunu yeniden hesaplayabilir;
- ortaya çıkan duruma dair bir **"commitment"**, yani bir "state root" (Ethereum [[block-header]]'ının taşıdığı türden bir [[merkle-root]]); böylece L1'deki bir contract [[rollup]]'ın ne iddia ettiğini bilir.

Veri Ethereum'da olduğu için [[rollup]]'ın geçmişini yeniden yazmak Ethereum'unkini yazmak kadar zordur. "Commitment" Ethereum'da olduğu için oradaki bir contract yatırılan parayı tutabilir ve yalnızca [[rollup]]'ın gerekçelendirebildiği bir duruma karşılık serbest bırakır. Gerekçelendirmenin nasıl yapıldığı, sonraki adımlardaki iki aileyi birbirinden ayırır: [[optimistic-rollup]]'lar ve [[zk-rollup]]'lar. 2026 itibarıyla bilinen örnekler: "optimistic" tarafta OP Mainnet, Base ve Arbitrum One; "zk" tarafta ZKsync Era, Starknet, Scroll ve Linea.

Kullanıcının ücreti iki parçadan oluşur: [[rollup]]'taki çalıştırma için küçük bir ücret ve "batch"'in L1'deki maliyetinden bir pay. L1 kısmının sabit bir parçası vardır ("batch" [[transaction]]'ının kendisi ve varsa "proof"); bu parça "batch"'teki herkese bölünür.

**Dene.** **Batch boyutu**'nu 1'den 1.000'e çıkar ve **Kişi başı L1 ücreti**'ni oku. Tek [[transaction]]'la [[rollup]] L1'den pahalıdır; bin tanesiyle yüzlerce kat ucuzdur. Sonra **L1 gas fiyatı**'nı yükselt: iki sütun da büyür ama kullanıcının payı küçücük kalır. Değerler transfer başına yaklaşık 100 bayt ve 1 ETH = 2.000 $ varsayar; ikisi de temsilîdir.`,
        expert: `Tanımlayıcı özellik şudur: L2 durumu, L1'deki verinin deterministik bir fonksiyonudur. Bir [[rollup]] [[node]]'u \`derive(L1 chain) → L2 chain\` çalıştırır: "batch"'leri (ve L1 kaynaklı "deposit"'leri) L1 sırasıyla okur, açar ve [[rollup]]'ın durum geçiş fonksiyonuyla çalıştırır. Durumu yeniden kurmak ya da doğrulamak için operatörden gelen hiçbir mesaja gerek yoktur. [[transaction]] verisi başka bir yerde yayımlanıyorsa o sistem [[rollup]] değil, "validium" ya da "optimium"'dur ve güven modeli farklıdır.

L1'e yazılan şey bir **"state root"** ya da onu saran bir değerdir. OP Stack'te önerilen değer bir **"output root"**'tur: \`keccak256(version ‖ state_root ‖ withdrawal_storage_root ‖ latest_block_hash)\`. "State root" hesaplarla ilgili kanıtlar içindir; L2'den L1'e mesaj contract'ının "storage root"'u çekimlerin ucuza kanıtlanabilmesi içindir; [[block]] [[hash]]'i de [[block]]'u sabitler. [[zk-rollup]]'lar kanıtlanan her "batch" için bir "state root" ile birlikte, "proof"'un "public input" olarak aldığı "batch" verisine dair bir "commitment" yazar.

"Batch" başına maliyet modeli: "batch" [[transaction]]'ı için \`21.000\` [[gas]]; ya [[calldata]] olarak (çalıştırma [[gas]]'ı) ya da [[blob]] olarak ("blob gas", ayrı bir piyasa, 6. adım) fiyatlanan veri; ayrıca "zk proof"'lar için doğrulama [[gas]]'ı ya da "optimistic" sistemlerde önerilerin yayılmış maliyeti. Kullanıcı başına: \`(sabit + veri) / N\` ve buna ek olarak [[sequencer]]'ın belirleyip kendine aldığı L2 çalıştırma ücreti.

**Dene.** Panel, her biri 100 bayt olan \`N\` transferlik bir "batch"'i fiyatlar. [[blob]]'lar bütün olarak satın alınır (131.072 bayt); bu yüzden kişi başı ücret, [[blob]] yaklaşık 1.310 transferde dolup ikincisi gerekene kadar \`1 / N\` olarak düşer: 1.000'den 2.000'e geç, "batch" maliyeti sıçrar.`,
      },
    },
    sequencer: {
      title: '"Sequencer" ve onun etrafından dolaşmanın yolu',
      alt: 'Rollup şeridinde solda bir kullanıcı, ortada sequencer etiketli bir makine, sağda kısa bir L2 block zinciri duruyor. Ethereum şeridinde bir inbox contract’ı ve bir block var. Düz oklar sequencer üzerinden giden olağan yolu gösteriyor; ikinci bir ok çifti kullanıcıdan Ethereum’daki inbox contract’ına, oradan da L2 zincirine uzanıyor. Bir paket, transaction o anda neredeyse orada duruyor.',
      body: {
        beginner: `Bir [[rollup]]'ta birinin [[transaction]]'ları toplaması, sıraya koyması ve paketleri Ethereum'a göndermesi gerekir. O kişi [[sequencer]]'dır.

Çok hızlı bir kasiyer gibi çalışır. [[transaction]]'ını verirsin, bir iki saniye içinde cevap alırsın: "tamam". Bu cevap bir sözdür. [[transaction]]'ını içeren paket Ethereum'a yazıldığında gerçeğe dönüşür.

Bugün çoğu [[rollup]]'ın, tek bir şirketin işlettiği tek bir kasiyeri var. Peki bozulursa ya da sana hizmet vermeyi reddederse? Bir arka kapı var: [[transaction]]'ını doğrudan Ethereum'daki bir contract'a verebilirsin. [[rollup]]'ın kuralları, o gelen kutusundaki her şeyin kasiyer olsa da olmasa da dahil edilmesinin **zorunlu** olduğunu söyler.

**Dene.** Bir [[transaction]] gönder ve olağan yolu adım adım izle. Sonra **Sequencer çevrimdışı** kutusunu işaretleyip yeniden gönder: hiçbir şey olmaz. Şimdi **L1 üzerinden zorla**'ya bas ve bekle: süre dolunca [[transaction]] yine de [[rollup]]'ın parçası olur.`,
        intermediate: `[[sequencer]], [[transaction]]'ları alır, sıralar, çalıştırır ve genellikle bir iki saniyede bir, hatta daha sık L2 [[block]]'ları üretir. Sana hemen bir **ön onay** ("soft confirmation") verir. Birkaç dakikada bir "batch"'leri Ethereum'a yazılır; o andan sonra sıra L1 tarafından sabitlenmiştir ve o L1 [[block]]'u [[finality]]'ye ulaştığında (yaklaşık 13 dakika) senin [[transaction]]'ın da kesinleşir.

2026 itibarıyla büyük [[rollup]]'ların çoğu, arkasındaki ekibin ya da vakfın işlettiği **tek bir [[sequencer]]** çalıştırıyor. Bu, üç gücü tek elde toplar: çevrimdışı kalabilir, [[transaction]]'ını geciktirebilir ya da görmezden gelebilir ve [[transaction]]'ların sırasını o seçer. "Proof" sistemi çalışıyorsa yapamayacağı şeyler ise şunlardır: sahte [[transaction]] üretmek, fon çalmak ya da L1'e yazılmış olanı değiştirmek.

İlk ikisine karşı savunma **"forced inclusion"**'dır. [[transaction]]'ını L1'deki bir contract'a gönderirsin. OP Stack zincirlerinde bu [[transaction]]'ın 12 saatlik bir pencere içinde dahil edilmesi zorunludur; Arbitrum One'da 24 saat sonra herkes onu zorla dahil ettirebilir. L1 [[gas]]'ı öder ve yavaştır, ama [[sequencer]]'ın bir kapı bekçisi değil, bir kolaylık olduğu anlamına gelir.

**Dene.** [[sequencer]] çevrimiçiyken gönder ve ilerle: ön onay, L1'e yazıldı, kesinleşti. **Verisi** değerine dikkat et: ön onay L1'de değildir. Sonra **Sequencer çevrimdışı**'nı işaretle, gönder (takılır), **L1 üzerinden zorla**'ya ve üç kez **4 saat bekle**'ye bas. Beklerken kutunun işaretini kaldır: geri dönen [[sequencer]]'ın [[transaction]]'ı erkenden dahil ettiğini görürsün; buna mecburdur.`,
        expert: `OP Stack'te "batcher", L2 [[block]]'larını "channel"'lara sıkıştırır, "frame"'lere böler ve bunları [[calldata]] ya da [[blob]] olarak bir "batch inbox" adresine yollar; hiçbir contract mantığı çalışmaz. Her [[rollup]] [[node]]'undaki "derivation pipeline", bu "frame"'leri ve \`OptimismPortal\`'ın \`TransactionDeposited\` olaylarını L1 sırasıyla okur. Her L2 [[block]]'u bir L1 "origin"'ine (kendi "epoch"'una) aittir ve o "origin"'in "deposit"'lerini içermek zorundadır; bir "epoch"'a ait "batch", ancak **"sequencing window"** (3.600 L1 [[block]]'u, 12 saat) içinde L1'e ulaşırsa geçerlidir. Hiçbiri ulaşmazsa [[node]]'lar yalnızca "deposit"'leri içeren [[block]]'lar türetir. "Forced inclusion" işte bu kuraldır: hiçbir taraf onu engelleyemez. Zincirin uçları *unsafe* ([[sequencer]] [[gossip]]'inden), *safe* (L1 verisinden türetilmiş) ve *finalized* (kesinleşmiş L1'den türetilmiş) olarak izlenir.

Arbitrum aynı fikri farklı böler: [[sequencer]] \`SequencerInbox\`'a yazar; herkes gecikmeli \`Inbox\`'a mesaj koyabilir ve gecikmeden sonra (Arbitrum One'da 24 saat) herkes \`forceInclusion\` çağırabilir. İki tasarım da hızlı yolun "liveness"'ını değil, gecikmeli bir sansür direncini sağlar: zamanında [[transaction]]'a bağımlı uygulamalar (likidasyonlar, "oracle" güncellemeleri) bir kesinti sırasında açıkta kalır.

Geriye sıralama gücü kalır; tek [[sequencer]]'ın yerine ne konacağı hâlâ açık bir tasarım alanıdır. **"Shared sequencing"**'te birkaç [[rollup]] tek bir dış [[sequencer]] kümesi kullanır; bu, [[rollup]]'lar arası atomik sıralama sağlar ama yeni bir güvenilen bileşen getirir. **"Based sequencing"** sıralamayı doğrudan L1 [[proposer]]'larına bırakır (Taiko bir örnektir); L1'in "liveness"'ını ve tarafsızlığını devralır, ama "preconfirmation" eklenmedikçe 12 saniyelik ritmini de. Kendi [[consensus]]'u olan, dönüşümlü ya da [[stake]]'li [[sequencer]] kümeleri üçüncü bir yoldur.

**Dene.** Paneldeki durum makinesi: \`send\` için [[sequencer]] gerekir; \`force\` L1'e yazar ve 12 saatlik bir sayaç başlatır; süre dolunca [[transaction]] her durumda zincire türetilir.`,
      },
    },
    optimistic: {
      title: '"Optimistic rollup": biri hileyi kanıtlamadıkça kabul',
      alt: 'Ethereum şeridinde bir contract, önerilen state root’u temsil eden bir block’un yanında duruyor; ardından itiraz süresinin her günü için biri yanan yedi plaka geliyor. Rollup şeridinde sıra hâlindeki on altı küçük kutu, çalıştırmanın adımlarını temsil ediyor; bir anlaşmazlık sırasında tartışmalı aralık turuncu oluyor ve her turda yarıya iniyor. Bir uçta coin yığınıyla bir proposer, diğer uçta bir challenger duruyor.',
      body: {
        beginner: `Ethereum, [[rollup]]'ın sonuç için verdiği parmak izinin dürüst olduğunu nereden bilir? [[optimistic-rollup]] güvenmeyi seçer, ama bir şartla.

Sonucu gönderen kişi bir teminat da yatırır. Sonra bir saat çalışmaya başlar; genellikle bir hafta kadar. Bu süre içinde herkes "bu sonuç yanlış, gösterebilirim" diyebilir. Haklıysa sonuç çöpe atılır ve yalan söyleyen teminatını kaybeder. Süre dolmadan kimse itiraz etmezse sonuç geçerli sayılır.

Belediye panosuna asılan bir ilan gibi: biri itiraz dilekçesi vermezse yedi gün sonra yürürlüğe girer. İzleyen tek bir dürüst kişi yeter.

**Dene.** **Hatalı root gönder**'e, sonra **İtiraz et**'e bas ve basmaya devam et: iki taraf tartışmayı yarıya indire indire tek bir adıma kadar daraltır, Ethereum da yalnızca o adımı denetler. Hatalı sonuç reddedilir. Sonra bir hatalı root daha gönder ve itiraz etmeden yedi kez **+1 gün**'e bas: kimse izlemedi, yanlış sonuç kesinleşti.`,
        intermediate: `[[optimistic-rollup]]'ta bir "proposer", L1'deki bir contract'a bir "state root" yazar ve bir teminat yatırır. Bu "root" **geçerli varsayılır** ve bir itiraz süresine girer: OP Stack zincirlerinde 7 gün, Arbitrum One'da yaklaşık 6,4 gün (2026 itibarıyla).

Süre boyunca, "batch"'i yeniden çalıştırıp farklı bir sonuç bulan herkes bir anlaşmazlık açabilir. Anlaşmazlığı bir [[fraud-proof]] çözer ve **ikiye bölme** ("bisection") sayesinde bu L1 için ucuzdur: iki taraf tartışmalı çalıştırmayı tekrar tekrar ikiye böler ve hâlâ nerede ayrıştıklarını söyler. Logaritmik sayıda turdan sonra tek bir adım kalır. L1 o tek adımı kendisi çalıştırır ve kimin yanıldığını görür. Kaybedenin teminatı kazanana geçer.

Güvenlik varsayımı alışılmadık ve güçlüdür: **dürüst ve çevrimiçi tek bir doğrulayıcı yeter**. Kaç [[validator]]'ın iş birliği yaptığı önemli değildir; yazılımı çalıştıran ve itiraz etmeye istekli tek bir taraf sistemi dürüst tutar. Bedeli zamandır: "root"'a bağlı hiçbir şey, özellikle de L1'e çekimler, süre dolmadan tamamlanamaz.

İki büyük "optimistic" yığının da ana ağda herkesin kullanabildiği "fraud proof"'ları var (OP Stack zincirlerinde 2024'ten, Arbitrum One'da BoLD protokolüyle 2025'ten beri).

**Dene.** Hatalı bir root gönder ve itiraz et: 16 adım için 4 bölme ve L1'de çalıştırılan tek bir adım gerekir. Doğru bir root gönder ve ona itiraz et: bu kez "challenger" kaybeder. Sonra hatalı bir root'u itirazsız 7 gün beklet ve durumu oku.`,
        expert: `Bir [[fraud-proof]] oyunu, iki tarafın ve L1'in üzerinde anlaştığı deterministik bir VM gerektirir. "Bu output root şundan çıkar" iddiası o VM'in bir çalıştırma izine ("execution trace") açılır; taraflar iz durumlarına "commit" eder ve \`n\` adım için \`⌈log₂ n⌉\` turda, aralarında tek bir komut bulunan, üzerinde anlaşılan bir ön durum ile tartışmalı bir son duruma kadar ikiye böler. L1 daha sonra o komutu, Merkle kanıtıyla verilen bir bellek ve durum parçası üzerinde çalıştırır.

OP Stack'te "fault dispute game" önce iki "output root" arasındaki L2 [[block]] numaraları üzerinde, sonra türetme ve çalıştırma programını koşturan MIPS tabanlı bir VM'in (Cannon) izi üzerinde ikiye böler; tek adımı L1'deki bir MIPS yorumlayıcı contract'ı çalıştırır, veriyi de bir "preimage oracle" sağlar. Hamleler teminat taşır ve her tarafın 3,5 günlük bir satranç saati vardır; bu, bir oyunu yaklaşık 7 günle sınırlar. Arbitrum, [[node]]'unu WebAssembly'den türetilmiş bir komut kümesine (WAVM) derler ve tek adımı \`OneStepProver\` contract'larında kanıtlar; BoLD protokolü bütün rakip iddiaları tek bir turnuvada koşturur. Böylece parası bol bir saldırgan, anlaşmazlıkları birbiri ardına açarak onayı süresiz geciktiremez; önceki bire bir tasarım buna izin veriyordu.

Önemli uç durumlar: "proof" ancak VM ve onun tek adımının L1'deki gerçeklemesi kadar sağlamdır (oradaki bir hata [[consensus]] hatasıdır); izi kurabilmek için verinin herkese açık olması gerekir (6. adım); "challenger"'ların teminat ve L1 [[gas]]'ı için sermayeye ihtiyacı vardır ve süre içinde L1'e [[transaction]] yazdırabilmeleri gerekir, yani L1'in bir hafta boyunca sansürlenmesi modeli bozar; ayrıca çoğu kurulum müdahale edebilen bir "Security Council" tutar; son adımdaki "stage"'lerin ölçtüğü tam olarak budur.

**Dene.** Panel, 16 adımlık bir izi SHA-256 ile [[hash]]'ler ve dürüst olmayan tarafa, tek bir adımda sapan ve yanlış durumdan tutarlı biçimde devam eden bir iz verir; gerçek bir hilecinin izi de böyle olurdu. İkiye bölme, iki izin orta noktadaki durumlarını karşılaştırır.`,
      },
      code: {
        lang: 'Python (bisection, sadeleştirilmiş)',
        source: `def dispute(proposer, challenger, n_steps, run_one_step):
    lo, hi = 0, n_steps          # state[lo]'da anlaşma, state[hi]'da anlaşmazlık
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if proposer.state(mid) == challenger.state(mid):
            lo = mid             # anlaşmazlık üst yarıda
        else:
            hi = mid             # ...ya da alt yarıda
    # Tek komut kaldı. Onu L1 kendisi çalıştırır.
    correct = run_one_step(proposer.state(lo), step=hi)
    return "proposer" if correct == proposer.state(hi) else "challenger"

# 2**40 adım için yalnızca 40 tur gerekir; L1 hiçbir zaman birden fazla adım çalıştırmaz.`,
      },
    },
    zk: {
      title: '"ZK rollup": sayılmadan önce kanıtla',
      alt: 'Rollup şeridinde küçük bir paket grubu prover etiketli bir makineye giriyor. Parlayan küçük bir top, yani proof, Ethereum şeridindeki verifier contract’ına gidiyor; bu contract, yayımlanan batch verisinin kutusu ile yeni state root’u temsil eden block’un arasında duruyor. Proof kabul edilince block yeşile dönüyor, reddedilince kırmızı olup devriliyor.',
      body: {
        beginner: `[[zk-rollup]] kimseden nöbet tutmasını istemez. Ethereum'a bir **kanıt** gönderir.

Kocaman bir toplama işlemini, yalnızca sonuç doğruysa üretilebilen bir damgayla birlikte teslim ettiğini düşün. Öğretmen işlemi baştan yapmaz; işlem ne kadar uzun olursa olsun damgayı kontrol etmek bir an sürer. Sonuç yanlış olsaydı o damga üretilemezdi.

O damga bir [[validity-proof]]'tur. [[rollup]] [[transaction]]'ları çalıştırır, güçlü bir bilgisayar kanıtı üretir, Ethereum'daki küçük bir program da onu kontrol eder. Ethereum yeni sonucu ancak o zaman kabul eder. Bir haftalık bekleme yoktur, çünkü itiraz edilecek bir şey kalmamıştır.

**Dene.** Dürüst bir "batch" ile **Kanıtla ve doğrula**'ya bas: kabul edilir. Sonra **Yanlış state root**'u seç (operatör kendine para yazmaya çalışıyor) ve yeniden çalıştır: geçerli bir kanıt üretilemez, Ethereum girişimi reddeder. **Değiştirilmiş veri**'yi seç: kanıt gerçektir ama yayımlanan veriyle uyuşmaz; o da başarısız olur.`,
        intermediate: `[[zk-rollup]] her "batch" için L1'e üç şey yazar: "batch" verisi, yeni "state root" ve bir [[validity-proof]]; yani "bu veriyi eski durum üzerinde çalıştırmak yeni durumu verir" önermesinin kısa bir kriptografik kanıtı. Bir "verifier" [[smart-contract]]'ı kanıtı kontrol eder; [[rollup]]'ın contract'ı "state root"'unu yalnızca kanıt geçerse günceller.

Bunu iki özellik mümkün kılar. Kanıt **"succinct"**'tir: kaç [[transaction]]'ı kapsarsa kapsasın küçüktür ve doğrulaması ucuzdur (birkaç yüz bin [[gas]] mertebesinde; ethereum.org yaklaşık 500.000 der). Ve **"sound"**'dur: kriptografiyi kırmadan kimse yanlış bir önerme için kanıt üretemez.

Böylece güven varsayımı değişir. "Optimistic" bir [[rollup]] dürüst bir gözcüye ve bir haftaya ihtiyaç duyar; "zk" bir [[rollup]] matematiğin ve "verifier" kodunun doğru olmasına ihtiyaç duyar ve kanıt doğrulanır doğrulanmaz L1'de kesindir. Çekimler bir itiraz süresi beklemez.

Maliyet "prover"'a kayar. Bir kanıt üretmek, [[transaction]]'ları çalıştırmaktan çok daha fazla hesaplama ister; genellikle GPU'lu makine kümelerinde yapılır ve bir "batch" ile kanıtı arasına dakikalardan saatlere varan bir gecikme koyar (2026 itibarıyla; düşmeye devam ediyor).

**Dene.** Üç durumu da çalıştır ve iki durum değerini ayrı ayrı oku: bir kanıtın *üretilip üretilemediği* ve L1 "verifier"'ının *ne dediği*. Son değer, sabit doğrulama [[gas]]'ını 2. adımdaki "batch" boyutuna böler. Gösterim, kanıtın yerine bir [[hash]] kullanır, çünkü gerçek bir "prover" tarayıcıda çalıştırılamayacak kadar ağırdır; uyguladığı kural ise gerçektir.`,
        expert: `Kanıtlanan önerme \`STF(pre_state_root, batch) = post_state_root\`'tur; "root"'lar ve "batch" verisine dair bir "commitment" "public input"'tur. Kanıtı *yayımlanan* veriye bağlamak önemlidir: veri [[blob]]'lara konduğunda devre "batch"'e "commit" eder, contract da bunu [[blob]]'un "versioned hash"'ine bağlar; tipik olarak "point-evaluation precompile" ile kontrol edilen bir KZG açılımıyla.

Üst düzeyde iki kanıt ailesi vardır:

- **SNARK**'lar (Groth16, KZG "commitment"'lı PLONK ailesi): birkaç yüz baytlık kanıtlar, bir avuç "pairing" ile doğrulama, L1'de ucuz. Çoğu bir "trusted setup" (devre başına ya da evrensel) ister ve kuantum sonrası dayanıklı olmayan eliptik eğri varsayımlarına dayanır.
- **STARK**'lar (FRI tabanlı): şeffaf, [[hash]] tabanlı ve kuantum sonrası için makul; küçük cisimler üzerinde hızlı "prover"'lar. Ama kanıtlar onlarca ila yüzlerce kilobayttır ve L1'de doğrulaması daha pahalıdır.

Canlıdaki sistemler bunları karıştırır: çalıştırmayı STARK tarzı bir sistemle kanıtla, özyinelemeli biçimde birleştir ve L1'de ucuz doğrulama için sonucu bir SNARK'a sar; ya da Starknet'in yaptığı gibi STARK'ları doğrudan doğrula. Tasarımlar neyi kanıtladıklarına göre de ayrışır: doğrudan [[evm]] için bir devre (farklı eşdeğerlik derecelerinde bir "zkEVM"), derleyicisi olan farklı bir VM ya da normal bir istemciyi çalıştıran genel amaçlı bir "zkVM".

Maliyetler: "prover" işi yerel çalıştırmanın kat kat üzerindedir; paralelleştirilebilir ama pahalıdır. "Batch"'ten doğrulanmış kanıta kadar geçen süre 2026 itibarıyla dakikalardan saatlere değişir. Bu yüzden operatörler birçok "batch"'i tek bir kanıt altında toplar ve sabit L1 doğrulama maliyetini yayar. "Soundness" hataları felaket niteliğindeki arıza biçimidir ve onları yakalayacak bir itiraz süresi yoktur; bazı ekiplerin birbirinden bağımsız birkaç "prover" çalıştırmasının ve "upgrade" anahtarlarının hâlâ var olmasının nedeni budur (son adım). "Prover"'ın "liveness"'ı ayrı bir kaygıdır: kanıt gelmezse zincir kesinleşemez; "escape hatch"'ler bunu ele alır.

**Dene.** Gösterimdeki "proof", "public input"'lar üzerinde alınan \`SHA-256\`'dır ve yalnızca yeniden çalıştırma iddia edilen "root"'la uyuşuyorsa verilir; \`verify\` onu yeniden hesaplar. Bu, "soundness"'ı ve "public input"'lara bağlanmayı taklit eder; "succinctness"'ı ya da "zero knowledge"'ı değil.`,
      },
    },
    blobs: {
      title: '"Data availability" ve "blob"\'lar',
      alt: 'Ethereum şeridinde bir block, yirmi bir yuvalık bir sıranın yanında duruyor; on dördüncüden sonraki çizgi hedefi gösteriyor. Blob kutuları ilk yuvaları, batch’in ihtiyacı kadar dolduruyor. Calldata modunda yuvalar boş; veri bunun yerine block’un üstünde parlayan bir kutu olarak duruyor. On sekiz günden fazla geçince blob’lar soluklaşıyor, block’un üzerindeki küçük commitment etiketi ise kalıyor. Rollup şeridinde bir ızgara dolusu paket batch’i, bir kişi de veriyi indirmeye çalışan yeni bir node’u temsil ediyor.',
      body: {
        beginner: `[[rollup]]'ın işini denetlemek için yalnızca sonuç yetmez, ham [[transaction]]'lar da gerekir. Operatör onları gizli tutsaydı kimse sonucun dürüst olup olmadığını söyleyemez, kimse neye sahip olduğunu kanıtlayamazdı. Verinin herkesin ulaşabileceği bir yerde yayımlandığından emin olmaya [[data-availability]] denir.

[[rollup]]'lar veriyi Ethereum'da yayımlar. Başta bunu sıradan [[transaction]]'ların içine yazıyorlardı; bu pahalıdır, çünkü Ethereum o veriyi sonsuza kadar saklar. 2024'ten beri tam bu iş için yapılmış daha ucuz bir alan var: [[blob]].

[[blob]], [[block]]'un yanındaki bir kargo dolabı gibidir. Paket yaklaşık 18 gün durur; bu, herkesin onu alıp denetlemesine yetecek kadar uzundur. Sonra dolap boşaltılır. Paketin kısa bir parmak izi ise [[block]]'ta kalıcı olarak durur.

**Dene.** **Blob** ile **Calldata** arasında geçiş yap ve kişi başı ücreti karşılaştır. **Gün** sürgüsünü 18'in ötesine götür: [[blob]]'lar solar, parmak izi kalır. **Blob** fiyat sürgüsünü yükselt; [[blob]] alanının sıradan [[gas]]'tan ayrı, kendine ait bir fiyatı olduğunu göreceksin.`,
        intermediate: `[[data-availability]], bir "state root"'un arkasındaki verinin gerçekten yayımlandığının güvencesidir. O olmadan bir [[optimistic-rollup]]'a itiraz edilemez (kimse durumu yeniden hesaplayamaz) ve hiçbir [[rollup]]'ın kullanıcıları çıkış için bakiyelerini kanıtlayamaz. [[rollup]]'ın verisini L1'e koymasının nedeni budur.

Mart 2024'e kadar bu, [[calldata]] demekti: normal bir [[transaction]]'ın içindeki baytlar; sıradan [[gas]] ile ödenir ve her [[node]] tarafından sonsuza kadar saklanır. EIP-4844, [[blob]]'ları ekledi:

- bir [[blob]], 32 baytlık 4.096 "field element"'tir; yaklaşık 128 kB;
- [[blob]]'lar [[block]]'un yanında taşınır; [[evm]] onları okuyamaz, yalnızca her birine ait bir "commitment"'ın [[hash]]'ini görür;
- [[node]]'lar onları yaklaşık 18 gün saklamak zorundadır, sonra silebilir;
- **"blob gas"** ile fiyatlanırlar: kendi "base fee"'si olan ayrı bir ücret piyasası. [[block]]'lar hedeften fazla [[blob]] taşıdığında yükselir, az taşıdığında düşer.

[[block]] başına hedef ve üst sınır 3 ve 6 olarak başladı, 2025'te 6 ve 9 oldu, Ocak 2026'dan beri 14 ve 21 (2026 itibarıyla; bu değerler artık küçük, bu işe özel "fork"'larla yükseltilebiliyor).

Silmek neden kabul edilebilir? Verinin, herkesin indirip denetleyebileceği ve itiraz edebileceği kadar uzun süre açık olması yeter. Ondan sonra [[rollup]] [[node]]'ları ve arşivler onu tutar; L1'deki "commitment" de herkesin bir kopyayı doğrulamasını sağlar.

**Dene.** **Blob** modunda **Batch**'i 1.000 yap: transferler tek bir [[blob]]'u %76 doldurur; 2.000 transfer iki [[blob]] ister. **Blob** fiyatını bütün aralığında gezdir (1 wei ile 100 gwei arası): [[blob]]'lara talep azken veri neredeyse bedavadır; en üst uçta ise çoğu boş bir [[blob]]'a konan küçük bir "batch", [[calldata]]'dan pahalıya gelir. 2025'in sonundan beri [[blob]] fiyatı, sıradan "base fee"'nin on altıda birinin altına indiğinde düşmeyi de bırakıyor; bunu **Blob gas fiyatı** değerinde görebilirsin.`,
        expert: `Bir [[blob]], BLS12-381 skaler cismi üzerinde derecesi 4096'dan küçük bir polinomdur ve KZG ile "commit" edilir. [[transaction]] (tip \`0x03\`) \`blob_versioned_hashes\` taşır; her biri \`0x01 ‖ sha256(commitment)[1:]\`'dir. [[blob]]'lar, "commitment"'lar ve "proof"'lar [[consensus]] katmanında bir "sidecar" içinde dolaşır. Contract'lar [[hash]]'e \`BLOBHASH\` [[opcode]]'uyla ulaşır ve \`0x0A\` adresindeki "point-evaluation precompile" ile (50.000 [[gas]]) bir \`p(z) = y\` değerlendirmesini ona karşı kontrol edebilir. Bir [[zk-rollup]] devresinin bu [[blob]]'un içeriğini tükettiğini böyle kanıtlar; bir [[optimistic-rollup]]'ın "fault proof"'u da [[blob]] verisini "preimage oracle"'ı üzerinden böyle yükler.

Fiyatlama: her [[blob]] \`GAS_PER_BLOB = 2¹⁷\` "blob gas" tüketir. "Header", hedefin üzerindeki kullanımın birikimli toplamı olan \`excess_blob_gas\`'ı izler ve \`base_fee_per_blob_gas = MIN · e^(excess_blob_gas / UPDATE_FRACTION)\` olur: [[eip-1559]] gibi üstel bir denetleyici, tabanı 1 wei. Hedef, üst sınır ve "update fraction" "fork" başına belirlenen parametrelerdir. EIP-7918 (Fusaka, 2025 sonu) bir rezerv fiyat ekler: \`BLOB_BASE_COST · base_fee_per_gas > GAS_PER_BLOB · base_fee_per_blob_gas\` iken (\`BLOB_BASE_COST = 2¹³\`) "excess" artık azalmaz; yani [[blob]] ücreti, çalıştırma "base fee"'sinin en az 1/16'sını izler. Bu arada veri ağırlıklı [[transaction]]'lar için [[calldata]] pahalandı: EIP-7623 (2025), "calldata token"'ı başına 10 [[gas]]'lık bir taban koyar; yani standart oranın 16 olduğu yerde sıfır olmayan bayt başına 40 [[gas]].

Saklama süresi \`MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS = 4096\` [[epoch]]'tur: 4096 × 32 × 12 sn ≈ 18,2 gün. Kapasiteyi [[node]]'ların indirebildiği miktar sınırlar; Fusaka'dan beri PeerDAS (EIP-7594), [[node]]'ların [[blob]]'ların tamamı yerine "erasure coding" ile genişletilmiş hâlinin bir kısmını tutup örneklemesine izin veriyor; daha yüksek [[blob]] sayılarını mümkün kılan da bu oldu.

Veriyi başka yere (bir komiteye ya da ayrı bir "data availability" ağına) yazan [[rollup]]'lar "validium" ya da "optimium"'dur: daha ucuzdur, ama o katman veriyi saklarsa, "zk" bir sistemde geçersiz bir durum kesinleşemese bile fonlar dondurulabilir.

**Dene.** Panel, \`blob sayısı × 2¹⁷ × max(blob fiyatı, gas fiyatı / 16)\` artı 21.000 [[gas]] ya da [[calldata]] modunda \`21.000 + 40 × bayt\` [[gas]] ücret alır.`,
      },
      code: {
        lang: 'Python (blob base fee, EIP-4844\'ten)',
        source: `GAS_PER_BLOB = 2**17                # blob başına 131.072 blob gas
MIN_BASE_FEE_PER_BLOB_GAS = 1       # wei

def fake_exponential(factor, numerator, denominator):
    # factor * e**(numerator / denominator) için tam sayılı yaklaşım
    i, output = 1, 0
    acc = factor * denominator
    while acc > 0:
        output += acc
        acc = (acc * numerator) // (denominator * i)
        i += 1
    return output // denominator

def blob_base_fee(excess_blob_gas, update_fraction):
    return fake_exponential(MIN_BASE_FEE_PER_BLOB_GAS,
                            excess_blob_gas, update_fraction)

# excess_blob_gas her block'ta (kullanılan blob gas - hedef) kadar artar
# ve sıfırın altına inmez; bu yüzden hedefin üzerindeki bir block dizisi
# ücreti üstel olarak yükseltir, altındaki bir dizi yeniden düşürür.`,
      },
    },
    bridge: {
      title: '"Bridge", çekimler ve neye güvendiğin',
      alt: 'Bir kullanıcı rollup şeridinde, Ethereum şeridindeki bir bridge contract’ına doğru uzanan iki paralel rayın önünde duruyor; contract bir coin yığını tutuyor. Raylardan biri üç işaretli zk rollup, diğeri yedi işaretli optimistic rollup. Zaman geçtikçe her birinde bir coin ilerliyor; zk coin’i birkaç saat sonra, optimistic olanı yedi gün sonra varıyor. Ethereum şeridinde, üstünde anahtar bloğu olan küçük bir kutu upgrade anahtarlarını temsil ediyor.',
      body: {
        beginner: `Bir [[rollup]]'ı kullanmak için coin'lerini bir [[bridge]] üzerinden ona taşırsın. Gerçek coin'ler Ethereum'daki bir contract'ta kilitlenir, aynı miktar da [[rollup]]'ta senin için belirir. İçeri girmek birkaç dakika sürer.

Asıl sınav geri çıkmaktır. [[rollup]] Ethereum'a "bu kişinin 10 coin alacağı var" der; Ethereum da coin'leri ancak bu iddianın doğru olduğundan emin olunca serbest bırakır. "Zk" bir [[rollup]]'ta bu, kanıtı beklemek demektir; genellikle birkaç saat. "Optimistic" bir [[rollup]]'ta ise bütün itiraz süresini beklemek demektir: yaklaşık yedi gün.

**Dene.** **İkisinde de çekim başlat**'a, sonra birkaç kez **+1 saat**'e ve birkaç kez **+1 gün**'e bas; hangi coin'in Ethereum'a önce vardığını izle.

Bir [[rollup]] güvenliğinin çoğunu Ethereum'dan ödünç alır, ama hepsini değil. Her [[rollup]] için sormaya değer: Veri Ethereum'da yayımlanıyor mu? Kanıtlar gerçekten çalışıyor mu ve onları herkes kullanabiliyor mu? Kuralları değiştirebilen anahtarlar kimde ve bana ne kadar önceden haber verilir? Operatör ortadan kaybolursa çıkabilir miyim?`,
        intermediate: `Bir [[rollup]]'ın asıl [[bridge]]'i, yatırılan parayı tutan L1'deki bir contract'tır. **Yatırma** bir L1 [[transaction]]'ıdır: contract token'larını kilitler, [[rollup]] da kısa bir gecikmeyle hesabına yazar. **Çekim** ters yönde işler ve bilerek daha yavaştır:

- L2'de bir [[transaction]] ile başlatırsın;
- onu içeren bir "state root"'un L1'de kabul edilmesini beklersin: [[zk-rollup]]'ta [[validity-proof]] doğrulanınca (2026 itibarıyla genellikle saatler), [[optimistic-rollup]]'ta itiraz süresi dolunca (yaklaşık 7 gün);
- L1 contract'ına çekiminin o durumun içinde olduğunu kanıtlarsın, o da ödemeyi yapar.

Hızlı çekim hizmetleri, sana L1'de kendi fonlarından ödeme yapıp çekimini sonradan kendileri tahsil ederek bekleyişi bir ücret karşılığında kısaltır. Bu, [[rollup]]'ın bir özelliği değil, üçüncü bir tarafla yapılan bir alışveriştir.

Güvenlik nereden gelir ve nerede biter? Veri ve "settlement" L1'den gelir. Geriye kalanlar her [[rollup]]'a özgüdür: "proof" sisteminin canlıda ve herkese açık olup olmadığı; **contract'ları kimin, ne kadar önceden haber vererek "upgrade" edebildiği** (anında yapılan bir "upgrade", [[bridge]]'in sahibi dahil her kuralı değiştirebilir); kullanıcıların operatör olmadan [[transaction]] zorlayıp çıkabilmesi.

L2BEAT'in **"stage"**'leri bunu özetler: Stage 0 (pratikte operatöre ve anahtarlarına tümüyle güvenilir), Stage 1 (çalışan bir "proof" sistemi; "Security Council" onu yalnızca yüksek bir eşikle geçersiz kılabilir; kullanıcılar çoğu "upgrade"'den önce çıkmak için en az 7 gün bulur) ve Stage 2 (herkese açık "proof"'lar, en az 30 gün önceden haber, yalnızca kanıtlanabilir hatalarla sınırlı bir konsey). 2026 itibarıyla en büyük [[rollup]]'lar Stage 1'dedir; Stage 2'ye ulaşan proje çok azdır.

**Dene.** Çekimleri başlat ve zamanı ilerlet. "Zk" rayı temsilî olarak 3 saat kullanır.`,
        expert: `Çekimler L2'den L1'e mesajlardır. OP Stack'te bir çekim \`L2ToL1MessagePasser\` contract'ının "storage"'ına yazar; kullanıcı daha sonra o "storage slot"'unu bir "output root"'un içindeki \`withdrawal_storage_root\`'a karşı (hesabın "storage proof"'uyla) kanıtlar, o "root" için "dispute game"'in sonuçlanmasını ve ek bir güvenlik gecikmesini bekler, sonra \`OptimismPortal\` üzerinde tamamlar. Arbitrum giden mesajları bir Merkle ağacında biriktirir (\`ArbSys.sendTxToL1\`); ağacın kökü "assertion" ile birlikte onaylanır ve ardından \`Outbox\` üzerinden yürütülür. [[zk-rollup]]'larda mesaj kökü kanıtlanan durumun parçasıdır; bu yüzden "batch" L1'de doğrulanıp yürütülür yürütülmez kullanılabilir. Bazı sistemler "soundness" hatalarına karşı önlem olarak bir yürütme gecikmesi ekler.

Katman katman neye dayanıyorsun:

- **[[data-availability]]**: "batch" verisi L1'de ([[calldata]] ya da [[blob]]). Aksi hâlde: bir komite ya da dış bir ağ.
- **Durumun geçerliliği**: en az bir dürüst, parası olan ve sansürlenmeyen "challenger"'ı bulunan bir [[fraud-proof]] sistemi ya da "sound" bir [[validity-proof]] sistemi. Yalnızca izin listesindeki tarafların kullanabildiği ya da küçük bir "multisig"'in dilediğinde geçersiz kılabildiği bir "proof" sistemi, tasarımının düşündürdüğünden zayıftır.
- **"Upgrade" edilebilirlik**: "proxy admin" anahtarları ve gecikmeleri. Anında "upgrade" mümkünse gerçek güvenlik modeli anahtar sahipleridir. *"Exit window"* ("upgrade" gecikmesi eksi çekim için gereken süre, "forced inclusion" gecikmesi dahil), kullanıcıların reddettikleri bir değişiklik yürürlüğe girmeden ayrılabilmesini sağlayan şeydir.
- **[[sequencer]] "liveness"'ı ve sansür**: "forced inclusion" (3. adım). Operatör tümüyle ortadan kalktığında çıkış için bir **"escape hatch"**: kullanıcılar ya da herhangi biri "state root"'ları doğrudan L1'e yazabilir veya bakiyeleri orada kanıtlayabilir; bazı sistemler donar ve kanıtlanmış son duruma karşı çekime izin verir.
- **"Proposer" "liveness"'ı**: "root"'ları yalnızca izin listesindeki bir "proposer" gönderebiliyorsa ve o durursa çekimler takılır; izinsiz önerme ya da bir yedek yol bunu ortadan kaldırır.

L2BEAT'in "stage"'leri bunlar üzerindeki eşikleri kodlar: Stage 1, hatalar dışında, çekimleri engellemenin ya da değiştirmenin bir "Security Council"'ın en az %75'ini gerektirmesini ve kullanıcılara başka herkesin yapacağı "upgrade"'lerden önce çıkmaları için en az 7 gün verilmesini ister; Stage 2 ise izinsiz "proof"'lar, en az 30 gün ve yalnızca zincir üzerinde kanıtlanabilir hatalarda harekete geçebilen bir konsey ister.

Zincirler arasındaki üçüncü taraf [[bridge]]'ler başka bir şeydir: her birinin kendi [[validator]] kümesi, "light client"'ı ya da likidite ağı vardır ve arızalanmaları [[rollup]]'ın "proof" sistemiyle hiç ilgili değildir.

**Dene.** İki ray 7 gün ve temsilî 3 saat kullanır. İkisi de kanıtlamak ve tahsil etmek için ayrıca göndereceğin L1 [[transaction]]'larını içermez.`,
      },
    },
  },
};

export default content;
