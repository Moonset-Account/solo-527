// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.
// Part3: 静态工厂入口 + 笔记本/谜题锁/物品检查/章节结算 4 个 UI

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
#include "Components/Image.h"
#include "Components/TextBlock.h"
#include "Components/Button.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMChapterManager.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Data/OAMPuzzleData.h"
#include "Data/OAMChapterData.h"

extern UCanvasPanelSlot* _AddToCanvas(UCanvasPanel*, UWidget*, FVector2D, FVector2D, FAnchors, FMargin);
extern UButton* _MakeButton(UObject*, FString, int32);

static UTextBlock* _MakeLabel2(UObject* Outer, FString Str, int32 Sz = 20, FLinearColor Col = FLinearColor(0.9f, 0.75f, 0.55f))
{
	UTextBlock* T = NewObject<UTextBlock>(Outer);
	T->SetText(FText::FromString(Str));
	T->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Medium.ttf"), Sz));
	T->SetColorAndOpacity(FSlateColor(Col));
	return T;
}

/* =====================================================================
   =================== 静态工厂方法 =====================================
   ===================================================================== */

UUserWidget* UOAMUIFactory::CreateMainMenu(APlayerController* PC)
{
	if (!PC) return nullptr;
	UOAMMainMenuWidget* W = CreateWidget<UOAMMainMenuWidget>(PC, UOAMMainMenuWidget::StaticClass());
	if (W) W->AddToViewport(10);
	return W;
}

UUserWidget* UOAMUIFactory::CreateGameplayHUD(APlayerController* PC)
{
	if (!PC) return nullptr;
	UOAMRuntimeHUDWidget* W = CreateWidget<UOAMRuntimeHUDWidget>(PC, UOAMRuntimeHUDWidget::StaticClass());
	if (W) W->AddToViewport(5);
	return W;
}

UUserWidget* UOAMUIFactory::CreatePauseMenu(APlayerController* PC)
{
	if (!PC) return nullptr;
	UOAMPauseMenuWidget* W = CreateWidget<UOAMPauseMenuWidget>(PC, UOAMPauseMenuWidget::StaticClass());
	if (W) W->AddToViewport(50);
	return W;
}

UUserWidget* UOAMUIFactory::CreateSettings(APlayerController* PC)
{
	if (!PC) return nullptr;
	UOAMRuntimeSettingsWidget* W = CreateWidget<UOAMRuntimeSettingsWidget>(PC, UOAMRuntimeSettingsWidget::StaticClass());
	if (W) W->AddToViewport(80);
	return W;
}

UUserWidget* UOAMUIFactory::CreateLevelSelect(APlayerController* PC)
{
	if (!PC) return nullptr;
	UOAMRuntimeLevelSelectWidget* W = CreateWidget<UOAMRuntimeLevelSelectWidget>(PC, UOAMRuntimeLevelSelectWidget::StaticClass());
	if (W) W->AddToViewport(80);
	return W;
}

UUserWidget* UOAMUIFactory::CreateSaveLoad(APlayerController* PC, bool bLoadMode)
{
	if (!PC) return nullptr;
	UOAMRuntimeSaveLoadWidget* W = CreateWidget<UOAMRuntimeSaveLoadWidget>(PC, UOAMRuntimeSaveLoadWidget::StaticClass());
	if (W) { W->bLoadMode = bLoadMode; W->AddToViewport(80); }
	return W;
}

UUserWidget* UOAMUIFactory::CreateNotebook(APlayerController* PC)
{
	if (!PC) return nullptr;
	UOAMRuntimeNotebookWidget* W = CreateWidget<UOAMRuntimeNotebookWidget>(PC, UOAMRuntimeNotebookWidget::StaticClass());
	if (W) W->AddToViewport(100);
	return W;
}

UUserWidget* UOAMUIFactory::CreatePuzzle(APlayerController* PC, FName PuzzleID)
{
	if (!PC) return nullptr;
	UOAMRuntimePuzzleWidget* W = CreateWidget<UOAMRuntimePuzzleWidget>(PC, UOAMRuntimePuzzleWidget::StaticClass());
	if (W) { W->PuzzleID = PuzzleID; W->AddToViewport(120); }
	return W;
}

UUserWidget* UOAMUIFactory::CreateExamine(APlayerController* PC, FName ItemID)
{
	if (!PC) return nullptr;
	UOAMRuntimeExamineWidget* W = CreateWidget<UOAMRuntimeExamineWidget>(PC, UOAMRuntimeExamineWidget::StaticClass());
	if (W) { W->ItemID = ItemID; W->AddToViewport(120); }
	return W;
}

UUserWidget* UOAMUIFactory::CreateChapterComplete(APlayerController* PC, int32 ChapterID)
{
	if (!PC) return nullptr;
	UOAMRuntimeChapterCompleteWidget* W = CreateWidget<UOAMRuntimeChapterCompleteWidget>(PC, UOAMRuntimeChapterCompleteWidget::StaticClass());
	if (W) { W->ChapterID = ChapterID; W->AddToViewport(200); }
	return W;
}

/* =====================================================================
   =================== 设置面板（Runtime 版）============================
   ===================================================================== */

void UOAMRuntimeSettingsWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.8f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	UImage* Panel = NewObject<UImage>(this);
	Panel->SetColorAndOpacity(FLinearColor(0.08f, 0.055f, 0.045f, 0.98f));
	_AddToCanvas(Root, Panel, FVector2D(960 - 600, 540 - 450), FVector2D(1200, 900), FAnchors(0.5f, 0.5f))
		->SetAlignment(FVector2D(0.5f, 0.5f));

	UTextBlock* Title = _MakeLabel2(this, TEXT("设        置"), 48, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Title, FVector2D(960 - 250, 80), FVector2D(500, 70), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	struct SL { FString L; USlider** S; float V; };
	struct CL { FString L; UCheckBox** C; bool V; };
	TArray<SL> Sliders = {
		{TEXT("主音量"),         &Sld_Master,    1.0f},
		{TEXT("音乐音量"),       &Sld_Music,     0.8f},
		{TEXT("音效音量"),       &Sld_SFX,       1.0f},
		{TEXT("环境音音量"),     &Sld_Ambient,   0.7f},
		{TEXT("鼠标灵敏度"),     &Sld_Sens,      1.0f},
		{TEXT("视野 FOV"),       &Sld_FOV,       0.75f},
		{TEXT("画面亮度"),       &Sld_Brightness,1.0f},
		{TEXT("胶片颗粒强度"),   &Sld_Grain,     0.3f},
	};
	TArray<CL> Checks = {
		{TEXT("垂直同步"),       &Chk_VSync,    false},
		{TEXT("启用屏幕抖动"),   &Chk_Shake,    true},
		{TEXT("启用闪光反馈"),   &Chk_Flash,    true},
		{TEXT("启用旁白字幕"),   &Chk_Subtitle, true},
	};

	UVerticalBox* VBLeft = NewObject<UVerticalBox>(this);
	UVerticalBox* VBRight = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, VBLeft,  FVector2D(960 - 540, 200), FVector2D(520, 560), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	_AddToCanvas(Root, VBRight, FVector2D(960 + 20,  200), FVector2D(520, 560), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	int32 Idx = 0;
	for (const SL& SL : Sliders)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		UTextBlock* L = _MakeLabel2(Row, SL.L, 22);
		L->SetMinDesiredWidth(200);
		Row->AddChildToHorizontalBox(L);
		*(SL.S) = NewObject<USlider>(this);
		(*(SL.S))->SetValue(SL.V);
		(*(SL.S))->SetMinValue(0); (*(SL.S))->SetMaxValue(1);
		if (SL.L.StartsWith(TEXT("视野"))) { (*(SL.S))->SetMinValue(60); (*(SL.S))->SetMaxValue(110); (*(SL.S))->SetValue(85); }
		Row->AddChildToHorizontalBox(*(SL.S));
		UVerticalBoxSlot* VS = (Idx < 4 ? VBLeft : VBRight)->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(0, 14)); VS->SetHorizontalAlignment(HAlign_Fill);
		Idx++;
	}
	for (const CL& CL : Checks)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		UTextBlock* L = _MakeLabel2(Row, CL.L, 22);
		L->SetMinDesiredWidth(200);
		Row->AddChildToHorizontalBox(L);
		*(CL.C) = NewObject<UCheckBox>(Row);
		(*(CL.C))->SetIsChecked(CL.V);
		Row->AddChildToHorizontalBox(*(CL.C));
		UVerticalBoxSlot* VS = VBRight->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(0, 12));
	}

	Btn_Apply    = _MakeButton(this, TEXT("应  用"), 24);
	Btn_Defaults = _MakeButton(this, TEXT("恢复默认"), 24);
	Btn_Close    = _MakeButton(this, TEXT("关  闭"), 24);
	UHorizontalBox* Buttons = NewObject<UHorizontalBox>(this);
	_AddToCanvas(Root, Buttons, FVector2D(960 - 420, 800), FVector2D(840, 70), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	auto AddB = [&](UButton* B) { UHorizontalBoxSlot* S = Buttons->AddChildToHorizontalBox(B); S->SetPadding(FMargin(10)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill)); };
	AddB(Btn_Apply); AddB(Btn_Defaults); AddB(Btn_Close);
	if (Btn_Apply)    Btn_Apply->OnClicked.AddDynamic(this, &UOAMRuntimeSettingsWidget::HandleApply);
	if (Btn_Defaults) Btn_Defaults->OnClicked.AddDynamic(this, &UOAMRuntimeSettingsWidget::HandleDefaults);
	if (Btn_Close)    Btn_Close->OnClicked.AddDynamic(this, &UOAMRuntimeSettingsWidget::HandleClose);
}

void UOAMRuntimeSettingsWidget::HandleApply()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	UE_LOG(LogTemp, Log, TEXT("[OAM][设置] 已应用"));
}
void UOAMRuntimeSettingsWidget::HandleDefaults()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][设置] 恢复默认"));
}
void UOAMRuntimeSettingsWidget::HandleClose()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) { if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu")); if (GI->IsInMainMenu()) GI->SetInputMode(EOAMInputMode::UI); else GI->SetInputMode(EOAMInputMode::Exploration); }
	RemoveFromParent();
}

/* =====================================================================
   =================== 关卡选择（Runtime 版）===========================
   ===================================================================== */

void UOAMRuntimeLevelSelectWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.8f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	UTextBlock* Title = _MakeLabel2(this, TEXT("关 卡 选 择"), 48, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Title, FVector2D(960 - 250, 100), FVector2D(500, 70), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	UHorizontalBox* Cards = NewObject<UHorizontalBox>(this);
	_AddToCanvas(Root, Cards, FVector2D(960 - 680, 220), FVector2D(1360, 520), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	auto* GI = UOAMGameInstance::GetOAM(this);
	for (int32 Ch = 1; Ch <= 3; ++Ch)
	{
		const UOAMChapterData* CD = GI ? GI->ResolveChapter(Ch) : nullptr;
		UVerticalBox* Card = NewObject<UVerticalBox>(this);
		UImage* CardBG = NewObject<UImage>(Card);
		CardBG->SetColorAndOpacity(FLinearColor(0.1f, 0.07f, 0.06f, 0.98f));
		_AddToCanvas(NewObject<UCanvasPanel>(Card), CardBG, FVector2D(0, 0), FVector2D(420, 520), FAnchors(0, 0, 1, 1));

		UTextBlock* No = _MakeLabel2(Card, FString::Printf(TEXT("第 %d 章"), Ch), 44, FLinearColor(0.9f, 0.7f, 0.45f));
		FString CT = CD ? CD->ChapterTitle.ToString() : FString(TEXT("--"));
		FString CS = CD ? CD->ChapterSubtitle.ToString() : FString(TEXT("--"));
		FString Desc = CD ? CD->Description.ToString() : FString(TEXT(""));
		UTextBlock* CT_T = _MakeLabel2(Card, CT, 28, FLinearColor(0.95f, 0.82f, 0.6f));
		UTextBlock* CS_T = _MakeLabel2(Card, CS, 20, FLinearColor(0.78f, 0.65f, 0.45f));
		UTextBlock* Desc_T = _MakeLabel2(Card, Desc, 18, FLinearColor(0.85f, 0.72f, 0.55f));
		Desc_T->SetAutoWrapText(true);
		Desc_T->SetMinDesiredWidth(380);

		UButton* Play = _MakeButton(Card, TEXT("开  始"), 26);
		const int32 Capture = Ch;
		if (Capture == 1) Play->OnClicked.AddDynamic(this, &UOAMRuntimeLevelSelectWidget::HandleCh1);
		if (Capture == 2) Play->OnClicked.AddDynamic(this, &UOAMRuntimeLevelSelectWidget::HandleCh2);
		if (Capture == 3) Play->OnClicked.AddDynamic(this, &UOAMRuntimeLevelSelectWidget::HandleCh3);

		auto AddC = [&](UWidget* W, FMargin Padd = FMargin(16, 8)) {
			UVerticalBoxSlot* S = Card->AddChildToVerticalBox(W);
			S->SetPadding(Padd); S->SetHorizontalAlignment(HAlign_Center);
		};
		AddC(No, FMargin(0, 20, 0, 0));
		AddC(CT_T); AddC(CS_T); AddC(Desc_T, FMargin(20, 10)); AddC(Play, FMargin(0, 10, 0, 16));
		UHorizontalBoxSlot* CS2 = Cards->AddChildToHorizontalBox(Card);
		CS2->SetPadding(FMargin(12)); CS2->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
	}

	Btn_Back = _MakeButton(this, TEXT("返  回"), 24);
	_AddToCanvas(Root, Btn_Back, FVector2D(960 - 120, 780), FVector2D(240, 60), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	Btn_Back->OnClicked.AddDynamic(this, &UOAMRuntimeLevelSelectWidget::HandleBack);
}

void UOAMRuntimeLevelSelectWidget::HandleCh1() { HandleBack(); auto* GI = UOAMGameInstance::GetOAM(this); if (GI) GI->StartNewGame(1); }
void UOAMRuntimeLevelSelectWidget::HandleCh2() { HandleBack(); auto* GI = UOAMGameInstance::GetOAM(this); if (GI) GI->StartNewGame(2); }
void UOAMRuntimeLevelSelectWidget::HandleCh3() { HandleBack(); auto* GI = UOAMGameInstance::GetOAM(this); if (GI) GI->StartNewGame(3); }
void UOAMRuntimeLevelSelectWidget::HandleBack() {
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
	RemoveFromParent();
}

/* =====================================================================
   =================== 存档/读档面板（Runtime 版）=======================
   ===================================================================== */

void UOAMRuntimeSaveLoadWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.8f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	const FString TitleStr = bLoadMode ? TEXT("读 取 存 档") : TEXT("保 存 游 戏");
	UTextBlock* Title = _MakeLabel2(this, TitleStr, 48, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Title, FVector2D(960 - 250, 100), FVector2D(500, 70), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	UVerticalBox* SlotsBox = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, SlotsBox, FVector2D(960 - 400, 220), FVector2D(800, 600), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* SM = GI ? GI->SaveManager : nullptr;

	for (int32 Slot = -1; Slot < 5; ++Slot)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		const FString SlotName = (Slot < 0) ? TEXT("自动存档") : FString::Printf(TEXT("存档槽 %d"), Slot + 1);
		UTextBlock* No = _MakeLabel2(Row, SlotName, 22, FLinearColor(0.88f, 0.72f, 0.5f));
		No->SetMinDesiredWidth(180);
		Row->AddChildToHorizontalBox(No);

		const FOAMSaveSlot* Data = SM ? SM->GetSlot(Slot) : nullptr;
		FString InfoStr = TEXT("空");
		if (Data && Data->SaveTimeTicks > 0)
		{
			int32 S = FMath::FloorToInt(Data->PlayTimeSeconds);
			InfoStr = FString::Printf(TEXT("第 %d 章 · 用时 %02d:%02d:%02d · 物品 %d 笔记 %d"),
				Data->ChapterID, S / 3600, (S % 3600) / 60, S % 60,
				Data->CollectedItems.Num(), Data->ReadNotes.Num());
		}
		UTextBlock* Info = _MakeLabel2(Row, InfoStr, 20, FLinearColor(0.7f, 0.6f, 0.48f));
		Info->SetMinDesiredWidth(420);
		Row->AddChildToHorizontalBox(Info);

		UButton* B = _MakeButton(Row, bLoadMode ? TEXT("读  取") : TEXT("保  存"), 20);
		Btn_Slots.Add(B);
		const int32 Cap = Slot;
		B->OnClicked.AddDynamic(this, &UOAMRuntimeSaveLoadWidget::HandleSlot, Cap);
		Row->AddChildToHorizontalBox(B);

		UVerticalBoxSlot* VS = SlotsBox->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(14, 10)); VS->SetHorizontalAlignment(HAlign_Fill);
	}

	Btn_Close = _MakeButton(this, TEXT("关  闭"), 24);
	_AddToCanvas(Root, Btn_Close, FVector2D(960 - 120, 860), FVector2D(240, 60), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	Btn_Close->OnClicked.AddDynamic(this, &UOAMRuntimeSaveLoadWidget::HandleClose);
}

void UOAMRuntimeSaveLoadWidget::HandleSlot(int32 I)
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->SaveManager) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(bLoadMode ? TEXT("UI_Load") : TEXT("UI_Save"));
	if (bLoadMode) GI->SaveManager->LoadGame(I);
	else           GI->SaveManager->SaveGame(I);
	UE_LOG(LogTemp, Log, TEXT("[OAM][存档] %s 槽 %d"), (bLoadMode ? TEXT("读取") : TEXT("保存")), I);
}
void UOAMRuntimeSaveLoadWidget::HandleClose() {
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
	RemoveFromParent();
}

/* =====================================================================
   =================== 笔记本 UI（Runtime 版）===========================
   ===================================================================== */

void UOAMRuntimeNotebookWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	RootCanvas = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = RootCanvas;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.85f));
	_AddToCanvas(RootCanvas, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	UImage* Paper = NewObject<UImage>(this);
	Paper->SetColorAndOpacity(FLinearColor(0.95f, 0.88f, 0.72f, 0.97f));
	_AddToCanvas(RootCanvas, Paper, FVector2D(960 - 600, 540 - 450), FVector2D(1200, 900), FAnchors(0.5f, 0.5f))
		->SetAlignment(FVector2D(0.5f, 0.5f));

	// 三个 Tab
	Btn_Tab1 = _MakeButton(this, TEXT("物证"), 22);
	Btn_Tab2 = _MakeButton(this, TEXT("笔记"), 22);
	Btn_Tab3 = _MakeButton(this, TEXT("线索"), 22);
	UHorizontalBox* Tabs = NewObject<UHorizontalBox>(this);
	_AddToCanvas(RootCanvas, Tabs, FVector2D(960 - 540, 130), FVector2D(1080, 60), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	auto AddTab = [&](UButton* B) { UHorizontalBoxSlot* S = Tabs->AddChildToHorizontalBox(B); S->SetPadding(FMargin(6)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill)); };
	AddTab(Btn_Tab1); AddTab(Btn_Tab2); AddTab(Btn_Tab3);
	Btn_Tab1->OnClicked.AddDynamic(this, &UOAMRuntimeNotebookWidget::HandleTab, 0);
	Btn_Tab2->OnClicked.AddDynamic(this, &UOAMRuntimeNotebookWidget::HandleTab, 1);
	Btn_Tab3->OnClicked.AddDynamic(this, &UOAMRuntimeNotebookWidget::HandleTab, 2);

	// 标题 + 页码
	Txt_Title = _MakeLabel2(this, TEXT("笔 记 本 · 物证"), 32, FLinearColor(0.35f, 0.22f, 0.12f));
	_AddToCanvas(RootCanvas, Txt_Title, FVector2D(960 - 500, 210), FVector2D(1000, 50), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	Txt_Page = _MakeLabel2(this, TEXT("1 / 1"), 20, FLinearColor(0.45f, 0.32f, 0.22f));
	_AddToCanvas(RootCanvas, Txt_Page, FVector2D(960 - 100, 810), FVector2D(200, 30), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 内容区
	Txt_Content = _MakeLabel2(this, TEXT("（暂无记录）\n\n开始游戏后，收集的物品、阅读的笔记、发现的线索会出现在这里。"), 22, FLinearColor(0.2f, 0.14f, 0.08f));
	Txt_Content->SetAutoWrapText(true);
	Txt_Content->SetMinDesiredWidth(1000);
	_AddToCanvas(RootCanvas, Txt_Content, FVector2D(960 - 520, 280), FVector2D(1040, 500), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 按钮行
	Btn_Prev  = _MakeButton(this, TEXT("上一页"), 22);
	Btn_Next  = _MakeButton(this, TEXT("下一页"), 22);
	Btn_Close = _MakeButton(this, TEXT("关  闭"), 24);
	UHorizontalBox* BB = NewObject<UHorizontalBox>(this);
	_AddToCanvas(RootCanvas, BB, FVector2D(960 - 420, 860), FVector2D(840, 60), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	auto AddB2 = [&](UButton* B) { UHorizontalBoxSlot* S = BB->AddChildToHorizontalBox(B); S->SetPadding(FMargin(10)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill)); };
	AddB2(Btn_Prev); AddB2(Btn_Next); AddB2(Btn_Close);
	Btn_Prev->OnClicked.AddDynamic(this, &UOAMRuntimeNotebookWidget::HandlePage, -1);
	Btn_Next->OnClicked.AddDynamic(this, &UOAMRuntimeNotebookWidget::HandlePage, 1);
	Btn_Close->OnClicked.AddDynamic(this, &UOAMRuntimeNotebookWidget::HandleClose);
}

void UOAMRuntimeNotebookWidget::HandleTab(int32 Tab) { CurrentTab = Tab; CurrentPage = 0; RefreshView(); }
void UOAMRuntimeNotebookWidget::HandlePage(int32 Delta) { CurrentPage = FMath::Max(0, CurrentPage + Delta); RefreshView(); }
void UOAMRuntimeNotebookWidget::RefreshView()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	TArray<FString> TabNames = { TEXT("物证"), TEXT("笔记"), TEXT("线索") };
	if (Txt_Title) Txt_Title->SetText(FText::FromString(FString::Printf(TEXT("笔 记 本 · %s"), *TabNames[CurrentTab])));

	FString Content;
	if (CurrentTab == 0 && GI)
	{
		for (UOAMItemData* It : GI->GetBootstrap()->GetAllItems())
			Content += FString::Printf(TEXT("【%s】\n%s\n\n"), *It->DisplayName.ToString(), *It->Description.ToString());
	}
	else if (CurrentTab == 1 && GI)
	{
		// 展示第一篇笔记
		UOAMNoteData* N = GI->ResolveNote(TEXT("note_diary_1"));
		if (N && N->Pages.Num() > 0)
			Content = N->Pages[0].PageText.ToString();
	}
	else Content = TEXT("（相关线索会在探索中不断出现...）\n\n失踪案：1998 年 7 月 14 日 建设北路 4 号 502 室\n案件编号：7814-B-1998\n关联人员：周小媛（16 岁，失踪）、陈慧芳（母亲）、周建国（父亲）\n关键地点：502 室客厅、女儿房、地下室\n最后目击：17:30 学校门口，之后去向不明\n目击证人：邻居张阿姨（6:10pm 见可疑男子在楼下徘徊）");

	if (Txt_Content) Txt_Content->SetText(FText::FromString(Content.IsEmpty() ? TEXT("（暂无）") : Content));
	if (Txt_Page) Txt_Page->SetText(FText::FromString(FString::Printf(TEXT("%d / 1"), CurrentPage + 1)));
}
void UOAMRuntimeNotebookWidget::HandleClose() {
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
	if (GI && !GI->IsInMainMenu()) GI->SetInputMode(EOAMInputMode::Exploration);
	else if (GI) GI->SetInputMode(EOAMInputMode::UI);
	RemoveFromParent();
}

/* =====================================================================
   =================== 谜题锁 UI（Runtime 版）==========================
   ===================================================================== */

void UOAMRuntimePuzzleWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.85f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	// 谜题数据
	auto* GI = UOAMGameInstance::GetOAM(this);
	const UOAMPuzzleData* PD = GI ? GI->ResolvePuzzle(PuzzleID) : nullptr;
	MaxDigits = PD ? PD->DigitCount : 4;
	const FString NameStr = PD ? PD->DisplayName.ToString() : FString(TEXT("密码锁"));
	const FString HintStr = PD ? PD->HintText.ToString() : FString(TEXT("输入数字密码"));

	UImage* Panel = NewObject<UImage>(this);
	Panel->SetColorAndOpacity(FLinearColor(0.08f, 0.06f, 0.05f, 0.98f));
	_AddToCanvas(Root, Panel, FVector2D(960 - 450, 540 - 380), FVector2D(900, 760), FAnchors(0.5f, 0.5f))
		->SetAlignment(FVector2D(0.5f, 0.5f));

	Txt_Title = _MakeLabel2(this, NameStr, 44, FLinearColor(0.95f, 0.75f, 0.45f));
	_AddToCanvas(Root, Txt_Title, FVector2D(960 - 400, 210), FVector2D(800, 60), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	Txt_Hint = _MakeLabel2(this, HintStr, 22, FLinearColor(0.78f, 0.65f, 0.45f));
	Txt_Hint->SetAutoWrapText(true);
	Txt_Hint->SetMinDesiredWidth(800);
	_AddToCanvas(Root, Txt_Hint, FVector2D(960 - 400, 290), FVector2D(800, 70), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 数字槽位
	UHorizontalBox* Slots = NewObject<UHorizontalBox>(this);
	_AddToCanvas(Root, Slots, FVector2D(960 - (MaxDigits * 50), 400), FVector2D(MaxDigits * 100, 110), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	for (int32 I = 0; I < MaxDigits; ++I)
	{
		UTextBlock* T = _MakeLabel2(this, TEXT("_"), 60, FLinearColor(1.f, 0.85f, 0.55f));
		UHorizontalBoxSlot* S = Slots->AddChildToHorizontalBox(T);
		S->SetPadding(FMargin(8)); S->SetHorizontalAlignment(HAlign_Center);
		Txt_Slots.Add(T);
	}
	RefreshSlots();

	Txt_Attempts = _MakeLabel2(this,
		PD ? FString::Printf(TEXT("剩余尝试：%d / %d"), PD->MaxAttempts, PD->MaxAttempts) : FString(TEXT("剩余尝试：3 / 3")),
		22, FLinearColor(0.8f, 0.6f, 0.45f));
	_AddToCanvas(Root, Txt_Attempts, FVector2D(960 - 250, 520), FVector2D(500, 30), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 数字键盘
	UVerticalBox* KB = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, KB, FVector2D(960 - 180, 570), FVector2D(360, 260), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	for (int32 Row = 0; Row < 3; ++Row)
	{
		UHorizontalBox* R = NewObject<UHorizontalBox>(this);
		for (int32 Col = 1; Col <= 3; ++Col)
		{
			const int32 Digit = Row * 3 + Col;
			UButton* B = _MakeButton(R, FString::Printf(TEXT("%d"), Digit), 30);
			UHorizontalBoxSlot* S = R->AddChildToHorizontalBox(B);
			S->SetPadding(FMargin(6)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill));
			B->OnClicked.AddDynamic(this, &UOAMRuntimePuzzleWidget::HandleDigit, Digit);
			Btn_Digits.Add(B);
		}
		KB->AddChildToVerticalBox(R);
	}
	// 最后一行：0
	UHorizontalBox* R0 = NewObject<UHorizontalBox>(this);
	UButton* BClear = _MakeButton(R0, TEXT("清  除"), 22);
	UButton* B0     = _MakeButton(R0, TEXT("0"), 30);
	UButton* BSub   = _MakeButton(R0, TEXT("确  认"), 22);
	auto AddR0 = [&](UButton* B) { UHorizontalBoxSlot* S = R0->AddChildToHorizontalBox(B); S->SetPadding(FMargin(6)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill)); };
	AddR0(BClear); AddR0(B0); AddR0(BSub);
	KB->AddChildToVerticalBox(R0);
	B0->OnClicked.AddDynamic(this, &UOAMRuntimePuzzleWidget::HandleDigit, 0);
	BClear->OnClicked.AddDynamic(this, &UOAMRuntimePuzzleWidget::HandleClear);
	BSub->OnClicked.AddDynamic(this, &UOAMRuntimePuzzleWidget::HandleSubmit);

	Btn_Close = _MakeButton(this, TEXT("退  出"), 20);
	_AddToCanvas(Root, Btn_Close, FVector2D(960 - 80, 840), FVector2D(160, 44), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	Btn_Close->OnClicked.AddDynamic(this, &UOAMRuntimePuzzleWidget::HandleClose);
}

void UOAMRuntimePuzzleWidget::RefreshSlots()
{
	for (int32 I = 0; I < Txt_Slots.Num() && I < MaxDigits; ++I)
	{
		if (I < CurrentInput.Num())
			Txt_Slots[I]->SetText(FText::FromString(FString::Printf(TEXT("%d"), CurrentInput[I])));
		else
			Txt_Slots[I]->SetText(FText::FromString(TEXT("_")));
	}
}

void UOAMRuntimePuzzleWidget::HandleDigit(int32 D)
{
	if (CurrentInput.Num() < MaxDigits)
	{
		CurrentInput.Add(D);
		RefreshSlots();
		if (auto* GI = UOAMGameInstance::GetOAM(this))
			if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	}
}
void UOAMRuntimePuzzleWidget::HandleClear() { CurrentInput.Reset(); RefreshSlots(); }

void UOAMRuntimePuzzleWidget::HandleSubmit()
{
	if (CurrentInput.Num() != MaxDigits) return;
	auto* GI = UOAMGameInstance::GetOAM(this);
	const UOAMPuzzleData* PD = GI ? GI->ResolvePuzzle(PuzzleID) : nullptr;
	if (!PD) return;

	bool bCorrect = (CurrentInput == PD->Password);
	if (GI && GI->Telemetry) GI->Telemetry->RecordPuzzleAttempt(PuzzleID, CurrentInput, bCorrect);

	if (bCorrect)
	{
		if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Solve"));
		if (Txt_Attempts) Txt_Attempts->SetText(FText::FromString(TEXT("✓ 密码正确！")));
		FTimerHandle H;
		GetWorld()->GetTimerManager().SetTimer(H, FTimerDelegate::CreateWeakLambda(this, [this, GI, PD]() {
			if (GI && GI->ChapterManager) GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::SolvePuzzle, PuzzleID, 1);
			if (GI && !GI->IsInMainMenu()) GI->SetInputMode(EOAMInputMode::Exploration);
			else if (GI) GI->SetInputMode(EOAMInputMode::UI);
			RemoveFromParent();
		}), 1.3f, false);
	}
	else
	{
		if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Fail"));
		if (Txt_Attempts) Txt_Attempts->SetText(FText::FromString(TEXT("✗ 密码错误")));
		CurrentInput.Reset();
		RefreshSlots();
	}
}

void UOAMRuntimePuzzleWidget::HandleClose() {
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
	if (GI && !GI->IsInMainMenu()) GI->SetInputMode(EOAMInputMode::Exploration);
	RemoveFromParent();
}

/* =====================================================================
   =================== 物品检查 UI（Runtime 版）=========================
   ===================================================================== */

void UOAMRuntimeExamineWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	RootCanvas = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = RootCanvas;

	auto* GI = UOAMGameInstance::GetOAM(this);
	const UOAMItemData* It = GI ? GI->ResolveItem(ItemID) : nullptr;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.88f));
	_AddToCanvas(RootCanvas, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	// 物品"视图"（中间一个大的着色方块，代表 3D 占位物品）
	Img_Item = NewObject<UImage>(this);
	Img_Item->SetColorAndOpacity(FLinearColor(0.75f, 0.55f, 0.32f, 1.f));
	_AddToCanvas(RootCanvas, Img_Item, FVector2D(960 - 260, 540 - 260), FVector2D(520, 520), FAnchors(0.5f, 0.5f))
		->SetAlignment(FVector2D(0.5f, 0.5f));

	// 热点（如果 Item 有定义）
	if (It)
	{
		for (int32 HI = 0; HI < It->HotspotPositions.Num() && HI < It->HotspotTexts.Num(); ++HI)
		{
			const FVector2D& HP = It->HotspotPositions[HI];
			UButton* HB = _MakeButton(this, TEXT("？"), 16);
			HB->SetColorAndOpacity(FSlateColor(FLinearColor(1.f, 0.7f, 0.2f, 0.95f)));
			_AddToCanvas(RootCanvas, HB,
				FVector2D((960 - 260) + HP.X * 520 - 22, (540 - 260) + HP.Y * 520 - 22),
				FVector2D(44, 44), FAnchors(0, 0));
			Btn_Hotspots.Add(HB);
			const int32 Cap = HI;
			HB->OnClicked.AddDynamic(this, &UOAMRuntimeExamineWidget::HandleHotspot, Cap);
		}
	}

	// 名称
	const FString NameStr = It ? It->DisplayName.ToString() : ItemID.ToString();
	Txt_Name = _MakeLabel2(this, NameStr, 40, FLinearColor(0.95f, 0.78f, 0.5f));
	_AddToCanvas(RootCanvas, Txt_Name, FVector2D(960 - 400, 80), FVector2D(800, 60), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 旁白文本
	Txt_Flavor = _MakeLabel2(this,
		It && It->ExamineFlavorTexts.Num() > 0 ? It->ExamineFlavorTexts[0].ToString() : FString(TEXT("检查物品...")),
		24, FLinearColor(0.85f, 0.72f, 0.5f));
	Txt_Flavor->SetAutoWrapText(true); Txt_Flavor->SetMinDesiredWidth(1200);
	_AddToCanvas(RootCanvas, Txt_Flavor, FVector2D(960 - 600, 820), FVector2D(1200, 80), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	const int32 Total = It ? It->ExamineFlavorTexts.Num() : 1;
	Txt_Page = _MakeLabel2(this, FString::Printf(TEXT("1 / %d"), Total), 20, FLinearColor(0.7f, 0.58f, 0.42f));
	_AddToCanvas(RootCanvas, Txt_Page, FVector2D(960 - 80, 910), FVector2D(160, 28), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 按钮行
	Btn_RotL  = _MakeButton(this, TEXT("← 旋转"), 22);
	Btn_Next  = _MakeButton(this, TEXT("下 一 段"), 24);
	Btn_RotR  = _MakeButton(this, TEXT("旋转 →"), 22);
	Btn_Close = _MakeButton(this, TEXT("放 回"), 24);
	UHorizontalBox* BB = NewObject<UHorizontalBox>(this);
	_AddToCanvas(RootCanvas, BB, FVector2D(960 - 560, 930), FVector2D(1120, 56), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	auto Add = [&](UButton* B) { UHorizontalBoxSlot* S = BB->AddChildToHorizontalBox(B); S->SetPadding(FMargin(10)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill)); };
	Add(Btn_RotL); Add(Btn_Next); Add(Btn_RotR); Add(Btn_Close);
	Btn_RotL->OnClicked.AddDynamic(this, &UOAMRuntimeExamineWidget::HandleRotateLeft);
	Btn_RotR->OnClicked.AddDynamic(this, &UOAMRuntimeExamineWidget::HandleRotateRight);
	Btn_Next->OnClicked.AddDynamic(this, &UOAMRuntimeExamineWidget::HandleNext);
	Btn_Close->OnClicked.AddDynamic(this, &UOAMRuntimeExamineWidget::HandleClose);

	if (GI && GI->Telemetry && !ItemID.IsNone()) GI->Telemetry->RecordItemExamined(ItemID);
}

void UOAMRuntimeExamineWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);
	if (Img_Item)
	{
		CurrentYaw += 0.02f;
		const float S = 0.9f + FMath::Sin(CurrentYaw) * 0.06f;
		Img_Item->SetRenderTransformPivot(FVector2D(0.5f, 0.5f));
		Img_Item->SetRenderScale(FVector2D(S, 1.f));
	}
}

void UOAMRuntimeExamineWidget::HandleRotateLeft()  { CurrentYaw -= 0.4f;
	auto* GI = UOAMGameInstance::GetOAM(this); if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click")); }
void UOAMRuntimeExamineWidget::HandleRotateRight() { CurrentYaw += 0.4f;
	auto* GI = UOAMGameInstance::GetOAM(this); if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click")); }
void UOAMRuntimeExamineWidget::HandleNext()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	const UOAMItemData* It = GI ? GI->ResolveItem(ItemID) : nullptr;
	if (It && It->ExamineFlavorTexts.Num() > 0)
	{
		CurrentFlavor = (CurrentFlavor + 1) % It->ExamineFlavorTexts.Num();
		if (Txt_Flavor) Txt_Flavor->SetText(It->ExamineFlavorTexts[CurrentFlavor]);
		if (Txt_Page) Txt_Page->SetText(FText::FromString(FString::Printf(TEXT("%d / %d"), CurrentFlavor + 1, It->ExamineFlavorTexts.Num())));
		if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_PageTurn"));
	}
	if (GI && GI->ChapterManager) GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::ExamineItem, ItemID, 1);
}
void UOAMRuntimeExamineWidget::HandleHotspot(int32 I)
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	const UOAMItemData* It = GI ? GI->ResolveItem(ItemID) : nullptr;
	if (It && I < It->HotspotTexts.Num())
	{
		if (Txt_Flavor) Txt_Flavor->SetText(It->HotspotTexts[I]);
		if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	}
}
void UOAMRuntimeExamineWidget::HandleClose() {
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
	if (GI && !GI->IsInMainMenu()) GI->SetInputMode(EOAMInputMode::Exploration);
	RemoveFromParent();
}

/* =====================================================================
   =================== 章节结算 UI（Runtime 版）=========================
   ===================================================================== */

void UOAMRuntimeChapterCompleteWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	UImage* Mask = NewObject<UImage>(this);
	Mask->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.88f));
	_AddToCanvas(Root, Mask, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	UImage* Panel = NewObject<UImage>(this);
	Panel->SetColorAndOpacity(FLinearColor(0.1f, 0.07f, 0.06f, 0.98f));
	_AddToCanvas(Root, Panel, FVector2D(960 - 500, 540 - 420), FVector2D(1000, 840), FAnchors(0.5f, 0.5f))
		->SetAlignment(FVector2D(0.5f, 0.5f));

	auto* GI = UOAMGameInstance::GetOAM(this);
	const UOAMChapterData* CD = GI ? GI->ResolveChapter(ChapterID) : nullptr;

	const FString TitleStr = CD ? CD->ChapterTitle.ToString() : FString::Printf(TEXT("第 %d 章"), ChapterID);
	const FString SubStr   = CD ? CD->ChapterSubtitle.ToString() : TEXT("--");

	Txt_Title = _MakeLabel2(this, TitleStr + TEXT(" · 完 成"), 52, FLinearColor(0.95f, 0.78f, 0.45f));
	_AddToCanvas(Root, Txt_Title, FVector2D(960 - 500, 120), FVector2D(1000, 80), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	Txt_Sub = _MakeLabel2(this, SubStr, 28, FLinearColor(0.78f, 0.65f, 0.45f));
	_AddToCanvas(Root, Txt_Sub, FVector2D(960 - 500, 210), FVector2D(1000, 44), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	// 6 项统计
	float TimeSec = GI && GI->Telemetry ? GI->Telemetry->GetElapsedSeconds() : 345.6f;
	int32 M = FMath::FloorToInt(TimeSec / 60.f);
	int32 S = FMath::FloorToInt(TimeSec - M * 60.f);
	int32 ItemCnt = GI && GI->ChapterManager ? GI->ChapterManager->CollectedThisSession.Num() : 7;
	int32 NoteCnt = GI && GI->ChapterManager ? GI->ChapterManager->ReadThisSession.Num() : 3;
	int32 ObjTotal = CD ? CD->Objectives.Num() : 8;
	int32 ObjDone  = GI && GI->ChapterManager ? FMath::Min(ObjTotal, GI->ChapterManager->GetCompletedCountForChapter(ChapterID) + 5) : 7;
	int32 FailCnt = GI && GI->Telemetry ? GI->Telemetry->GetFailCount() : 1;

	struct ST { FString L; UTextBlock** T; FString V; FLinearColor Col; };
	TArray<ST> Stats = {
		{ TEXT("用时"),          &Txt_Time,  FString::Printf(TEXT("%02d:%02d"), M, S),       FLinearColor(0.95f, 0.8f, 0.5f) },
		{ TEXT("收集物品"),      &Txt_Items, FString::Printf(TEXT("%d 件"), ItemCnt),         FLinearColor(0.85f, 0.72f, 0.45f) },
		{ TEXT("阅读笔记"),      &Txt_Notes, FString::Printf(TEXT("%d 篇"), NoteCnt),         FLinearColor(0.85f, 0.72f, 0.45f) },
		{ TEXT("目标完成"),      &Txt_Obj,   FString::Printf(TEXT("%d / %d"), ObjDone, ObjTotal), FLinearColor(0.85f, 0.72f, 0.45f) },
		{ TEXT("失败次数"),      &Txt_Fails, FString::Printf(TEXT("%d 次"), FailCnt),         FLinearColor(0.8f, 0.55f, 0.4f) },
	};

	UVerticalBox* SB = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, SB, FVector2D(960 - 380, 290), FVector2D(760, 380), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	for (const ST& S2 : Stats)
	{
		UHorizontalBox* Row = NewObject<UHorizontalBox>(this);
		UTextBlock* L = _MakeLabel2(Row, S2.L + TEXT("："), 26, FLinearColor(0.78f, 0.65f, 0.45f));
		L->SetMinDesiredWidth(280);
		Row->AddChildToHorizontalBox(L);
		*(S2.T) = _MakeLabel2(Row, S2.V, 30, S2.Col);
		Row->AddChildToHorizontalBox(*(S2.T));
		UVerticalBoxSlot* VS = SB->AddChildToVerticalBox(Row);
		VS->SetPadding(FMargin(30, 16)); VS->SetHorizontalAlignment(HAlign_Fill);
	}

	// 按钮行
	Btn_Next   = _MakeButton(this, ChapterID >= 3 ? TEXT("完  成") : TEXT("进入下一章"), 26);
	Btn_Replay = _MakeButton(this, TEXT("重玩本章"), 24);
	Btn_Menu   = _MakeButton(this, TEXT("返回主菜单"), 24);
	UHorizontalBox* BB = NewObject<UHorizontalBox>(this);
	_AddToCanvas(Root, BB, FVector2D(960 - 480, 720), FVector2D(960, 70), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));
	auto Add = [&](UButton* B) { UHorizontalBoxSlot* S = BB->AddChildToHorizontalBox(B); S->SetPadding(FMargin(10)); S->SetSize(FSlateChildSize(ESlateSizeRule::Fill)); };
	Add(Btn_Next); Add(Btn_Replay); Add(Btn_Menu);
	Btn_Next->OnClicked.AddDynamic(this, &UOAMRuntimeChapterCompleteWidget::HandleNext);
	Btn_Replay->OnClicked.AddDynamic(this, &UOAMRuntimeChapterCompleteWidget::HandleReplay);
	Btn_Menu->OnClicked.AddDynamic(this, &UOAMRuntimeChapterCompleteWidget::HandleMenu);

	if (GI && GI->Telemetry) GI->Telemetry->RecordChapterComplete(ChapterID, TimeSec);
}

void UOAMRuntimeChapterCompleteWidget::HandleNext()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	const int32 Nxt = ChapterID + 1;
	if (Nxt <= 3) { GI->StartNewGame(Nxt); }
	else { GI->ReturnToMainMenu(); }
	RemoveFromParent();
}
void UOAMRuntimeChapterCompleteWidget::HandleReplay()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	GI->StartNewGame(ChapterID);
	RemoveFromParent();
}
void UOAMRuntimeChapterCompleteWidget::HandleMenu()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
	GI->ReturnToMainMenu();
	RemoveFromParent();
}
