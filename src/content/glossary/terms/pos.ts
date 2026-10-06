import type { GlossaryTerm } from '../../../types';

const terms: GlossaryTerm[] = [
  {
    id: 'proof-of-stake',
    name: 'Proof of Stake',
    category: 'consensus',
    related: ['validator', 'stake', 'slashing', 'proof-of-work'],
    lesson: 'pos',
    en: {
      short: 'A way to choose block makers by the coins they lock up as a deposit, not by computing power.',
      long: `In Proof of Stake (PoS), participants lock coins as a [[stake]] and become [[validator|validators]]. The protocol picks one of them to propose each [[block]] and has the others vote on it, with influence proportional to stake.

Security comes from the deposit. Honest validators earn rewards; validators that provably cheat lose part of their stake through [[slashing]]. Attacking the chain therefore means risking coins inside the very system being attacked.

Ethereum has used Proof of Stake since September 2022. It needs a tiny fraction of the energy of [[proof-of-work]] and can declare blocks final.`,
    },
    tr: {
      short: '[[block]] üretecek olanları hesaplama gücüne göre değil, teminat olarak kilitledikleri coin\'lere göre seçme yöntemi.',
      long: `[[proof-of-stake]] (PoS) sisteminde katılımcılar coin'lerini [[stake]] olarak kilitler ve [[validator]] olur. Protokol her [[block]]'u önermesi için içlerinden birini seçer, diğerlerine de o [[block]]'u oylatır; herkesin söz hakkı [[stake]]'i kadardır.

Güvenlik teminattan gelir. Dürüst [[validator]]'lar ödül kazanır; hile yaptığı kanıtlananlar [[slashing]] ile [[stake]]'lerinin bir kısmını kaybeder. Yani zincire saldırmak, saldırılan sistemin içindeki coin'leri riske atmak demektir.

Ethereum, Eylül 2022'den beri [[proof-of-stake]] kullanıyor. Bu yöntem [[proof-of-work]]'ün harcadığı enerjinin çok küçük bir kısmıyla çalışır ve [[block]]'ları kesinleşmiş ilan edebilir.`,
    },
  },
  {
    id: 'validator',
    name: 'validator',
    category: 'consensus',
    related: ['stake', 'proposer', 'attestation', 'slashing'],
    lesson: 'pos',
    en: {
      short: 'A participant who has locked a stake and takes part in proposing and voting on blocks.',
      long: `A validator is the Proof of Stake counterpart of a [[miner]]. It is identified by a key pair and backed by a [[stake]]; on Ethereum the minimum is 32 ETH.

Its duties are to propose a [[block]] when chosen as [[proposer]] and to send an [[attestation]] once per [[epoch]]. Doing this correctly and on time earns rewards, being offline costs small penalties, and signing contradictory messages leads to [[slashing]].

Running a validator needs an ordinary, always-on computer rather than specialised hardware.`,
    },
    tr: {
      short: '[[stake]] kilitlemiş, [[block]] önerme ve oylama işine katılan katılımcı.',
      long: `[[validator]], [[proof-of-stake]] dünyasında [[miner]]'ın karşılığıdır. Bir anahtar çiftiyle tanınır ve arkasında bir [[stake]] vardır; Ethereum'da alt sınır 32 ETH'dir.

Görevleri, [[proposer]] seçildiğinde bir [[block]] önermek ve her [[epoch]]'ta bir kez [[attestation]] göndermektir. Bunları doğru ve zamanında yapmak ödül kazandırır, çevrimdışı kalmak küçük cezalara yol açar, birbiriyle çelişen mesajlar imzalamak ise [[slashing]] ile sonuçlanır.

Bir [[validator]] çalıştırmak için özel donanım değil, sürekli açık duran sıradan bir bilgisayar yeter.`,
    },
  },
  {
    id: 'stake',
    name: 'stake',
    category: 'consensus',
    related: ['staking', 'validator', 'slashing'],
    lesson: 'pos',
    en: {
      short: 'Coins locked as a security deposit by a validator.',
      long: `A stake is collateral. While it is locked, its owner may act as a [[validator]], and the size of the stake sets the weight of their votes and their chance of being picked to propose.

The stake is what makes promises believable: break the rules and the protocol can destroy part of it ([[slashing]]). On Ethereum a validator needs at least 32 ETH, and the total stake of all validators is what an attacker would have to match a large share of.`,
    },
    tr: {
      short: 'Bir [[validator]]\'ın güvence olarak kilitlediği coin\'ler.',
      long: `[[stake]] bir teminattır. Kilitli kaldığı sürece sahibi [[validator]] olarak görev yapabilir; [[stake]]'in büyüklüğü de oylarının ağırlığını ve öneri için seçilme şansını belirler.

Verilen sözleri inandırıcı kılan şey [[stake]]'tir: kuralları çiğnersen protokol bir kısmını yok edebilir ([[slashing]]). Ethereum'da bir [[validator]] için en az 32 ETH gerekir; bir saldırganın büyük bir payına denk gelmek zorunda olduğu şey de bütün [[validator]]'ların toplam [[stake]]'idir.`,
    },
  },
  {
    id: 'staking',
    name: 'staking',
    category: 'consensus',
    related: ['stake', 'validator', 'proof-of-stake'],
    lesson: 'pos',
    en: {
      short: 'Locking coins to help secure a Proof of Stake chain and earn rewards for it.',
      long: `Staking means putting up a [[stake]] and running a [[validator]], or handing coins to someone who runs one for you. In return the protocol pays rewards, typically a few percent per year on Ethereum.

Staked coins are not freely spendable: leaving takes time, because exits are queued. Many people stake through pools or liquid staking services, which is convenient but concentrates control over validators in a few operators.`,
    },
    tr: {
      short: 'Bir [[proof-of-stake]] zincirinin güvenliğine katkı için coin kilitlemek ve karşılığında ödül almak.',
      long: `[[staking]], bir [[stake]] koyup [[validator]] çalıştırmak ya da coin'lerini senin yerine çalıştıran birine emanet etmek demektir. Karşılığında protokol ödül öder; Ethereum'da bu genellikle yılda yüzde birkaçtır.

Kilitlenen coin'ler serbestçe harcanamaz; çıkışlar kuyruğa girdiği için ayrılmak zaman alır. Pek çok kişi havuzlar ya da "liquid staking" hizmetleri üzerinden katılır; bu kolaydır ama [[validator]]'ların kontrolünü birkaç işletmecide toplar.`,
    },
  },
  {
    id: 'slashing',
    name: 'slashing',
    category: 'consensus',
    related: ['stake', 'validator', 'nothing-at-stake', 'attestation'],
    lesson: 'pos',
    en: {
      short: 'Destroying part of a validator\'s stake as punishment for provable cheating.',
      long: `Slashing punishes a [[validator]] that signs contradictory messages: two different blocks for the same [[slot]], or two conflicting votes. The two signatures are the proof, and anyone can submit them.

A slashed validator loses part of its [[stake]] and is removed from the validator set. On Ethereum the penalty grows with the number of validators slashed around the same time, so an isolated mistake is cheap and a coordinated attack is ruinous.

Being offline is not slashable. It only costs small ongoing penalties.`,
    },
    tr: {
      short: 'Kanıtlanabilen bir hilenin cezası olarak [[validator]]\'ın [[stake]]\'inin bir kısmının yok edilmesi.',
      long: `[[slashing]], birbiriyle çelişen mesajlar imzalayan [[validator]]'ı cezalandırır: aynı [[slot]] için iki farklı [[block]] ya da çelişen iki oy. Kanıt, iki imzanın kendisidir ve bunu herkes ağa sunabilir.

Ceza alan [[validator]], [[stake]]'inin bir kısmını kaybeder ve kümeden çıkarılır. Ethereum'da ceza, aynı dönemde ceza alan [[validator]] sayısıyla birlikte büyür; tek başına bir hata ucuza, eşgüdümlü bir saldırı ise çok pahalıya patlar.

Çevrimdışı kalmak [[slashing]] sebebi değildir; yalnızca küçük ve sürekli kesintilere yol açar.`,
    },
  },
  {
    id: 'attestation',
    name: 'attestation',
    category: 'consensus',
    related: ['validator', 'epoch', 'lmd-ghost', 'casper-ffg'],
    lesson: 'pos',
    en: {
      short: 'A validator\'s signed vote for the block it sees as the head of the chain.',
      long: `On Ethereum every [[validator]] sends one attestation per [[epoch]]. It is a signed statement with two parts: which [[block]] the validator considers the current head of the chain, and which checkpoints it wants to see finalized.

The first part feeds the [[lmd-ghost]] rule that picks between competing branches. The second part feeds [[casper-ffg]], which makes blocks final. Attestations from many validators are merged into a single aggregate signature to save space.`,
    },
    tr: {
      short: 'Bir [[validator]]\'ın, zincirin ucu olarak gördüğü [[block]] için verdiği imzalı oy.',
      long: `Ethereum'da her [[validator]], her [[epoch]]'ta bir [[attestation]] gönderir. Bu, iki parçalı imzalı bir beyandır: [[validator]] hangi [[block]]'u zincirin güncel ucu sayıyor ve hangi "checkpoint"lerin kesinleşmesini istiyor.

İlk parça, yarışan dallar arasında seçim yapan [[lmd-ghost]] kuralını besler. İkinci parça, [[block]]'ları kesinleştiren [[casper-ffg]]'yi besler. Yer kazanmak için çok sayıda [[validator]]'ın [[attestation]]'ı tek bir birleşik imzada toplanır.`,
    },
  },
  {
    id: 'epoch',
    name: 'epoch',
    category: 'consensus',
    related: ['slot', 'attestation', 'casper-ffg'],
    lesson: 'pos',
    en: {
      short: 'A group of 32 slots on Ethereum, 6.4 minutes long; the unit in which finality is counted.',
      long: `An epoch is 32 consecutive [[slot|slots]]. During one epoch every active [[validator]] votes exactly once, so by its end the whole validator set has been heard.

Epoch boundaries are where the bookkeeping happens: rewards and penalties are applied, validators enter and leave, and the checkpoint votes are counted. Finalizing a block normally takes two epochs, about 13 minutes.`,
    },
    tr: {
      short: 'Ethereum\'da 32 [[slot]]\'tan oluşan 6,4 dakikalık dilim; kesinleşme bu birimle sayılır.',
      long: `Bir [[epoch]], art arda gelen 32 [[slot]]'tur. Bir [[epoch]] boyunca her aktif [[validator]] tam bir kez oy verir; yani [[epoch]] bittiğinde bütün [[validator]] kümesinin sesi duyulmuş olur.

Hesap kitap [[epoch]] sınırlarında yapılır: ödüller ve cezalar uygulanır, [[validator]]'lar girer ve çıkar, "checkpoint" oyları sayılır. Bir [[block]]'un kesinleşmesi normalde iki [[epoch]], yani yaklaşık 13 dakika sürer.`,
    },
  },
  {
    id: 'slot',
    name: 'slot',
    category: 'consensus',
    related: ['epoch', 'proposer', 'block'],
    lesson: 'pos',
    en: {
      short: 'A 12-second window on Ethereum in which one chosen validator may propose a block.',
      long: `Ethereum's clock ticks in slots of exactly 12 seconds. Each slot has one [[proposer]], who may publish one [[block]], and one group of validators who vote on what they see.

A slot can stay empty if its proposer is offline; the chain simply continues with the next one. Thirty-two slots form an [[epoch]].`,
    },
    tr: {
      short: 'Ethereum\'da seçilen tek bir [[validator]]\'ın [[block]] önerebildiği 12 saniyelik zaman dilimi.',
      long: `Ethereum'un saati tam 12 saniyelik [[slot]]'larla işler. Her [[slot]]'un bir [[block]] yayımlayabilecek tek bir [[proposer]]'ı ve gördüğünü oylayan bir [[validator]] grubu vardır.

[[proposer]] çevrimdışıysa [[slot]] boş kalabilir; zincir bir sonrakiyle devam eder. Otuz iki [[slot]] bir [[epoch]] eder.`,
    },
  },
  {
    id: 'proposer',
    name: 'proposer',
    category: 'consensus',
    related: ['slot', 'validator', 'attestation'],
    lesson: 'pos',
    en: {
      short: 'The validator chosen to create the block for a given slot.',
      long: `For each [[slot]] the protocol selects one [[validator]] as proposer, pseudo-randomly and with probability proportional to [[stake]]. Only that validator's [[block]] is accepted for the slot.

The proposer chooses and orders the transactions, and earns the tips plus a protocol reward. Proposing two different blocks for the same slot is punished by [[slashing]].`,
    },
    tr: {
      short: 'Belirli bir [[slot]] için [[block]] üretmek üzere seçilen [[validator]].',
      long: `Protokol her [[slot]] için bir [[validator]]'ı [[proposer]] seçer; seçim sözde rastgeledir ve olasılık [[stake]] ile orantılıdır. O [[slot]] için yalnızca bu [[validator]]'ın [[block]]'u kabul edilir.

[[proposer]] işlemleri seçer ve sıralar; karşılığında bahşişleri ve protokol ödülünü alır. Aynı [[slot]] için iki farklı [[block]] önermek [[slashing]] ile cezalandırılır.`,
    },
  },
  {
    id: 'casper-ffg',
    name: 'Casper FFG',
    category: 'consensus',
    related: ['lmd-ghost', 'epoch', 'attestation', 'slashing'],
    lesson: 'pos',
    en: {
      short: 'The part of Ethereum\'s consensus that makes blocks final once two thirds of the stake has voted.',
      long: `Casper FFG ("the Friendly Finality Gadget") runs on top of block production. Once per [[epoch]] it treats one block as a checkpoint, and validators vote for links between checkpoints.

A checkpoint supported by at least 2/3 of the total [[stake]] becomes justified. When the next checkpoint is justified on top of it, the earlier one is finalized and can no longer be reverted by honest nodes.

Its key guarantee is accountability: two conflicting blocks can only both be finalized if validators holding at least 1/3 of the stake signed contradictory votes, which exposes them to [[slashing]].`,
    },
    tr: {
      short: 'Ethereum\'un [[consensus]] mekanizmasında, [[stake]]\'in üçte ikisi oy verince [[block]]\'ları kesinleştiren kısım.',
      long: `[[casper-ffg]] ("the Friendly Finality Gadget"), [[block]] üretiminin üzerinde çalışır. Her [[epoch]]'ta bir [[block]]'u "checkpoint" sayar ve [[validator]]'lar "checkpoint"ler arasındaki bağlara oy verir.

Toplam [[stake]]'in en az 2/3'ünün desteklediği bir "checkpoint" "justified" olur. Üzerine bir sonraki "checkpoint" de "justified" olunca önceki "finalized" olur ve dürüst bilgisayarlar onu artık geri almaz.

En önemli güvencesi hesap sorulabilirliktir: birbiriyle çelişen iki [[block]]'un ikisi birden ancak [[stake]]'in en az 1/3'üne sahip [[validator]]'lar çelişen oylar imzaladıysa kesinleşebilir; bu da onları [[slashing]]'e açık hale getirir.`,
    },
  },
  {
    id: 'lmd-ghost',
    name: 'LMD-GHOST',
    category: 'consensus',
    related: ['casper-ffg', 'attestation', 'validator'],
    lesson: 'pos',
    en: {
      short: 'Ethereum\'s rule for picking the head of the chain: follow the branch with the most stake voting for it.',
      long: `LMD-GHOST stands for "Latest Message Driven, Greedy Heaviest Observed SubTree". When the chain has competing branches, a node starts at the last justified checkpoint and, at every split, steps into the branch whose blocks together carry the most [[stake]] in votes.

"Latest message" means only each [[validator]]'s most recent [[attestation]] counts, so nobody is counted twice.

It gives a fast answer to "which block do I build on right now?", while [[casper-ffg]] separately decides which blocks are final.`,
    },
    tr: {
      short: 'Ethereum\'un zincirin ucunu seçme kuralı: arkasında en çok [[stake]] oyu olan dalı izle.',
      long: `[[lmd-ghost]], "Latest Message Driven, Greedy Heaviest Observed SubTree" sözlerinin kısaltmasıdır. Zincirde yarışan dallar varsa bir bilgisayar en son "justified" olan "checkpoint"ten başlar ve her ayrımda, [[block]]'ları toplamda en çok [[stake]] oyu taşıyan dala girer.

"Latest message", her [[validator]]'ın yalnızca en son [[attestation]]'ının sayıldığı anlamına gelir; böylece kimse iki kez sayılmaz.

Bu kural "şu anda hangi [[block]]'un üzerine kurmalıyım?" sorusuna hızlı bir cevap verir; hangi [[block]]'ların kesinleştiğine ise ayrıca [[casper-ffg]] karar verir.`,
    },
  },
  {
    id: 'nothing-at-stake',
    name: 'nothing at stake',
    category: 'consensus',
    related: ['slashing', 'proof-of-stake', 'stake'],
    lesson: 'pos',
    en: {
      short: 'The problem that voting on every competing branch costs nothing unless the protocol punishes it.',
      long: `In [[proof-of-work]], a miner must split its machines between branches, so supporting two histories halves its chances on each. In a naive [[proof-of-stake]] design a signature costs nothing, so the profitable move is to vote on every branch at once, and the network never settles on one.

Modern protocols close this gap with [[slashing]]: signing two conflicting votes is provable and costs the [[validator]] its [[stake]]. With something to lose, voting for a single history becomes the rational choice.`,
    },
    tr: {
      short: 'Protokol cezalandırmadıkça yarışan her dala birden oy vermenin hiçbir maliyeti olmaması sorunu.',
      long: `[[proof-of-work]] sisteminde bir [[miner]] makinelerini dallar arasında bölmek zorundadır; iki ayrı geçmişi desteklemek her birindeki şansını yarıya indirir. Saf bir [[proof-of-stake]] tasarımında ise imza atmak bedavadır; kârlı hamle her dala birden oy vermektir ve ağ hiçbir zaman tek bir dalda karar kılamaz.

Modern protokoller bu açığı [[slashing]] ile kapatır: birbiriyle çelişen iki oy imzalamak kanıtlanabilir ve [[validator]]'a [[stake]]'ine mal olur. Kaybedecek bir şey olunca tek bir geçmişe oy vermek akılcı seçim haline gelir.`,
    },
  },
];

export default terms;
