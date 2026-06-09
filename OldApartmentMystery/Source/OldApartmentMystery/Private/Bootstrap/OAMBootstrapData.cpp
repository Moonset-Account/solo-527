// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Bootstrap/OAMBootstrapData.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Data/OAMPuzzleData.h"
#include "Data/OAMChapterData.h"
#include "Data/OAMLevelDataAsset.h"

UOAMBootstrapData* UOAMBootstrapData::Singleton = nullptr;

UOAMBootstrapData* UOAMBootstrapData::Get()
{
	if (!Singleton)
	{
		Singleton = NewObject<UOAMBootstrapData>(GetTransientPackage());
		Singleton->AddToRoot();
	}
	return Singleton;
}

void UOAMBootstrapData::EnsureAllDataBuilt(UObject* Outer)
{
	if (Items.Num() > 0) return;
	BuildOuter = Outer ? Outer : GetTransientPackage();
	BuildAllItems();
	BuildAllNotes();
	BuildAllPuzzles();
	BuildAllChapters();
	BuildAllLevels();
	UE_LOG(LogTemp, Log, TEXT("[OAM][Bootstrap] 构建 %d Items / %d Notes / %d Puzzles / %d Chapters / %d Levels"),
		Items.Num(), Notes.Num(), Puzzles.Num(), Chapters.Num(), Levels.Num());
}

UOAMItemData* UOAMBootstrapData::GetItem(FName ID) const { return Items.FindRef(ID); }
UOAMNoteData* UOAMBootstrapData::GetNote(FName ID) const { return Notes.FindRef(ID); }
UOAMPuzzleData* UOAMBootstrapData::GetPuzzle(FName ID) const { return Puzzles.FindRef(ID); }
UOAMChapterData* UOAMBootstrapData::GetChapter(int32 ID) const { return Chapters.FindRef(ID); }
UOAMLevelDataAsset* UOAMBootstrapData::GetLevel(FName Name) const { return Levels.FindRef(Name); }

TArray<UOAMItemData*> UOAMBootstrapData::GetAllItems() const { TArray<UOAMItemData*> O; Items.GenerateValueArray(O); return O; }
TArray<FName> UOAMBootstrapData::GetAllItemIDs() const { TArray<FName> O; Items.GenerateKeyArray(O); return O; }

/* -------- 构造辅助 -------- */

UOAMItemData* UOAMBootstrapData::MakeItem(FName ID, const FString& Name, const FString& Desc,
	bool bPickable, bool bNote, FName LinkedNote, FName UnlockDoor, FName RequiredItem,
	const TArray<FText>& Examine, const TArray<FVector2D>& Hotspots, const TArray<FText>& HotspotTexts)
{
	UOAMItemData* I = NewObject<UOAMItemData>(BuildOuter);
	I->ItemID = ID;
	I->DisplayName = _T(Name);
	I->Description = _T(Desc);
	I->bIsPickable = bPickable;
	I->bIsNote = bNote;
	I->ExamineFlavorTexts = Examine;
	I->HotspotPositions = Hotspots;
	I->HotspotTexts = HotspotTexts;
	if (LinkedNote != NAME_None)
	{
		// Link in BuildAllNotes (may not exist yet; we update in a 2nd pass below)
		I->LinkedNote = TSoftObjectPtr<UOAMNoteData>(FSoftObjectPath(
			FString::Printf(TEXT("/Script/OldApartmentMystery.OAMNoteData %s"), *LinkedNote.ToString())));
	}
	I->UnlocksDoorID = UnlockDoor;
	I->RequiredItemForInteraction = RequiredItem;
	Items.Add(ID, I);
	return I;
}

UOAMNoteData* UOAMBootstrapData::MakeNote(FName ID, const FString& Title, const FString& Author,
	const FString& Date, EOAMNoteMood Mood, const TArray<FOAMNotePage>& Pages,
	FName RelatedPuzzle, bool bEvidence)
{
	UOAMNoteData* N = NewObject<UOAMNoteData>(BuildOuter);
	N->NoteID = ID;
	N->Title = _T(Title);
	N->Author = _T(Author);
	N->DateStr = _T(Date);
	N->MoodTag = Mood;
	N->Pages = Pages;
	N->RelatedPuzzleID = RelatedPuzzle;
	N->bIsEvidence = bEvidence;
	Notes.Add(ID, N);
	return N;
}

UOAMPuzzleData* UOAMBootstrapData::MakePuzzle(FName ID, const FString& Name, EOAMLockType LockType,
	int32 Digits, const TArray<int32>& Pwd,
	const FString& Hint, const FString& Fail, const FString& OnSolve,
	int32 MaxAttempts, FName RewardItem, FName UnlockDoor, FName ReqKey)
{
	UOAMPuzzleData* P = NewObject<UOAMPuzzleData>(BuildOuter);
	P->PuzzleID = ID;
	P->DisplayName = _T(Name);
	P->LockType = LockType;
	P->DigitCount = Digits;
	P->Password = Pwd;
	P->HintText = _T(Hint);
	P->FailFeedback = _T(Fail);
	P->OnSolveNarration = _T(OnSolve);
	P->MaxAttempts = MaxAttempts;
	P->RewardItemID = RewardItem;
	P->UnlocksDoorID = UnlockDoor;
	P->RequiredKeyItemID = ReqKey;
	P->ShakeOnFail = 1.0f;
	Puzzles.Add(ID, P);
	return P;
}

UOAMChapterData* UOAMBootstrapData::MakeChapter(int32 ID, const FString& Title, const FString& Sub,
	const FString& Desc, FName LevelName,
	const FLinearColor& A, const FLinearColor& B,
	const TArray<FName>& ReqItems, const TArray<FOAMChapterObjective>& Objs)
{
	UOAMChapterData* C = NewObject<UOAMChapterData>(BuildOuter);
	C->ChapterID = ID;
	C->ChapterTitle = _T(Title);
	C->ChapterSubtitle = _T(Sub);
	C->Description = _T(Desc);
	C->LevelName = LevelName;
	C->BGColorA = A; C->BGColorB = B;
	C->RequiredItems = ReqItems;
	C->Objectives = Objs;
	Chapters.Add(ID, C);
	return C;
}

UOAMLevelDataAsset* UOAMBootstrapData::MakeLevel(FName Name, const FString& Display, int32 Chapter,
	FVector2D Grid, const TArray<FOAMWallRect>& Walls,
	const TArray<FOAMFloorZone>& Zones, const TArray<FVector2D>& Furn,
	const TArray<FOAMLevelItemSpawn>& ItemsList,
	const TArray<FOAMLevelDoor>& Doors, const TArray<FOAMRoomTrigger>& Rooms,
	FVector2D Spawn, const FLinearColor& Fog)
{
	UOAMLevelDataAsset* L = NewObject<UOAMLevelDataAsset>(BuildOuter);
	L->LevelName = Name;
	L->DisplayName = _T(Display);
	L->ChapterID = Chapter;
	L->GridSize = Grid;
	L->Walls = Walls;
	L->FloorZones = Zones;
	L->FurnitureTiles = Furn;
	L->ItemSpawns = ItemsList;
	L->Doors = Doors;
	L->RoomTriggers = Rooms;
	L->SpawnPoint = Spawn;
	L->FogTint = Fog;
	Levels.Add(Name, L);
	return L;
}

/* -------- 所有 Items -------- */
void UOAMBootstrapData::BuildAllItems()
{
	MakeItem(FName("item_employ_letter"), TEXT("雇佣信"), TEXT("委托人：周先生。遗物整理工作。地点：建设北路4号旧公寓502室。报酬5000。"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("泛黄的纸质信笺。"), _T("签名处有轻微晕开的墨迹。"), _T("左上角印着『周』字的蓝色火漆印。") });
	MakeItem(FName("item_oldphoto_1"), TEXT("老照片·三人合影"), TEXT("一家三口在照相馆拍的全家福：父亲、母亲和小女儿小媛"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("照片边缘已经严重卷曲。"), _T("背面用铅笔写着：1991 春。"), _T("右下角日期戳：1991 03 17") },
		{ FVector2D(0.5, 0.85) }, { _T("背面数字：1 9 9 1") });
	MakeItem(FName("item_shopping_list"), TEXT("冰箱购物清单"), TEXT("贴在冰箱上的便签"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("铅笔写成的潦草清单：牛奶、鸡蛋、苹果..."), _T("最后一行写着：『7月14日小媛生日，提前买蛋糕』") });
	MakeItem(FName("item_fridge_magnet"), TEXT("冰箱磁贴"), TEXT("带有数字的磁铁组合：1-9-9-1"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("磁贴上四个数字：1、9、9、1，顺序是1991。"), _T("跟老照片背面的日期一样。") });
	MakeItem(FName("item_drawer_key"), TEXT("电视柜抽屉钥匙"), TEXT("铜色小钥匙"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("钥匙柄上有一圈明显的磨损痕迹。"), _T("应该经常被使用。") });
	MakeItem(FName("item_calendar_98"), TEXT("1998年台历"), TEXT("台历上7月被翻到，14号被红墨水圈了三次"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("7月14日：红墨水画了三个重重的圈。"), _T("旁边写着：小媛16岁生日"), _T("7 1 4...三个数字") },
		{ FVector2D(0.2, 0.7) }, { _T("7-1-4") });
	MakeItem(FName("item_diary"), TEXT("陈女士的日记本"), TEXT("皮面日记，锁着的"),
		true, true, FName("note_diary_1"), NAME_None, NAME_None,
		{ _T("硬壳皮面，棕色。"), _T("锁孔需要密码才能打开。") });
	MakeItem(FName("item_cd_box"), TEXT("音乐CD盒"), TEXT("女儿的收藏。密码4位。"),
		false, false, NAME_None, NAME_None, NAME_None,
		{ _T("CD盒上的密码锁：4个拨轮。"), _T("好像跟她的生日或者什么纪念日有关。") });
	MakeItem(FName("item_letter_box"), TEXT("信件收纳盒"), TEXT("放在女儿书桌角落的塑料盒子"),
		true, true, FName("note_letters"), NAME_None, NAME_None,
		{ _T("里面整齐地叠着数十封往来信件。") });
	MakeItem(FName("item_old_camera"), TEXT("海鸥相机"), TEXT("父亲的老式机械相机"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("镜头盖上面刻着『上海·1985』。"), _T("底部的胶卷仓里似乎还留有一卷。") });
	MakeItem(FName("item_hallway_key_2"), TEXT("走廊尽头的钥匙"), TEXT("铜钥匙，挂着小铜牌：地下室"),
		true, false, NAME_None, FName("door_basement"), NAME_None,
		{ _T("钥匙牌上刻着：地下室。"), _T("锈迹很多，应该很久没开了。") });
	MakeItem(FName("item_newspaper_stack"), TEXT("旧报纸堆"), TEXT("1998年的晚报，压在地下室角落"),
		true, true, FName("note_case_report"), NAME_None, NAME_None,
		{ _T("1998年7-8月的晚报合订。"), _T("头版有一行红色标题：女中学生离奇失踪") });
	MakeItem(FName("item_case_clip"), TEXT("案件编号条"), TEXT("夹在旧报纸里的泛黄纸条"),
		true, false, NAME_None, NAME_None, NAME_None,
		{ _T("纸条上写着：案件编号 7814-B-1998"), _T("数字是7、8、1、4、9、8 —— 781498") },
		{ FVector2D(0.4, 0.5) }, { _T("7-8-1-4-9-8") });
	MakeItem(FName("item_iron_chest"), TEXT("铁皮箱"), TEXT("地下室深处沉重的铁皮箱"),
		false, false, NAME_None, NAME_None, NAME_None,
		{ _T("6位的数字密码锁。"), _T("箱子表面漆着『ZHOU』字样。") });
	MakeItem(FName("item_mother_letter"), TEXT("母亲最后一封信"), TEXT("写于1998年8月10日，没有寄出"),
		true, true, FName("note_final_letter"), NAME_None, NAME_None,
		{ _T("信封写着『给女儿小媛』。"), _T("但没有收件地址。") });
	MakeItem(FName("item_admission"), TEXT("大学录取通知书"), TEXT("北京师范大学 中文系 1998"),
		true, true, FName("note_admission"), NAME_None, NAME_None,
		{ _T("红色封套，烫金的校徽。"), _T("签发日期正好是7月14日。") });
	MakeItem(FName("item_memento_box"), TEXT("女儿的遗物盒"), TEXT("一个小小的原木盒子"),
		true, true, FName("note_memento"), NAME_None, NAME_None,
		{ _T("锁着的，但锁扣已经松动。"), _T("里面大概是些小物件。") });
}

/* -------- 所有 Notes -------- */

static TArray<FOAMNotePage> P(const TArray<FString>& Strs)
{
	TArray<FOAMNotePage> O;
	for (const auto& S : Strs) { FOAMNotePage P; P.PageText = FText::FromString(S); O.Add(P); }
	return O;
}

void UOAMBootstrapData::BuildAllNotes()
{
	MakeNote(FName("note_diary_1"), TEXT("陈女士的日记"), TEXT("陈慧芳（母亲）"), TEXT("1998 夏"), EOAMNoteMood::Somber,
		P({
			"1998年7月12日\n\n小媛再过两天就16岁了。她今天回家的时候脸色很差，我问她发生了什么，她只是摇头，把自己关在房间里哭。",
			"1998年7月14日\n\n今天是她的生日。早上出门的时候她跟我说：妈，今天我要晚一点回来。我说好。她穿着我去年给她买的白色连衣裙。",
			"1998年7月15日\n\n她没有回家。警察说让我们等。我不敢给她爸爸打电话，他在上海出差。我坐在客厅里等，等了一夜。"
		}), NAME_None, true);

	MakeNote(FName("note_letters"), TEXT("往来信件（三封）"), TEXT("寄件人：郑老师 / 张阿姨 / 匿名"), TEXT("1998 7-8月"), EOAMNoteMood::Cryptic,
		P({
			"郑老师（班主任）7月20日：\n\n陈女士您好。小媛7月14日下午放学后和同学在学校门口分手，之后没有同学再见过她。她最近情绪很不稳定，多次提到『压力大』。我非常担心。",
			"张阿姨（邻居）7月22日：\n\n慧芳啊，我想起来一件事。14号那天傍晚，大概6点多，我在阳台看见一个穿深色上衣的男人在你们单元楼下徘徊了很久。后来我就进去做饭了，没再留意。你要不要报警问问？",
			"匿名信（无邮戳，塞在门缝里）8月3日：\n\n你们不要再查了。她自己选择走的。那天晚上她在502门口哭了很久，然后往地下室去了。地下室的钥匙她一直有。不要再找了。"
		}), FName("puzzle_chest"), true);

	MakeNote(FName("note_case_report"), TEXT("1998晚报·失踪报道"), TEXT("城市晚报"), TEXT("1998-08-05"), EOAMNoteMood::Tense,
		P({
			"【头版】\n建设北路四号旧公寓——女中学生离奇失踪案\n\n记者：李明远",
			"本报讯 7月14日晚，本市建设北路四号旧公寓502室的周某（16岁，女）在过生日当天离家后未归。经警方初步调查，周某当日17:30左右与同学在学校门口分手，最后目击地点为其家单元楼外。\n\n警方已立案调查，案件编号：7814-B-1998。市民如目击可疑人员或线索请拨打……",
			"【后续】\n8月12日，警方宣布因证据不足暂存档。周某家属公开悬赏5万元征集线索。\n周某父亲因过度悲伤引发心脏病住院。母亲陈慧芳整日在502室守着，不肯离开。"
		}), FName("puzzle_chest"), true);

	MakeNote(FName("note_final_letter"), TEXT("母亲最后一封信（未寄出）"), TEXT("陈慧芳"), TEXT("1998-08-10"), EOAMNoteMood::Somber,
		P({
			"小媛：\n\n你走了28天。我每天给你留一盏灯，客厅的灯从来没关过。\n\n今天整理你房间的时候，我翻到了那张录取通知书——北师中文系，你跟我说过你要去北京读中文，要当作家，要写出让人流泪的故事。",
			"你爸爸说让我放你走，说你去了你想去的地方。但我知道你不会走的，你答应过我陪我到老。\n\n我在铁皮箱里放了你所有的东西：你的日记本、你的CD、你的通知书、你的相机、你最喜欢的那条白裙子。\n\n铁皮箱的密码是案件编号的数字：781498。你一直记着的。\n\n如果你回来，打开它。如果不回来……等我老了，我下去陪你。\n\n——永远爱你的妈妈 1998.8.10"
		}), NAME_None, true);

	MakeNote(FName("note_admission"), TEXT("北师大录取通知书"), TEXT("北京师范大学招生办公室"), TEXT("1998-07-14"), EOAMNoteMood::Urgent,
		P({
			"北京师范大学录取通知书\n\n同学 周小媛：\n经我校招生委员会研究决定，录取你进入我校中文系汉语言文学专业学习。请持本通知书于1998年9月1日到校报到。",
			"签发日期：1998年7月14日\n校长：袁贵仁\n\n【注】这张通知书签发的日期，正好是她失踪的那一天。"
		})), NAME_None, true);

	MakeNote(FName("note_memento"), TEXT("女儿遗物盒里的纸条"), TEXT("周小媛"), TEXT("1998-07-14 17:50"), EOAMNoteMood::Tense,
		P({
			"【一张被揉皱又展平的小纸条】\n\n『我没办法了。\n\n他说如果我告诉任何人，就让我爸妈再也见不到我。\n\n可是他今天又给我递了纸条，说让我晚上到地下室去。\n\n我不敢告诉妈。她最近身体那么差。\n\n我把录取通知书藏在铁皮箱里了，密码是781498，妈妈你看到的话就帮我保存好。\n\n—— 小媛 7.14 下午』"
		})), NAME_None, true);
}

/* -------- 所有 Puzzles -------- */
void UOAMBootstrapData::BuildAllPuzzles()
{
	MakePuzzle(FName("puzzle_cdbox"), TEXT("CD盒密码锁"), EOAMLockType::DigitLock, 4,
		{ 1,9,9,1 },
		TEXT("CD盒上的4位密码锁。想想她出生那年？老照片背面有。"),
		TEXT("咔哒——密码不对，锁没有开。"),
		TEXT("锁开了，CD盒里躺着一张王菲的《天空》，还有一张学生证照片，背面写着：北京等我。"),
		3, NAME_None, NAME_None, NAME_None);

	MakePuzzle(FName("puzzle_jewelry"), TEXT("梳妆台小盒"), EOAMLockType::DigitLock, 3,
		{ 7,1,4 },
		TEXT("金属小盒，3位密码。1998年台历上那个被圈了三次的日子？"),
		TEXT("嗯——锁纹丝不动。"),
		TEXT("盒盖打开了：里面是一把铜钥匙，刻着：地下室。"),
		3, FName("item_hallway_key_2"), NAME_None, NAME_None);

	MakePuzzle(FName("puzzle_chest"), TEXT("铁皮箱"), EOAMLockType::DigitLock, 6,
		{ 7,8,1,4,9,8 },
		TEXT("沉重的铁皮箱6位密码锁。信里说是『案件编号的数字』……"),
		TEXT("砰——锁纹丝不动，箱子的铁环微微颤抖。"),
		TEXT("咔哒——锁开了。箱盖吱呀一声抬起，里面散发出陈旧的纸张气味：白裙子、录取通知书、日记本、母亲的信，整齐地叠着。"),
		4, NAME_None, FName("door_ending"), NAME_None);
}

/* -------- 所有 Chapters -------- */

static FOAMChapterObjective Obj(const FString& ID, const FString& Desc, EOAMObjectiveCheck T, FName V, int32 Cnt = 0, bool bReq = true)
{
	FOAMChapterObjective O;
	O.ObjectiveID = *ID;
	O.Description = FText::FromString(Desc);
	O.CheckType = T; O.CheckValue = V; O.CheckCount = Cnt; O.bIsRequired = bReq;
	return O;
}

void UOAMBootstrapData::BuildAllChapters()
{
	TArray<FOAMChapterObjective> O1;
	O1.Add(Obj("obj_letter",    "阅读雇佣信", EOAMObjectiveCheck::CollectItem, FName("item_employ_letter")));
	O1.Add(Obj("obj_photo",     "检查老照片（背面）", EOAMObjectiveCheck::ExamineItem, FName("item_oldphoto_1")));
	O1.Add(Obj("obj_fridge",    "检查冰箱", EOAMObjectiveCheck::CollectItem, FName("item_shopping_list")));
	O1.Add(Obj("obj_magnet",    "拿走冰箱磁贴", EOAMObjectiveCheck::CollectItem, FName("item_fridge_magnet")));
	O1.Add(Obj("obj_drawer",    "打开电视柜抽屉", EOAMObjectiveCheck::CollectItem, FName("item_drawer_key")));
	O1.Add(Obj("obj_collect_5", "收集至少5件物品", EOAMObjectiveCheck::CollectCount, NAME_None, 5));
	O1.Add(Obj("obj_hallway_1", "打开走廊门", EOAMObjectiveCheck::EnterRoom, FName("room_hallway")));

	MakeChapter(1, TEXT("第一章"), TEXT("遗物整理师·第一日"),
		TEXT("受雇于周家独子周先生，在旧公寓502室整理去世父母的遗物。"),
		FName("MainMenu"), // 启动时切到 Chapter1
		C(0.15, 0.11, 0.08), C(0.05, 0.04, 0.035),
		{ FName("item_employ_letter") }, O1);

	TArray<FOAMChapterObjective> O2;
	O2.Add(Obj("obj_calendar",  "翻阅1998年台历", EOAMObjectiveCheck::ExamineItem, FName("item_calendar_98")));
	O2.Add(Obj("obj_diary",     "阅读母亲日记", EOAMObjectiveCheck::ReadNote, FName("note_diary_1")));
	O2.Add(Obj("obj_letters",   "阅读往来信件", EOAMObjectiveCheck::ReadNote, FName("note_letters")));
	O2.Add(Obj("obj_cdbox",     "打开CD盒", EOAMObjectiveCheck::SolvePuzzle, FName("puzzle_cdbox")));
	O2.Add(Obj("obj_jewelry",   "打开梳妆台小盒", EOAMObjectiveCheck::SolvePuzzle, FName("puzzle_jewelry")));
	O2.Add(Obj("obj_key_2",     "获取地下室钥匙", EOAMObjectiveCheck::CollectItem, FName("item_hallway_key_2")));
	O2.Add(Obj("obj_basement",  "打开地下室门", EOAMObjectiveCheck::EnterRoom, FName("room_basement")));

	MakeChapter(2, TEXT("第二章"), TEXT("女儿的房间·第二日"),
		TEXT("走廊深处，女儿的卧室还维持着1998年的样子。"),
		FName("Chapter2"),
		C(0.12, 0.09, 0.12), C(0.04, 0.03, 0.05),
		{ FName("item_calendar_98"), FName("item_diary") }, O2);

	TArray<FOAMChapterObjective> O3;
	O3.Add(Obj("obj_report",    "阅读失踪案报道", EOAMObjectiveCheck::ReadNote, FName("note_case_report")));
	O3.Add(Obj("obj_clip",      "检查案件编号条", EOAMObjectiveCheck::ExamineItem, FName("item_case_clip")));
	O3.Add(Obj("obj_chest",     "打开铁皮箱", EOAMObjectiveCheck::SolvePuzzle, FName("puzzle_chest")));
	O3.Add(Obj("obj_mother",    "阅读母亲最后一封信", EOAMObjectiveCheck::ReadNote, FName("note_final_letter")));
	O3.Add(Obj("obj_admission", "阅读录取通知书", EOAMObjectiveCheck::ReadNote, FName("note_admission")));
	O3.Add(Obj("obj_memento",   "打开女儿遗物盒", EOAMObjectiveCheck::ReadNote, FName("note_memento")));
	O3.Add(Obj("obj_end",       "带着真相离开公寓", EOAMObjectiveCheck::EnterRoom, FName("room_ending")));

	MakeChapter(3, TEXT("第三章"), TEXT("地下室·真相"),
		TEXT("地下室的最深处，铁箱里锁着28年前的真相。"),
		FName("Chapter3"),
		C(0.08, 0.06, 0.07), C(0.02, 0.02, 0.03),
		{ FName("item_case_clip"), FName("item_newspaper_stack") }, O3);
}

/* -------- 所有 Levels -------- */

static FOAMWallRect WR(int X, int Y, int W, int H) { FOAMWallRect R; R.X = X; R.Y = Y; R.W = W; R.H = H; return R; }
static FOAMFloorZone FZ(FName ID, const FString& N, int X, int Y, int W, int H, const FLinearColor& C)
{ FOAMFloorZone Z; Z.ZoneID = ID; Z.Name = N; Z.X = X; Z.Y = Y; Z.W = W; Z.H = H; Z.Color = C; return Z; }
static FIntRect IR(int X, int Y, int W, int H) { return FIntRect(X, Y, X + W, Y + H); }
static FOAMLevelItemSpawn ISP(FName I, float X, float Y, FName R, bool bP = false, bool bH = false, FName Unlock = NAME_None)
{ FOAMLevelItemSpawn S; S.ItemID = I; S.Position = FVector2D(X, Y); S.RoomID = R; S.bIsPuzzle = bP; S.bHiddenByDefault = bH; S.UnlockConditionItem = Unlock; return S; }
static FOAMLevelDoor DR(FName ID, float X, float Y, FName To, float SX, float SY, FName SR, bool bL, FName K, const FString& N, bool bEnd = false)
{ FOAMLevelDoor D; D.DoorID = ID; D.Position = FVector2D(X, Y); D.Size = FVector2D(1, 3); D.ToLevel = To; D.ToSpawn = FVector2D(SX, SY); D.ToRoom = SR; D.bLocked = bL; D.KeyItemID = K; D.DisplayName = FText::FromString(N); D.bIsEndingDoor = bEnd; return D; }
static FOAMRoomTrigger RT(FName ID, int X, int Y, int W, int H, const FString& N)
{ FOAMRoomTrigger R; R.RoomID = ID; R.Rect = IR(X, Y, W, H); R.RoomName = FText::FromString(N); return R; }

void UOAMBootstrapData::BuildAllLevels()
{
	/* 第一章 · 客厅/厨房/阳台 24×18 */
	{
		TArray<FOAMWallRect> W;
		W.Add(WR(0, 0, 24, 1));   W.Add(WR(0, 17, 24, 1));
		W.Add(WR(0, 0, 1, 18));   W.Add(WR(23, 0, 1, 18));
		W.Add(WR(12, 0, 1, 8));    // 客厅/厨房隔墙
		TArray<FOAMFloorZone> Z;
		Z.Add(FZ(FName("living"), TEXT("客厅"), 1, 1, 11, 16, C(0.42f, 0.31f, 0.21f)));
		Z.Add(FZ(FName("kitchen"), TEXT("厨房"), 13, 1, 10, 7, C(0.48f, 0.40f, 0.27f)));
		Z.Add(FZ(FName("balcony"), TEXT("阳台"), 13, 9, 10, 8, C(0.40f, 0.46f, 0.50f)));
		TArray<FVector2D> F;
		F.Add(FVector2D(4, 4)); F.Add(FVector2D(16, 4)); F.Add(FVector2D(17, 13)); // 家具
		TArray<FOAMLevelItemSpawn> IS;
		IS.Add(ISP(FName("item_employ_letter"), 5, 5, FName("room_living")));
		IS.Add(ISP(FName("item_oldphoto_1"), 17, 12, FName("room_living")));
		IS.Add(ISP(FName("item_shopping_list"), 20, 3, FName("room_kitchen")));
		IS.Add(ISP(FName("item_fridge_magnet"), 21, 5, FName("room_kitchen")));
		IS.Add(ISP(FName("item_drawer_key"), 15, 6, FName("room_living")));
		TArray<FOAMLevelDoor> DS;
		DS.Add(DR(FName("door_hallway_1"), 0, 10, FName("Chapter2"), 5, 5, FName("room_hallway"), true, FName("item_drawer_key"), TEXT("通往走廊"));
		TArray<FOAMRoomTrigger> RS;
		RS.Add(RT(FName("room_living"), 1, 1, 11, 16, TEXT("客厅")));
		RS.Add(RT(FName("room_kitchen"), 13, 1, 10, 7, TEXT("厨房")));
		RS.Add(RT(FName("room_balcony"), 13, 9, 10, 8, TEXT("阳台")));
		MakeLevel(FName("MainMenu"), TEXT("502室·客厅"), 1,
			FVector2D(24, 18), W, Z, F, IS, DS, RS, FVector2D(6, 10),
			C(0.35f, 0.25f, 0.18f, 0.55f));

		/* MainMenu 关卡就是第一章（因为 MainMenu 配置了启动关卡），
		   同时保存一个 Chapter1 同名副本供关卡选择跳转 */
		Levels.Add(FName("Chapter1"), Levels[FName("MainMenu")]);
	}

	/* 第二章 · 走廊/女儿房/卫生间/书房 24×20 */
	{
		TArray<FOAMWallRect> W;
		W.Add(WR(0, 0, 24, 1));   W.Add(WR(0, 19, 24, 1));
		W.Add(WR(0, 0, 1, 20));   W.Add(WR(23, 0, 1, 20));
		W.Add(WR(1, 10, 22, 1));   // 走廊/房间隔墙
		W.Add(WR(8, 10, 1, 10));   // 女儿房/书房
		W.Add(WR(16, 10, 1, 10));  // 卫生间
		TArray<FOAMFloorZone> Z;
		Z.Add(FZ(FName("hallway"), TEXT("走廊"), 1, 1, 22, 9, C(0.36f, 0.30f, 0.25f)));
		Z.Add(FZ(FName("daughter_room"), TEXT("女儿房间"), 1, 10, 7, 9, C(0.50f, 0.36f, 0.44f)));
		Z.Add(FZ(FName("bathroom"), TEXT("卫生间"), 8, 10, 8, 9, C(0.50f, 0.52f, 0.54f)));
		Z.Add(FZ(FName("study"), TEXT("书房"), 16, 10, 7, 9, C(0.38f, 0.34f, 0.30f)));
		TArray<FVector2D> F;
		F.Add(FVector2D(4, 14)); F.Add(FVector2D(12, 14)); F.Add(FVector2D(20, 14));
		TArray<FOAMLevelItemSpawn> IS;
		IS.Add(ISP(FName("item_calendar_98"), 3, 13, FName("room_daughter")));
		IS.Add(ISP(FName("item_diary"), 4, 16, FName("room_daughter")));
		IS.Add(ISP(FName("item_cd_box"), 6, 12, FName("room_daughter"), true));
		IS.Add(ISP(FName("item_letter_box"), 19, 13, FName("room_study")));
		IS.Add(ISP(FName("item_old_camera"), 21, 16, FName("room_study")));
		TArray<FOAMLevelDoor> DS;
		DS.Add(DR(FName("door_back_living"), 0, 5, FName("Chapter1"), 5, 10, FName("room_living"), false, NAME_None, TEXT("返回客厅")));
		DS.Add(DR(FName("door_basement"), 23, 14, FName("Chapter3"), 6, 6, FName("room_basement"), true, FName("item_hallway_key_2"), TEXT("通往地下室")));
		TArray<FOAMRoomTrigger> RS;
		RS.Add(RT(FName("room_hallway"), 1, 1, 22, 9, TEXT("走廊")));
		RS.Add(RT(FName("room_daughter"), 1, 10, 7, 9, TEXT("女儿的房间")));
		RS.Add(RT(FName("room_bathroom"), 8, 10, 8, 9, TEXT("卫生间")));
		RS.Add(RT(FName("room_study"), 16, 10, 7, 9, TEXT("书房")));
		MakeLevel(FName("Chapter2"), TEXT("走廊·女儿房间"), 2,
			FVector2D(24, 20), W, Z, F, IS, DS, RS, FVector2D(5, 5),
			C(0.30f, 0.24f, 0.28f, 0.6f));
	}

	/* 第三章 · 地下室/储藏间 24×16 */
	{
		TArray<FOAMWallRect> W;
		W.Add(WR(0, 0, 24, 1));   W.Add(WR(0, 15, 24, 1));
		W.Add(WR(0, 0, 1, 16));   W.Add(WR(23, 0, 1, 16));
		W.Add(WR(12, 1, 1, 10));   // 主区/储藏间
		TArray<FOAMFloorZone> Z;
		Z.Add(FZ(FName("basement_main"), TEXT("地下室"), 1, 1, 11, 14, C(0.25f, 0.22f, 0.21f)));
		Z.Add(FZ(FName("storage"), TEXT("储藏间"), 13, 1, 10, 10, C(0.20f, 0.18f, 0.17f)));
		Z.Add(FZ(FName("ending_zone"), TEXT("出口"), 13, 12, 10, 3, C(0.6f, 0.55f, 0.45f)));
		TArray<FVector2D> F;
		F.Add(FVector2D(4, 5)); F.Add(FVector2D(4, 10)); F.Add(FVector2D(18, 5));
		TArray<FOAMLevelItemSpawn> IS;
		IS.Add(ISP(FName("item_newspaper_stack"), 4, 4, FName("room_basement")));
		IS.Add(ISP(FName("item_case_clip"), 5, 8, FName("room_basement")));
		IS.Add(ISP(FName("item_iron_chest"), 16, 4, FName("room_storage"), true));
		IS.Add(ISP(FName("item_mother_letter"), 17, 7, FName("room_storage"), false, true, FName("puzzle_chest")));
		IS.Add(ISP(FName("item_admission"), 18, 9, FName("room_storage"), false, true, FName("puzzle_chest")));
		IS.Add(ISP(FName("item_memento_box"), 16, 12, FName("room_ending"), false, true, FName("puzzle_chest")));
		TArray<FOAMLevelDoor> DS;
		DS.Add(DR(FName("door_upstairs"), 0, 8, FName("Chapter2"), 22, 14, FName("room_study"), false, NAME_None, TEXT("回到楼上")));
		DS.Add(DR(FName("door_ending"), 23, 13, NAME_None, 0, 0, FName("room_ending"), true, FName("puzzle_chest"), TEXT("带着真相离开"), true));
		TArray<FOAMRoomTrigger> RS;
		RS.Add(RT(FName("room_basement"), 1, 1, 11, 14, TEXT("地下室")));
		RS.Add(RT(FName("room_storage"), 13, 1, 10, 10, TEXT("储藏间")));
		RS.Add(RT(FName("room_ending"), 13, 12, 10, 3, TEXT("出口·带着真相离开")));
		MakeLevel(FName("Chapter3"), TEXT("地下室·真相"), 3,
			FVector2D(24, 16), W, Z, F, IS, DS, RS, FVector2D(6, 6),
			C(0.12f, 0.10f, 0.12f, 0.75f));
	}
}
