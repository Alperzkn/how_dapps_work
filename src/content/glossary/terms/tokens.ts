import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'total-supply',
    name: 'total supply',
    category: 'dapps',
    related: ['mint', 'burn', 'erc-20', 'token'],
    lesson: 'tokens',
    en: {
      short: 'How many units of a token exist right now: the sum of every balance, kept as one number in the token contract.',
      long: `An [[erc-20]] contract reports its total supply through \`totalSupply()\`. A transfer never changes it; only a [[mint]] raises it and only a [[burn]] lowers it.

It is given in the token's smallest unit, so it has to be divided by 10 to the power of [[decimals]] to get the figure people quote.

Some tokens have a fixed supply set once at [[deployment]]. Others grow or shrink under rules written in the contract or at the decision of an issuer. Which of these applies tells you a lot about a [[token]].`,
    },
    tr: {
      short: 'Bir [[token]]\'dan şu an kaç birim bulunduğu: bütün bakiyelerin toplamı; [[token]] contract\'ında tek bir sayı olarak tutulur.',
      long: `Bir [[erc-20]] contract'ı toplam arzını \`totalSupply()\` ile bildirir. Bir transfer onu hiç değiştirmez; yalnızca bir [[mint]] yükseltir, yalnızca bir [[burn]] düşürür.

[[token]]'ın en küçük birimi cinsinden verilir; insanların söylediği rakamı bulmak için 10 üzeri [[decimals]] değerine bölmek gerekir.

Bazı [[token]]'ların arzı sabittir ve [[deployment]] sırasında bir kez belirlenir. Bazılarınınki ise contract'ta yazılı kurallara ya da bir ihraççının kararına göre büyür ya da küçülür. Bunlardan hangisinin geçerli olduğu, bir [[token]] hakkında çok şey söyler.`,
    },
  },
  {
    id: 'mint',
    name: 'mint',
    category: 'dapps',
    related: ['burn', 'total-supply', 'token', 'erc-20'],
    lesson: 'tokens',
    en: {
      short: 'To create new tokens: the contract increases one balance and the total supply by the same amount.',
      long: `Minting does not move tokens from somewhere else. The [[token]] contract writes a larger balance for an [[address]] and adds the same amount to the [[total-supply]].

An [[erc-20]] mint is announced as a \`Transfer\` [[event-log]] from the zero address. For an [[nft]], minting creates a new token id and gives it its first owner.

The standards do not say who may mint. A token may mint its whole supply once, give the right to an issuer, or mint by a rule in code, as a pool does with its [[lp-token]]. Unrestricted minting power lets its holder dilute everyone else.`,
    },
    tr: {
      short: 'Yeni [[token]] oluşturmak: contract, bir bakiyeyi ve toplam arzı aynı miktarda artırır.',
      long: `[[mint]], [[token]]'ları başka bir yerden taşımaz. [[token]] contract'ı bir [[address]] için daha büyük bir bakiye yazar ve aynı miktarı [[total-supply]]'a ekler.

Bir [[erc-20]] [[mint]]'i, sıfır adresinden gelen bir \`Transfer\` [[event-log]]'u olarak duyurulur. Bir [[nft]] için [[mint]], yeni bir "token id" oluşturur ve ona ilk sahibini verir.

Standartlar kimin [[mint]] yapabileceğini söylemez. Bir [[token]] bütün arzını bir kerede basabilir, bu hakkı bir ihraççıya verebilir ya da bir havuzun [[lp-token]] ile yaptığı gibi koddaki bir kurala göre basabilir. Kısıtsız basma yetkisi, sahibinin herkesin payını sulandırmasına olanak verir.`,
    },
  },
  {
    id: 'burn',
    name: 'burn',
    category: 'dapps',
    related: ['mint', 'total-supply', 'token', 'erc-20'],
    lesson: 'tokens',
    en: {
      short: 'To destroy tokens: the contract reduces one balance and the total supply by the same amount.',
      long: `Burning is the opposite of a [[mint]]. The [[token]] contract subtracts from a holder's balance and from the [[total-supply]], and announces it as a \`Transfer\` [[event-log]] to the zero address.

It is how a redeemable token keeps its books straight: a [[stablecoin]] is burned when its dollars are paid back out, a [[wrapped-token]] when the underlying asset is released, an [[lp-token]] when liquidity is withdrawn.

Sending tokens to an address nobody controls takes them out of circulation, but it is not a burn in the contract's accounting: the total supply stays the same.`,
    },
    tr: {
      short: '[[token]]\'ları yok etmek: contract, bir bakiyeyi ve toplam arzı aynı miktarda azaltır.',
      long: `[[burn]], bir [[mint]]'in tersidir. [[token]] contract'ı, sahibin bakiyesinden ve [[total-supply]]'dan düşer ve bunu sıfır adresine giden bir \`Transfer\` [[event-log]]'u olarak duyurur.

Geri ödenebilir bir [[token]] hesaplarını böyle doğru tutar: bir [[stablecoin]], karşılığındaki dolar geri ödendiğinde; bir [[wrapped-token]], asıl varlık serbest bırakıldığında; bir [[lp-token]] ise likidite çekildiğinde yakılır.

[[token]]'ları kimsenin kontrol etmediği bir adrese göndermek onları dolaşımdan çıkarır, ama contract'ın muhasebesinde bu bir [[burn]] değildir: toplam arz aynı kalır.`,
    },
  },
  {
    id: 'decimals',
    name: 'decimals',
    category: 'dapps',
    related: ['erc-20', 'token', 'total-supply', 'ether'],
    lesson: 'tokens',
    en: {
      short: 'How many digits from the right the decimal point goes when a token\'s stored whole number is shown to people.',
      long: `Contracts cannot store fractions, so a [[token]] balance is a whole number of the token's smallest unit. \`decimals()\` tells wallets and apps how to display it: shown amount = stored number ÷ 10^decimals.

Most tokens use 18, the same as [[ether]] and its wei. USDC and USDT use 6, WBTC uses 8. The stored number 2,500,000 is 2.5 with 6 decimals and 0.0000000000025 with 18.

The value has no effect inside the token contract; it is only a hint for display. Code that combines two tokens must scale by each one's decimals, and must not assume 18.`,
    },
    tr: {
      short: 'Bir [[token]]\'ın saklanan tam sayısı insanlara gösterilirken ondalık noktanın sağdan kaç basamak içeriye konacağı.',
      long: `Contract'lar kesirli sayı saklayamaz; bu yüzden bir [[token]] bakiyesi, o [[token]]'ın en küçük biriminin tam sayı adedidir. \`decimals()\`, cüzdanlara ve uygulamalara onu nasıl göstereceklerini söyler: gösterilen miktar = saklanan sayı ÷ 10^decimals.

Çoğu [[token]] 18 kullanır; [[ether]] ve wei ile aynı. USDC ve USDT 6, WBTC ise 8 kullanır. Saklanan 2.500.000 sayısı 6 ondalıkla 2,5; 18 ondalıkla 0,0000000000025 eder.

Bu değerin [[token]] contract'ının içinde hiçbir etkisi yoktur; yalnızca gösterim için bir ipucudur. İki [[token]]'ı birleştiren kod her birinin [[decimals]] değerine göre ölçeklemeli ve 18 varsaymamalıdır.`,
    },
  },
  {
    id: 'allowance',
    name: 'allowance',
    category: 'dapps',
    related: ['token-approval', 'erc-20', 'token', 'smart-contract'],
    lesson: 'tokens',
    en: {
      short: 'The amount of your tokens that another address is currently permitted to move, as recorded in the token contract.',
      long: `An [[erc-20]] contract keeps, for every owner and every spender, a number: how much of the owner's balance the spender may still transfer. You set it with \`approve(spender, value)\`; this is the [[token-approval]] a wallet asks you to sign.

The spender uses it by calling \`transferFrom\`, and each use reduces the allowance. It stays in place until it is used up or you change it. Approving again replaces the old value, and approving zero revokes it.

Apps often request the largest possible number so they never have to ask again. Such an unlimited allowance does not run down and covers tokens you receive later, so a flaw in the spender contract puts your whole balance of that [[token]] at risk.`,
    },
    tr: {
      short: '[[token]]\'larından başka bir adresin şu an hareket ettirmeye izinli olduğu miktar; [[token]] contract\'ında kayıtlıdır.',
      long: `Bir [[erc-20]] contract'ı, her sahip ve her harcayan için bir sayı tutar: harcayanın, sahibin bakiyesinden daha ne kadarını aktarabileceği. Bunu \`approve(spender, value)\` ile ayarlarsın; cüzdanın imzalamanı istediği [[token-approval]] budur.

Harcayan onu \`transferFrom\` çağırarak kullanır ve her kullanım [[allowance]]'ı azaltır. Tükenene ya da sen değiştirene kadar yerinde durur. Yeniden onaylamak eski değerin yerine geçer, sıfır onaylamak ise iptal eder.

Uygulamalar çoğu zaman bir daha sormak zorunda kalmamak için mümkün olan en büyük sayıyı ister. Böyle sınırsız bir [[allowance]] azalmaz ve sonradan aldığın [[token]]'ları da kapsar; bu yüzden harcayan contract'taki bir açık, o [[token]]'daki bütün bakiyeni riske atar.`,
    },
  },
  {
    id: 'stablecoin',
    name: 'stablecoin',
    category: 'defi',
    related: ['token', 'erc-20', 'mint', 'burn', 'decimals'],
    lesson: 'tokens',
    en: {
      short: 'A token designed to keep a steady value, almost always one US dollar.',
      long: `A stablecoin is an ordinary [[token]] whose issuer or mechanism tries to hold its price at a fixed value. People use it to hold dollars on a [[blockchain]], and most trading pairs are quoted against one.

Fiat-backed stablecoins such as USDC and USDT are issued by a company that holds dollars and similar assets, and that performs a [[mint]] when money comes in and a [[burn]] when it is redeemed. Crypto-backed ones such as DAI are minted by a [[smart-contract]] against collateral worth more than the tokens created.

The peg is a promise, not a law. A fiat-backed coin depends on its issuer's reserves and can be frozen; a crypto-backed one depends on its collateral and its liquidation rules. Either can trade away from one dollar.`,
    },
    tr: {
      short: 'Değerini sabit tutmak için tasarlanmış bir [[token]]; neredeyse her zaman bir ABD doları.',
      long: `Bir [[stablecoin]], ihraççısının ya da mekanizmasının fiyatını sabit bir değerde tutmaya çalıştığı sıradan bir [[token]]'dır. İnsanlar onu bir [[blockchain]] üzerinde dolar tutmak için kullanır; işlem çiftlerinin çoğu da bir [[stablecoin]] karşısında fiyatlanır.

USDC ve USDT gibi itibari para karşılıklı olanlar, dolar ve benzeri varlıklar tutan bir şirket tarafından çıkarılır; şirket para geldiğinde [[mint]], geri ödendiğinde [[burn]] yapar. DAI gibi kripto karşılıklı olanlar ise bir [[smart-contract]] tarafından, oluşturulan [[token]]'lardan daha değerli bir teminata karşı basılır.

Sabit kur bir vaattir, bir yasa değil. İtibari para karşılıklı olan, ihraççının rezervlerine bağlıdır ve dondurulabilir; kripto karşılıklı olan ise teminatına ve tasfiye kurallarına bağlıdır. İkisi de bir dolardan uzaklaşabilir.`,
    },
  },
  {
    id: 'wrapped-token',
    name: 'wrapped token',
    category: 'defi',
    related: ['erc-20', 'ether', 'token', 'mint', 'burn', 'native-eth'],
    lesson: 'tokens',
    en: {
      short: 'A token that stands in for another asset one for one, so that the asset can be used wherever tokens of that standard are expected.',
      long: `You hand the original asset to a contract or a custodian and receive the same amount of the wrapped [[token]]. Returning the wrapped token gives the original back. Wrapping is a [[mint]], unwrapping a [[burn]].

The best-known example is WETH. [[ether]] predates [[erc-20]] and does not follow it, so apps built for ERC-20 tokens use WETH instead. The WETH contract holds exactly as much ETH as there is WETH, with no operator and no fee.

Wrapped assets from other chains, such as WBTC for [[bitcoin]], work differently underneath: a custodian or a bridge holds the real asset elsewhere, and the wrapped token is only as good as that arrangement.`,
    },
    tr: {
      short: 'Başka bir varlığın bire bir yerine geçen bir [[token]]; böylece o varlık, o standarttaki [[token]]\'ların beklendiği her yerde kullanılabilir.',
      long: `Asıl varlığı bir contract'a ya da bir saklayıcıya verirsin ve aynı miktarda sarılmış [[token]] alırsın. Sarılmış [[token]]'ı geri vermek aslını geri getirir. Sarmak bir [[mint]], açmak bir [[burn]]'dür.

En bilinen örnek WETH'dir. [[ether]], [[erc-20]]'den eskidir ve ona uymaz; bu yüzden ERC-20 [[token]]'ları için yazılmış uygulamalar onun yerine WETH kullanır. WETH contract'ı, var olan WETH kadar ETH tutar; ne bir işletmecisi ne de bir ücreti vardır.

Başka zincirlerden gelen sarılmış varlıklar, örneğin Bitcoin için WBTC, altta farklı çalışır: asıl varlığı başka bir yerde bir saklayıcı ya da bir köprü tutar ve sarılmış [[token]] ancak o düzen kadar sağlamdır.`,
    },
  },
  {
    id: 'nft',
    name: 'NFT',
    category: 'dapps',
    related: ['erc-721', 'token', 'nft-position', 'mint', 'smart-contract'],
    lesson: 'tokens',
    en: {
      short: 'Non-fungible token: a token that is one of a kind. Each has its own id and exactly one owner.',
      long: `Units of an ordinary [[token]] are interchangeable, like money. An NFT is not: token number 7 is a different thing from token number 8. The contract records, for every id, which [[address]] owns it.

What an NFT represents is described by metadata that the contract points to: usually a name, a description and a picture. That data is often stored off chain, so it is worth checking where and whether it can change.

NFTs are used for art and collectibles, but also for plain bookkeeping where each item differs: tickets, names, and positions in financial protocols such as an [[nft-position]] in Uniswap v3. Most follow the [[erc-721]] standard.`,
    },
    tr: {
      short: '"Non-fungible token": eşi olmayan bir [[token]]. Her birinin kendi "id" değeri ve tam olarak bir sahibi vardır.',
      long: `Sıradan bir [[token]]'ın birimleri, para gibi, birbirinin yerine geçer. Bir [[nft]] öyle değildir: 7 numaralı [[token]], 8 numaralıdan farklı bir şeydir. Contract, her "id" için onun hangi [[address]]'e ait olduğunu kaydeder.

Bir [[nft]]'nin neyi temsil ettiği, contract'ın işaret ettiği üst veriyle anlatılır: çoğunlukla bir ad, bir açıklama ve bir resim. Bu veri sıklıkla zincir dışında saklanır; bu yüzden nerede durduğuna ve değişip değişemeyeceğine bakmaya değer.

[[nft]]'ler sanat ve koleksiyon için kullanılır, ama her kalemin farklı olduğu düz kayıt işleri için de kullanılır: biletler, adlar ve Uniswap v3'teki [[nft-position]] gibi finansal protokol pozisyonları. Çoğu [[erc-721]] standardına uyar.`,
    },
  },
  {
    id: 'erc-721',
    name: 'ERC-721',
    category: 'dapps',
    related: ['nft', 'erc-20', 'token', 'allowance'],
    lesson: 'tokens',
    en: {
      short: 'The standard interface for NFTs on Ethereum: every token id has one owner, and a fixed set of functions reads and transfers them.',
      long: `ERC-721 does for an [[nft]] what [[erc-20]] does for interchangeable tokens: it fixes the function names, so any wallet or marketplace can work with any collection.

The central functions are \`ownerOf(tokenId)\`, which returns the single owner of an id, and \`transferFrom(from, to, tokenId)\`, which moves one id. \`balanceOf(owner)\` only counts how many ids an address holds. An optional extension adds \`tokenURI(tokenId)\`, a link to the token's metadata.

Owners can approve another address for one token, or for all their tokens in the collection with \`setApprovalForAll\`. \`safeTransferFrom\` additionally checks that a receiving contract declares it can handle NFTs, so tokens are not stranded.`,
    },
    tr: {
      short: 'Ethereum\'da [[nft]]\'ler için standart arayüz: her "token id" değerinin tek bir sahibi vardır ve sabit bir fonksiyon takımı onları okur ve aktarır.',
      long: `[[erc-721]], birbirinin yerine geçen [[token]]'lar için [[erc-20]] ne yapıyorsa bir [[nft]] için onu yapar: fonksiyon adlarını sabitler; böylece her cüzdan ya da pazar yeri her koleksiyonla çalışabilir.

Merkezdeki fonksiyonlar, bir "id"'nin tek sahibini döndüren \`ownerOf(tokenId)\` ve tek bir "id"'yi taşıyan \`transferFrom(from, to, tokenId)\` fonksiyonlarıdır. \`balanceOf(owner)\` yalnızca bir adresin kaç "id" tuttuğunu sayar. İsteğe bağlı bir eklenti, [[token]]'ın üst verisine giden bağlantıyı veren \`tokenURI(tokenId)\` fonksiyonunu ekler.

Sahipler başka bir adresi tek bir [[token]] için ya da \`setApprovalForAll\` ile koleksiyondaki bütün [[token]]'ları için onaylayabilir. \`safeTransferFrom\` ise buna ek olarak, alıcı bir contract'ın [[nft]] kabul edebildiğini bildirdiğini kontrol eder; böylece [[token]]'lar bir yerde takılı kalmaz.`,
    },
  },
];

export default terms;
