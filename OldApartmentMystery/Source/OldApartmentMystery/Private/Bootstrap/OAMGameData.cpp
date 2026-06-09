// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.
// 硬编码完整游戏内容（22 物品/ 6 笔记/ 3 谜题/ 3 章/ 3 关）

#include "Bootstrap/OAMGameData.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Data/OAMPuzzleData.h"
#include "Data/OAMChapterData.h"
#include "Data/OAMLevelDataAsset.h"

const UOAMGameData* UOAMGameData::Get()
{
	return GetDefault<UOAMGameData>();
}

UOAMItemData* UOAMGameData::BuildOrGetItem(FName ID) const
{
	if (UOAMItemData** pp = RuntimeItemCache.Find(ID)) return *pp;
	UOAMItemData* It = NewObject<UOAMItemData>();
	It->ItemID = ID;
	for (const auto& R : ItemRows) if (R.ItemID == ID)
	{
		It->DisplayName = R.DisplayName;
		It->Description = R.Description;
		It->bIsNote = R.bIsNote;
		It->LinkedNote = BuildOrGetNote(R.LinkedNoteID);
		It->UnlocksDoorID = R.UnlocksDoorID;
		It->TintColor = R.Color;
		for (const FString& T : R.ExamineTexts) It->ExamineFlavorTexts.Add(FText::FromString(T));
		break;
	}
	RuntimeItemCache.Add(ID, It);
	return It;
}

UOAMNoteData* UOAMGameData::BuildOrGetNote(FName ID) const
{
	if (ID.IsNone()) return nullptr;
	if (UOAMNoteData** pp = RuntimeNoteCache.Find(ID)) return *pp;
	UOAMNoteData* It = NewObject<UOAMNoteData>();
	It->NoteID = ID;
	for (const auto& R : NoteRows) if (R.NoteID == ID)
	{
		It->Title = R.Title;
		It->Author = R.Author;
		It->DateStr = FText::FromString(R.DateStr);
		It->MoodTag = (EOAMNoteMood)R.Mood;
		It->bIsEvidence = R.bIsEvidence;
		for (const auto& S : R.Pages) It->Pages.Add({ FText::FromString(S) });
		break;
	}
	RuntimeNoteCache.Add(ID, It);
	return It;
}

UOAMPuzzleData* UOAMGameData::BuildOrGetPuzzle(FName ID) const
{
	if (ID.IsNone()) return nullptr;
	if (UOAMPuzzleData** pp = RuntimePuzzleCache.Find(ID)) return *pp;
	UOAMPuzzleData* It = NewObject<UOAMPuzzleData>();
	It->PuzzleID = ID;
	for (const auto& R : PuzzleRows) if (R.PuzzleID == ID)
	{
		It->DisplayName = R.DisplayName;
		It->DigitCount = R.DigitCount;
		It->Password = R.Password;
		It->MaxAttempts = R.MaxAttempts;
		It->HintText = R.HintText;
		It->FailFeedback = R.FailFeedback;
		It->OnSolveNarration = R.OnSolveNarration;
		It->RewardItemID = R.RewardItemID;
		It->UnlocksDoorID = R.UnlocksDoorID;
		It->RequiredKeyItemID = R.RequiredKeyItemID;
		break;
	}
	RuntimePuzzleCache.Add(ID, It);
	return It;
}

UOAMChapterData* UOAMGameData::BuildOrGetChapter(int32 ID) const
{
	if (UOAMChapterData** pp = RuntimeChapterCache.Find(ID)) return *pp;
	UOAMChapterData* It = NewObject<UOAMChapterData>();
	It->ChapterID = ID;
	for (const auto& R : ChapterRows) if (R.ChapterID == ID)
	{
		It->ChapterTitle = R.Title;
		It->ChapterSubtitle = R.Subtitle;
		It->Description = R.Description;
		It->LevelName = R.LevelName;
		for (const auto& O : R.Objectives)
		{
			FOAMChapterObjective Obj;
			Obj.ObjectiveID = O.ObjectiveID;
			Obj.Description = O.Description;
			Obj.CheckType = (EOAMObjectiveCheck)O.CheckType;
			Obj.CheckValue = O.CheckValue;
			Obj.CheckCount = O.CheckCount;
			Obj.bIsRequired = O.bIsRequired;
			It->Objectives.Add(Obj);
		}
		break;
	}
	RuntimeChapterCache.Add(ID, It);
	return It;
}

UOAMLevelDataAsset* UOAMGameData::BuildOrGetLevel(FName ID) const
{
	if (ID.IsNone()) return nullptr;
	if (UOAMLevelDataAsset** pp = RuntimeLevelCache.Find(ID)) return *pp;
	UOAMLevelDataAsset* It = NewObject<UOAMLevelDataAsset>();
	It->LevelName = ID;
	for (const auto& R : LevelRows) if (R.LevelName == ID)
	{
		It->ChapterID = R.ChapterID;
		It->GridSize = R.GridSize;
		It->SpawnPoint = R.SpawnPoint;
		for (const auto& W : R.Walls) It->Walls.Add({ W.X, W.Y, W.W, W.H });
		for (const auto& I : R.Items)
		{
			FOAMLevelItemSpawn S;
			S.ItemID = I.ItemID;
			S.Position = I.Position;
			S.RoomID = I.RoomID;
			S.bIsPuzzle = I.bIsPuzzle;
			It->ItemSpawns.Add(S);
		}
		for (const auto& D : R.Doors)
		{
			FOAMLevelDoor DD;
			DD.DoorID = D.DoorID;
			DD.Position = D.Position;
			DD.Size = D.Size;
			DD.ToLevel = D.ToLevel;
			DD.ToSpawn = D.ToSpawn;
			DD.ToRoom = D.ToRoom;
			DD.bLocked = D.bLocked;
			DD.KeyItemID = D.KeyItemID;
			DD.DisplayName = D.DisplayName;
			DD.bIsEndingDoor = D.bIsEndingDoor;
			It->Doors.Add(DD);
		}
		for (const auto& Rm : R.Rooms)
		{
			FOAMRoomTrigger T;
			T.RoomID = Rm.RoomID;
			T.RoomName = Rm.RoomName;
			T.Rect = FIntRect(Rm.X, Rm.Y, Rm.X + Rm.W, Rm.Y + Rm.H);
			It->RoomTriggers.Add(T);
		}
		break;
	}
	RuntimeLevelCache.Add(ID, It);
	return It;
}

const UOAMItemData*   UOAMGameData::FindItem(FName ItemID)    { return Get()->BuildOrGetItem(ItemID); }
const UOAMNoteData*   UOAMGameData::FindNote(FName NoteID)    { return Get()->BuildOrGetNote(NoteID); }
const UOAMPuzzleData* UOAMGameData::FindPuzzle(FName PuzzleID){ return Get()->BuildOrGetPuzzle(PuzzleID); }
const UOAMChapterData* UOAMGameData::FindChapter(int32 ID)   { return Get()->BuildOrGetChapter(ID); }
const UOAMLevelDataAsset* UOAMGameData::FindLevel(FName ID)  { return Get()->BuildOrGetLevel(ID); }

/* ========================================================================
   ================ 完整硬编码游戏内容（22 物品/6 笔记/3 谜题/3 章）=======
   ======================================================================== */

#define _T(X) FText::FromString(TEXT(X))
#define IT(ID, NAME, DESC, NOTE, UNLK, EXAMS, COLOR) \
	ItemRows.Add({ FName(TEXT(ID)), _T(NAME), _T(DESC), !!(NOTE), FName(TEXT(NOTE)), FName(TEXT(UNLK)), EXAMS, FColor(COLOR) });

UOAMGameData::UOAMGameData()
{
	/* ----------- 22 个可交互物品 ----------- */
	ItemRows.Empty();
	IT("item_letter",        "雇佣信",        "「遗物整理 · 王宅」。雇主署名刘女士。日期：2026/6/9", "", "", {
		"泛黄的信封，边角略有磨损", "收件地址是一栋旧公寓", "雇主希望在3天内清理完毕", "最后一句：请尊重逝者的隐私"
	}, "#d4b483");
	IT("item_photo1",        "老照片",        "泛黄的全家福，背面写着：1991年春，摄于屋后。", "note_photo1991", "", {
		"一家四口站在一棵大树下", "父亲抱着小女儿，母亲牵着哥哥的手", "翻过背面，写着铅笔字：『1991 · 春』",
		"背面右下角还有一串数字：1 9 9 1"
	}, "#c9a46a");
	IT("item_shoppinglist",  "购物清单",      "贴在冰箱上的便签：鸡蛋/牛奶/面包/女儿爱吃的草莓酱", "", "", {
		"字迹娟秀，应该是妈妈写的", "最后一项『草莓酱』画了个爱心", "下面有个磁贴吸着它，是个小花朵"
	}, "#ffe6a8");
	IT("item_fridgemagnet",  "冰箱磁贴花朵",  "印着『1991』的粉色花朵磁贴，是密码 1991 的线索。", "", "", {
		"粉色花朵，花蕊是烫金的 1 9 9 1", "就是 CD 机的密码线索！"
	}, "#ff9eb5");
	IT("item_calendar",      "1998 年台历",    "7月14日被红圈出来，旁边写着『小雨的生日』。", "", "", {
		"7月14日，红笔圈出", "小雨的生日——这就是梳妆台密码 714",
		"旁边小字：妈妈给小雨的礼物放在梳妆台抽屉里"
	}, "#e8b4b8");
	IT("item_cdbox",         "CD 机收纳盒",   "密码锁的蓝色金属盒，藏着日记第一篇。", "", "", {
		"四位数密码锁，1 9 9 1 ？", "打开之后里面是女儿的日记第一册"
	}, "#7ba7d4");
	IT("item_diary1",        "日记 第 1 册",   "90 年代末少女的心情随笔，3 页。", "note_diary1", "", {
		"蓝色封面，边角磨损", "第一页夹着个干花书签", "笔迹从稚嫩变秀丽"
	}, "#74a4d4");
	IT("item_drawerkey",     "抽屉钥匙",       "铜色老钥匙，能开电视柜抽屉。", "", "", {
		"钥匙扣是个小布偶猫", "能打开电视柜抽屉，藏着日历和 CD 机"
	}, "#cd9b55");
	IT("item_tvkey",         "电视柜抽屉",     "需要先找到抽屉钥匙。", "", "", {}, "#8a6a45");
	IT("item_hallwaykey",    "走廊钥匙",       "古铜色，藏在书架后面的秘密位置。", "", "door_tohallway", {
		"书架后发现的", "能打开通往走廊的木门"
	}, "#b58450");
	IT("item_letterbox",     "信件盒",        "一叠女儿和母亲的通信。", "note_letterbox", "", {
		"泛黄的信笺", "共 17 封，都是 1997 年到 1998 年的通信", "最后一封的日期是 1998/7/31"
	}, "#e8d5b0");
	IT("item_jewelrybox",    "梳妆首饰盒",    "三位数密码：714（女儿生日）。", "", "", {
		"木质首饰盒，雕花", "三位数密码锁",
		"打开之后，里面是妈妈给女儿留的项链、还有一把钥匙"
	}, "#a07a55");
	IT("item_jewelrykey",    "地下室钥匙",     "首饰盒里得到，金色，能开地下室。", "", "door_basement", {
		"金色钥匙，有小铃铛", "打开地下室的门，1998 年的真相在那里"
	}, "#d4af37");
	IT("item_camera",        "旧相机",        "1998 年的胶卷相机，没洗出的胶卷。", "note_photo1998", "", {
		"美能达 X-700，机身上有刻名『小雨』", "胶卷还在，里面藏着 1998 年 7 月的最后几张照片"
	}, "#4a4a4a");
	IT("item_diary2",        "日记 第 2 册",   "记录了 1998 年夏天到 7 月，3 页。", "note_diary2", "", {
		"封面比第一本破旧些", "写着『小雨 · 1998』"
	}, "#c4a475");
	IT("item_newspaper",     "旧报纸堆",       "1998 年 8 月的本地日报，头条：『少女失踪案』。", "note_newspaper", "", {
		"报纸折叠整齐", "版头是《东江日报》1998/8/15",
		"标题：『本城一名高三女生于 7 月 31 日晚离家后未归，警方正在调查』"
	}, "#ded2b0");
	IT("item_caseclip",      "案件编号条",     "纸条上写着『案卷 7814-B-1998』。", "", "", {
		"写着 7814-B-1998", "密码 7 8 1 4 9 8，对应铁皮箱"
	}, "#ffffff");
	IT("item_oldchest",      "铁皮箱",        "沉重的绿色军用铁皮箱，六位数密码锁。", "", "", {
		"美国军用铁皮箱", "六位数密码锁", "密码就是案件编号 7 8 1 4 9 8",
		"里面是：妈妈写给小雨但没寄出的信，大学录取通知书，和小雨的遗物盒"
	}, "#6a7a55");
	IT("item_motherletter",  "妈妈的信",       "一封没寄出的信，写满母亲的思念与愧疚。", "note_motherletter", "", {
		"泛黄的信纸，泪痕斑斑", "开头『亲爱的小雨，如果你还在……』"
	}, "#f5e0d0");
	IT("item_admission",     "录取通知书",     "1998 年的大学录取通知书，新闻系。", "note_admission", "", {
		"某大学新闻系", "录取日期 1998/8/10，信封没拆开"
	}, "#d8c8a0");
	IT("item_mementobox",    "遗物盒",         "女儿的随身物品：发夹、笔、日记本最后一页。", "note_lastpage", "", {
		"一个小铁盒", "里面是小雨最珍贵的东西：蝴蝶结发夹、一支用了一半的钢笔",
		"最后一页日记，只有一句话：『妈妈，对不起。』"
	}, "#b8a0a0");
	IT("item_hallwaykey2",   "地下室钥匙",     "首饰盒里得到，金色，能开地下室。", "", "door_basement", {}, "#d4af37");

	/* ----------- 6 篇笔记 ----------- */
	NoteRows.Empty();
	TArray<FString> P;
	P = { "1991/4/5 · 春\n\n今天去屋后的大树下照了全家福。\n爸爸抱我举得好高，妈妈牵着哥哥的手。\n这一天我要永远记住。",
		  "妈妈说，以后每年春天都要拍一张。",
		  "妈妈画了 4 个小爱心，每个爱心旁边写了家人的名字：爸爸、妈妈、哥哥、我。" };
	NoteRows.Add({ FName(TEXT("note_photo1991")), _T("1991 年春"), _T("小雨"), "1991/4/5", P, 0, true });
	P = { "1997/9/1 · 高二开学\n\n今天分班了。\n我选了文科。妈妈说她支持我，爸爸说只要我开心就好。\n哥哥送了我一支钢笔作为开学礼物。",
		  "1998/3/12\n\n妈妈最近总是咳嗽，我劝她去医院。\n她总说『只是感冒』。\n我有点担心。",
		  "1998/7/14 · 17 岁生日\n\n妈妈今天偷偷把我的礼物\n放在梳妆台抽屉里，用密码锁着。\n她说是『17 岁的秘密』。\n密码是我的生日：714。\n我哭了很久。" };
	NoteRows.Add({ FName(TEXT("note_diary1")), _T("日记 · 第 1 册"), _T("小雨"), "1997 - 1998", P, 1, true });
	P = { "给我的小雨：\n\n收到你的信了，知道你考试顺利，妈妈很开心。\n大学一定有很多新朋友，别怕，小雨从小就是最勇敢的孩子。",
		  "1998/7/20\n\n小雨，妈妈最近身体不好，可能不能送你去大学了。\n但妈妈会在楼上看着你走进大学校门的，好不好？\n\n爱你的妈妈。",
		  "最后一封：1998/7/31\n\n小雨，你今天出门的时候说『今晚就回来』。\n妈妈等你。\n我把项链放在梳妆台抽屉里，等你回来戴。" };
	NoteRows.Add({ FName(TEXT("note_letterbox")), _T("母亲与女儿的通信"), _T("妈妈"), "1997 - 1998", P, 2, true });
	P = { "1998/6/25\n\n爸爸说，妈妈住院了，让我考完期末就去看她。\n我很害怕。",
		  "1998/7/28\n\n今天出院了，但妈妈看起来比以前更瘦。\n我把录取通知书偷偷藏了起来，没有告诉她我拿到了。",
		  "1998/7/31 下午\n\n我去找爸爸的旧同事，想问清楚妈妈的病情。\n走的时候留了纸条给妈妈，说我今晚就回来。\n我一定会回来的。" };
	NoteRows.Add({ FName(TEXT("note_diary2")), _T("日记 · 第 2 册"), _T("小雨"), "1998 夏", P, 3, true });
	P = { "【东江日报 · 1998/8/15 · 头条】\n\n本城一名 17 岁高三女生于 7 月 31 日晚离家后未归，\n警方已立案调查。\n据悉，该女生当日前往父亲旧同事家，其后未回到家中。",
		  "【后续报道 · 1999/2/12】\n\n失踪案半年来未有新进展。\n家属悲痛度日，呼吁知情人士提供线索。" };
	NoteRows.Add({ FName(TEXT("note_newspaper")), _T("旧报纸 · 1998/8"), _T("东江日报"), "1998", P, 4, true });
	P = { "亲爱的小雨：\n\n如果你看到这封信，妈妈已经不在了。\n妈妈知道你 7 月 31 日那晚，是想去找李叔叔问我的病情。\n妈妈对不起你。",
		  "那天下了很大的雨，你在路上摔了一跤，头部受了伤。\n路人把你送到医院的时候，你已经昏迷了。\n他们不知道你是谁。\n妈妈在 1999 年的冬天才通过医院的启事认出你。\n那时候，你已经醒不过来了。\n\n妈妈把你接回家，藏在了地下室里。",
		  "妈妈每天都陪你说话，每天都给你写一封信。\n8 年了，小雨一直很乖。\n现在妈妈要去找你了。\n\n哥哥把遗物整理的费用都付清了。\n请遗物整理师，把这些东西全部收走。\n——让小雨，真正地，安心走吧。" };
	NoteRows.Add({ FName(TEXT("note_motherletter")), _T("妈妈最后一封信"), _T("妈妈"), "2006", P, 2, true });
	P = { "录取通知书：\n本校新闻系录取王雨同学。\n入学日期：1998 年 9 月 1 日。",
		  "学费已由其兄长王某代为缴纳。\n但其本人于入学前意外失踪，学籍保留至今。" };
	NoteRows.Add({ FName(TEXT("note_admission")), _T("1998 年大学录取通知"), _T("东江大学"), "1998", P, 0, true });
	P = { "最后一页日记：\n\n妈妈，对不起。\n我没有告诉你我收到了录取通知书。\n我怕你觉得我要离开你。\n\n我今晚出去，就是去问清楚。\n等我回来。我会把录取通知书，亲手交给你看。\n\n我永远爱你。\n——小雨。1998/7/31。" };
	NoteRows.Add({ FName(TEXT("note_lastpage")), _T("遗物盒 · 最后一页"), _T("小雨"), "1998/7/31", P, 2, true });

	/* ----------- 3 个谜题 ----------- */
	PuzzleRows.Empty();
	PuzzleRows.Add({ FName(TEXT("puzzle_cdbox")), _T("CD 机收纳盒"), 4, {1,9,9,1}, 4,
		_T("「1991 年的春天，是全家福的密码。」"),
		_T("密码不对。CD 盒锁着。"),
		_T("咔哒！盒盖打开，露出第一本日记。"),
		FName(TEXT("item_diary1")), NAME_None, NAME_None });
	PuzzleRows.Add({ FName(TEXT("puzzle_jewelrybox")), _T("梳妆首饰盒"), 3, {7,1,4}, 3,
		_T("「小雨的生日 · 1998/7/14」"),
		_T("首饰盒锁上了。3 次尝试错误。"),
		_T("叮！首饰盒开了。金色钥匙静静躺着。"),
		FName(TEXT("item_jewelrykey")), FName(TEXT("door_basement")), NAME_None });
	PuzzleRows.Add({ FName(TEXT("puzzle_chest")), _T("铁皮箱"), 6, {7,8,1,4,9,8}, 5,
		_T("「案卷 7814-B-1998」"),
		_T("密码错误。箱子很重，纹丝不动。"),
		_T("铁皮箱的沉重锁扣咔一声打开。8 年的真相，在里面。"),
		FName(TEXT("item_mementobox")), NAME_None, NAME_None });

	/* ----------- 3 章 ----------- */
	ChapterRows.Empty();
	TArray<FOAMObjectiveRow> Objs;

	Objs.Empty();
	Objs.Add({ FName(TEXT("obj_letter")),        _T("阅读雇主雇佣信"),                  0, FName(TEXT("item_letter")),         0, true });
	Objs.Add({ FName(TEXT("obj_photo")),         _T("检查老照片，找到背面数字 1991"),    4, FName(TEXT("item_photo1")),         0, true });
	Objs.Add({ FName(TEXT("obj_shoppinglist")),   _T("看一眼厨房冰箱上的购物清单"),        4, FName(TEXT("item_shoppinglist")),   0, true });
	Objs.Add({ FName(TEXT("obj_fridgemagnet")),   _T("拿起冰箱花朵磁贴，记下密码线索"),    0, FName(TEXT("item_fridgemagnet")),    0, true });
	Objs.Add({ FName(TEXT("obj_key1")),           _T("找到电视柜抽屉钥匙"),                 0, FName(TEXT("item_drawerkey")),      0, true });
	Objs.Add({ FName(TEXT("obj_puzzle_cdbox")),   _T("解开 CD 机收纳盒密码"),              1, FName(TEXT("puzzle_cdbox")),        0, true });
	Objs.Add({ FName(TEXT("obj_count7")),         _T("在客厅 / 厨房 / 阳台至少检查 7 件物品"), 5, FName(TEXT("collect7")),         7, true });
	Objs.Add({ FName(TEXT("obj_hallwaykey")),     _T("取得走廊钥匙"),                       0, FName(TEXT("item_hallwaykey")),    0, true });
	Objs.Add({ FName(TEXT("obj_tohallway")),      _T("打开走廊门，进入第 2 章"),            0, FName(TEXT("door_tohallway")),      0, true });
	ChapterRows.Add({ 1, _T("第一章 · 第一天"), _T("整理客厅 · 1991 年的春天"),
		_T("遗物整理师的第一天。王宅客厅尘封 20 年，需要清理所有家具物品。"),
		FName(TEXT("Chapter1_LivingRoom")), Objs });

	Objs.Empty();
	Objs.Add({ FName(TEXT("obj_calendar")),      _T("检查 1998 年台历，圈出 7/14"),         4, FName(TEXT("item_calendar")),       0, true });
	Objs.Add({ FName(TEXT("obj_letterbox")),     _T("读通信盒里的母子通信"),                 3, FName(TEXT("item_letterbox")),      0, true });
	Objs.Add({ FName(TEXT("obj_camera")),        _T("检查旧相机"),                           4, FName(TEXT("item_camera")),         0, true });
	Objs.Add({ FName(TEXT("obj_puzzle_jewelry")),_T("解梳妆台首饰盒密码 714"),               1, FName(TEXT("puzzle_jewelrybox")),  0, true });
	Objs.Add({ FName(TEXT("obj_diary2")),        _T("读日记第 2 册"),                        3, FName(TEXT("item_diary2")),         0, true });
	Objs.Add({ FName(TEXT("obj_key2")),          _T("取得地下室钥匙"),                       0, FName(TEXT("item_jewelrykey2")),    0, true });
	Objs.Add({ FName(TEXT("obj_count15")),       _T("检查至少 15 件物品"),                    5, FName(TEXT("collect15")),         15, true });
	Objs.Add({ FName(TEXT("obj_basement")),      _T("打开地下室门，进入第 3 章"),            0, FName(TEXT("door_basement")),      0, true });
	ChapterRows.Add({ 2, _T("第二章 · 第二天"), _T("走廊 & 女儿房 · 1998 年的夏天"),
		_T("第二天。整理走廊、女儿的房间，1998 年的夏天到底发生了什么？"),
		FName(TEXT("Chapter2_Hallway")), Objs });

	Objs.Empty();
	Objs.Add({ FName(TEXT("obj_newspaper")),    _T("读 1998/8 的旧报纸头条"),               3, FName(TEXT("item_newspaper")),     0, true });
	Objs.Add({ FName(TEXT("obj_caseclip")),     _T("找到并检查案件编号条"),                 4, FName(TEXT("item_caseclip")),      0, true });
	Objs.Add({ FName(TEXT("obj_puzzle_chest")), _T("解开铁皮箱六位数密码"),                 1, FName(TEXT("puzzle_chest")),      0, true });
	Objs.Add({ FName(TEXT("obj_motherletter")), _T("读妈妈的最后一封信"),                   3, FName(TEXT("item_motherletter")),  0, true });
	Objs.Add({ FName(TEXT("obj_admission")),    _T("打开录取通知书"),                       3, FName(TEXT("item_admission")),     0, true });
	Objs.Add({ FName(TEXT("obj_memento")),      _T("打开遗物盒，读最后一页"),               3, FName(TEXT("item_mementobox")),    0, true });
	Objs.Add({ FName(TEXT("obj_count22")),      _T("检查 22 件物品并完成结局"),             5, FName(TEXT("collect22")),       22, true });
	Objs.Add({ FName(TEXT("obj_ending")),       _T("从公寓后门离开，完成整理"),             0, FName(TEXT("door_ending")),       0, true });
	ChapterRows.Add({ 3, _T("第三章 · 第三天"), _T("地下室 · 最后的真相"),
		_T("第三天。沉重的绿色铁皮箱在地下室深处。遗物整理师要完成最后的整理。"),
		FName(TEXT("Chapter3_Basement")), Objs });

	/* ----------- 3 关 关卡布局（24×18 / 20×20 / 22×16） ----------- */
	LevelRows.Empty();
	// Level 1: LivingRoom
	{
		FOAMLevelDataRow L;
		L.LevelName = FName(TEXT("Chapter1_LivingRoom"));
		L.ChapterID = 1;
		L.GridSize = FVector2D(24, 18);
		L.SpawnPoint = FVector2D(5, 10);
		// Walls: 四周 + 内部隔断（厨房 / 客厅 / 阳台）
		for (int i = 0; i < 24; ++i) { L.Walls.Add({ i, 0, 1, 1 }); L.Walls.Add({ i, 17, 1, 1 }); }
		for (int i = 0; i < 18; ++i) { L.Walls.Add({ 0, i, 1, 1 }); L.Walls.Add({ 23, i, 1, 1 }); }
		// 厨房-客厅隔断（x=12，y 1-8 墙, y=9-12 门, y 13-16 墙）
		for (int y = 1; y <= 8; ++y)  L.Walls.Add({ 12, y, 1, 1 });
		for (int y = 13; y <= 16; ++y) L.Walls.Add({ 12, y, 1, 1 });
		// 阳台隔断
		for (int x = 12; x <= 22; ++x) L.Walls.Add({ x, 9, 1, 1 });
		L.Walls.Add({ 12, 9, 0, 0 }); // 门口缺口
		// Furniture
		L.Furniture.Add({ 3,  3, 4, 2, TEXT("Sofa"),        FLinearColor(0.55f, 0.3f, 0.2f) });
		L.Furniture.Add({ 10, 3, 3, 2, TEXT("TVCabinet"),   FLinearColor(0.4f, 0.25f, 0.15f) });
		L.Furniture.Add({ 5,  7, 2, 2, TEXT("CoffeeTable"), FLinearColor(0.65f, 0.45f, 0.25f) });
		L.Furniture.Add({ 16, 2, 3, 2, TEXT("Bookshelf"),   FLinearColor(0.5f, 0.32f, 0.18f) });
		L.Furniture.Add({ 14, 12, 2, 2, TEXT("Fridge"),     FLinearColor(0.9f, 0.9f, 0.92f) });
		L.Furniture.Add({ 18, 12, 3, 2, TEXT("KitchenCab"), FLinearColor(0.7f, 0.55f, 0.38f) });
		L.Furniture.Add({ 16, 15, 4, 1, TEXT("KitchenCounter"), FLinearColor(0.78f, 0.65f, 0.5f) });
		L.Furniture.Add({ 15, 12, 1, 1, TEXT("Window"), FLinearColor(0.3f, 0.5f, 0.8f, 0.6f) });
		// Items
		L.Items.Add({ FName(TEXT("item_letter")),       FVector2D(6, 7),  FName(TEXT("room_living")),   false });
		L.Items.Add({ FName(TEXT("item_photo1")),       FVector2D(11, 3), FName(TEXT("room_living")),   false });
		L.Items.Add({ FName(TEXT("item_shoppinglist")), FVector2D(15, 11),FName(TEXT("room_kitchen")),  false });
		L.Items.Add({ FName(TEXT("item_fridgemagnet")), FVector2D(14, 11),FName(TEXT("room_kitchen")),  false });
		L.Items.Add({ FName(TEXT("item_drawerkey")),    FVector2D(11, 4), FName(TEXT("room_living")),   false });
		L.Items.Add({ FName(TEXT("item_tvkey")),        FVector2D(10, 3), FName(TEXT("room_living")),   false });
		L.Items.Add({ FName(TEXT("item_calendar")),     FVector2D(19, 3), FName(TEXT("room_living")),   false });
		L.Items.Add({ FName(TEXT("item_cdbox")),        FVector2D(10, 4), FName(TEXT("room_living")),   true });
		L.Items.Add({ FName(TEXT("item_diary1")),       FVector2D(10, 5), FName(TEXT("room_living")),   false });
		L.Items.Add({ FName(TEXT("item_hallwaykey")),   FVector2D(18, 4), FName(TEXT("room_living")),   false });
		// Doors
		L.Doors.Add({ FName(TEXT("door_tohallway")),    FVector2D(23, 10), FVector2D(1, 3), FName(TEXT("Chapter2_Hallway")), FVector2D(5, 10), FName(TEXT("room_hallway")), true, FName(TEXT("item_hallwaykey")), _T("通往走廊的木门"), false });
		// Rooms
		L.Rooms.Add({ FName(TEXT("room_living")),   _T("客厅 · 第一天"),     1, 1, 11, 16, true });
		L.Rooms.Add({ FName(TEXT("room_kitchen")),  _T("厨房"),             13, 10, 10, 7, false });
		L.Rooms.Add({ FName(TEXT("room_balcony")),  _T("阳台"),             13, 1,  10, 8, true });
		LevelRows.Add(L);
	}
	// Level 2: Hallway
	{
		FOAMLevelDataRow L;
		L.LevelName = FName(TEXT("Chapter2_Hallway"));
		L.ChapterID = 2;
		L.GridSize = FVector2D(20, 20);
		L.SpawnPoint = FVector2D(5, 10);
		// Walls
		for (int i = 0; i < 20; ++i) { L.Walls.Add({ i, 0, 1, 1 }); L.Walls.Add({ i, 19, 1, 1 }); }
		for (int i = 0; i < 20; ++i) { L.Walls.Add({ 0, i, 1, 1 }); L.Walls.Add({ 19, i, 1, 1 }); }
		for (int y = 1; y <= 6;  ++y) L.Walls.Add({ 10, y, 1, 1 });
		for (int y = 13; y <= 18; ++y) L.Walls.Add({ 10, y, 1, 1 });
		for (int x = 11; x <= 19; ++x) L.Walls.Add({ x, 10, 1, 1 });
		L.Furniture.Add({ 3,  3, 3, 2, TEXT("Dresser"),     FLinearColor(0.55f, 0.35f, 0.2f) });
		L.Furniture.Add({ 4,  8, 2, 3, TEXT("Bed"),         FLinearColor(0.75f, 0.5f, 0.55f) });
		L.Furniture.Add({ 12, 3, 3, 2, TEXT("StudyDesk"),   FLinearColor(0.45f, 0.3f, 0.2f) });
		L.Furniture.Add({ 15, 6, 2, 2, TEXT("Bookshelf"),   FLinearColor(0.5f, 0.32f, 0.18f) });
		L.Furniture.Add({ 14, 14, 3, 3, TEXT("Wardrobe"),    FLinearColor(0.6f, 0.4f, 0.25f) });
		L.Furniture.Add({ 3, 14, 2, 3, TEXT("BathTub"),     FLinearColor(0.85f, 0.9f, 0.95f) });
		// Items
		L.Items.Add({ FName(TEXT("item_calendar")),     FVector2D(3, 3),  FName(TEXT("room_daughter")), false });
		L.Items.Add({ FName(TEXT("item_letterbox")),    FVector2D(13, 3), FName(TEXT("room_study")),    false });
		L.Items.Add({ FName(TEXT("item_camera")),       FVector2D(15, 7), FName(TEXT("room_study")),    false });
		L.Items.Add({ FName(TEXT("item_jewelrybox")),   FVector2D(3, 5),  FName(TEXT("room_daughter")), true });
		L.Items.Add({ FName(TEXT("item_diary2")),       FVector2D(5, 9),  FName(TEXT("room_daughter")), false });
		L.Items.Add({ FName(TEXT("item_jewelrykey")),   FVector2D(2, 5),  FName(TEXT("room_daughter")), false });
		// Doors
		L.Doors.Add({ FName(TEXT("door_back1")),       FVector2D(0, 10),  FVector2D(1, 3), FName(TEXT("Chapter1_LivingRoom")), FVector2D(22, 10), FName(TEXT("room_living")),   false, NAME_None, _T("回到客厅"), false });
		L.Doors.Add({ FName(TEXT("door_basement")),    FVector2D(10, 10), FVector2D(1, 3), FName(TEXT("Chapter3_Basement")), FVector2D(5, 8),  FName(TEXT("room_basement")), true, FName(TEXT("item_jewelrykey")), _T("通往地下室的铁门"), false });
		// Rooms
		L.Rooms.Add({ FName(TEXT("room_hallway")),   _T("走廊"),               0,  0, 10, 20, true });
		L.Rooms.Add({ FName(TEXT("room_daughter")),_T("女儿的房间 · 第二天"), 1,  1, 9,  10, true });
		L.Rooms.Add({ FName(TEXT("room_study")),    _T("书房 / 哥哥的房间"),   11, 1, 8,  9,  false });
		L.Rooms.Add({ FName(TEXT("room_bath")),     _T("卫生间"),             1, 12, 9,  7,  false });
		LevelRows.Add(L);
	}
	// Level 3: Basement
	{
		FOAMLevelDataRow L;
		L.LevelName = FName(TEXT("Chapter3_Basement"));
		L.ChapterID = 3;
		L.GridSize = FVector2D(22, 16);
		L.SpawnPoint = FVector2D(5, 8);
		for (int i = 0; i < 22; ++i) { L.Walls.Add({ i, 0, 1, 1 }); L.Walls.Add({ i, 15, 1, 1 }); }
		for (int i = 0; i < 16; ++i) { L.Walls.Add({ 0, i, 1, 1 }); L.Walls.Add({ 21, i, 1, 1 }); }
		for (int y = 1; y <= 7;  ++y) L.Walls.Add({ 12, y, 1, 1 });
		L.Furniture.Add({ 3,  3, 3, 2, TEXT("StorageBoxes"), FLinearColor(0.6f, 0.45f, 0.3f) });
		L.Furniture.Add({ 4,  10, 4, 2, TEXT("NewspaperStack"), FLinearColor(0.75f, 0.7f, 0.55f) });
		L.Furniture.Add({ 14, 3, 5, 3, TEXT("OldChest"), FLinearColor(0.4f, 0.5f, 0.3f) });
		L.Furniture.Add({ 14, 10, 4, 3, TEXT("MotherBureau"), FLinearColor(0.5f, 0.32f, 0.2f) });
		L.Items.Add({ FName(TEXT("item_newspaper")),    FVector2D(4, 10), FName(TEXT("room_storage")),  false });
		L.Items.Add({ FName(TEXT("item_caseclip")),     FVector2D(3, 4),  FName(TEXT("room_storage")),  false });
		L.Items.Add({ FName(TEXT("item_oldchest")),     FVector2D(15, 4), FName(TEXT("room_basement")), true });
		L.Items.Add({ FName(TEXT("item_motherletter")), FVector2D(15, 11),FName(TEXT("room_basement")), false });
		L.Items.Add({ FName(TEXT("item_admission")),    FVector2D(17, 11),FName(TEXT("room_basement")), false });
		L.Items.Add({ FName(TEXT("item_mementobox")),   FVector2D(14, 13),FName(TEXT("room_basement")), false });
		L.Doors.Add({ FName(TEXT("door_back2")),      FVector2D(0, 8),   FVector2D(1, 3), FName(TEXT("Chapter2_Hallway")), FVector2D(10, 10), FName(TEXT("room_hallway")), false, NAME_None, _T("回到走廊"), false });
		L.Doors.Add({ FName(TEXT("door_ending")),     FVector2D(21, 8),  FVector2D(1, 3), FName(TEXT("MainMenu")), FVector2D(0, 0), FName(TEXT("room_ending")), true, NAME_None, _T("离开公寓 · 结局"), true });
		L.Rooms.Add({ FName(TEXT("room_storage")),  _T("储藏室"),              1,  1, 11, 6, false });
		L.Rooms.Add({ FName(TEXT("room_basement")), _T("地下室 · 第三天 · 真相"), 13, 1, 8,  14, true });
		LevelRows.Add(L);
	}
}

#undef _T
#undef IT
