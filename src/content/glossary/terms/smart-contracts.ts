import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'eoa',
    name: 'EOA',
    category: 'dapps',
    related: ['contract-account', 'private-key', 'address', 'account-nonce', 'wallet'],
    lesson: 'smart-contracts',
    en: {
      short: 'Externally owned account: an Ethereum account controlled by a private key, with no code of its own.',
      long: `An EOA is the kind of account a person has. Whoever holds its [[private-key]] can sign a [[transaction]] from it; nothing else can make it act.

It has an [[address]], a balance in [[ether]] and an [[account-nonce]] that counts the transactions it has sent. It has no code and no storage.

Every transaction on Ethereum starts from an EOA. A [[contract-account]] can only act when a transaction, or another contract inside one, calls it.`,
    },
    tr: {
      short: '"Externally owned account": bir [[private-key]] ile yönetilen, kendine ait kodu olmayan Ethereum hesabı.',
      long: `[[eoa]], bir insanın sahip olduğu hesap türüdür. [[private-key]]'i elinde tutan kişi ondan bir [[transaction]] imzalayabilir; onu başka hiçbir şey harekete geçiremez.

Bir [[address]] değeri, [[ether]] cinsinden bir bakiyesi ve gönderdiği işlemleri sayan bir [[account-nonce]] değeri vardır. Kodu ve depolaması yoktur.

Ethereum'daki her işlem bir [[eoa]]'dan başlar. Bir [[contract-account]] ise ancak bir işlem ya da o işlemin içindeki başka bir contract onu çağırdığında çalışabilir.`,
    },
  },
  {
    id: 'contract-account',
    name: 'contract account',
    category: 'dapps',
    related: ['eoa', 'smart-contract', 'bytecode', 'contract-state', 'address'],
    lesson: 'smart-contracts',
    en: {
      short: 'An Ethereum account that is controlled by code instead of a private key: a deployed smart contract.',
      long: `A contract account has an [[address]] and can hold [[ether]] just like a person's account, but nobody has a key for it. It has two things an [[eoa]] lacks: code ([[bytecode]]) and its own permanent storage.

It cannot start anything by itself. It runs only when it is called, and then it does exactly what its code says, including sending the ether it holds.

Its code is fixed at [[deployment]]. Its storage, the [[contract-state]], changes only when its own code writes to it.`,
    },
    tr: {
      short: 'Bir [[private-key]] yerine kodla yönetilen Ethereum hesabı: yüklenmiş bir [[smart-contract]].',
      long: `Bir [[contract-account]]'ın da bir insanın hesabı gibi bir [[address]] değeri vardır ve [[ether]] tutabilir, ama anahtarı kimsede yoktur. Bir [[eoa]]'da olmayan iki şeyi vardır: kod ([[bytecode]]) ve kendine ait kalıcı depolama.

Kendi başına hiçbir şey başlatamaz. Yalnızca çağrıldığında çalışır ve o zaman kodu ne diyorsa onu yapar; tuttuğu "ether"'i göndermek de buna dahildir.

Kodu [[deployment]] anında sabitlenir. Depolaması, yani [[contract-state]], yalnızca kendi kodu ona yazdığında değişir.`,
    },
  },
  {
    id: 'bytecode',
    name: 'bytecode',
    category: 'dapps',
    related: ['evm', 'opcode', 'solidity', 'deployment', 'abi'],
    lesson: 'smart-contracts',
    en: {
      short: 'The compiled form of a smart contract: a sequence of bytes the EVM executes one instruction at a time.',
      long: `People write contracts in a language such as [[solidity]]. A compiler turns that source into bytecode, which is what actually gets stored on the chain. Each byte is either an [[opcode]] or data that belongs to one.

There are two pieces. The **init code** runs once during [[deployment]] and returns the **runtime code**, which is what stays at the contract's [[address]] and runs on every later call.

On Ethereum the runtime code can be at most 24,576 bytes. Anyone can read a contract's bytecode from a [[node]], but without the published source it is hard to understand, which is why explorers offer source verification.`,
    },
    tr: {
      short: 'Bir [[smart-contract]]\'ın derlenmiş hali: [[evm]]\'in komut komut çalıştırdığı bir bayt dizisi.',
      long: `İnsanlar contract'ları [[solidity]] gibi bir dille yazar. Derleyici bu kaynağı [[bytecode]]'a çevirir; zincirde gerçekten saklanan şey budur. Her bayt ya bir [[opcode]]'dur ya da bir [[opcode]]'a ait veridir.

İki parçası vardır. **"Init code"**, [[deployment]] sırasında bir kez çalışır ve **çalışma zamanı kodunu** döndürür; contract'ın [[address]] değerinde kalan ve sonraki her çağrıda çalışan kod budur.

Ethereum'da çalışma zamanı kodu en fazla 24.576 bayt olabilir. Herkes bir contract'ın [[bytecode]]'unu bir [[node]]'dan okuyabilir, ama yayımlanmış kaynak olmadan anlamak zordur; bu yüzden blok gezginleri kaynak doğrulama sunar.`,
    },
  },
  {
    id: 'deployment',
    name: 'deployment',
    category: 'dapps',
    related: ['bytecode', 'contract-account', 'transaction', 'account-nonce', 'address'],
    lesson: 'smart-contracts',
    en: {
      short: 'Putting a contract on the chain: a transaction with no recipient that carries the code and creates a new contract account.',
      long: `To deploy, you send a [[transaction]] whose \`to\` field is empty and whose \`data\` is the contract's init [[bytecode]]. The [[evm]] runs it once; what it returns becomes the permanent code of a new [[contract-account]].

The new [[address]] is derived from the sender's address and [[account-nonce]], so it can be computed in advance. A second method, \`CREATE2\`, derives it from the deployer, a chosen salt and the code instead.

Deployment costs [[gas]] in proportion to the size of the code. After it, the code cannot be edited; changing behaviour means deploying a new contract or having built in an upgrade mechanism from the start.`,
    },
    tr: {
      short: 'Bir contract\'ı zincire koymak: alıcısı olmayan, kodu taşıyan ve yeni bir [[contract-account]] oluşturan bir [[transaction]].',
      long: `Bir contract yüklemek için, \`to\` alanı boş olan ve \`data\` alanında contract'ın başlangıç [[bytecode]]'unu taşıyan bir [[transaction]] gönderirsin. [[evm]] bunu bir kez çalıştırır; geri döndürdüğü şey yeni bir [[contract-account]]'ın kalıcı kodu olur.

Yeni [[address]], gönderenin adresinden ve [[account-nonce]] değerinden türetilir; bu yüzden önceden hesaplanabilir. İkinci bir yöntem olan \`CREATE2\` ise adresi yükleyenden, seçilen bir "salt" değerinden ve koddan türetir.

[[deployment]], kodun boyutuyla orantılı [[gas]] tutar. Sonrasında kod düzenlenemez; davranışı değiştirmek, yeni bir contract yüklemek ya da baştan bir güncelleme mekanizması kurmuş olmak demektir.`,
    },
  },
  {
    id: 'contract-state',
    name: 'contract state',
    category: 'dapps',
    related: ['storage-slot', 'contract-account', 'state-trie', 'smart-contract'],
    lesson: 'smart-contracts',
    en: {
      short: 'The data a contract keeps between calls: its stored variables, plus the ether it holds.',
      long: `A contract's state is everything it remembers: balances, owners, counters, settings. It lives in the contract's storage, organised into [[storage-slot|storage slots]], and is part of the chain's global state kept by every [[full-node]].

Only the contract's own code can change it, and only during a [[transaction]]. If a call fails, every change it made is undone.

State is public. Anyone can read any contract's storage from a [[node]], even variables the source code marks as private.`,
    },
    tr: {
      short: 'Bir contract\'ın çağrılar arasında sakladığı veri: kayıtlı değişkenleri ve tuttuğu [[ether]].',
      long: `Bir contract'ın durumu, hatırladığı her şeydir: bakiyeler, sahipler, sayaçlar, ayarlar. Contract'ın depolamasında, [[storage-slot]]'lara ayrılmış halde durur ve her [[full-node]]'un tuttuğu zincirin genel durumunun bir parçasıdır.

Onu yalnızca contract'ın kendi kodu, yalnızca bir [[transaction]] sırasında değiştirebilir. Bir çağrı başarısız olursa yaptığı her değişiklik geri alınır.

Durum herkese açıktır. Kaynak kodun "private" diye işaretlediği değişkenler dahil, herkes herhangi bir contract'ın depolamasını bir [[node]]'dan okuyabilir.`,
    },
  },
  {
    id: 'storage-slot',
    name: 'storage slot',
    category: 'dapps',
    related: ['contract-state', 'state-trie', 'gas', 'hash', 'transient-storage'],
    lesson: 'smart-contracts',
    en: {
      short: 'One numbered 32-byte cell of a contract\'s permanent storage. Every contract has 2²⁵⁶ of them, all zero until written.',
      long: `A contract's storage is a huge table from a 256-bit slot number to a 32-byte value. The compiler gives variables slots in the order they are declared, starting at 0, and packs small ones together.

Tables and lists cannot fit in one slot, so their entries are placed at a slot number computed with a [[hash]]: for a mapping, the hash of the key together with the mapping's own slot number.

Writing a slot is the most expensive common operation in the [[evm]]: 20,000 [[gas]] to set a slot that was zero. Reading one costs 2,100 gas the first time in a [[transaction]] and 100 after that.`,
    },
    tr: {
      short: 'Bir contract\'ın kalıcı depolamasındaki numaralı, 32 baytlık tek bir hücre. Her contract\'ta 2²⁵⁶ tane vardır; yazılana kadar hepsi sıfırdır.',
      long: `Bir contract'ın depolaması, 256 bitlik bir "slot" numarasından 32 baytlık bir değere giden dev bir tablodur. Derleyici, değişkenlere tanımlandıkları sırayla 0'dan başlayarak "slot" verir ve küçük olanları bir araya paketler.

Tablolar ve listeler tek bir "slot"'a sığmaz; bu yüzden kayıtları, bir [[hash]] ile hesaplanan bir "slot" numarasına yerleştirilir: bir "mapping" için bu, anahtarın ve "mapping"'in kendi "slot" numarasının birlikte alınmış [[hash]]'idir.

Bir "slot"'a yazmak, [[evm]]'de sık yapılan işlemlerin en pahalısıdır: sıfır olan bir "slot"'u doldurmak 20.000 [[gas]] tutar. Okumak ise bir [[transaction]] içinde ilk seferde 2.100, sonrasında 100 gas tutar.`,
    },
  },
  {
    id: 'revert',
    name: 'revert',
    category: 'dapps',
    related: ['gas', 'gas-fee', 'transaction', 'contract-state', 'evm'],
    lesson: 'smart-contracts',
    en: {
      short: 'A failed call: everything it changed is undone as if it never ran, but the gas it used is still paid for.',
      long: `A contract reverts when one of its checks fails (for example "balance too low"), when it runs out of [[gas]], or when it hits an invalid operation. All changes to [[contract-state]] made by that call, and by any calls it made in turn, are rolled back.

This makes a [[transaction]] all-or-nothing: either every step succeeds or none of it happened. It is what lets a swap, for example, be safe without trusting the other side.

The fee is not refunded. The network did the work of running the code up to the failure, so the sender pays the [[gas-fee]] for it, and the failed transaction is still recorded in a [[block]].`,
    },
    tr: {
      short: 'Başarısız bir çağrı: değiştirdiği her şey hiç çalışmamış gibi geri alınır, ama harcadığı [[gas]] yine de ödenir.',
      long: `Bir contract, kontrollerinden biri başarısız olduğunda (örneğin "bakiye yetersiz"), [[gas]]'ı bittiğinde ya da geçersiz bir işleme rastladığında [[revert]] eder. O çağrının ve onun yaptığı diğer çağrıların [[contract-state]] üzerindeki bütün değişiklikleri geri alınır.

Bu, bir [[transaction]]'ı "ya hep ya hiç" yapar: ya her adım başarılı olur ya da hiçbiri olmamıştır. Örneğin bir takasın, karşı tarafa güvenmeden güvenli olabilmesini sağlayan şey budur.

Ücret iade edilmez. Ağ, hataya kadar olan kodu çalıştırma işini yapmıştır; gönderen bunun [[gas-fee]]'sini öder ve başarısız işlem yine de bir [[block]]'a kaydedilir.`,
    },
  },
  {
    id: 'reentrancy',
    name: 'reentrancy',
    category: 'dapps',
    related: ['smart-contract', 'revert', 'contract-state', 'ether'],
    lesson: 'smart-contracts',
    en: {
      short: 'A bug where a contract calls out before finishing its own bookkeeping, and the callee calls back in while the records are still stale.',
      long: `When a contract sends [[ether]] or calls another contract, it hands over control. The other contract can call straight back into the first one before the first call has finished.

If the first contract has not yet updated its records, for example it paid out but has not reduced the balance, the second call sees the old numbers and can be paid again. Repeating this drains the contract.

The standard defence is the checks-effects-interactions order: check the conditions, update your own state, and only then call anyone else. A reentrancy lock adds a second layer. The bug drained over 3.6 million ETH from The DAO in 2016.`,
    },
    tr: {
      short: 'Bir contract\'ın kendi kayıtlarını bitirmeden dışarıyı çağırdığı, çağrılanın da kayıtlar hâlâ eskiyken geri içeri girdiği hata.',
      long: `Bir contract [[ether]] gönderdiğinde ya da başka bir contract'ı çağırdığında kontrolü devreder. Diğer contract, ilk çağrı daha bitmeden doğrudan ilk contract'ı yeniden çağırabilir.

İlk contract kayıtlarını henüz güncellemediyse, örneğin ödemeyi yapmış ama bakiyeyi düşmemişse, ikinci çağrı eski sayıları görür ve yeniden ödeme alabilir. Bunu tekrarlamak contract'ı boşaltır.

Standart savunma "checks-effects-interactions" sırasıdır: koşulları kontrol et, kendi durumunu güncelle, ancak ondan sonra başkasını çağır. Bir "reentrancy" kilidi ikinci bir katman ekler. Bu hata 2016'da The DAO'dan 3,6 milyondan fazla ETH çekilmesine yol açtı.`,
    },
  },
];

export default terms;
