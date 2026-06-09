// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.
// Part 2: 程序化构建设置/关卡选择/存档/笔记本/谜题/物品检查 UI

#include "Bootstrap/OAMUIFactory.h"
#include "UI/OAMSettingsWidget.h"
#include "UI/OAMLevelSelectWidget.h"
#include "UI/OAMSaveLoadWidget.h"
#include "UI/OAMNotebookWidget.h"
#include "UI/OAMPuzzleWidget.h"
#include "UI/OAMExamineWidget.h"
#include "UI/OAMChapterCompleteWidget.h"
#include "Components/Slider.h"
#include "Components/CheckBox.h"
#include "Components/VerticalBox.h"
#include "Components/HorizontalBox.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/ScrollBox.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMChapterManager.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Bootstrap/OAMBootstrapData.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Data/OAMPuzzleData.h"
#include "Puzzle/OAMLockPuzzleActor.h"

/* 辅助：创建 Slider */
static USlider* _MakeSlider(UObject* Outer, float Val)
{
	USlider* S = NewObject<USlider>(Outer);
	S->SetValue(Val);
	S->SetMinValue(0.f);
	S->SetMaxValue(1.f);
	S->SetStepSize(0.01f);
	return S;
}

static UTextBlock* _MakeLabel(UObject* Outer, FString Str, int32 Sz = 20, FLinearColor Col = FLinearColor(0.9f, 0.75f, 0.55f))
{
	UTextBlock* T = NewObject<UTextBlock>(Outer);
	T->SetText(FText::FromString(Str));
	T->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Medium.ttf"), Sz));
	T->SetColorAndOpacity(FSlateColor(Col));
	return T;
}

/* =====================================================================
   =================== 设置面板 NativeConstruct ========================
   ===================================================================== */

void UOAMSettingsWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.75f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	// 面板背景
	UImage* Panel = NewObject<UImage>(this);
	Panel->SetColorAndOpacity(FLinearColor(0.08f, 0.055f, 0.045f, 0.97f));
	_AddToCanvas(Root, Panel, FVector2D(960 - 700, 540 - 500), FVector2D(1400, 1000), FAnchors(0.5f, 0.5f))
		->SetAlignment(FVector2D(0.5f, 0.5f));

	UTextBlock* Title = _MakeLabel(this, TEXT("设        置"), 52, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Title, FVector2D(960 - 300, 100), FVector2D(600, 80), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 左右两列
	struct SL { FString L; USlider** S; float V; };
	struct CL { FString L; UCheckBox** C; bool V; };

	TArray<SL> Sliders = {
		{TEXT("主音量"),          &Slider_Master,     1.0f},
		{TEXT("音效音量"),        &Slider_SFX,        1.0f},
		{TEXT("环境音音量"),      &Slider_Ambient,    0.8f},
		{TEXT("UI 音量"),         &Slider_UI,         1.0f},
		{TEXT("画面亮度"),        &Slider_Brightness, 1.0f},
		{TEXT("鼠标灵敏度"),      &Slider_Sensitivity,1.0f},
		{TEXT("视野 FOV"),        &Slider_FOV,        0.75f},
		{TEXT("自动存档（分钟）"),&Slider_AutoSave,   0.33f},
	};
	TArray<CL> Checks = {
		{TEXT("启用胶片颗粒"),    &Chk_FilmGrain,   true},
		{TEXT("启用暗角效果"),    &Chk_Vignette,    true},
		{TEXT("启用互动提示"),    &Chk_Hints,       true},
		{TEXT("启用字幕/旁白"), &Chk_Subtitles, true},
	};

	UVerticalBox* VBLeft = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, VBLeft, FVector2D(960 - 620, 250), FVector2D(600, 600), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	UVerticalBox* VBRight = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, VBRight, FVector2D(960 + 20, 250), FVector2D(600, 600), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	int32 Idx = 0;
	for (const SL& SL : Sliders)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		UTextBlock* L = _MakeLabel(Row, SL.L, 22);
		L->SetMinDesiredWidth(260);
		UHorizontalBoxSlot* LS = Row->AddChildToHorizontalBox(L);
		LS->SetPadding(FMargin(0, 0, 16, 0));

		*(SL.S) = _MakeSlider(this, SL.V);
		(*(SL.S))->SetMinValue(0.f);
		if (SL.L.StartsWith(TEXT("FOV")))        { (*(SL.S))->SetMinValue(60);   (*(SL.S))->SetMaxValue(110); (*(SL.S))->SetValue(75); }
		if (SL.L.StartsWith(TEXT("自动"))) { (*(SL.S))->SetMinValue(1);    (*(SL.S))->SetMaxValue(30);  (*(SL.S))->SetValue(5); }

		Row->AddChildToHorizontalBox(*(SL.S));
		UVerticalBoxSlot* VS = (Idx < 4 ? VBLeft : VBRight)->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(0, 16));
		VS->SetHorizontalAlignment(HAlign_Fill);
		Idx++;
	}

	Idx = 0;
	for (const CL& CL : Checks)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		UTextBlock* L = _MakeLabel(Row, CL.L, 22);
		L->SetMinDesiredWidth(260);
		Row->AddChildToHorizontalBox(L);
		*(CL.C) = NewObject<UCheckBox>(Row);
		(*(CL.C))->SetIsChecked(CL.V);
		Row->AddChildToHorizontalBox(*(CL.C));
		UVerticalBoxSlot* VS = VBRight->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(0, 12));
		Idx++;
	}

	// 按钮行
	Btn_Defaults = _MakeButton(this, TEXT("恢复默认"), 24);
	Btn_ExportTelemetry = _MakeButton(this, TEXT("导出试玩数据"), 24);
	Btn_Close = _MakeButton(this, TEXT("应 用 并 关 闭"), 26);

	UHorizontalBox* Buttons = NewObject<UHorizontalBox>(this);
	_AddToCanvas(Root, Buttons, FVector2D(960 - 500, 900), FVector2D(1000, 80), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	UHorizontalBoxSlot* B1 = Buttons->AddChildToHorizontalBox(Btn_Defaults);   B1->SetPadding(FMargin(10)); B1->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	UHorizontalBoxSlot* B2 = Buttons->AddChildToHorizontalBox(Btn_ExportTelemetry); B2->SetPadding(FMargin(10)); B2->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	UHorizontalBoxSlot* B3 = Buttons->AddChildToHorizontalBox(Btn_Close);        B3->SetPadding(FMargin(10)); B3->SetSize(FSlateChildSize(ESlateSizeRule::Fill));

	Super::NativeConstruct();
	if (Txt_Version) Txt_Version->SetText(FText::FromString(TEXT("v1.0.0 · 旧公寓遗物整理录 · C++ 程序化 UI")));

	if (Btn_Defaults)        Btn_Defaults->OnClicked.AddDynamic(this, &UOAMSettingsWidget::HandleDefaults);
	if (Btn_ExportTelemetry) Btn_ExportTelemetry->OnClicked.AddDynamic(this, &UOAMSettingsWidget::HandleExport);
	if (Btn_Close)           Btn_Close->OnClicked.AddDynamic(this, &UOAMSettingsWidget::HandleClose);
}

/* =====================================================================
   =================== 关卡选择 NativeConstruct =========================
   ===================================================================== */

void UOAMLevelSelectWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.75f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	UTextBlock* Title = _MakeLabel(this, TEXT("关 卡 选 择"), 52, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Title, FVector2D(960 - 300, 120), FVector2D(600, 80), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	UHorizontalBox* Cards = NewObject<UHorizontalBox>(this);
	_AddToCanvas(Root, Cards, FVector2D(960 - 750, 260), FVector2D(1500, 560), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 3 章卡片
	for (int32 Ch = 1; Ch <= 3; ++Ch)
	{
		auto* GI = UOAMGameInstance::GetOAM(this);
		const UOAMChapterData* CD = GI ? GI->ResolveChapter(Ch) : nullptr;
		if (!CD) continue;

		UVerticalBox* Card = NewObject<UVerticalBox>(this);
		UImage* CardBG = NewObject<UImage>(Card);
		CardBG->SetColorAndOpacity(FLinearColor(0.1f, 0.07f, 0.06f, 0.98f));

		UTextBlock* No = _MakeLabel(Card, FString::Printf(TEXT("第 %d 章"), Ch), 48, FLinearColor(0.9f, 0.7f, 0.45f));
		UTextBlock* CT = _MakeLabel(Card, CD->ChapterTitle.ToString(), 32, FLinearColor(0.95f, 0.82f, 0.6f));
		UTextBlock* CS = _MakeLabel(Card, CD->ChapterSubtitle.ToString(), 22, FLinearColor(0.78f, 0.65f, 0.45f));
		UTextBlock* Desc = _MakeLabel(Card, CD->Description.ToString(), 20, FLinearColor(0.85f, 0.72f, 0.55f));
		Desc->SetAutoWrapText(true);
		Desc->SetMinDesiredWidth(400);

		UButton* Play = _MakeButton(Card, TEXT("开 始"), 28);
		const int32 Capture = Ch;
		Play->OnClicked.AddUObject(this, [this, Capture]() { HandleChapterSelected(Capture); });

		auto AddC = [&](UWidget* W, FMargin Padd = FMargin(16, 10))
		{
			UVerticalBoxSlot* S = Card->AddChildToVerticalBox(W);
			S->SetPadding(Padd);
			S->SetHorizontalAlignment(HAlign_Center);
		};
		AddC(No, FMargin(0, 20, 0, 0));
		AddC(CT);
		AddC(CS);
		AddC(Desc, FMargin(24, 16));
		AddC(Play, FMargin(0, 16, 0, 24));

		UHorizontalBoxSlot* CS2 = Cards->AddChildToHorizontalBox(Card);
		CS2->SetPadding(FMargin(16));
		CS2->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	Btn_Close = _MakeButton(this, TEXT("关 闭"), 26);
	_AddToCanvas(Root, Btn_Close, FVector2D(960 - 120, 860), FVector2D(240, 64), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	Btn_Close->OnClicked.AddDynamic(this, &UOAMLevelSelectWidget::HandleClose);
	if (Txt_Title) Txt_Title->SetText(FText::FromString(TEXT("选 择 章 节")));
}

/* =====================================================================
   =================== 存档/读档面板 ===================================
   ===================================================================== */

void UOAMSaveLoadWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.75f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	const FString TitleStr = bIsLoadMode ? TEXT("读 取 存 档") : TEXT("保 存 游 戏");
	UTextBlock* Title = _MakeLabel(this, TitleStr, 52, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Title, FVector2D(960 - 300, 120), FVector2D(600, 80), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	if (Txt_ModeTitle) Txt_ModeTitle->SetText(FText::FromString(TitleStr));

	UVerticalBox* SlotsBox = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, SlotsBox, FVector2D(960 - 450, 250), FVector2D(900, 680), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* SM = GI ? GI->SaveManager : nullptr;

	for (int32 Slot = 0; Slot <= UOAMSaveManager::SLOT_COUNT; ++Slot)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		const FString SlotName = (Slot == UOAMSaveManager::AUTO_SLOT) ? TEXT("自动存档") : FString::Printf(TEXT("存档槽 %d"), Slot + 1);
		UTextBlock* No = _MakeLabel(Row, SlotName, 24, FLinearColor(0.88f, 0.72f, 0.5f));
		No->SetMinDesiredWidth(200);
		Row->AddChildToHorizontalBox(No);

		const FOAMSaveSlot* Data = SM ? SM->GetSlot(Slot) : nullptr;
		FString InfoStr = TEXT("空");
		if (Data && Data->SaveTimeTicks != 0)
		{
			int32 S = FMath::FloorToInt(Data->PlayTimeSeconds);
			InfoStr = FString::Printf(TEXT("第 %d 章 · %s · 用时 %02d:%02d:%02d · 物品 %d 笔记 %d"),
				Data->ChapterID,
				*SM->FormatSaveTime(*Data),
				S / 3600, (S % 3600) / 60, S % 60,
				Data->CollectedItems.Num(), Data->ReadNotes.Num());
		}
		UTextBlock* Info = _MakeLabel(Row, InfoStr, 22, FLinearColor(0.7f, 0.6f, 0.48f));
		Info->SetMinDesiredWidth(520);
		Row->AddChildToHorizontalBox(Info);

		UButton* B = _MakeButton(Row, bIsLoadMode ? TEXT("读  取") : TEXT("保  存"), 22);
		const int32 Cap = Slot;
		B->OnClicked.AddUObject(this, [this, Cap]() { HandleSlotClicked(Cap); });
		Row->AddChildToHorizontalBox(B);

		UVerticalBoxSlot* VS = SlotsBox->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(16, 12));
		VS->SetHorizontalAlignment(HAlign_Fill);
	}

	Btn_Close = _MakeButton(this, TEXT("关 闭"), 26);
	_AddToCanvas(Root, Btn_Close, FVector2D(960 - 120, 950), FVector2D(240, 64), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	Btn_Close->OnClicked.AddDynamic(this, &UOAMSaveLoadWidget::HandleClose);

	if (VBox_Slots) VBox_Slots->SetVisibility(ESlateVisibility::SelfHitTestInvisible);
	RefreshSlots();
}
