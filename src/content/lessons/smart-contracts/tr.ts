import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[revert]]'i -> "revert"'i.

const content: LessonContent = {
  labels: {
    eoa: 'Alice: EOA',
    eoaCaption: 'anahtar yönetir',
    contractAccount: 'Contract account',
    contractCaption: 'kendi kodu yönetir',
    contractShort: 'Counter (contract)',
    privateKey: 'private key',
    code: 'kod',
    storage: 'storage',
    tryInspect: 'Dene: iki hesabı da incele',
    alice: 'Alice',
    bob: 'Bob',
    carol: 'Carol',
    balance: 'bakiye',
    empty: 'boş',
    none: 'yok',
    bytes: 'bayt',
    slot: 'slot',
    controlledBy: 'yöneten',
    senderNonce: 'Gönderenin nonce değeri',
    sender: 'gönderen',
    contractAddress: 'contract adresi',
    source: 'kaynak kod',
    bytecode: 'bytecode',
    compile: 'derle',
    creationTx: 'oluşturma transaction',
    newAddress: 'yeni adres',
    contractHolds: 'contract içinde',
    everyNode: 'her node aynı kodu çalıştırır',
    reset: 'Sıfırla',
    result: 'sonuç',
    noCallYet: 'henüz çağrı yok',
    success: 'başarılı',
    errFunds: 'yeterli ETH yok',
    errBalance: 'bakiye yetersiz',
    mappingKey: 'anahtar',
    depositAs: 'bu anahtarla deposit() 1 ETH',
    value: 'değer',
    notStored: 'saklanmıyor',
    hashSpace: 'slot = anahtarın hash değeri',
    stepBtn: 'Adım',
    runBtn: 'Sona kadar çalıştır',
    lastStep: 'son adım',
    gasLeft: 'kalan gas',
    gasUsed: 'harcanan gas',
    stack: 'stack',
    finished: 'bitti',
    outOfGas: 'gas bitti',
    gasLimit: 'Gas limit',
    slotNonZero: 'count zaten 1',
    outOfGasRevert: 'gas bitti, revert',
    refunded: 'kullanılmadı, iade',
    fee: 'ücret',
    limitShort: 'limit',
    intrinsic: 'taban maliyet',
    needs: 'gereken',
    rolledBack: 'geri alındı',
    vault: 'Kasa',
    attacker: 'Saldırgan',
    depth: 'çağrı derinliği',
    othersDeposit: 'Başkalarının yatırdığı',
    effectsFirst: 'göndermeden önce bakiyeyi güncelle',
    nextCall: 'Sonraki adım',
    runAttack: 'Saldırıyı çalıştır',
    recorded: 'saldırganın kaydı',
    ready: 'hazır',
    attackReverted: 'saldırı geri alındı',
    stolen: 'çalınan:',
    nothingStolen: 'çalınacak bir şey yok',
  },
  steps: {
    account: {
      title: 'Kendi adresi olan bir program',
      alt: 'Solda bir kişi, üzerinde süzülen bir anahtarın altında duruyor; yanında birkaç madeni para var: bu, anahtarla yönetilen bir hesap. Sağda kendi platformunda bir makine duruyor; yanında birkaç madeni para, üzerinde süzülen bir sıra kod bloğu ve hemen yanında bir depolama çekmecesi var: bu, kodla yönetilen bir hesap. Düğmeler birini ya da diğerini öne çıkarıyor.',
      body: {
        beginner: `Bir [[smart-contract]], [[blockchain]] üzerinde yaşayan bir programdır. Sokakta duran bir otomat düşün: içinde para tutar, sabit kurallara uyar ve çalışması için içinde birinin oturması gerekmez.

Ethereum'da iki tür hesap vardır. Biri bir insana aittir ve gizli bir anahtarla yönetilir. Diğeri ise **doğrudan bir programdır**: kendine ait bir [[address]] değeri vardır ve [[ether]] tutabilir, ama onun bir anahtarı yoktur. O paraya ne olacağına yalnızca kendi kodu karar verir.

İki düğmeyle hesaplara tek tek bak. İnsanda olup makinede olmayan şeye (anahtar) ve makinede olup insanda olmayan şeye (kod ve saklanan veri) dikkat et.`,
        intermediate: `İki hesap türünün de bir [[address]] değeri, [[ether]] cinsinden bir bakiyesi ve [[account-nonce]] denen bir sayacı vardır.

- Bir [[eoa]] ("externally owned account"), bir [[private-key]] ile yönetilir. Ne kodu ne de kendine ait verisi vardır. Her [[transaction]] bir [[eoa]]'dan başlar, çünkü yalnızca bir anahtar imza atabilir.
- Bir [[contract-account]] ise kodu tarafından yönetilir. Anahtarı yoktur, yani kimse onun adına imza atamaz. Yalnızca biri onu çağırdığında harekete geçer ve o zaman da kod ne diyorsa tam olarak onu yapar.

Bir contract ayrıca kalıcı veri tutar; buna [[contract-state]] denir: sayaçlar, bakiyeler, sahipler, yazarın tanımladığı her şey. Panelde iki hesabı karşılaştır: contract'ın kodu ve saklanan bir değeri var, [[eoa]]'nın ikisi de yok.

Bir contract [[ether]] tutabildiği ve onun anahtarı kimsede olmadığı için, o paranın yerinden oynamasının tek yolu koddur. Bu yüzden kodu okumak, yazarına güvenmekten daha önemlidir.`,
        expert: `Dünya durumunda her hesap dört alandan oluşur ve [[state-trie]] içinde \`keccak256(address)\` altında saklanır:

- \`nonce\`: gönderilen [[transaction]] sayısı (bir [[eoa]] için) ya da oluşturulan contract sayısı (bir [[contract-account]] için). Yeni bir contract 0'dan değil 1'den başlar (EIP-161).
- \`balance\`: wei cinsinden.
- \`storageRoot\`: hesabın kendi depolama ağacının kökü. Boş depolama, boş ağacın kökünü verir: \`0x56e81f17…b421\` = \`keccak256(rlp(""))\`.
- \`codeHash\`: \`keccak256(code)\`. Kod yoksa \`0xc5d24601…a470\` = \`keccak256("")\`.

Bu seviyede panel her hesap için iki [[hash]] değerini de gösterir. [[eoa]]'da tam olarak bu iki boş sabit vardır. Contract ise 8 baytlık kodunun [[hash]]'ini ve tek kayıtlı (slot 0 = 1) bir depolama ağacının kökünü gösterir: \`0x821e2556…e5f0\`.

Bir [[transaction]]'ı yalnızca bir [[eoa]] başlatabilir; contract ancak bir tanesinin içinde çalışır, bu yüzden \`tx.origin\` her zaman bir EOA'dır. Pectra güncellemesinden (Mayıs 2025) beri bu sınır o kadar keskin değil: EIP-7702 ile bir [[eoa]], kodunu \`0xef0100 ‖ address\` biçiminde bir yönlendirme işaretine ayarlayabilir; ona yapılan çağrılar o adresteki kodu EOA'nın kendi bağlamında çalıştırır.`,
      },
      code: {
        lang: 'Hesap durumu',
        source: `# hesap = (nonce, balance, storageRoot, codeHash)

# Alice, bir EOA: depolama yok, kod yok
nonce        7
balance      2500000000000000000            # wei cinsinden 2.5 ETH
storageRoot  0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
codeHash     0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470

# Counter, bir contract: depolama { slot 0: 1 }, kod 0x5f546001015f5500
nonce        1
balance      3000000000000000000            # 3 ETH
storageRoot  0x821e2556a290c86405f8160a2d662042a431ba456b9db265c79bb837c04be5f0
codeHash     keccak256(0x5f546001015f5500)`,
      },
    },
    deploy: {
      title: '"Deployment": kaynak koddan adrese',
      alt: 'Soldan sağa bir sıra: önceki işlemlerini sayan küçük bir yığınla Alice, bir kaynak kod sayfası, bir sıra bytecode küpüne giden bir ok ve contract makinesinin durduğu platforma uçan bir paket; makinenin altında yeni adresi yazıyor. Kaydırıcıyı oynatmak Alice\'in yığınını ve adresi değiştiriyor.',
      body: {
        beginner: `Bir programı zincire koymaya [[deployment]] denir. Programı yazarsın, bir çevirmen onu ağın anladığı makine diline çevirir ve sen de bunu, alıcısı olmayan özel bir [[transaction]] ile ağa gönderirsin.

Ağ programı saklar ve ona yepyeni bir [[address]] verir. O andan sonra onu herkes kullanabilir; yazarının da onun üzerinde başkalarından fazla bir yetkisi kalmaz.

Yeni adres rastgele değildir. **Kimin gönderdiğinden** ve **o göndericinin daha önce kaç işlem yaptığından** hesaplanır. Kaydırıcıyı oynat: her sayı bambaşka bir adres verir.`,
        intermediate: `Contract'lar çoğunlukla [[solidity]] ile yazılır. Derleyici kaynak kodu [[bytecode]]'a çevirir: [[evm]]'in çalıştırabildiği bir bayt dizisi. Ayrıca dış dünyanın contract ile konuşmak için kullandığı [[abi]]'yi de üretir.

Bir [[deployment]], \`to\` alanı boş olan ve kodu \`data\` alanında taşıyan bir [[transaction]]'dır. [[evm]] bu kodu bir kez çalıştırır ("constructor" burada çalışır); kodun geri döndürdüğü şey contract'ın kalıcı kodu olarak saklanır.

Contract'ın [[address]] değeri, gönderenin adresinden ve gönderenin [[account-nonce]] değerinden hesaplanır. Yani işlem daha gönderilmeden bilinir ve aynı gönderici aynı adresi iki kez üretemez.

Kod saklamak bedava değildir: bir oluşturma işlemi, her zamanki 21.000'in üstüne 32.000 [[gas]] tutar; ayrıca zincire yazılan kodun her baytı için 200 gas ödenir.`,
        expert: `Bir oluşturma işlemi (ve \`CREATE\` [[opcode]]'u) için adres şudur:

\`keccak256(rlp([sender, nonce]))[12:]\`

Nonce 0 için RLP \`0xd6 0x94 <20 baytlık sender> 0x80\` olur. Gönderen olarak Hardhat'in ilk test hesabı kullanıldığında, kaydırıcı 0'dayken \`0x5fbdb2315678afecb367f032d93f642f64180aa3\` çıkar: her yerel Hardhat projesinin ilk gördüğü adres.

\`CREATE2\` (EIP-1014) nonce'u bırakır: \`keccak256(0xff ‖ deployer ‖ salt ‖ keccak256(initCode))[12:]\`. Adres o zaman yalnızca yükleyene, seçilen bir "salt" değerine ve koda bağlıdır; böylece hiçbir şey yüklenmeden önce hesaplanabilir ve içine para gönderilebilir. Uniswap v2 çiftleri böyle oluşturulur.

Oluşturma işleminin \`data\` alanı **"init code"**'dur: "constructor" mantığı, ardından çalışma zamanı kodu ve sonuna eklenmiş, ABI ile kodlanmış "constructor" argümanları. Geriye çalışma zamanı [[bytecode]]'unu döndürür; \`immutable\` değerler bu aşamada o kodun içine yazılır. Sınırlar ve maliyetler:

- çalışma zamanı kodu en fazla 24.576 bayt (EIP-170), "init code" en fazla 49.152 bayt (EIP-3860);
- oluşturma için 32.000 gas, "init code"'un her 32 baytlık kelimesi için 2 gas, yüklenen kodun her baytı için 200 gas;
- kod \`0xEF\` ile başlayamaz (EIP-3541).

"Init code" [[revert]] ederse ya da [[gas]]'ı biterse o adreste bir contract oluşmaz, ama gönderenin nonce'u yine de artmış olur.`,
      },
      code: {
        lang: 'Solidity',
        source: `// \`sender\` adresinden, nonce 0 ile yapılan bir CREATE'in alacağı adres.
// rlp([sender, 0]) = 0xd6 0x94 <sender> 0x80
function createAddress(address sender) pure returns (address) {
    return address(uint160(uint256(keccak256(
        abi.encodePacked(bytes1(0xd6), bytes1(0x94), sender, bytes1(0x80))
    ))));
}

// CREATE2: nonce yok, bu yüzden adres önceden bilinir.
function create2Address(address deployer, bytes32 salt, bytes32 initCodeHash)
    pure returns (address)
{
    return address(uint160(uint256(keccak256(
        abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash)
    ))));
}`,
      },
    },
    call: {
      title: 'Bir fonksiyonu çağırmak',
      alt: 'Alice solda, madeni paralarıyla duruyor. Ondan ortadaki contract makinesine bir paket uçuyor. Makinenin yanında kendi madeni para yığını, sağda ise iki depolama çekmecesi var: sayaç ve Alice\'in kayıtlı bakiyesi. Arkada üç node kulesi duruyor; hepsi aynı kodu çalıştırıyor. Düğmeler çağrı gönderiyor; paralar ve çekmeceler değişiyor, başarısız bir çağrıda makine kırmızıya dönüyor.',
      body: {
        beginner: `Bu contract, sayacı olan küçük bir kumbaradır. Onu kullanmak için, fonksiyonlarından hangisinin çalışacağını söyleyen bir mesaj gönderirsin. Bu mesaj bir [[transaction]]'dır ve yanında [[ether]] taşıyabilir.

**deposit** düğmesine bas: Alice'ten bir ETH çıkar, contract'a girer ve contract, Alice'e 1 borçlu olduğunu yazar. **increment** düğmesine bas: sayaç artar. Alice'in kayıtlı bakiyesi sıfır olana kadar **withdraw** düğmesine bas, sonra bir kez daha bas.

Bu son çağrı başarısız olur. Contract kuralını kontrol eder ("yatırdığından fazlasını çekemezsin"), reddeder ve hiçbir şey değişmez. Buna [[revert]] denir. Ağdaki her bilgisayar aynı çağrıyı çalıştırır ve aynı sonuca varır.`,
        intermediate: `Bir contract'ı çağırmak için onun [[address]] değerine bir [[transaction]] gönderirsin. İşi iki alan görür:

- \`data\`, [[calldata]]'yı taşır: fonksiyonu belirten 4 bayt ve ardından her biri 32 bayta tamamlanmış argümanlar. Panel, her düğme için gerçek baytları gösterir.
- \`value\`, birlikte gönderilen [[ether]] miktarıdır. Onu yalnızca \`payable\` olarak işaretlenmiş fonksiyonlar kabul eder.

Contract'ın içinde \`msg.sender\` çağıran kişidir, \`msg.value\` ise çağrıyla gelen "ether"'dir. \`deposit()\`, \`msg.value\` değerini çağıranın kaydına ekler; \`withdraw\` ise önce kaydı kontrol eder ve yetersizse [[revert]] eder.

Her [[full-node]] çağrıyı aynı kodla ve aynı başlangıç durumuyla çalıştırır, dolayısıyla hepsi aynı [[contract-state]]'e ulaşır. [[evm]]'de hiçbir şey rastgele değildir ve hiçbir şey çalıştığı makineye bağlı değildir. Bir değeri okumak içinse işlem gerekmez: bir [[node]], fonksiyonu kendi üzerinde çalıştırıp cevabı döndürebilir.`,
        expert: `[[calldata]]'nın ilk 4 baytı "selector"'dır: \`keccak256("withdraw(uint256)")[0:4] = 0x2e1a7d4d\`. Derlenmiş [[bytecode]], "selector"'ı her dış fonksiyonla karşılaştırıp ilgili yere atlayan bir "dispatcher" ile başlar. Eşleşme yoksa, varsa \`fallback()\` çalışır; boş calldata \`receive()\` fonksiyonunu çalıştırır; ikisi de yoksa çağrı [[revert]] eder.

Bir contract, aynı [[transaction]] içinde başka contract'ları çağırabilir. Üç çağrı [[opcode]]'u bağlam açısından farklıdır:

- \`CALL\`: çağrılanın kodunu çağrılanın depolamasıyla çalıştırır. \`msg.sender\` çağıran contract olur. Değer gönderebilir.
- \`DELEGATECALL\`: çağrılanın kodunu **çağıranın** depolaması, bakiyesi, \`msg.sender\` ve \`msg.value\` değerleriyle çalıştırır. Kütüphaneler ve "proxy"'ler böyle çalışır.
- \`STATICCALL\` (EIP-214): değer göndermeyen bir \`CALL\` gibidir; içindeki her durum değişikliği (\`SSTORE\`, \`LOG\`, \`CREATE\`, "ether" göndermek) başarısız olur. \`view\` fonksiyonları böyle çağrılır.

Bir çağrı, kalan [[gas]]'ın en fazla 63/64'ünü aktarır (EIP-150) ve iç içe çağrı derinliği 1024 ile sınırlıdır. Başarısız bir alt çağrı çağıranı geri almaz: "opcode" yığına 0 koyar ve [[revert]] edip etmemek çağıranın kararıdır. Solidity'nin üst düzey çağrıları bunu kendiliğinden yapar; düşük düzeyli \`addr.call(...)\` ise kontrol edilmesi gereken \`(bool ok, bytes memory data)\` döndürür.

Revert verisi de bir çağrı gibi ABI ile kodlanır: \`require(cond, "msg")\`, "selector"'ı \`0x08c379a0\` olan \`Error(string)\` döndürür; başarısız bir \`assert\` ya da aritmetik taşma \`Panic(uint256)\` (\`0x4e487b71\`) döndürür; özel hatalar ise kendi 4 baytlık "selector"'larını kullanır.`,
      },
      code: {
        lang: 'Solidity',
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PiggyBank {
    uint256 public count;                          // slot 0
    mapping(address => uint256) public balances;   // slot 1

    function increment() external {                // 0xd09de08a
        count += 1;
    }

    function deposit() external payable {          // 0xd0e30db0
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {   // 0x2e1a7d4d
        require(balances[msg.sender] >= amount, "balance too low");
        balances[msg.sender] -= amount;                     // önce kayıt
        (bool ok, ) = msg.sender.call{value: amount}("");   // sonra gönderim
        require(ok, "send failed");
    }
}`,
      },
    },
    storage: {
      title: '"Storage": numaralı "slot"\'lar',
      alt: 'Solda numaralı iki çekmece: slot 0 sayacı tutuyor, slot 1 ise bakiye tablosunun boş işaretçisi. Sağa doğru uzun bir ray uzanıyor; üzerinde dağınık konumlarda, her kişi için birer tane olmak üzere üç çekmece daha var. Seçilen kişinin çekmecesi yükselip parlıyor, uzun slot numarasını ve değerini gösteriyor. Boş çekmeceler soluk.',
      body: {
        beginner: `Bir contract, hatırlaması gerekenleri kendine ait numaralı çekmecelerden oluşan bir duvarda saklar. Her çekmece tek bir sayı tutar. Onları yalnızca contract'ın kendi kodu değiştirebilir ve içindekiler, kod yeniden değiştirene kadar orada kalır.

Basit değerler ilk çekmeceleri alır: sayaç 0 numaralı çekmecededir. "Kime ne kadar borçluyum" gibi bir tablo ise farklı çalışır. Her kişinin çekmecesi, o kişinin adı karıştırılıp dev bir sayıya çevrilerek bulunur; böylece neredeyse sonsuz bir duvarda herkesin kendine ait bir çekmecesi olur.

Bir kişi seç, sonra o kişi olarak para yatır. Her birinin bambaşka bir yere düştüğüne ve kimsenin yazmadığı bir çekmecenin sadece boş olduğuna dikkat et.`,
        intermediate: `Her contract'ın 2²⁵⁶ depolama konumu vardır; her birine [[storage-slot]] denir ve her biri 32 bayt tutar. Bir şey yazılana kadar hepsi sıfır okunur.

Değişkenler, tanımlandıkları sırayla "slot" alır: burada \`count\` slot 0, \`balances\` ise slot 1'dir. Bir "mapping" tek bir "slot"'a sığmaz; bu yüzden kendi "slot"'u boş kalır ve her kayıt şurada durur:

\`keccak256(anahtar, mapping'in slot numarası)\`

Panel, her anahtar için gerçek [[hash]] değerini gösterir. Üç kayıt birbirinin yakınında bile değildir ve anahtarların listesi hiçbir yerde tutulmaz: bir contract bir "mapping" üzerinde döngü kuramaz, sıfır olan bir kayıt da hiç yer kaplamaz.

Akılda tutmaya değer iki sonuç var. Depolama **herkese açıktır**: kaynak kod ona \`private\` dese bile, herkes herhangi bir contract'ın herhangi bir "slot"'unu bir [[node]]'dan okuyabilir. Ayrıca depolama, bir contract'ın yaptığı en pahalı iştir, çünkü her [[full-node]] onu sonsuza dek saklamak zorundadır: yeni bir "slot"'a yazmak 20.000 [[gas]] tutar.`,
        expert: `Solidity'nin yerleşim kuralları (durum değişkenleri tanım sırasıyla, taban contract'lar C3 doğrusallaştırma sırasında önce):

- 32 bayttan küçük değer tipleri, art arda geliyorlarsa tek bir [[storage-slot]]'a, düşük baytlardan başlayarak paketlenir; sığmayan değer bir sonraki "slot"'u başlatır;
- "struct"'lar ve diziler her zaman yeni bir "slot"'tan başlar, onlardan sonra gelen de öyle;
- \`p\` numaralı "slot"'taki bir "mapping", \`k\` anahtarının değerini \`keccak256(h(k) . p)\` konumunda saklar; \`h\`, değer tiplerini 32 bayta tamamlar; iç içe "mapping"'lerde bu art arda uygulanır;
- \`p\` numaralı "slot"'taki dinamik bir dizi, uzunluğunu \`p\` içinde, elemanlarını \`keccak256(p)\` konumundan itibaren saklar;
- 31 bayta kadar olan \`bytes\` ve \`string\` değerleri "slot"'un kendisinde durur, en düşük baytta \`length * 2\` yazar; daha uzunları "slot"'ta \`length * 2 + 1\`, veriyi ise \`keccak256(p)\` konumundan itibaren saklar.

Protokol düzeyinde bir contract'ın depolaması, anahtarı \`keccak256(slot)\` olan kendi Merkle-Patricia ağacıdır; kökü hesabın \`storageRoot\` alanıdır. Sıfıra ayarlanan bir "slot" ağaçtan silinir.

Erişim EIP-2929 ile fiyatlanır: bir [[transaction]] içinde bir "slot"'a ilk dokunuş **"cold"**'dur (\`SLOAD\` için 2.100 [[gas]]), sonrakiler **"warm"**'dır (100). EIP-1153, [[transient-storage]]'ı ekler (\`TSTORE\` / \`TLOAD\`, her biri 100 gas); bu alan işlemin sonunda temizlenir ve ağaca hiç ulaşmaz.

İşin içine bir "proxy" girdiğinde yerleşim, contract'ın arayüzünün bir parçası olur: değişkenlerin sırasını değiştiren ya da araya değişken ekleyen bir güncelleme, mevcut "slot"'ları sessizce başka anlamla okur.`,
      },
      code: {
        lang: 'Solidity',
        source: `contract Layout {
    uint256 count;                        // slot 0
    mapping(address => uint256) balances; // slot 1 (slot'un kendisi boş kalır)
    uint128 a;                            // slot 2, düşük 16 bayt
    uint128 b;                            // slot 2, yüksek 16 bayt (paketlenmiş)
    uint256[] list;                       // slot 3 uzunluğu tutar

    // balances[who] nerede durur
    function balanceSlot(address who) external pure returns (bytes32) {
        return keccak256(abi.encode(who, uint256(1)));
    }

    // list[i] nerede durur
    function listSlot(uint256 i) external pure returns (uint256) {
        return uint256(keccak256(abi.encode(uint256(3)))) + i;
    }
}

// "private" olsa da olmasa da herkes her slot'u okuyabilir:
//   eth_getStorageAt(contract, slot, "latest")`,
      },
    },
    evm: {
      title: 'EVM her seferinde tek bir "opcode" çalıştırır',
      alt: 'Yedi komut bloğundan oluşan bir sıra; o an çalışan bloğun üzerinde bir işaretçi var. Sağda, üzerinde çalışılan değerleri tutan küçük bir tabak yığını ve sayacı tutan bir depolama çekmecesi duruyor. Aşağıdaki uzun yeşil çubuk kalan gas miktarını gösteriyor. Adım düğmesine her basışta işaretçi ilerliyor, yığın değişiyor ve çubuk kısalıyor.',
      body: {
        beginner: `Her [[node]]'un içinde aynı küçük hesap makinesi vardır: [[evm]]. Bir contract'ın programını, her seferinde tek bir küçük komut olacak şekilde okur. Üzerinde çalıştığı sayılar bir tabak yığını gibidir: en üste bir tabak koyabilir ya da en üsttekini alabilir.

Bu program sayaca 1 ekler. **Adım** düğmesine bas ve izle: sayacı çekmecesinden getir, yığına bir 1 koy, ikisini topla, sonucu çekmeceye geri koy.

Yeşil çubuğa bak. Her komut biraz [[gas]] harcar ve ikisi diğerlerinden çok daha fazlasını harcar: çekmeceye dokunanlar.`,
        intermediate: `[[evm]] bir yığın makinesidir. Her komut tek bir bayttır, yani bir [[opcode]]; her biri girdilerini yığının tepesinden alır ve sonucunu yine oraya koyar. Değerler 256 bit genişliğindedir.

\`count = count + 1\` işleminin yedi adımı:

- \`PUSH0\` yığına 0 koyar: "slot" numarası. 2 gas.
- \`SLOAD\` onu, o [[storage-slot]]'taki değerle değiştirir. 2.100 gas.
- \`PUSH1 1\` yığına 1 koyar. 3 gas.
- \`ADD\` en üstteki iki değeri toplamlarıyla değiştirir. 3 gas.
- \`PUSH0\` "slot" numarasını yeniden koyar. 2 gas.
- \`SSTORE\` toplamı "slot"'a yazar. 20.000 gas.
- \`STOP\` çağrıyı bitirir. 0 gas.

Toplam 22.110 [[gas]] eder ve bunun 22.100'ü depolamadır. Aritmetik neredeyse bedavadır; pahalı olan, her [[full-node]]'un saklamak zorunda olduğu durumdur.`,
        expert: `Program şu 8 bayttır: \`0x5f546001015f5500\`. Buradaki yorumlayıcı gerçektir: 256 bitlik kelimelerden oluşan yığın (sınır 1024), [[opcode]] başına [[gas]] ve ana ağdaki gibi depolama fiyatlaması.

- \`PUSH0\` (\`0x5f\`, EIP-3855, Shanghai) 2 tutar; \`PUSH1\` ve \`ADD\` 3 tutar.
- \`SLOAD\` burada 2.100 tutar, çünkü slot 0 **"cold"**'dur. Ardından "slot" işlemin erişim kümesine girer, bu yüzden \`SSTORE\` "cold" ek ücreti ödemez (EIP-2929).
- \`SSTORE\` üç değere göre fiyatlanır: özgün (işlemin başındaki), şimdiki ve yeni. Sıfır → sıfır olmayan 20.000'dir. Sıfır olmayan → farklı bir sıfır olmayan 2.900'dür. Şimdiki değeri yeniden yazmak ya da bu işlemde zaten değiştirilmiş bir "slot"'a yazmak 100'dür. Ayrıca 2.300 ya da daha az gas kaldıysa \`SSTORE\` doğrudan başarısız olur (EIP-2200).
- Bir "slot"'u temizlemek 4.800 iade eder; toplam iade, harcanan gas'ın beşte biriyle sınırlıdır (EIP-3529).

Yığının yanında bayt adresli **bellek** (her çağrıdan sonra temizlenir, büyüdükçe karesel fiyatlanır), salt okunur [[calldata]] ve son alt çağrının dönüş verisi vardır.

Gerçek derlenmiş [[solidity]], elle yazılmış bu programdan fazlasını yapar: "selector" üzerinde bir "dispatcher", \`payable\` olmayan bir fonksiyona "ether" gönderilmediğinin kontrolü, toplamada taşma kontrolü (başarısız olursa \`Panic(0x11)\` ile revert eder) ve boş bellek işaretçisinin kurulması. Yine de baskın olan depolama maliyetidir.`,
      },
      code: {
        lang: 'EVM assembly',
        source: `pc  bayt    opcode     sonraki yığın      gas
00  5f      PUSH0      [0]                    2
01  54      SLOAD      [count]            2,100   // slot 0'ın cold okuması
02  60 01   PUSH1 1    [count, 1]             3
04  01      ADD        [count + 1]            3
05  5f      PUSH0      [count + 1, 0]         2
06  55      SSTORE     []                20,000   // 0 -> sıfır olmayan (zaten doluysa 2,900)
07  00      STOP                              0
                                         ------
                                         22,110`,
      },
    },
    gas: {
      title: '"Gas": biterse "revert" olur, ücreti yine ödersin',
      alt: 'Aynı komut bloğu sırası. Altında bir çubuk gas limit değerini gösteriyor: taban maliyet için gri, kodun harcadığı gas için turuncu, iade edilen kısım için yeşil bir bölüm. Koyu bir direk, çağrının ne kadar gas gerektirdiğini işaretliyor. Limit direğin altında kaldığında, çalışmanın durduğu blok kırmızıya dönüyor, çubuk kırmızı oluyor, depolama çekmecesi boş kalıyor ve bir yığın ücret parası yine de ödeniyor.',
      body: {
        beginner: `Bir çağrı çalışmadan önce gönderen, en fazla ne kadar [[gas]] ödemeye razı olduğuna karar verir; ön ödemeli bir sayaca belli bir tutar yüklemek gibi.

Program biterken gas artarsa kalanı geri verilir. Sayaç yarı yolda sıfıra inerse program durur ve **yaptığı her şey geri alınır**; sanki çağrı hiç olmamış gibi. Bu bir [[revert]]'tir.

Ama bilgisayarlar o ana kadar gerçekten çalıştı, bu yüzden ücret yine de kesilir. Çağrı başarısız olana kadar kaydırıcıyı aşağı çek: sayaç olduğu yerde kalır, ücret paraları ise hâlâ oradadır.`,
        intermediate: `Her [[transaction]]'ın bir **"gas limit"** değeri vardır. [[gas-fee]], gerçekten harcanan gas ile birim gas fiyatının çarpımıdır; burada fiyat 20 gwei alınmıştır.

Bu çağrı 43.110 gas gerektirir: her işlemin ödediği 21.000 ve kodun harcadığı 22.110. Çubuktaki koyu direk bunu işaretler.

- Limit 43.110 ya da üstündeyse çağrı başarılı olur, tam 43.110 harcar ve limitin kalanı hiç tahsil edilmez.
- Limit bunun altındaysa çalışma, parasının yetmediği komutta durur. Sayaç değişmez, limitin tamamı tüketilir ve ücret bunun tamamı üzerinden ödenir.

Sayacın baştan 1 olması için kutuyu işaretle. Sıfır olmayan bir değeri değiştirmek 20.000 yerine 2.900 tutar; böylece aynı çağrı artık yalnızca 26.010 gerektirir. Aynı fonksiyonun farklı günlerde farklı tutması ve "wallet"'ların limiti seçmek için çağrıyı önce simüle etmesi bu yüzdendir.`,
        expert: `"Intrinsic gas", hiçbir kod çalışmadan önce kesilir: 21.000, artı [[calldata]]'nın her sıfır baytı için 4 ve sıfır olmayan her baytı için 16 (EIP-2028), artı oluşturma işlemi için 32.000, artı erişim listesi kayıtları. Pectra'dan beri EIP-7623, veri ağırlıklı işlemler için calldata "token"'ı başına 10 gas'lık bir taban ekler. Buradaki çağrının calldata'sı boştur, yani "intrinsic" maliyeti tam olarak 21.000'dir. Limiti bu maliyetin altında olan bir işlem geçersizdir: hiçbir zaman dahil edilmez ve hiçbir şey ödemez.

Bir çerçeve iki şekilde başarısız olabilir ve gas sonuçları farklıdır:

- **istisnai durma** (gas'ın bitmesi, geçersiz "opcode" \`0xfe\`, yığın alt taşması, \`STATICCALL\` içinde durum değişikliği) o çerçeveye verilen bütün gas'ı tüketir;
- \`REVERT\` [[opcode]]'u (\`0xfd\`, EIP-140) çerçevenin durum değişikliklerini geri alır, ama kullanılmayan gas'ı ve bir veri yükünü geri döndürür. \`require\`, \`revert\` ve Solidity 0.8'den beri \`assert\` buna derlenir.

İki durumda da o çerçevenin ve alt çağrılarının durum değişiklikleri geri alınır, içeride yayımlanan "log"'lar atılır. En üst çerçeve başarısız olursa [[transaction]] yine de \`status = 0\` ile [[block]]'a girer, gönderenin nonce'u artar ve [[eip-1559]] uyarınca \`gasUsed × (baseFee + tip)\` ücreti ödenir.

Diğer sınırlar: bir işlem en fazla 16.777.216 gas kullanabilir (EIP-7825, Fusaka'dan beri); bir çağrı elindeki gas'ın en fazla 63/64'ünü aktardığı için de çağıran, gas'ı biten bir alt çağrıyı ele alacak kadarını her zaman elinde tutar.`,
      },
      code: {
        lang: 'Solidity',
        source: `contract GasExamples {
    uint256 public count;

    function increment() external {
        count += 1;
    }

    // REVERT (0xfd): durum geri alınır, kullanılmayan gas ve sebep döner.
    function mustBePositive(uint256 x) external pure {
        require(x > 0, "x is zero");
    }

    // Başarısız bir alt çağrıyı yakalamak: yalnızca çağrılanın değişiklikleri geri alınır.
    function tryIncrement(GasExamples other) external returns (bool ok) {
        // Yalnızca 10.000 gas aktar: içerideki SSTORE için yetmez.
        (ok, ) = address(other).call{gas: 10_000}(
            abi.encodeCall(GasExamples.increment, ())
        );
        // ok == false; bu fonksiyon kendi gas'ıyla devam eder.
    }
}`,
      },
    },
    reentrancy: {
      title: 'Kod kalıcıdır, hataları da öyle',
      alt: 'Solda madeni para yığınıyla bir kasa contract\'ı, sağda bir saldırgan contract\'ı var. Aralarında, henüz bitmemiş her iç içe çağrı için bir tane olmak üzere bir plaka yığını büyüyor. Kırmızı bir ok saldırganın kasayı çağırdığını, kesikli bir çizgi ise ETH\'nin geri aktığını gösteriyor. Saldırıyı adım adım ilerletmek paraları birer birer saldırgana taşıyor; düzeltme açıkken yığın kırmızıya dönüyor ve bütün paralar kasada kalıyor.',
      body: {
        beginner: `Bir contract yüklendikten sonra kodu düzenlenemez. Amaç da budur: kuralları sonradan kimse değiştiremez. Ama bu, bir hatanın da sonsuza dek orada kalacağı anlamına gelir.

En ünlü hata, dikkatsiz bir banka veznedarına benzer. Müşteri para çekmek ister. Veznedar parayı **önce** verir, ancak ondan sonra bakiyeyi silmek için deftere uzanır. Eli çabuk bir müşteri, kalem kâğıda değmeden bir daha ister, sonra bir daha, bir daha.

Saldırganın kasayı, başkalarına ait paralar dahil, nasıl boşalttığını izlemek için **Sonraki adım** düğmesine bas. Sonra **göndermeden önce bakiyeyi güncelle** kutusunu işaretle ve yeniden dene. Defter önce güncellenince ikinci istek reddedilir ve bütün saldırı geri alınır.`,
        intermediate: `Kasanın \`withdraw\` fonksiyonu üç işi yanlış sırayla yapar: çağıranın bakiyesini kontrol eder, [[ether]]'i gönderir, sonra bakiyeyi sıfırlar.

Bir [[contract-account]]'a "ether" göndermek o contract'ın kodunu çalıştırır. Saldırganın kodu hemen yeniden \`withdraw\` çağırır. Kasa daha üçüncü satırına gelmemiştir, kaydı hâlâ saldırgana 1 ETH borçlu olduğunu söyler ve yeniden öder. Başka kullanıcılardan 9 ETH ve saldırgandan 1 ETH varken, iç içe on çağrı kasayı boşaltır. Buna [[reentrancy]] denir.

Çözüm, **"checks-effects-interactions"** denen bir sıralama kuralıdır: başkasını çağırmadan önce kendi kayıtlarını güncelle. O zaman iç içe çağrı kontrolü geçemez, hata yukarı doğru taşınır ve [[transaction]]'ın tamamı [[revert]] eder.

2016'da tam olarak bu hata, The DAO adlı bir contract'tan 3,6 milyondan fazla ETH çekilmesine yol açtı. Kod değiştirilemediği için tek çare zincirin kendisini değiştirmekti; bu da zinciri Ethereum ve Ethereum Classic olarak ikiye böldü.

Bazı projeler contract'ları bir **"proxy"** ile bilerek değiştirilebilir yapar: kullanıcılar, veriyi tutan ve her çağrıyı değiştirilebilir bir mantık contract'ına ileten küçük bir contract'ı çağırır. Böylece hatalar düzeltilebilir, ama birinin elinde kuralları değiştirme gücü kalır; değiştirilemezliğin önlemek istediği şey de tam olarak buydu.`,
        expert: `[[reentrancy]]'ye karşı savunmalar, tercih sırasıyla:

- **"Checks-effects-interactions"**: her dış çağrıdan önce bütün durum yazmalarını bitir. Hiçbir maliyeti yoktur.
- **Bir "reentrancy" kilidi** (OpenZeppelin \`ReentrancyGuard\` içindeki \`nonReentrant\`): girişte ayarlanıp çıkışta temizlenen bir depolama bayrağı. Bir türevi bayrağı [[transient-storage]]'da tutar.
- \`transfer\` / \`send\` ile gelen 2.300 gas'lık "stipend"'e güvenme: "opcode" fiyatları değişir, üstelik daha fazla gas'a ihtiyaç duyan alıcıları bozar.

Burada gösterilen tek fonksiyonlu durum en basit olanıdır. **"Cross-function" reentrancy**, aynı bayat durumu okuyan başka bir fonksiyona girer; **"read-only" reentrancy** ise güncellemenin ortasındaki bir contract'ın \`view\` fonksiyonunu çağırır ve bayat cevabı üçüncü bir protokole verir. Her dış çağrı olası bir giriş noktasıdır; \`onERC721Received\` gibi "token hook"'ları da buna dahildir.

"Proxy"'ler: "proxy" depolamayı tutar ve bir uygulama contract'ına \`DELEGATECALL\` yapar; uygulamanın adresi, normal yerleşimle çakışamayacak şekilde EIP-1967 ile seçilmiş sabit bir [[storage-slot]]'ta durur: \`bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)\` = \`0x360894a1…382bbc\`. "Constructor"'lar "proxy" bağlamında çalışmaz; bu yüzden uygulamalar, iki kez çağrılmaya karşı korunması gereken "initializer" fonksiyonları kullanır. Güncellemeler depolama yerleşimine yalnızca sona ekleme yapabilir. Kimin güncelleyebildiği (bir anahtar, bir "multisig", bir "timelock", yönetişim) sistemin asıl güven varsayımıdır.

Kod artık silinemez de: Cancun'dan beri (EIP-6780) \`SELFDESTRUCT\`, contract'ı oluşturan [[transaction]]'ın içinde çalışmıyorsa yalnızca bakiyeyi hedefe gönderir ve hiçbir şeyi silmez.`,
      },
      code: {
        lang: 'Solidity',
        source: `contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // Açık var: kendi kaydını güncellemeden önce ödeme yapıyor.
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        (bool ok, ) = msg.sender.call{value: amount}("");   // etkileşim
        require(ok, "send failed");
        balances[msg.sender] = 0;                           // kayıt, çok geç
    }

    // Düzeltilmiş: kontroller, kayıtlar, etkileşimler.
    function withdrawSafe() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        balances[msg.sender] = 0;                           // önce kayıt
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send failed");
    }
}

contract Attacker {
    Vault immutable vault;
    constructor(Vault v) { vault = v; }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    // Kasa buraya her ether gönderdiğinde çalışır.
    receive() external payable {
        if (address(vault).balance >= msg.value) vault.withdraw();
    }
}`,
      },
    },
  },
};

export default content;
