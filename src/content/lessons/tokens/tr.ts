import type { LessonContent } from '../../../types';

// Rule for Turkish text: technical terms stay in English inside double quotes.
// [[term-id]] adds the quotes itself; suffixes go after the token: [[token]]'lar -> "token"'lar.

const content: LessonContent = {
  labels: {
    alice: 'Alice',
    bob: 'Bob',
    dex: 'DEX contract',
    tokenContract: 'Token contract',
    aliceWallet: 'Alice\'in wallet\'ı',
    bobWallet: 'Bob\'un wallet\'ı',
    walletCaption: 'wallet anahtar tutar, token değil',
    anyToken: 'herhangi bir ERC-20 token',
    oneWallet: 'tek wallet, aynı çağrılar',
    stored: 'saklanan',
    shown: 'gösterilen',
    supply: 'total supply',
    burnPit: 'yakılan',
    allowance: 'allowance',
    unlimitedShort: 'sınırsız',
    wethContract: 'WETH contract',
    ethInside: 'içindeki ETH',
    wethSupply: 'basılan WETH',
    offChain: 'resim başka bir yerde saklanır',
    errAllowance: 'allowance yetersiz',
    errBalance: 'bakiye yetersiz',
    errNotOwner: 'çağıran sahibi değil',
    event: 'event',
    result: 'sonuç',
    noCallYet: 'henüz çağrı yok',
    amount: 'Miktar',
    badAmount: 'geçerli bir miktar değil',
    to: 'alıcı',
    reset: 'Sıfırla',
    rawInteger: 'Saklanan tam sayı',
    approveAmount: 'Onay',
    unlimited: 'sınırsız',
    revoke: 'iptal et',
    dexTakes: 'DEX çeker',
    dexTakesAll: 'hepsini çeker',
    wrapped: 'Sarılan',
    lastCall: 'çağrı',
    backing: 'karşılık',
    caller: 'çağıran',
    asWho: 'çağıran:',
    bytes: 'bayt',
  },
  steps: {
    ledger: {
      title: 'Bir "token", bir tablodaki sayıdır',
      alt: 'Ortadaki bir pano üç satır gösteriyor: Alice, Bob ve DEX; her satırda bakiyesi kadar uzun bir çubuk var. Panonun yanında, onun sahibi olan token contract\'ı duruyor. Önde iki cüzdan var: biri Alice\'in, biri Bob\'un. Bir transfer gönderildiğinde Alice\'in cüzdanından contract\'a bir paket uçuyor, bir çubuk kısalıp diğeri uzuyor ve event panonun altında beliriyor. Miktar fazla büyükse contract kırmızıya dönüyor ve hiçbir şey kıpırdamıyor.',
      body: {
        beginner: `Cüzdanın bir [[token]]'dan 100 tane sahibi olduğunu söylediğinde, cüzdanın içinde duran 100 madeni para yoktur. Bir yerde, bir tablo tutan bir [[smart-contract]] vardır: şu adreste 100, bu adreste 20. Cüzdanın yalnızca senin satırını okur ve sana gösterir.

Bob'a [[token]] göndermek, o contract'tan senin satırından bir miktar düşmesini ve Bob'unkine eklemesini istemek demektir. Hiçbir şey bir yere gitmez. İki sayı değişir.

Bir miktar yaz ve **transfer** düğmesine bas. İki çubuğu ve contract'ın ne yaptığına dair yayımladığı notu izle. Sonra Alice'in sahip olduğundan fazlasını göndermeyi dene: contract reddeder ve hiçbir sayı değişmez.`,
        intermediate: `[[ether]], Ethereum'un içine gömülüdür: her hesabın, hesabın kendisinin bir parçası olan bir ETH bakiyesi vardır. Bir [[token]] ise farklıdır. Onu bir [[smart-contract]] oluşturur ve "bakiyen", o contract'ın depolamasında senin [[address]] değerinin altında duran tek bir kayıttır.

Bu yüzden bir [[token]] transferi, alıcıya değil, **token contract'ına** gönderilen bir [[transaction]]'dır. ETH taşımaz. [[calldata]]'sı şunu söyler: "\`transfer\` fonksiyonunu şu alıcı ve şu miktarla çalıştır". Contract da:

- gönderenin kaydının en az o miktar kadar olduğunu kontrol eder, değilse [[revert]] eder;
- miktarı gönderenin kaydından düşer ve alıcınınkine ekler;
- bir \`Transfer\` [[event-log]]'u yayımlar; cüzdanlar ve blok gezginleri bir şeyin hareket ettiğini böyle fark eder.

Alıcı hiçbir şey yapmaz ve çevrimiçi olması gerekmez. [[token]]'ların [[wallet]]'ında kendiliğinden belirebilmesi ve bir [[wallet]]'a bazen bir [[token]]'ı göstermesi için contract adresinin elle verilmesi de bu yüzdendir.`,
        expert: `Bütün defter tek bir "mapping"'dir: \`mapping(address account => uint256) _balances\`. OpenZeppelin'in v5 sürümünde her bakiye değişikliği \`_update(from, to, value)\` üzerinden geçer; gönderenin bakiyesi yetmezse bu fonksiyon \`ERC20InsufficientBalance(sender, balance, needed)\` özel hatasıyla (ERC-6093) [[revert]] eder.

Panel gerçek [[calldata]]'yı gösterir: "selector" \`0xa9059cbb\` = \`keccak256("transfer(address,uint256)")[0:4]\`, ardından soldan 32 bayta tamamlanmış alıcı, ardından taban birim cinsinden \`uint256\` olarak miktar (burada yazılan miktar × 10¹⁸).

[[event-log]]'un üç "topic"'i ve bir veri kelimesi vardır: \`topic0 = keccak256("Transfer(address,address,uint256)") = 0xddf252ad…523b3ef\`, "indexed" olan \`from\` ve \`to\`, veri kısmında da \`value\`. Bakiyeler zincir üzerinde listelenemez; bu yüzden sahip listeleri zincir dışında bu "log"'lardan yeniden kurulur.

Standardın şart koştuğu ve insanları şaşırtan şeyler: 0 değerinde bir transfer normal bir transferdir ve "event" yayımlamak zorundadır; ayrıca [[token]]'ları bir daha hareket ettiremeyecek bir adrese, örneğin bunun için fonksiyonu olmayan bir contract'a yapılan transferi hiçbir şey engellemez. Öyle [[token]]'lar orada kalır. [[erc-20]]'de alıcı tarafında bir "hook" yoktur; OpenZeppelin yalnızca \`address(0)\`'ı engeller.`,
      },
      code: {
        lang: 'Solidity',
        source: `// Bir ERC-20 token'ın özü, yalnızca transfer için gerekenlere indirgenmiş hali.
contract Token {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "balance too low");
        balanceOf[msg.sender] -= value;   // iki sayı değişir,
        balanceOf[to] += value;           // hiçbir şey bir yere gitmez
        emit Transfer(msg.sender, to, value);
        return true;
    }
}`,
      },
    },
    erc20: {
      title: '"ERC-20": her "token" için tek arayüz',
      alt: 'Solda, her birinin üzerinde farklı renkte bir madeni para duran üç küçük token contract\'ı, aynı tür çizgiyle tek bir cüzdana bağlı. Sağda bir sıra rakam karosu saklanan tam sayıyı gösteriyor; ondalık noktanın geleceği yerde parlayan bir işaret var. Decimals ayarını değiştirmek işareti sıra boyunca kaydırıyor ve altında gösterilen sayıyı değiştiriyor.',
      body: {
        beginner: `Farklı insanların yazdığı binlerce farklı [[token]] var. Yine de cüzdanın hepsini gösterebilir, bir borsa hepsini takas edebilir; çünkü hepsi aynı düğme takımında anlaşmıştır: "bu adresin bakiyesi ne?", "şu adrese şu kadar gönder" ve birkaç tane daha. Bu anlaşmanın adı [[erc-20]]'dir.

Prizler gibi düşün. Bütün aletlerin fişi aynı olunca her şey her yere takılır.

Ortak düğmelerden biri [[decimals]]'tır. Bir contract yalnızca tam sayı saklayabilir; bu yüzden bir [[token]], ondalık noktanın sağdan kaç basamak içeride olduğunu söyler. Sağdaki şerit saklanan bir sayıyı gösteriyor. 6 ile 18 arasında geçiş yap ve aynı rakamların nasıl bambaşka bir miktara dönüştüğünü izle.`,
        intermediate: `[[erc-20]], bir [[token]] contract'ının sahip olmayı taahhüt ettiği fonksiyon ve "event" listesidir. Temel olanlar:

- \`balanceOf(owner)\`: bir adresin tablodaki kaydı;
- \`transfer(to, value)\`: kendi [[token]]'larını gönder;
- \`totalSupply()\`: toplamda kaç tane var;
- \`approve\`, \`allowance\`, \`transferFrom\`: [[token]]'larını bir başkasının hareket ettirmesine izin ver (iki adım sonra);
- isteğe bağlı \`name()\`, \`symbol()\` ve \`decimals()\`.

Fonksiyon adları ve argüman tipleri sabit olduğu için, yıllar önce yazılmış bir [[wallet]], bir blok gezgini ya da bir [[dex]], bugün yüklenen bir [[token]] ile hiçbir değişiklik gerekmeden çalışır.

[[evm]]'de kesirli sayı yoktur; bu yüzden bakiyeler, [[token]]'ın en küçük biriminin tam sayı adedidir ve [[decimals]] yalnızca uygulamalara noktayı nereye koyacaklarını söyler. Çoğu [[token]], ETH ve wei gibi 18 kullanır. USDC ise 6 kullanır: saklanan 2.500.000 sayısı 2,5 USDC demektir. Aynı sayıyı 18 ondalıkla okursan 0,0000000000025 eder. Yanlış değeri varsayan bir uygulama bir trilyon kat yanılır.`,
        expert: `EIP-20'nin tam arayüzü, "selector"'larıyla birlikte (imzanın Keccak-256 [[hash]]'inin ilk 4 baytı):

- \`totalSupply()\` \`0x18160ddd\`, \`balanceOf(address)\` \`0x70a08231\`, \`allowance(address,address)\` \`0xdd62ed3e\`
- \`transfer(address,uint256)\` \`0xa9059cbb\`, \`approve(address,uint256)\` \`0x095ea7b3\`, \`transferFrom(address,address,uint256)\` \`0x23b872dd\`; her biri \`bool\` döndürür
- isteğe bağlı: \`name()\` \`0x06fdde03\`, \`symbol()\` \`0x95d89b41\`, \`uint8\` döndüren \`decimals()\` \`0x313ce567\`
- "event"'ler: \`Transfer(address indexed, address indexed, uint256)\` ve \`Approval(address indexed, address indexed, uint256)\`

Standart kısadır ve gerçek [[token]]'lar ondan sapar. Ezbere bilinmesi gereken entegrasyon tuzakları:

- **Dönüş değeri yok.** Bazı eski [[token]]'lar, ana ağdaki USDT dahil, \`transfer\` fonksiyonundan hiçbir şey döndürmez. \`returns (bool)\` tanımlayan bir arayüz üzerinden yapılan Solidity çağrısı o zaman dönüş verisini çözerken [[revert]] eder. OpenZeppelin'in \`SafeERC20\` kütüphanesi (\`safeTransfer\`, \`safeTransferFrom\`, \`forceApprove\`) hem "true döndü" hem de "hiçbir şey dönmedi" durumunu kabul eder.
- **"Fee on transfer".** Alıcıya \`value\` değerinden azı ulaşır. Argümana güvenmek yerine kendi bakiyeni önce ve sonra ölç.
- **"Rebasing".** Bakiyeler hiçbir transfer olmadan değişir; bir bakiyeyi önbelleğe alan contract gerçeklikten kopar. Protokoller çoğunlukla bunun yerine "rebase" etmeyen bir sarmalayıcıyı kabul eder.
- **Ondalık basamak.** [[decimals]] isteğe bağlıdır, her zaman 18 değildir ve var olacağı garanti değildir. Asla sabit yazma; iki [[token]]'ı birleştirirken açıkça ölçekle.

Paneldeki birim dönüşümü kayan noktalı sayılarla değil, tam sayılarla (\`BigInt\`) yapılır: 2²⁵⁶ − 1, 78 basamaklıdır; bu, bir "double"'ın tam olarak tutabileceğinin çok ötesindedir.`,
      },
      code: {
        lang: 'Solidity',
        source: `// EIP-20, arayüz olarak.
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// İsteğe bağlı, ama neredeyse her token'da var.
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

// gösterilen = saklanan / 10 ** decimals   (zincir dışında, insanlar için)
// 2_500_000, 6 decimals ile   ->  2.5
// 2_500_000, 18 decimals ile  ->  0.0000000000025`,
      },
    },
    supply: {
      title: '"Mint" ve "burn": "token"\'lar nereden gelir',
      alt: 'Yine bakiye panosu; bu kez yanında toplam arzı gösteren uzun turuncu bir sütun, önünde de yakılan token\'lar için koyu bir çukur var. Mint, panoya yukarıdan yeni bir token düşürüyor: Alice\'in çubuğu da arz sütunu da büyüyor. Burn bir token\'ı çukura gönderiyor: ikisi de küçülüyor.',
      body: {
        beginner: `[[token]]'ların baştan beri var olması gerekmez. Contract yenilerini oluşturabilir; buna [[mint]] denir. Var olanları yok da edebilir; buna [[burn]] denir.

[[mint]], [[token]]'ları bir yerden almaz. Contract birinin satırına daha büyük bir sayı yazar ve var olan bütün [[token]]'ların sayısı, yani [[total-supply]], aynı miktarda büyür. [[burn]] bunun tersidir.

**mint** ve **burn** düğmelerine bas ve uzun sütunu izle: her zaman bütün satırların toplamına eşittir. Sonra Alice'in hiçbir şeyi kalmayana kadar yak ve bir kez daha dene.

Kimin [[mint]] yapabildiği, bir [[token]]'ın en önemli kuralıdır; çünkü serbestçe basabilen biri, herkesin payını değersizleştirebilir.`,
        intermediate: `[[total-supply]], contract'taki bir sayı daha; kod onu bütün bakiyelerin toplamına eşit tutar:

- bir [[mint]], bir bakiyeye ve toplama ekler;
- bir [[burn]], bir bakiyeden ve toplamdan düşer;
- bir transfer iki bakiyeyi değiştirir, toplama dokunmaz.

İkisi de bildik \`Transfer\` [[event-log]]'unu yayımlar: bir [[mint]], sıfır adresinden **gelen** bir transfer olarak; bir [[burn]] ise sıfır adresine **giden** bir transfer olarak kaydedilir. Böylece yalnızca \`Transfer\` dinleyen bir uygulama bile bakiyelerdeki her değişikliği görür.

[[erc-20]]'nin kendisi kimin [[mint]] yapabileceğini söylemez. Her [[token]] buna kendi kodunda karar verir:

- [[deployment]] sırasında bir kez basılan, sonrasında [[mint]] fonksiyonu olmayan sabit bir arz;
- özel bir role sahip bir ihraççı; örneğin dolar geldiğinde basan, çıktığında yakan bir [[stablecoin]];
- kodda yazılı bir kural; örneğin bir havuza para yatırdığında basılan, çektiğinde yakılan bir [[lp-token]].

Bir [[token]]'a güvenmeden önce bunlardan hangisi olduğunu öğren.`,
        expert: `\`mint\` de \`burn\` de EIP-20'nin parçası değildir. Standart yalnızca, [[token]] oluşturan bir contract'ın \`_from\` alanı \`0x0\` olan bir \`Transfer\` yayımlaması gerektiğini (SHOULD) söyler. Buradaki düğmeler yaygın biçimleri çağırır: \`mint(address,uint256)\` (\`0x40c10f19\`) ve \`burn(uint256)\` (\`0x42966c68\`); gerçek [[token]]'lar bunları diledikleri gibi adlandırır ve korur.

OpenZeppelin v5'te \`_mint(to, value)\`, \`_update(address(0), to, value)\` demektir; \`_burn(from, value)\` ise \`_update(from, address(0), value)\`. \`_update\`, taraflardan biri sıfır adresiyse \`_totalSupply\` değerini ayarlar; arz üzerinde kontrollü aritmetik, bakiyelerde ise \`unchecked\` kullanır; hiçbir bakiye toplamı aşamayacağı için bu güvenlidir. Erişim denetimi, miras alan contract'a bırakılır: \`Ownable\`, \`AccessControl\` rolleri, bir üst sınır (\`ERC20Capped\`) ya da sahibin başlattığı \`burn\` ve "allowance" tabanlı \`burnFrom\` için \`ERC20Burnable\`.

Denetimlerde önem taşıyan iki ayrıntı:

- [[token]]'ları \`0x…dEaD\` gibi ölü bir adrese göndermek, contract açısından bir [[burn]] değildir: \`totalSupply()\` değişmez. Onu yalnızca \`_totalSupply\` değerini azaltan kod küçültür.
- Ayrıcalıklı bir basıcı, her sahibin üzerinde sınırsız bir haktır. Rolün kimde olduğunu, bir "timelock" ya da "multisig" arkasında durup durmadığını ve güncellenebilir bir "proxy"'nin sonradan bir [[mint]] fonksiyonu ekleyip ekleyemeyeceğini kontrol et.

Arzı çağrılarla değil formülle değişen [[token]]'lar ("rebasing"), bir ölçek katsayısı tutar ve \`balanceOf\` değerini anında hesaplar; böylece tek tek bakiyeler hiçbir \`Transfer\` olmadan değişir.`,
      },
      code: {
        lang: 'Solidity',
        source: `// OpenZeppelin Contracts v5'ten sadeleştirildi: her bakiye değişikliği tek yerde.
function _update(address from, address to, uint256 value) internal {
    if (from == address(0)) {
        _totalSupply += value;                     // mint
    } else {
        uint256 fromBalance = _balances[from];
        if (fromBalance < value) revert ERC20InsufficientBalance(from, fromBalance, value);
        unchecked { _balances[from] = fromBalance - value; }
    }

    if (to == address(0)) {
        unchecked { _totalSupply -= value; }       // burn
    } else {
        unchecked { _balances[to] += value; }
    }

    emit Transfer(from, to, value);                // mint ve burn için de
}

function _mint(address to, uint256 value) internal { _update(address(0), to, value); }
function _burn(address from, uint256 value) internal { _update(from, address(0), value); }`,
      },
    },
    approve: {
      title: '"approve" ve "transferFrom": bir contract\'ın senin adına harcaması',
      alt: 'Bakiye panosu; solda Alice, sağda bir borsa contract\'ı var. Aralarında, borsanın Alice\'ten ne kadar çekmeye izinli olduğunu gösteren bir gösterge duruyor. Onaylamak göstergeyi yükseltiyor; borsa her token çektiğinde panodan borsaya bir token uçuyor, Alice\'in çubuğu kısalıyor, DEX çubuğu uzuyor ve gösterge düşüyor. Sınırsız onayda gösterge kırmızıya dönüyor ve hiç düşmüyor.',
      body: {
        beginner: `Bir borsa, bir [[smart-contract]]'tır. [[token]]'larını takas edebilmesi için onları senden alması gerekir, ama [[token]] tablosundaki satırını yalnızca sen değiştirebilirsin. Bu yüzden [[token]]'larda ikinci bir mekanizma vardır: [[token]] contract'ına "bu borsa benim [[token]]'larımdan şu kadarına kadar alabilir" dersin. Bu izne [[allowance]] denir.

Kaydırıcıyı ayarla ve **approve** düğmesine bas: gösterge yükselir, ama henüz hiçbir [[token]] hareket etmez. Şimdi **DEX çeker 30** düğmesine bas. Borsa 30 çeker ve gösterge 30 düşer. Bir daha bas; başarısız olur, çünkü [[allowance]]'tan geriye kalan yetmez.

Şimdi **sınırsız** kutusunu işaretle ve yeniden onayla. Borsa, Alice'in sahip olduğu her şeyi alabilir; bugün de, bir yıl sonra da. Pek çok uygulama tam olarak bunu ister, çünkü sonradan seni bir adımdan kurtarır. O contract bir gün ele geçirilirse ya da baştan beri kötü niyetliyse [[token]]'ların gider. **İptal et**, izni yeniden sıfıra indirir.`,
        intermediate: `Bir contract'a [[ether]] ile ödeme yapmak kolaydır: ETH'yi çağrıya eklersin. Bir [[token]] ise çağrıya eklenemez. Borsanın senin adına \`transfer\` çağırması gerekirdi, ama [[token]] contract'ı yalnızca çağıranın kendi bakiyesini hareket ettirir.

[[erc-20]] bunu iki çağrıyla çözer:

- \`approve(spender, value)\`: senin tarafından **token** contract'ına gönderilir. Bir [[allowance]] kaydeder: "spender, benim [[token]]'larımdan en fazla \`value\` kadarını hareket ettirebilir". Cüzdanının onaylamanı istediği [[token-approval]] budur.
- \`transferFrom(from, to, value)\`: daha sonra harcayan tarafından gönderilir. [[token]] contract'ı [[allowance]]'ı kontrol eder, [[token]]'ları taşır ve [[allowance]]'ı \`value\` kadar azaltır.

Deneyebileceklerin ve gösterdikleri:

- 40 onayla, sonra iki kez 30 çek: ikinci çağrı [[revert]] eder, [[allowance]] yetersizdir;
- 40 onayla, sonra **hepsini çeker**: bu da başarısız olur. Alice'in 100'ü var ve borsa 40'ını taşıyabilir; yani tam miktarlı bir [[allowance]], ters gidebilecek şeyi sınırlar;
- **sınırsız** seç, sonra **hepsini çeker**: bütün [[token]]'lar gider ve [[allowance]] sonrasında hâlâ sınırsızdır.

Bir [[allowance]], sen değiştirene kadar kalır. Tek bir takasa bağlı değildir ve sonradan aldığın [[token]]'ları da kapsar. Yeniden onaylamak eski değerin **yerine geçer**; 0 onaylamak ise izni iptal eder.`,
        expert: `"Allowance"'lar şöyle saklanır: \`mapping(address owner => mapping(address spender => uint256))\`. "Sınırsız", \`type(uint256).max\` demektir: paneldeki calldata \`0x095ea7b3\`, harcayan adres ve 32 bayt \`ff\`'ten oluşur. OpenZeppelin, bu değerdeki bir [[allowance]]'ı \`transferFrom\` içinde azaltmaz; bu, her takasta bir depolama yazmasından tasarruf sağlar. v5 ayrıca \`transferFrom\` bir [[allowance]] harcadığında \`Approval\` "event"'i yayımlamaz. Yetersizlik \`ERC20InsufficientAllowance(spender, allowance, needed)\` ile [[revert]] eder ve [[allowance]], bakiyeden önce kontrol edilir.

**"approve" yarışı.** Bir [[allowance]]'ı tek bir \`approve\` ile N'den M'ye değiştirmek, bekleyen işlemi gören bir harcayıcının önce N'yi, sonra M'yi de harcamasına olanak tanır. EIP-20'nin kendisi, yeni bir değer vermeden önce [[allowance]]'ı 0'a çekmeyi önerir. Bazı [[token]]'lar bunu zorunlu kılar: USDT, sıfır olmayan bir değerden sıfır olmayan başka bir değere yapılan \`approve\` çağrısında [[revert]] eder; \`SafeERC20.forceApprove\` bunun etrafından dolaşır. \`increaseAllowance\` / \`decreaseAllowance\` hiçbir zaman standardın parçası olmadı ve OpenZeppelin onları v5'te kaldırdı.

**"Permit" (EIP-2612).** \`permit(owner, spender, value, deadline, v, r, s)\`, [[allowance]]'ı sahibin bir işlemiyle değil, bir EIP-712 imzasıyla ayarlar; sahip başına tutulan \`nonces\` sayacı ve \`DOMAIN_SEPARATOR\` ile korunur. Böylece onay ve kullanım, ücretini başkasının ödediği tek bir işlemde gerçekleşebilir. Bedeli şudur: imza atmak hiçbir şeye mal olmaz, dolayısıyla bir imzayı oltayla ele geçirmek kurbana baştan hiçbir şey ödetmez.

Onaylar, [[token]] sahipleri için başlıca kalıcı risktir: harcayanın kodu, o kodun herhangi bir güncellemesi dahil, onaylanan miktarı her an hareket ettirebilir. Tam miktarlı onaylar ve düzenli iptal, zararı sınırlar.`,
      },
      code: {
        lang: 'Solidity',
        source: `// OpenZeppelin Contracts v5'ten sadeleştirildi.
mapping(address owner => mapping(address spender => uint256)) private _allowances;

function approve(address spender, uint256 value) public returns (bool) {
    _allowances[msg.sender][spender] = value;      // üstüne yazar, asla eklemez
    emit Approval(msg.sender, spender, value);
    return true;
}

function transferFrom(address from, address to, uint256 value) public returns (bool) {
    uint256 current = _allowances[from][msg.sender];
    if (current != type(uint256).max) {            // "sınırsız" hiç azaltılmaz
        if (current < value) revert ERC20InsufficientAllowance(msg.sender, current, value);
        unchecked { _allowances[from][msg.sender] = current - value; }
    }
    _update(from, to, value);                      // bakiye yetmezse revert eder
    return true;
}

// EIP-2612: aynı allowance, bir işlem yerine bir imzayla ayarlanır.
function permit(address owner, address spender, uint256 value, uint256 deadline,
                uint8 v, bytes32 r, bytes32 s) external;`,
      },
    },
    kinds: {
      title: '"Stablecoin"\'ler, "wrapped token"\'lar ve "LP token"\'lar',
      alt: 'Alice solda, bir yığın ETH parası ve bir yığın WETH token\'ı ile duruyor. Ortada WETH contract\'ı, yanında eşit yükseklikte iki yığın var: contract\'ın tuttuğu ETH ve bastığı WETH. Kaydırıcıyı oynatmak Alice ile contract arasında bir paket gönderiyor; Alice\'in iki yığını tek tek yer değiştiriyor, contract\'ın yanındaki iki yığın birlikte yükselip alçalıyor.',
      body: {
        beginner: `Aynı tür tablo çok farklı şeyleri temsil edebilir.

- Bir [[stablecoin]], değeri bir dolarda kalması amaçlanan bir [[token]]'dır. Çoğunlukla bir şirket gerçek dolar tutar ve her biri için bir [[token]] çıkarır.
- Bir [[wrapped-token]], başka bir varlığın bire bir yerine geçen bir [[token]]'dır. Varlığı bir contract'a verirsin ve sarılmış halini alırsın; onu geri verirsen aslını alırsın.
- Bir [[lp-token]], bir borsadaki havuzda sahip olduğun payın makbuzudur. Uniswap dersleri bunu kullanır.

Sahne sarmalamayı gösteriyor. ETH'nin kendisi bu türden bir [[token]] değildir; bu yüzden pek çok uygulama WETH, yani "wrapped ETH" kullanır. Kaydırıcıyı oynat: Alice'in koyduğu her ETH bir WETH olur, geri de döner. Contract'ın yanındaki iki yığını izle. Her zaman aynı yüksekliktedirler; bütün vaat de budur: her WETH'nin arkasında gerçek bir ETH vardır.`,
        intermediate: `[[stablecoin]]'lerin iki ana tasarımı vardır. USDC ya da USDT gibi itibari para karşılıklı olanlarda, dolar ve kısa vadeli devlet borcu tutan bir ihraççı vardır; para geldiğinde [[mint]], geri ödendiğinde [[burn]] yapar. İhraççıya güvenirsin; o ayrıca bir [[address]]'i dondurabilir. DAI gibi kripto karşılıklı olanlar ise bir [[smart-contract]] tarafından, oluşturulan [[token]]'lardan daha değerli bir teminata karşı basılır; teminatın değeri fazla düşerse teminat kendiliğinden satılır.

[[wrapped-token]]'lar, [[ether]]'in [[erc-20]]'den eski olması ve ona uymaması yüzünden vardır: \`transferFrom\` fonksiyonu da [[allowance]]'ı da yoktur. WETH contract'ı bunu çözer. \`deposit()\`, ETH'ni alır ve aynı miktarda WETH yazar; \`withdraw(amount)\`, WETH'yi yok eder ve ETH'yi geri gönderir. Ücret yok, fiyat yok, sahip yok. Contract'ın ETH bakiyesi her zaman var olan WETH miktarına eşittir.

Başka zincirlerden gelen sarılmış varlıklar, örneğin bitcoin için WBTC, yüzeyde aynı görünür; ama asıl varlığı başka bir yerde tutan bir saklayıcıya dayanır.

[[lp-token]]'lar, para yatırdığında bir havuz tarafından basılır, çektiğinde yakılır. Üçü de sıradan [[erc-20]] [[token]]'ları olduğu için, nasıl üretildiklerinden habersiz uygulamalar bunların hepsini takas edebilir, ödünç verebilir ya da teminat olarak kullanabilir.`,
        expert: `Ana ağdaki standart contract olan WETH9 (\`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\`) yaklaşık 60 satırdır. \`deposit()\` (\`0xd0e30db0\`, payable) şunu yapar: \`balanceOf[msg.sender] += msg.value\`; "fallback" da onu çağırır, yani contract'a doğrudan gönderilen ETH de sarılır. \`withdraw(uint wad)\` (\`0x2e1a7d4d\`) bakiyeyi kontrol edip düşer, sonra \`msg.sender.transfer(wad)\` çağırır: etkileşimden önce kayıt, artı 2.300 gas'lık "stipend". \`totalSupply()\` doğrudan \`address(this).balance\` değeridir; contract, sıfır adresinden ya da sıfır adresine \`Transfer\` yerine \`Deposit\` / \`Withdrawal\` yayımlar, dolayısıyla arzı yalnızca \`Transfer\` "log"'larıyla izlemek onda çalışmaz. 18 [[decimals]] kullanır ve \`permit\` fonksiyonu yoktur.

Buradaki kaydırıcı gerçek çağrıları üretir: sağa çekmek \`msg.value\` taşıyan \`deposit()\`, sola çekmek sıfır değerli \`withdraw(wad)\` çağrısıdır.

Uniswap v2 ve v3 havuzları WETH tutar, "router"'ları da bir takasın çevresinde sarıp açar; v4 ise [[native-eth]]'i doğrudan destekler.

Entegrasyon hedefi olarak [[stablecoin]]'ler: USDC 6 [[decimals]] kullanır, güncellenebilir bir "proxy" arkasındadır ve listelenen adresler için \`transfer\` çağrısını [[revert]] ettiren bir kara listesi vardır; USDT ise önceki adımlardaki eksik dönüş değeri ve "approve" tuhaflıklarını taşır. "1 token = 1 dolar" ifadesine koddaki bir sabit gibi değil, oynayabilen bir fiyat gibi davran.

Getiri taşıyan ve kasa türü [[token]]'lar bir katman daha ekler: ERC-4626, payları birer [[erc-20]] olan ve varlık biriktikçe pay fiyatı yükselen bir kasayı standartlaştırır; bu da "rebasing"'e gerek bırakmaz. Her sarmalayıcı için sorular aynıdır: arkasında ne var, kim [[mint]] yapabilir ve geri ödeme durdurulabilir mi.`,
      },
      code: {
        lang: 'Solidity',
        source: `// WETH9, kısaltılmış (yüklendiği haliyle Solidity 0.4 sözdizimi).
contract WETH9 {
    string public name     = "Wrapped Ether";
    string public symbol   = "WETH";
    uint8  public decimals = 18;

    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    mapping (address => uint) public balanceOf;

    function() public payable { deposit(); }       // düz ETH de sarılır

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;        // 1 ETH girer, 1 WETH yazılır
        Deposit(msg.sender, msg.value);
    }

    function withdraw(uint wad) public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;              // önce WETH yok edilir,
        msg.sender.transfer(wad);                  // sonra ETH geri gönderilir
        Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint) {
        return this.balance;                       // karşılık ve arz tek bir sayıdır
    }
}`,
      },
    },
    nft: {
      title: '"NFT"\'ler: her "token id" için tek sahip',
      alt: 'İki platform: biri Alice\'in, biri Bob\'un. Üzerlerinde 1\'den 4\'e numaralanmış, farklı biçimlerde dört nesne duruyor: her biri bir token id. Seçilen nesne yükselip parlıyor ve ondan, resminin ve açıklamasının tutulduğu arkadaki küçük bir sunucuya kesikli bir çizgi uzanıyor. Transfer, o tek nesneyi diğer platforma taşıyor; çağıran onun sahibi değilse etiketi kırmızıya dönüyor ve nesne yerinde kalıyor.',
      body: {
        beginner: `Şimdiye kadarki [[token]]'larda her birim bir diğeriyle aynıydı, para gibi. Bazı şeyler ise böyle değildir: 14 numaralı koltuğun konser bileti, bir evin tapusu, bir sanat eseri. Bunlar için [[nft]] vardır, yani "non-fungible token": her biri numaralıdır ve tam olarak bir sahibi vardır.

Contract'ın tablosu tersine çevrilmiştir. "Kimde kaç tane var" yerine "1 numaranın sahibi kim, 2 numaranın sahibi kim" diye tutar.

Bir numara seç ve onu transfer et. Bir miktarın değil, belirli tek bir nesnenin hareket ettiğine dikkat et. Sonra Bob'a ait olan 3 numarayı seç ve onu Alice olarak taşımayı dene. Contract reddeder.

Dikkat edilecek bir şey daha: kesikli çizgi. Bir [[nft]] için gördüğün resim çoğunlukla [[blockchain]] üzerinde **değildir**. Contract yalnızca ona giden bir bağlantıyı saklar.`,
        intermediate: `Bir [[nft]]'nin standardı [[erc-721]]'dir. Merkezdeki fonksiyon \`ownerOf(tokenId)\`'dir ve tek bir [[address]] döndürür. \`balanceOf(owner)\` hâlâ vardır, ama yalnızca bir adresin kaç "id" tuttuğunu sayar; hangileri olduğunu söylemez.

Bir transfer, "id"'yi adıyla belirtir: \`transferFrom(from, to, tokenId)\`. Contract, çağıranın sahip olduğunu (ya da sahibi tarafından onaylandığını) kontrol eder ve o tek "id"'nin sahibini yeniden yazar. Miktar yoktur, bölünecek bir şey de yoktur.

[[token]]'ın **ne olduğu** ise üst veriden gelir. \`tokenURI(tokenId)\`, içinde bir ad, bir açıklama ve bir resim bağlantısı bulunan küçük bir JSON dosyasına giden bağlantıyı döndürür. Bu dosyaların nerede durduğu önemlidir:

- bir şirketin web sunucusunda: değiştirilebilir ya da kaybolabilir;
- IPFS üzerinde; orada bağlantı, içeriğin bir [[hash]]'idir: başka bir şeyle değiştirilemez, ama yalnızca biri barındırmayı sürdürdükçe erişilebilir kalır;
- tamamen zincir üzerinde: nadirdir, çünkü depolama pahalıdır.

[[token]]'ın sahibi olmak, contract'ın seni sahibi olarak listelemesi demektir. Tek başına sana resmin telif hakkını vermez.

ERC-1155, birçok "id"'yi tek bir contract'a koyan ve her "id"'ye bir bakiye veren daha yeni bir standarttır; böylece tek bir contract hem eşsiz nesneleri hem de bin tane bulunan nesneleri tutabilir ve birkaçını tek çağrıda taşıyabilir. [[nft]]'ler sanat dışındaki şeyler için de kullanılır: bir Uniswap v3 pozisyonu da bir [[nft]]'dir ([[nft-position]] terimine bak).`,
        expert: `[[erc-721]]'in tamamı:

- \`balanceOf(address)\`, \`ownerOf(uint256)\`
- \`transferFrom(address,address,uint256)\` \`0x23b872dd\`, \`safeTransferFrom(address,address,uint256)\` \`0x42842e0e\` ve \`safeTransferFrom(address,address,uint256,bytes)\` \`0xb88d4fde\`
- \`approve(address,uint256)\`, \`getApproved(uint256)\`, \`setApprovalForAll(address,bool)\` \`0xa22cb465\`, \`isApprovedForAll(address,address)\`
- "event"'ler: \`Transfer(address indexed, address indexed, uint256 indexed tokenId)\`, \`Approval(…)\` ve \`ApprovalForAll(address indexed, address indexed, bool)\`
- ERC-165 \`supportsInterface\`: ERC-721 için \`0x80ac58cd\`, üst veri eklentisi (\`name\`, \`symbol\`, \`tokenURI\`) için \`0x5b5e139f\`

\`transferFrom\`, [[erc-20]]'dekiyle aynı imzaya, dolayısıyla aynı "selector"'a sahiptir; \`Transfer\` "event"'inin \`topic0\` değeri de aynıdır. Fark, burada üçüncü argümanın "indexed" olmasıdır: bir [[nft]] için dört "topic", bir ERC-20 için üç. "Indexer"'lar ikisini buradan ayırt eder.

\`safeTransferFrom\`, düz \`transferFrom\` bir [[nft]]'yi onu hiçbir zaman hareket ettiremeyecek bir contract'a seve seve gönderdiği için vardır. Transferden sonra alıcının kodu varsa \`onERC721Received(operator, from, tokenId, data)\` çağrılır ve dönüş değeri o fonksiyonun "selector"'ı olan \`0x150b7a02\` değilse işlem [[revert]] eder. Bu geri çağrı, transferin ortasında yapılan bir dış çağrıdır, yani bir [[reentrancy]] giriş noktasıdır: onu kullanan "mint" ve transfer fonksiyonları önce durumu güncellemelidir.

\`setApprovalForAll(operator, true)\`, sınırsız onayın [[nft]] karşılığıdır: operatör, o koleksiyonda sahip olduğun her [[token]]'ı şimdi de sonra da taşıyabilir. Pazar yerleri buna dayanır; [[nft]] hırsızlıklarının çoğu da.

ERC-1155: \`balanceOf(address,uint256)\`, \`safeTransferFrom(address,address,uint256,uint256,bytes)\`, \`safeBatchTransferFrom\`, \`TransferSingle\` / \`TransferBatch\` "event"'leri ve istemcilerin \`{id}\` yerine 64 basamaklı küçük harfli onaltılık "id"'yi koyduğu tek bir \`uri(id)\` şablonu. \`ownerOf\` fonksiyonu yoktur.`,
      },
      code: {
        lang: 'Solidity',
        source: `// OpenZeppelin'in IERC721 arayüzündeki gibi. (EIP ayrıca transfer fonksiyonlarını ve approve'u payable olarak işaretler.)
interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;

    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

// safeTransferFrom ile NFT almak isteyen bir contract:
interface IERC721Receiver {
    // 0x150b7a02 döndürmelidir: kendi selector'ı
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external returns (bytes4);
}

// tokenURI(2) -> "ipfs://<hash>/2.json" -> { "name": "...", "description": "...", "image": "ipfs://..." }`,
      },
    },
  },
};

export default content;
