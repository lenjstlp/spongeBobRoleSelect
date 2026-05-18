import garyImage from "@/assets/characters/gary.svg"
import larryImage from "@/assets/characters/larry.svg"
import krabsImage from "@/assets/characters/mr-krabs.svg"
import puffImage from "@/assets/characters/mrs-puff.svg"
import patrickImage from "@/assets/characters/patrick.svg"
import pearlImage from "@/assets/characters/pearl.svg"
import planktonImage from "@/assets/characters/plankton.svg"
import sandyImage from "@/assets/characters/sandy.svg"
import spongebobImage from "@/assets/characters/spongebob.svg"
import squidwardImage from "@/assets/characters/squidward.svg"

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
  }
]
