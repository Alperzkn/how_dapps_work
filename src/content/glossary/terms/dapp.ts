import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'dapp',
    name: 'dapp',
    category: 'dapps',
    related: ['frontend', 'rpc', 'abi', 'blockchain'],
    lesson: 'dapp',
    en: {
      short: 'A decentralized application: a website whose rules and data live in smart contracts on a blockchain instead of on a company server.',
      long: `A dapp has the same visible part as any web app, the [[frontend]], but its backend is one or more [[smart-contract|smart contracts]]. Users act through a [[wallet]] that signs each [[transaction]], and the site reaches the chain through an [[rpc]] node.

Because the contracts are public and run identically on every [[node]], nobody, including the team that built the dapp, can change a balance or bend a rule outside what the code allows.

How decentralized a dapp really is depends on every layer: the contracts may have admin keys, the website may be served from one domain, and the data may come from one provider.`,
    },
    tr: {
      short: 'Merkeziyetsiz uygulama: kuralları ve verisi bir şirket sunucusunda değil, bir [[blockchain]] üzerindeki kontratlarda duran web sitesi.',
      long: `Bir [[dapp]]'in görünen kısmı her web uygulamasındaki gibidir, yani bir [[frontend]]; ama arka tarafında bir ya da birkaç [[smart-contract]] vardır. Kullanıcılar, her [[transaction]]'ı imzalayan bir [[wallet]] üzerinden işlem yapar; site ise zincire bir [[rpc]] sunucusu üzerinden ulaşır.

Kontratlar herkese açık olduğu ve her [[node]] üzerinde aynı şekilde çalıştığı için hiç kimse, [[dapp]]'i geliştiren ekip bile, kodun izin verdiğinin dışında bir bakiyeyi değiştiremez ya da bir kuralı esnetemez.

Bir [[dapp]]'in gerçekte ne kadar merkeziyetsiz olduğu her katmana bağlıdır: kontratlarda yönetici anahtarı olabilir, web sitesi tek bir alan adından sunuluyor olabilir, veri tek bir sağlayıcıdan geliyor olabilir.`,
    },
  },
  {
    id: 'frontend',
    name: 'frontend',
    category: 'dapps',
    related: ['dapp', 'abi', 'rpc'],
    lesson: 'dapp',
    en: {
      short: 'The part of an app that runs in your browser: the pages, buttons and numbers you see.',
      long: `In a [[dapp]] the frontend is an ordinary website made of HTML, CSS and JavaScript. It reads data from the chain through an [[rpc]] node, builds calls using the contract's [[abi]], and asks your [[wallet]] to sign them.

The frontend holds no funds and enforces no rules; the [[smart-contract]] does. Anyone can write another frontend for the same contracts.

It is also the layer that is easiest to fake or compromise, so what the [[wallet]] asks you to sign matters more than what the page says.`,
    },
    tr: {
      short: 'Bir uygulamanın tarayıcında çalışan kısmı: gördüğün sayfalar, düğmeler ve sayılar.',
      long: `Bir [[dapp]] içinde [[frontend]]; HTML, CSS ve JavaScript'ten oluşan sıradan bir web sitesidir. Zincirdeki veriyi bir [[rpc]] sunucusu üzerinden okur, kontratın [[abi]] tanımını kullanarak çağrıları hazırlar ve bunları imzalaması için [[wallet]]'a başvurur.

[[frontend]] para tutmaz ve kural uygulamaz; bunu [[smart-contract]] yapar. Aynı kontratlar için herkes başka bir [[frontend]] yazabilir.

Aynı zamanda taklit edilmesi ya da ele geçirilmesi en kolay katmandır; bu yüzden sayfanın ne dediğinden çok, [[wallet]]'ın senden neyi imzalamanı istediği önemlidir.`,
    },
  },
  {
    id: 'rpc',
    name: 'RPC',
    category: 'dapps',
    related: ['json-rpc', 'dapp', 'frontend'],
    lesson: 'dapp',
    en: {
      short: 'Remote procedure call: how an app asks a blockchain node to look something up or to broadcast a transaction.',
      long: `A browser is not part of the peer-to-peer network, so a [[dapp]] and a [[wallet]] talk to a [[node]] that is. That node exposes an RPC endpoint, usually an HTTPS URL, speaking [[json-rpc]].

Through it an app can read state (balances, contract values, past [[event-log|event logs]]) for free, and submit signed [[transaction|transactions]] to be included in a [[block]].

The node cannot forge your transactions, but it can see your requests, serve stale data or refuse to forward something. Most apps use hosted providers; running your own node removes that dependency.`,
    },
    tr: {
      short: '"Remote procedure call": bir uygulamanın bir [[node]]\'dan bir şeye bakmasını ya da bir [[transaction]] yayınlamasını isteme yolu.',
      long: `Tarayıcı eşler arası ağın bir parçası değildir; bu yüzden bir [[dapp]] ve bir [[wallet]], ağın parçası olan bir [[node]] ile konuşur. O [[node]], çoğunlukla bir HTTPS adresi olan ve [[json-rpc]] konuşan bir [[rpc]] uç noktası sunar.

Uygulama bu uç nokta üzerinden durumu (bakiyeler, kontrat değerleri, geçmiş [[event-log]] kayıtları) ücretsiz okuyabilir ve bir [[block]]'a girmesi için imzalı [[transaction]] gönderebilir.

[[node]] senin adına sahte işlem üretemez; ama isteklerini görebilir, eski veri sunabilir ya da bir şeyi iletmeyi reddedebilir. Çoğu uygulama hazır sağlayıcılar kullanır; kendi [[node]]'unu çalıştırmak bu bağımlılığı ortadan kaldırır.`,
    },
  },
  {
    id: 'json-rpc',
    name: 'JSON-RPC',
    category: 'dapps',
    related: ['rpc', 'calldata', 'event-log'],
    lesson: 'dapp',
    en: {
      short: 'The request format Ethereum nodes understand: a small JSON object naming a method and its parameters.',
      long: `Every request is \`{ "jsonrpc": "2.0", "id", "method", "params" }\` and every answer carries either a \`result\` or an \`error\`. It runs over HTTPS or WebSocket.

Common methods: \`eth_call\` (run a contract function without a transaction), \`eth_estimateGas\`, \`eth_sendRawTransaction\` (submit a signed [[transaction]]), \`eth_getTransactionReceipt\`, \`eth_getLogs\` (read [[event-log|event logs]]) and \`eth_blockNumber\`.

Libraries such as viem and ethers.js wrap these methods and do the [[abi]] encoding, so application code rarely writes the JSON by hand.`,
    },
    tr: {
      short: 'Ethereum [[node]]\'larının anladığı istek biçimi: bir metot adı ve parametrelerini taşıyan küçük bir JSON nesnesi.',
      long: `Her istek \`{ "jsonrpc": "2.0", "id", "method", "params" }\` biçimindedir; her cevap ya bir \`result\` ya da bir \`error\` taşır. HTTPS ya da WebSocket üzerinden çalışır.

Sık kullanılan metotlar: \`eth_call\` (bir kontrat fonksiyonunu işlem göndermeden çalıştırır), \`eth_estimateGas\`, \`eth_sendRawTransaction\` (imzalı bir [[transaction]] gönderir), \`eth_getTransactionReceipt\`, \`eth_getLogs\` ([[event-log]] kayıtlarını okur) ve \`eth_blockNumber\`.

viem ve ethers.js gibi kütüphaneler bu metotları sarmalar ve [[abi]] kodlamasını kendileri yapar; uygulama kodunda JSON'u elle yazmak nadiren gerekir.`,
    },
  },
  {
    id: 'abi',
    name: 'ABI',
    category: 'dapps',
    related: ['calldata', 'solidity', 'event-log'],
    lesson: 'dapp',
    en: {
      short: 'Application Binary Interface: the description of a contract\'s functions and events that tells software how to encode a call and decode the result.',
      long: `A deployed contract is only bytecode. The ABI, usually a JSON file produced by the [[solidity]] compiler, lists each function and event with its name and argument types.

With it, a [[frontend]] can turn "transfer 10 tokens to Ben" into [[calldata]] and turn the returned bytes back into values. The same rules define how an [[event-log]] is laid out.

"ABI encoding" also names the byte format itself: a 4-byte function selector followed by arguments packed into 32-byte words.`,
    },
    tr: {
      short: '"Application Binary Interface": bir kontratın fonksiyonlarını ve "event"\'lerini tarif eden, bir çağrının nasıl kodlanıp sonucun nasıl çözüleceğini yazılıma söyleyen tanım.',
      long: `Zincire yüklenmiş bir kontrat yalnızca "bytecode"'dur. [[abi]] ise, çoğunlukla [[solidity]] derleyicisinin ürettiği bir JSON dosyasıdır ve her fonksiyonu ve "event"'i adı ve argüman tipleriyle listeler.

[[frontend]] bununla "Ben'e 10 token gönder" isteğini [[calldata]]'ya çevirir, dönen baytları da yeniden değerlere dönüştürür. Bir [[event-log]] kaydının düzenini de aynı kurallar belirler.

"ABI encoding" ifadesi bayt biçiminin kendisini de anlatır: 4 baytlık bir fonksiyon "selector"'ı ve ardından 32 baytlık kelimelere yerleştirilmiş argümanlar.`,
    },
  },
  {
    id: 'calldata',
    name: 'calldata',
    category: 'dapps',
    related: ['abi', 'json-rpc', 'solidity'],
    lesson: 'dapp',
    en: {
      short: 'The bytes sent along with a call to a contract: which function to run and with which arguments.',
      long: `Calldata is the \`data\` field of a [[transaction]] or of an \`eth_call\`. For a function call it starts with a 4-byte selector, the first 4 bytes of the keccak256 hash of the function signature such as \`transfer(address,uint256)\`, followed by the arguments encoded according to the [[abi]].

It is read-only during execution and is published with the [[transaction]], so anyone can see what was called. Every byte costs [[gas]], and zero bytes are cheaper than non-zero ones.

Wallets decode calldata to show what you are about to sign. When a wallet can only show raw hex, be careful.`,
    },
    tr: {
      short: 'Bir kontrat çağrısıyla birlikte gönderilen baytlar: hangi fonksiyon, hangi argümanlarla çalışacak.',
      long: `[[calldata]], bir [[transaction]]'ın ya da bir \`eth_call\` isteğinin \`data\` alanıdır. Bir fonksiyon çağrısında 4 baytlık "selector" ile başlar; bu, \`transfer(address,uint256)\` gibi bir fonksiyon imzasının keccak256 özetinin ilk 4 baytıdır. Ardından [[abi]] kurallarına göre kodlanmış argümanlar gelir.

Çalışma sırasında yalnızca okunabilir ve [[transaction]] ile birlikte yayınlanır; yani neyin çağrıldığını herkes görebilir. Her baytı [[gas]] harcar; sıfır baytlar sıfır olmayanlardan ucuzdur.

[[wallet]]'lar, imzalamak üzere olduğun şeyi gösterebilmek için [[calldata]]'yı çözer. Bir [[wallet]] yalnızca ham "hex" gösterebiliyorsa dikkatli ol.`,
    },
  },
  {
    id: 'event-log',
    name: 'event log',
    category: 'dapps',
    related: ['indexer', 'abi', 'json-rpc'],
    lesson: 'dapp',
    en: {
      short: 'A record a contract writes while it runs, so that apps outside the chain can see what happened.',
      long: `When a contract executes \`emit Transfer(from, to, value)\`, the [[node]] stores a log in the [[transaction]]'s receipt. A log has the emitting contract's [[address]], up to four **topics** (the first is the hash of the event signature, the rest are \`indexed\` arguments) and a \`data\` field with the remaining arguments.

Logs are cheap compared with contract storage, but contracts cannot read them back. They exist for the outside world: a [[frontend]] subscribes to them, and an [[indexer]] turns them into searchable history.

They are fetched with the [[json-rpc]] method \`eth_getLogs\`, filtered by contract address and topics.`,
    },
    tr: {
      short: 'Bir kontratın çalışırken yazdığı kayıt; zincir dışındaki uygulamalar ne olduğunu buradan görür.',
      long: `Bir kontrat \`emit Transfer(from, to, value)\` çalıştırdığında [[node]], [[transaction]]'ın makbuzuna bir "log" yazar. Bir "log"'da onu yayınlayan kontratın [[address]] değeri, en fazla dört **topic** (ilki "event" imzasının özeti, diğerleri \`indexed\` argümanlar) ve kalan argümanları taşıyan bir \`data\` alanı bulunur.

"Log"'lar kontrat depolamasına göre ucuzdur, ama kontratlar onları geri okuyamaz. Dış dünya için vardırlar: bir [[frontend]] onlara abone olur, bir [[indexer]] ise onları aranabilir bir geçmişe dönüştürür.

[[json-rpc]] metodu \`eth_getLogs\` ile, kontrat adresine ve "topic"'lere göre filtrelenerek okunurlar.`,
    },
  },
  {
    id: 'indexer',
    name: 'indexer',
    category: 'dapps',
    related: ['event-log', 'rpc', 'frontend'],
    lesson: 'dapp',
    en: {
      short: 'A service that follows the chain and stores its events in a database, so apps can query history quickly.',
      long: `A [[node]] is good at answering "what is the state now?" and poor at "show me every swap this account ever made". An indexer fills that gap: it reads each new [[block]], decodes the [[event-log|event logs]] it cares about and writes rows into a database with a query API.

Block explorers, portfolio pages and most [[dapp]] history views sit on top of an indexer. The Graph is a well-known example.

An indexer is a convenience layer, not part of [[consensus]]. It can lag or be wrong, and it must undo rows when a [[reorg]] removes a block.`,
    },
    tr: {
      short: 'Zinciri izleyip "event"\'leri bir veritabanına yazan servis; uygulamalar geçmişi buradan hızlıca sorgular.',
      long: `Bir [[node]] "şu anki durum ne?" sorusuna iyi, "bu hesabın bugüne kadar yaptığı bütün takasları göster" sorusuna kötü cevap verir. [[indexer]] bu boşluğu doldurur: her yeni [[block]]'u okur, ilgilendiği [[event-log]] kayıtlarını çözer ve bunları sorgu arayüzü olan bir veritabanına satır satır yazar.

"Block explorer"'lar, portföy sayfaları ve çoğu [[dapp]]'in geçmiş ekranları bir [[indexer]]'ın üzerinde durur. The Graph bilinen bir örnektir.

[[indexer]] bir kolaylık katmanıdır, [[consensus]]'un parçası değildir. Geride kalabilir ya da yanılabilir; bir [[reorg]] bir [[block]]'u düşürdüğünde ilgili satırları da geri alması gerekir.`,
    },
  },
  {
    id: 'token-approval',
    name: 'token approval',
    category: 'dapps',
    related: ['erc-20', 'token', 'dapp'],
    lesson: 'dapp',
    en: {
      short: 'Permission you give a contract to spend up to a set amount of one of your tokens.',
      long: `A contract cannot pull an [[erc-20]] [[token]] out of your account by itself. You first call \`approve(spender, amount)\` on the token, which records an **allowance**. The spender can then call \`transferFrom\` to move up to that amount, for example when you swap or deposit.

An approval stays in force until it is used up or you set it back to zero. Many sites request an unlimited amount to save you a transaction later; if that contract is malicious or gets hacked, everything you approved is at risk.

Approve only what you need where practical, and revoke allowances you no longer use.`,
    },
    tr: {
      short: 'Bir kontrata, bir [[token]]\'ından belirli bir miktara kadar harcama yapması için verdiğin izin.',
      long: `Bir kontrat, hesabındaki bir [[erc-20]] [[token]]'ını kendiliğinden çekemez. Önce [[token]] üzerinde \`approve(spender, amount)\` çağırırsın; bu bir **allowance** kaydeder. Harcama yetkisi verilen kontrat bundan sonra, örneğin sen takas ya da yatırma yaparken, \`transferFrom\` çağırarak o miktara kadar aktarabilir.

Bir onay, tükenene ya da sen sıfıra çekene kadar yürürlükte kalır. Birçok site, ileride seni bir işlemden kurtarmak için sınırsız miktar ister; o kontrat kötü niyetliyse ya da saldırıya uğrarsa onay verdiğin her şey risk altına girer.

Mümkün olduğunda yalnızca ihtiyacın kadarına onay ver ve artık kullanmadığın izinleri iptal et.`,
    },
  },
  {
    id: 'erc-20',
    name: 'ERC-20',
    category: 'dapps',
    related: ['token', 'token-approval', 'solidity'],
    lesson: 'dapp',
    en: {
      short: 'The standard interface for fungible tokens on Ethereum, so every wallet and dapp can handle every such token the same way.',
      long: `An ERC-20 [[token]] is a [[smart-contract]] that keeps a table of balances and exposes a fixed set of functions: \`totalSupply\`, \`balanceOf\`, \`transfer\`, \`approve\`, \`allowance\` and \`transferFrom\`, plus the events \`Transfer\` and \`Approval\`.

Because the interface is standard, an exchange or a [[wallet]] written once works with thousands of tokens. \`decimals\` (often 18) only tells user interfaces where to put the decimal point; on chain, amounts are whole numbers.

Real tokens deviate in small ways: some return nothing from \`transfer\`, some charge a fee on transfer, some can be paused or blacklisted by an admin.`,
    },
    tr: {
      short: 'Ethereum\'da birbirinin yerine geçebilen [[token]]\'lar için standart arayüz; her cüzdan ve [[dapp]] bu türden her [[token]] ile aynı şekilde çalışabilir.',
      long: `Bir [[erc-20]] [[token]]'ı, bir bakiye tablosu tutan ve sabit bir fonksiyon kümesi sunan bir [[smart-contract]]'tır: \`totalSupply\`, \`balanceOf\`, \`transfer\`, \`approve\`, \`allowance\` ve \`transferFrom\`; yanında da \`Transfer\` ve \`Approval\` "event"'leri.

Arayüz standart olduğu için bir kez yazılan bir borsa ya da [[wallet]] binlerce [[token]] ile çalışır. \`decimals\` (çoğunlukla 18) yalnızca arayüzlere ondalık ayracın nereye konacağını söyler; zincirde miktarlar tam sayıdır.

Gerçek [[token]]'lar küçük sapmalar gösterir: bazıları \`transfer\`'den değer döndürmez, bazıları transferden ücret keser, bazıları bir yönetici tarafından durdurulabilir ya da kara listeye alınabilir.`,
    },
  },
  {
    id: 'token',
    name: 'token',
    category: 'dapps',
    related: ['erc-20', 'token-approval'],
    lesson: 'dapp',
    en: {
      short: 'A unit of value defined by a smart contract rather than by the blockchain itself.',
      long: `A chain has one native coin (such as [[ether]] on Ethereum) that pays for [[gas]]. Everything else, from stablecoins to governance tokens, is a token: a [[smart-contract]] that records who owns how much.

Holding a token means the contract's table has a number next to your [[address]]. Sending it means calling the contract so that it edits two rows. Most fungible tokens follow the [[erc-20]] standard.

Because a token is code, its rules are whatever the contract says: supply can be fixed or mintable, transfers can be free or restricted.`,
    },
    tr: {
      short: 'Zincirin kendisi tarafından değil, bir [[smart-contract]] tarafından tanımlanan değer birimi.',
      long: `Bir zincirin, [[gas]] ücretlerini ödemekte kullanılan tek bir yerel parası vardır (Ethereum'da [[ether]]). Geri kalan her şey, "stablecoin"'lerden yönetişim birimlerine kadar, birer [[token]]'dır: kimin ne kadara sahip olduğunu kaydeden bir [[smart-contract]].

Bir [[token]]'a sahip olmak, kontratın tablosunda senin [[address]] değerinin yanında bir sayı yazması demektir. Onu göndermek ise kontratı çağırıp iki satırı değiştirtmektir. Birbirinin yerine geçebilen [[token]]'ların çoğu [[erc-20]] standardına uyar.

[[token]] bir kod olduğu için kuralları kontrat ne diyorsa odur: arz sabit olabilir ya da yeni birim basılabilir, transferler serbest ya da kısıtlı olabilir.`,
    },
  },
  {
    id: 'solidity',
    name: 'Solidity',
    category: 'dapps',
    related: ['abi', 'calldata', 'erc-20'],
    lesson: 'dapp',
    en: {
      short: 'The most widely used programming language for writing smart contracts on Ethereum and compatible chains.',
      long: `Solidity is a statically typed language with a syntax close to JavaScript and C++. Its compiler, \`solc\`, turns source code into [[evm]] bytecode and also produces the contract's [[abi]].

A contract declares state variables (kept in storage), functions (callable through [[calldata]]) and events (written as [[event-log|event logs]]). Since version 0.8, arithmetic overflow and underflow revert by default.

Deployed code is hard to change and holds real value, so Solidity development leans heavily on testing, audits and well-known library code. Vyper is the main alternative language.`,
    },
    tr: {
      short: 'Ethereum ve uyumlu zincirlerde [[smart-contract]] yazmak için en yaygın kullanılan programlama dili.',
      long: `Solidity, söz dizimi JavaScript ve C++'a yakın, statik tipli bir dildir. Derleyicisi \`solc\`, kaynak kodu [[evm]] "bytecode"'una çevirir ve kontratın [[abi]] tanımını da üretir.

Bir kontrat; durum değişkenleri (depolamada tutulur), fonksiyonlar ([[calldata]] ile çağrılır) ve "event"'ler ([[event-log]] olarak yazılır) tanımlar. 0.8 sürümünden beri aritmetik taşmalar varsayılan olarak "revert" ile sonuçlanır.

Zincire yüklenen kodu değiştirmek zordur ve kod gerçek değer taşır; bu yüzden Solidity geliştirme pratiği teste, denetime ve iyi bilinen kütüphane kodlarına yaslanır. Başlıca alternatif dil Vyper'dır.`,
    },
  },
];

export default terms;
