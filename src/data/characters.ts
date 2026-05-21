import barnacleBoyImage from "@/assets/characters/barnacle-boy.jpg"
import dirtyBubbleImage from "@/assets/characters/dirty-bubble.png"
import garyImage from "@/assets/characters/gary.jpg"
import karenImage from "@/assets/characters/karen.jpg"
import kingNeptuneImage from "@/assets/characters/king-neptune.jpg"
import larryImage from "@/assets/characters/larry.png"
import mermaidManImage from "@/assets/characters/mermaid-man.png"
import krabsImage from "@/assets/characters/mr-krabs.png"
import puffImage from "@/assets/characters/mrs-puff.png"
import patchyAndPottyImage from "@/assets/characters/patchy-and-potty.jpg"
import patrickImage from "@/assets/characters/patrick.png"
import pearlImage from "@/assets/characters/pearl.png"
import planktonImage from "@/assets/characters/plankton.jpg"
import sandyImage from "@/assets/characters/sandy.png"
import spongebobImage from "@/assets/characters/spongebob.png"
import squilliamImage from "@/assets/characters/squilliam.png"
import squidwardImage from "@/assets/characters/squidward.png"
import flyingDutchmanImage from "@/assets/characters/the-flying-dutchman.jpg"

export type CharacterCard = {
  id: string
  name: string
  image: string
  accent: string
  note: string
}

export const initialCharacters: CharacterCard[] = [
  {
    id: "spongebob",
    name: "海绵宝宝",
    image: spongebobImage,
    accent: "from-yellow-200 via-yellow-300 to-orange-200",
    note: "住在比奇堡菠萝屋里的乐天派，总能把普通的一天过得热热闹闹。"
  },
  {
    id: "patrick",
    name: "派大星",
    image: patrickImage,
    accent: "from-pink-200 via-rose-200 to-orange-100",
    note: "看起来慢半拍，但总能用最直接的方式把快乐值拉满。"
  },
  {
    id: "squidward",
    name: "章鱼哥",
    image: squidwardImage,
    accent: "from-teal-100 via-cyan-100 to-slate-100",
    note: "情绪稳定里带着一点嫌弃，是比奇堡最有个人节奏的角色之一。"
  },
  {
    id: "mr-krabs",
    name: "蟹老板",
    image: krabsImage,
    accent: "from-rose-100 via-red-100 to-orange-100",
    note: "对生意极其敏锐，出场时总带着一种正在盘算营业机会的气场。"
  },
  {
    id: "plankton",
    name: "痞老板",
    image: planktonImage,
    accent: "from-lime-100 via-green-100 to-emerald-100",
    note: "体型最小但野心一点不小，永远在为下一次计划积蓄能量。"
  },
  {
    id: "sandy",
    name: "珊迪",
    image: sandyImage,
    accent: "from-amber-100 via-orange-100 to-yellow-100",
    note: "行动力和技术力都很强，给整个角色阵列带来十足的高能感。"
  },
  {
    id: "gary",
    name: "小蜗",
    image: garyImage,
    accent: "from-sky-100 via-blue-100 to-cyan-50",
    note: "虽然总是慢悠悠，但只要出现就能稳稳抢走一部分注意力。"
  },
  {
    id: "pearl",
    name: "珍珍",
    image: pearlImage,
    accent: "from-pink-100 via-rose-100 to-fuchsia-50",
    note: "蟹老板的女儿，出场总带着夸张又直接的青春期能量。"
  },
  {
    id: "mrs-puff",
    name: "泡芙老师",
    image: puffImage,
    accent: "from-amber-100 via-orange-100 to-yellow-50",
    note: "驾船学校的老师，面对海绵宝宝时常常保持职业又崩溃的微妙平衡。"
  },
  {
    id: "larry",
    name: "拉里龙虾",
    image: larryImage,
    accent: "from-red-100 via-rose-100 to-sky-50",
    note: "沙滩和健身房里的存在感担当，永远是一副精力过剩的状态。"
  },
  {
    id: "mermaid-man",
    name: "大洋游侠",
    image: mermaidManImage,
    accent: "from-orange-100 via-amber-100 to-yellow-50",
    note: "比奇堡的老牌英雄，热血和年代感一起拉满，出场自带怀旧气场。"
  },
  {
    id: "barnacle-boy",
    name: "海超人",
    image: barnacleBoyImage,
    accent: "from-blue-100 via-sky-100 to-cyan-50",
    note: "和大洋游侠搭档多年，表情常常写满无奈，但关键时刻总能接上节奏。"
  },
  {
    id: "the-flying-dutchman",
    name: "飞天魔鬼",
    image: flyingDutchmanImage,
    accent: "from-emerald-100 via-green-100 to-lime-50",
    note: "幽灵船长式的经典反派，阴森里又带着一股很有辨识度的戏剧感。"
  },
  {
    id: "patchy-and-potty",
    name: "海盗派奇和鹦鹉芭迪",
    image: patchyAndPottyImage,
    accent: "from-amber-100 via-orange-100 to-red-50",
    note: "真人段落里的高频组合，一个热情过头，一个负责把场面搅得更乱。"
  },
  {
    id: "king-neptune",
    name: "海神王",
    image: kingNeptuneImage,
    accent: "from-cyan-100 via-sky-100 to-blue-50",
    note: "掌控海洋秩序的大人物，出场时总带着一种高压又夸张的王者姿态。"
  },
  {
    id: "karen",
    name: "凯伦",
    image: karenImage,
    accent: "from-slate-100 via-zinc-100 to-neutral-50",
    note: "痞老板最稳定也最毒舌的搭档，冷静输出往往比计划本身更有杀伤力。"
  },
  {
    id: "dirty-bubble",
    name: "邪恶泡泡",
    image: dirtyBubbleImage,
    accent: "from-purple-100 via-fuchsia-100 to-pink-50",
    note: "经典反派形象之一，夸张的压迫感和荒诞感混在一起，非常抓眼。"
  },
  {
    id: "squilliam",
    name: "章鱼威廉",
    image: squilliamImage,
    accent: "from-teal-100 via-emerald-100 to-cyan-50",
    note: "章鱼哥最不想遇到的成功样板，永远用一种体面的方式把压迫感拉满。"
  }
]
