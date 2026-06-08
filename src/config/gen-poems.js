const fs = require('fs');
const path = require('path');

function c(char, tone, isRhyme, isKeyword, imagery) {
  const obj = { char, tone, isRhyme: !!isRhyme, isKeyword: !!isKeyword };
  if (imagery) obj.imagery = imagery;
  return obj;
}

function tp(tone, expected) {
  return { tone, expected };
}

function line(text, characters, tonePattern, rhymeGroup) {
  const obj = { text, characters, tonePattern };
  if (rhymeGroup) obj.rhymeGroup = rhymeGroup;
  return obj;
}

const P = tp.bind(null);
const ping = 'ping', ze = 'ze';
const R = true, K = true, F = false;

const poems = [
  {
    id: "poem_rml_1", title: "如梦令·常记溪亭日暮", author: "李清照", dynasty: "宋", ciPaiId: "cp_rumengling", difficulty: 1,
    imagery: ["溪亭","日暮","归路","鸥鹭","藕花","沉醉","争渡"],
    lines: [
      line("常记溪亭日暮", [c("常",ping,F,F),c("记",ze,F,F),c("溪",ping,F,K,"溪亭"),c("亭",ping,F,K,"溪亭"),c("日",ze,F,K,"日暮"),c("暮",ze,R,K,"日暮")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
      line("沉醉不知归路", [c("沉",ping,F,F),c("醉",ze,F,K,"沉醉"),c("不",ze,F,F),c("知",ping,F,F),c("归",ping,F,K,"归路"),c("路",ze,R,K,"归路")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
      line("兴尽晚回舟", [c("兴",ze,F,F),c("尽",ze,F,F),c("晚",ze,F,F),c("回",ping,F,F),c("舟",ping,F,K,"舟")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("误入藕花深处", [c("误",ze,F,F),c("入",ze,F,F),c("藕",ze,F,K,"藕花"),c("花",ping,F,K,"藕花"),c("深",ping,F,F),c("处",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
      line("争渡", [c("争",ping,F,F),c("渡",ze,R,K,"争渡")], [P(ping,"平"),P(ze,"仄")], "第四部"),
      line("争渡", [c("争",ping,F,F),c("渡",ze,R,K,"争渡")], [P(ping,"平"),P(ze,"仄")], "第四部"),
      line("惊起一滩鸥鹭", [c("惊",ping,F,F),c("起",ze,F,F),c("一",ze,F,F),c("滩",ping,F,F),c("鸥",ping,F,K,"鸥鹭"),c("鹭",ze,R,K,"鸥鹭")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
    ]
  },
  {
    id: "poem_rml_2", title: "如梦令·昨夜雨疏风骤", author: "李清照", dynasty: "宋", ciPaiId: "cp_rumengling", difficulty: 1,
    imagery: ["风雨","残酒","卷帘","海棠","绿肥红瘦"],
    lines: [
      line("昨夜雨疏风骤", [c("昨",ze,F,F),c("夜",ze,F,F),c("雨",ze,F,K,"风雨"),c("疏",ping,F,F),c("风",ping,F,K,"风雨"),c("骤",ze,R,K,"风骤")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十二部"),
      line("浓睡不消残酒", [c("浓",ping,F,F),c("睡",ze,F,K,"浓睡"),c("不",ze,F,F),c("消",ping,F,F),c("残",ping,F,K,"残酒"),c("酒",ze,R,K,"残酒")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十二部"),
      line("试问卷帘人", [c("试",ze,F,F),c("问",ze,F,F),c("卷",ze,F,K,"卷帘"),c("帘",ping,F,K,"卷帘"),c("人",ping,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("却道海棠依旧", [c("却",ze,F,F),c("道",ze,F,F),c("海",ze,F,F),c("棠",ping,F,K,"海棠"),c("依",ping,F,F),c("旧",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十二部"),
      line("知否", [c("知",ping,F,F),c("否",ze,R,F)], [P(ping,"平"),P(ze,"仄")], "第十二部"),
      line("知否", [c("知",ping,F,F),c("否",ze,R,F)], [P(ping,"平"),P(ze,"仄")], "第十二部"),
      line("应是绿肥红瘦", [c("应",ping,F,F),c("是",ze,F,F),c("绿",ze,F,K,"绿肥红瘦"),c("肥",ping,F,K,"绿肥红瘦"),c("红",ping,F,K,"绿肥红瘦"),c("瘦",ze,R,K,"绿肥红瘦")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十二部"),
    ]
  },
  {
    id: "poem_hxs_1", title: "浣溪沙·一曲新词酒一杯", author: "晏殊", dynasty: "宋", ciPaiId: "cp_huanxisha", difficulty: 2,
    imagery: ["新词","旧亭台","夕阳","落花","归燕","香径","小园"],
    lines: [
      line("一曲新词酒一杯", [c("一",ze,F,F),c("曲",ze,F,K,"新词"),c("新",ping,F,K,"新词"),c("词",ping,F,K,"新词"),c("酒",ze,F,K,"酒"),c("一",ze,F,F),c("杯",ping,R,K,"酒")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ping,"平")], "第二部"),
      line("去年天气旧亭台", [c("去",ze,F,F),c("年",ping,F,F),c("天",ping,F,K,"天气"),c("气",ze,F,K,"天气"),c("旧",ze,F,K,"旧亭台"),c("亭",ping,F,K,"旧亭台"),c("台",ping,R,K,"旧亭台")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第二部"),
      line("夕阳西下几时回", [c("夕",ze,F,K,"夕阳"),c("阳",ping,F,K,"夕阳"),c("西",ping,F,F),c("下",ze,F,F),c("几",ze,F,F),c("时",ping,F,F),c("回",ping,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第二部"),
      line("无可奈何花落去", [c("无",ping,F,F),c("可",ze,F,F),c("奈",ze,F,F),c("何",ping,F,F),c("花",ping,F,K,"落花"),c("落",ze,F,K,"落花"),c("去",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("似曾相识燕归来", [c("似",ze,F,F),c("曾",ping,F,F),c("相",ping,F,F),c("识",ze,F,F),c("燕",ze,F,K,"归燕"),c("归",ping,F,K,"归燕"),c("来",ping,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第二部"),
      line("小园香径独徘徊", [c("小",ze,F,F),c("园",ping,F,K,"小园"),c("香",ping,F,K,"香径"),c("径",ze,F,K,"香径"),c("独",ze,F,F),c("徘",ping,F,F),c("徊",ping,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第二部"),
    ]
  },
  {
    id: "poem_hxs_2", title: "浣溪沙·漠漠轻寒上小楼", author: "秦观", dynasty: "宋", ciPaiId: "cp_huanxisha", difficulty: 2,
    imagery: ["轻寒","小楼","淡烟","流水","画屏","飞花","丝雨","银钩"],
    lines: [
      line("漠漠轻寒上小楼", [c("漠",ze,F,F),c("漠",ze,F,F),c("轻",ping,F,K,"轻寒"),c("寒",ping,F,K,"轻寒"),c("上",ze,F,F),c("小",ze,F,K,"小楼"),c("楼",ping,R,K,"小楼")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ping,"平")], "第十二部"),
      line("晓阴无赖似穷秋", [c("晓",ze,F,F),c("阴",ping,F,K,"晓阴"),c("无",ping,F,F),c("赖",ze,F,F),c("似",ze,F,F),c("穷",ping,F,K,"穷秋"),c("秋",ping,R,K,"穷秋")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第十二部"),
      line("淡烟流水画屏幽", [c("淡",ze,F,F),c("烟",ping,F,K,"淡烟"),c("流",ping,F,K,"流水"),c("水",ze,F,K,"流水"),c("画",ze,F,K,"画屏"),c("屏",ping,F,K,"画屏"),c("幽",ping,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第十二部"),
      line("自在飞花轻似梦", [c("自",ze,F,F),c("在",ze,F,F),c("飞",ping,F,K,"飞花"),c("花",ping,F,K,"飞花"),c("轻",ping,F,F),c("似",ze,F,F),c("梦",ze,F,K,"梦")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("无边丝雨细如愁", [c("无",ping,F,F),c("边",ping,F,F),c("丝",ping,F,K,"丝雨"),c("雨",ze,F,K,"丝雨"),c("细",ze,F,F),c("如",ping,F,F),c("愁",ping,R,K,"愁")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第十二部"),
      line("宝帘闲挂小银钩", [c("宝",ze,F,F),c("帘",ping,F,K,"宝帘"),c("闲",ping,F,F),c("挂",ze,F,F),c("小",ze,F,F),c("银",ping,F,K,"银钩"),c("钩",ping,R,K,"银钩")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第十二部"),
    ]
  },
  {
    id: "poem_dlh_1", title: "蝶恋花·伫倚危楼风细细", author: "柳永", dynasty: "宋", ciPaiId: "cp_dielianhua", difficulty: 3,
    imagery: ["危楼","春愁","天际","草色","烟光","残照","凭阑","疏狂","憔悴"],
    lines: [
      line("伫倚危楼风细细", [c("伫",ze,F,F),c("倚",ze,F,F),c("危",ping,F,K,"危楼"),c("楼",ping,F,K,"危楼"),c("风",ping,F,K,"风"),c("细",ze,R,K,"风")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第三部"),
      line("望极春愁", [c("望",ze,F,F),c("极",ze,F,F),c("春",ping,F,K,"春愁"),c("愁",ping,F,K,"春愁")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("黯黯生天际", [c("黯",ze,F,F),c("黯",ze,F,F),c("生",ping,F,F),c("天",ping,F,K,"天际"),c("际",ze,R,K,"天际")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第三部"),
      line("草色烟光残照里", [c("草",ze,F,K,"草色"),c("色",ze,F,K,"草色"),c("烟",ping,F,K,"烟光"),c("光",ping,F,K,"烟光"),c("残",ping,F,K,"残照"),c("照",ze,F,K,"残照"),c("里",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第三部"),
      line("无言谁会凭阑意", [c("无",ping,F,F),c("言",ping,F,F),c("谁",ping,F,F),c("会",ze,F,F),c("凭",ping,F,K,"凭阑"),c("阑",ping,F,K,"凭阑"),c("意",ze,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第三部"),
      line("拟把疏狂图一醉", [c("拟",ze,F,F),c("把",ze,F,F),c("疏",ping,F,K,"疏狂"),c("狂",ping,F,K,"疏狂"),c("图",ping,F,F),c("一",ze,F,F),c("醉",ze,R,K,"醉")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第三部"),
      line("对酒当歌", [c("对",ze,F,F),c("酒",ze,F,K,"酒"),c("当",ping,F,F),c("歌",ping,F,K,"歌")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("强乐还无味", [c("强",ze,F,F),c("乐",ze,F,K,"强乐"),c("还",ping,F,F),c("无",ping,F,F),c("味",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第三部"),
      line("衣带渐宽终不悔", [c("衣",ping,F,F),c("带",ze,F,F),c("渐",ze,F,F),c("宽",ping,F,K,"渐宽"),c("终",ping,F,F),c("不",ze,F,F),c("悔",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第三部"),
      line("为伊消得人憔悴", [c("为",ze,F,F),c("伊",ping,F,K,"伊"),c("消",ping,F,F),c("得",ze,F,F),c("人",ping,F,F),c("憔",ping,F,K,"憔悴"),c("悴",ze,R,K,"憔悴")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第三部"),
    ]
  },
  {
    id: "poem_dlh_2", title: "蝶恋花·庭院深深深几许", author: "欧阳修", dynasty: "宋", ciPaiId: "cp_dielianhua", difficulty: 3,
    imagery: ["庭院","杨柳","堆烟","帘幕","雕鞍","章台","黄昏","留春","秋千","乱红"],
    lines: [
      line("庭院深深深几许", [c("庭",ping,F,K,"庭院"),c("院",ze,F,K,"庭院"),c("深",ping,F,F),c("深",ping,F,F),c("深",ping,F,F),c("几",ze,F,F),c("许",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第四部"),
      line("杨柳堆烟", [c("杨",ping,F,K,"杨柳"),c("柳",ze,F,K,"杨柳"),c("堆",ping,F,K,"堆烟"),c("烟",ping,F,K,"堆烟")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("帘幕无重数", [c("帘",ping,F,K,"帘幕"),c("幕",ze,F,K,"帘幕"),c("无",ping,F,F),c("重",ping,F,F),c("数",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
      line("玉勒雕鞍游冶处", [c("玉",ze,F,K,"玉勒"),c("勒",ze,F,K,"玉勒"),c("雕",ping,F,K,"雕鞍"),c("鞍",ping,F,K,"雕鞍"),c("游",ping,F,F),c("冶",ze,F,F),c("处",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第四部"),
      line("楼高不见章台路", [c("楼",ping,F,K,"楼"),c("高",ping,F,F),c("不",ze,F,F),c("见",ze,F,F),c("章",ping,F,K,"章台"),c("台",ping,F,K,"章台"),c("路",ze,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
      line("雨横风狂三月暮", [c("雨",ze,F,K,"风雨"),c("横",ping,F,F),c("风",ping,F,K,"风雨"),c("狂",ping,F,F),c("三",ping,F,F),c("月",ze,F,F),c("暮",ze,R,K,"暮")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第四部"),
      line("门掩黄昏", [c("门",ping,F,K,"门"),c("掩",ze,F,F),c("黄",ping,F,K,"黄昏"),c("昏",ping,F,K,"黄昏")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("无计留春住", [c("无",ping,F,F),c("计",ze,F,F),c("留",ping,F,K,"留春"),c("春",ping,F,K,"留春"),c("住",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
      line("泪眼问花花不语", [c("泪",ze,F,K,"泪眼"),c("眼",ze,F,K,"泪眼"),c("问",ze,F,F),c("花",ping,F,K,"花"),c("花",ping,F,K,"花"),c("不",ze,F,F),c("语",ze,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第四部"),
      line("乱红飞过秋千去", [c("乱",ze,F,K,"乱红"),c("红",ping,F,K,"乱红"),c("飞",ping,F,F),c("过",ze,F,F),c("秋",ping,F,K,"秋千"),c("千",ping,F,K,"秋千"),c("去",ze,R,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第四部"),
    ]
  },
  {
    id: "poem_sdgt_1", title: "水调歌头·明月几时有", author: "苏轼", dynasty: "宋", ciPaiId: "cp_shuidiaogetou", difficulty: 4,
    imagery: ["明月","青天","宫阙","琼楼","清影","婵娟","朱阁","无眠","悲欢离合"],
    lines: [
      line("明月几时有", [c("明",ping,F,K,"明月"),c("月",ze,F,K,"明月"),c("几",ze,F,F),c("时",ping,F,F),c("有",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")]),
      line("把酒问青天", [c("把",ze,F,F),c("酒",ze,F,K,"把酒"),c("问",ze,F,F),c("青",ping,F,K,"青天"),c("天",ping,R,K,"青天")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("不知天上宫阙", [c("不",ze,F,F),c("知",ping,F,F),c("天",ping,F,F),c("上",ze,F,F),c("宫",ping,F,K,"宫阙"),c("阙",ze,F,K,"宫阙")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("今夕是何年", [c("今",ping,F,F),c("夕",ze,F,F),c("是",ze,F,F),c("何",ping,F,F),c("年",ping,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("我欲乘风归去", [c("我",ze,F,F),c("欲",ze,F,F),c("乘",ping,F,K,"乘风"),c("风",ping,F,K,"乘风"),c("归",ping,F,F),c("去",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("又恐琼楼玉宇", [c("又",ze,F,F),c("恐",ze,F,F),c("琼",ping,F,K,"琼楼"),c("楼",ping,F,K,"琼楼"),c("玉",ze,F,K,"玉宇"),c("宇",ze,F,K,"玉宇")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("高处不胜寒", [c("高",ping,F,F),c("处",ze,F,F),c("不",ze,F,F),c("胜",ping,F,F),c("寒",ping,R,K,"不胜寒")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("起舞弄清影", [c("起",ze,F,F),c("舞",ze,F,F),c("弄",ze,F,F),c("清",ping,F,K,"清影"),c("影",ze,F,K,"清影")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("何似在人间", [c("何",ping,F,F),c("似",ze,F,F),c("在",ze,F,F),c("人",ping,F,K,"人间"),c("间",ping,R,K,"人间")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("转朱阁", [c("转",ze,F,F),c("朱",ping,F,K,"朱阁"),c("阁",ze,F,K,"朱阁")], [P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("低绮户", [c("低",ping,F,F),c("绮",ze,F,K,"绮户"),c("户",ze,F,K,"绮户")], [P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("照无眠", [c("照",ze,F,F),c("无",ping,F,F),c("眠",ping,R,K,"无眠")], [P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("不应有恨", [c("不",ze,F,F),c("应",ping,F,F),c("有",ze,F,F),c("恨",ze,F,K,"恨")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("何事长向别时圆", [c("何",ping,F,F),c("事",ze,F,F),c("长",ping,F,F),c("向",ze,F,F),c("别",ze,F,F),c("时",ping,F,F),c("圆",ping,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("人有悲欢离合", [c("人",ping,F,K,"悲欢离合"),c("有",ze,F,F),c("悲",ping,F,K,"悲欢离合"),c("欢",ping,F,K,"悲欢离合"),c("离",ping,F,K,"悲欢离合"),c("合",ze,F,K,"悲欢离合")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("月有阴晴圆缺", [c("月",ze,F,F),c("有",ze,F,F),c("阴",ping,F,K,"阴晴圆缺"),c("晴",ping,F,K,"阴晴圆缺"),c("圆",ping,F,K,"阴晴圆缺"),c("缺",ze,F,K,"阴晴圆缺")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("此事古难全", [c("此",ze,F,F),c("事",ze,F,F),c("古",ze,F,F),c("难",ping,F,F),c("全",ping,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
      line("但愿人长久", [c("但",ze,F,F),c("愿",ze,F,F),c("人",ping,F,K,"人长久"),c("长",ping,F,K,"人长久"),c("久",ze,F,K,"人长久")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("千里共婵娟", [c("千",ping,F,F),c("里",ze,F,F),c("共",ze,F,F),c("婵",ping,F,K,"婵娟"),c("娟",ping,R,K,"婵娟")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第七部"),
    ]
  },
  {
    id: "poem_sdgt_2", title: "水调歌头·落日绣帘卷", author: "苏轼", dynasty: "宋", ciPaiId: "cp_shuidiaogetou", difficulty: 4,
    imagery: ["落日","孤鸿","江南烟雨","碧峰","浩然气","快哉风"],
    lines: [
      line("落日绣帘卷", [c("落",ze,F,K,"落日"),c("日",ze,F,K,"落日"),c("绣",ze,F,F),c("帘",ping,F,K,"绣帘"),c("卷",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")]),
      line("亭下水连空", [c("亭",ping,F,F),c("下",ze,F,F),c("水",ze,F,K,"水"),c("连",ping,F,F),c("空",ping,R,K,"空")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("知君为我新作", [c("知",ping,F,F),c("君",ping,F,F),c("为",ze,F,F),c("我",ze,F,F),c("新",ping,F,K,"新作"),c("作",ze,F,K,"新作")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("窗户湿青红", [c("窗",ping,F,K,"窗户"),c("户",ze,F,K,"窗户"),c("湿",ze,F,F),c("青",ping,F,K,"青红"),c("红",ping,R,K,"青红")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("长记平山堂上", [c("长",ping,F,F),c("记",ze,F,F),c("平",ping,F,K,"平山堂"),c("山",ping,F,K,"平山堂"),c("堂",ping,F,K,"平山堂"),c("上",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("欹枕江南烟雨", [c("欹",ping,F,F),c("枕",ze,F,F),c("江",ping,F,K,"江南烟雨"),c("南",ping,F,K,"江南烟雨"),c("烟",ping,F,K,"江南烟雨"),c("雨",ze,F,K,"江南烟雨")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("杳杳没孤鸿", [c("杳",ze,F,F),c("杳",ze,F,F),c("没",ze,F,F),c("孤",ping,F,K,"孤鸿"),c("鸿",ping,R,K,"孤鸿")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("认得醉翁语", [c("认",ze,F,F),c("得",ze,F,F),c("醉",ze,F,K,"醉翁"),c("翁",ping,F,K,"醉翁"),c("语",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("山色有无中", [c("山",ping,F,K,"山色"),c("色",ze,F,K,"山色"),c("有",ze,F,F),c("无",ping,F,F),c("中",ping,R,F)], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("一千顷", [c("一",ze,F,F),c("千",ping,F,F),c("顷",ze,F,F)], [P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("都镜净", [c("都",ping,F,F),c("镜",ze,F,F),c("净",ze,F,F)], [P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("倒碧峰", [c("倒",ze,F,F),c("碧",ze,F,K,"碧峰"),c("峰",ping,R,K,"碧峰")], [P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("忽然浪起", [c("忽",ze,F,F),c("然",ping,F,F),c("浪",ze,F,F),c("起",ze,F,F)], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("掀舞一叶白头翁", [c("掀",ping,F,F),c("舞",ze,F,F),c("一",ze,F,F),c("叶",ze,F,F),c("白",ze,F,K,"白头翁"),c("头",ping,F,K,"白头翁"),c("翁",ping,R,K,"白头翁")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("堪笑兰台公子", [c("堪",ping,F,F),c("笑",ze,F,F),c("兰",ping,F,K,"兰台"),c("台",ping,F,K,"兰台"),c("公",ping,F,F),c("子",ze,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("未解庄生天籁", [c("未",ze,F,F),c("解",ze,F,F),c("庄",ping,F,K,"庄生"),c("生",ping,F,K,"庄生"),c("天",ping,F,K,"天籁"),c("籁",ze,F,K,"天籁")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("刚道有雌雄", [c("刚",ping,F,F),c("道",ze,F,F),c("有",ze,F,F),c("雌",ping,F,K,"雌雄"),c("雄",ping,R,K,"雌雄")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
      line("一点浩然气", [c("一",ze,F,F),c("点",ze,F,K,"浩然气"),c("浩",ze,F,K,"浩然气"),c("然",ping,F,K,"浩然气"),c("气",ze,F,K,"浩然气")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("千里快哉风", [c("千",ping,F,F),c("里",ze,F,F),c("快",ze,F,K,"快哉风"),c("哉",ping,F,K,"快哉风"),c("风",ping,R,K,"快哉风")], [P(ze,"仄"),P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")], "第一部"),
    ]
  },
  {
    id: "poem_nnj_1", title: "念奴娇·赤壁怀古", author: "苏轼", dynasty: "宋", ciPaiId: "cp_niannujiao", difficulty: 5,
    imagery: ["大江","惊涛","乱石","豪杰","羽扇纶巾","华发","江月"],
    lines: [
      line("大江东去", [c("大",ze,F,F),c("江",ping,F,K,"大江"),c("东",ping,F,F),c("去",ze,F,F)], [P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")]),
      line("浪淘尽", [c("浪",ze,F,F),c("淘",ping,F,F),c("尽",ze,F,F)], [P(ze,"仄"),P(ping,"平"),P(ze,"仄")]),
      line("千古风流人物", [c("千",ping,F,F),c("古",ze,F,F),c("风",ping,F,K,"风流"),c("流",ping,F,K,"风流"),c("人",ping,F,K,"人物"),c("物",ze,R,K,"人物")], [P(ping,"平"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十八部"),
      line("故垒西边", [c("故",ze,F,F),c("垒",ze,F,K,"故垒"),c("西",ping,F,F),c("边",ping,F,F)], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("人道是", [c("人",ping,F,F),c("道",ze,F,F),c("是",ze,F,F)], [P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("三国周郎赤壁", [c("三",ping,F,F),c("国",ze,F,F),c("周",ping,F,K,"周郎"),c("郎",ping,F,K,"周郎"),c("赤",ze,F,K,"赤壁"),c("壁",ze,R,K,"赤壁")], [P(ping,"平"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")], "第十八部"),
      line("乱石穿空", [c("乱",ze,F,K,"乱石"),c("石",ze,F,K,"乱石"),c("穿",ping,F,F),c("空",ping,F,K,"空")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("惊涛拍岸", [c("惊",ping,F,K,"惊涛"),c("涛",ping,F,K,"惊涛"),c("拍",ze,F,K,"拍岸"),c("岸",ze,F,K,"拍岸")], [P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("卷起千堆雪", [c("卷",ze,F,F),c("起",ze,F,F),c("千",ping,F,F),c("堆",ping,F,F),c("雪",ze,R,K,"雪")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十八部"),
      line("江山如画", [c("江",ping,F,K,"江山"),c("山",ping,F,K,"江山"),c("如",ping,F,F),c("画",ze,F,K,"如画")], [P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄")]),
      line("一时多少豪杰", [c("一",ze,F,F),c("时",ping,F,F),c("多",ping,F,F),c("少",ze,F,F),c("豪",ping,F,K,"豪杰"),c("杰",ze,R,K,"豪杰")], [P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ping,"平"),P(ze,"仄")], "第十八部"),
      line("遥想公瑾当年", [c("遥",ping,F,F),c("想",ze,F,K,"遥想"),c("公",ping,F,K,"公瑾"),c("瑾",ze,F,K,"公瑾"),c("当",ping,F,F),c("年",ping,F,F)], [P(ping,"平"),P(ze,"仄"),P(ping,"平"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("小乔初嫁了", [c("小",ze,F,K,"小乔"),c("乔",ping,F,K,"小乔"),c("初",ping,F,F),c("嫁",ze,F,F),c("了",ze,F,F)], [P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("雄姿英发", [c("雄",ping,F,K,"雄姿英发"),c("姿",ping,F,K,"雄姿英发"),c("英",ping,F,K,"雄姿英发"),c("发",ze,R,K,"雄姿英发")], [P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十八部"),
      line("羽扇纶巾", [c("羽",ze,F,K,"羽扇纶巾"),c("扇",ze,F,K,"羽扇纶巾"),c("纶",ping,F,K,"羽扇纶巾"),c("巾",ping,F,K,"羽扇纶巾")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("谈笑间", [c("谈",ping,F,F),c("笑",ze,F,F),c("间",ping,F,F)], [P(ping,"平"),P(ze,"仄"),P(ping,"平")]),
      line("樯橹灰飞烟灭", [c("樯",ping,F,K,"樯橹"),c("橹",ze,F,K,"樯橹"),c("灰",ping,F,F),c("飞",ping,F,F),c("烟",ping,F,K,"烟灭"),c("灭",ze,R,K,"烟灭")], [P(ping,"平"),P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十八部"),
      line("故国神游", [c("故",ze,F,F),c("国",ze,F,K,"故国"),c("神",ping,F,K,"神游"),c("游",ping,F,K,"神游")], [P(ze,"仄"),P(ze,"仄"),P(ping,"平"),P(ping,"平")]),
      line("多情应笑我", [c("多",ping,F,F),c("情",ping,F,K,"多情"),c("应",ping,F,F),c("笑",ze,F,F),c("我",ze,F,F)], [P(ping,"平"),P(ping,"平"),P(ping,"平"),P(ze,"仄"),P(ze,"仄")]),
      line("早生华发", [c("早",ze,F,F),c("生",ping,F,F),c("华",ping,F,K,"华发"),c("发",ze,R,K,"华发")], [P(ze,"仄"),P(ping,"平"),P(ping,"平"),P(ze,"仄")], "第十八部"),
      line("人生如梦", [c("人",ping,F,K,"人生"),c("生",ping,F,K,"人生"),c("如",ping,F,F),c("梦",ze,F,K