// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.
// 程序化构建主菜单 / HUD / 暂停菜单 UI（不需要 Widget Blueprint）

#include "Bootstrap/OAMUIFactory.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/VerticalBox.h"
#include "Components/HorizontalBox.h"
#include "Components/Image.h"
#include "Components/ProgressBar.h"
#include "Components/PanelWidget.h"
#include "Components/SlateWrapperTypes.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "UI/OAMSettingsWidget.h"
#include "UI/OAMLevelSelectWidget.h"
#include "UI/OAMSaveLoadWidget.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetSystemLibrary.h"
#include "Blueprint/WidgetLayoutLibrary.h"
#include "Framework/Application/SlateApplication.h"
#include "Widgets/Text/STextBlock.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Images/SImage.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SConstraintCanvas.h"
#include "Widgets/Layout/SVerticalBox.h"
#include "Widgets/Layout/SBorder.h"
#include "Styling/SlateTypes.h"
#include "Styling/SlateStyle.h"
#include "Styling/CoreStyle.h"
#include "Styling/AppStyle.h"

/* =====================================================================
   ================ 辅助：创建 Canvas 内 Anchor 对齐的 Slot ===========
   ===================================================================== */

static UCanvasPanelSlot* _AddToCanvas(UCanvasPanel* Canvas, UWidget* W,
	FVector2D Off, FVector2D Size, FAnchors Anch, FMargin Padd = FMargin(0))
{
	UCanvasPanelSlot* S = Canvas->AddChildToCanvas(W);
	S->SetAnchors(Anch);
	S->SetOffsets(FMargin(Off.X, Off.Y, Off.X + Size.X, Off.Y + Size.Y));
	S->SetAutoSize(false);
	return S;
}

static FButtonStyle _BtnStyle(FLinearColor Normal = FLinearColor(0.08f, 0.06f, 0.05f, 0.9f),
	FLinearColor Hover = FLinearColor(0.18f, 0.12f, 0.08f, 1.f),
	FLinearColor Pressed = FLinearColor(0.04f, 0.03f, 0.02f, 1.f))
{
	FButtonStyle S = FAppStyle::Get().GetWidgetStyle<FButtonStyle>("Button");
	S.Normal = FSlateColorBrush(Normal);
	S.Hovered = FSlateColorBrush(Hover);
	S.Pressed = FSlateColorBrush(Pressed);
	S.Disabled = FSlateColorBrush(FLinearColor(0.3f, 0.3f, 0.3f, 0.5f));
	S.NormalPadding = FMargin(12, 6);
	return S;
}

static FTextBlockStyle _TxtStyle(int32 Size = 28, FLinearColor Col = FLinearColor(0.93f, 0.82f, 0.6f),
	FString FontName = TEXT("Noto Sans SC"))
{
	FTextBlockStyle S = FCoreStyle::Get().GetWidgetStyle<FTextBlockStyle>("NormalText");
	S.SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Bold.ttf"), Size));
	S.SetColorAndOpacity(FSlateColor(Col));
	S.SetShadowOffset(FVector2D(1, 1));
	S.SetShadowColorAndOpacity(FLinearColor(0, 0, 0, 0.6f));
	return S;
}

static UButton* _MakeButton(UObject* Outer, FString Label, int32 Font = 26)
{
	UButton* B = NewObject<UButton>(Outer);
	B->SetStyle(_BtnStyle());

	UTextBlock* T = NewObject<UTextBlock>(B);
	T->SetText(FText::FromString(Label));
	T->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f, 0.85f, 0.68f)));
	T->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Bold.ttf"), Font));
	B->AddChild(T);
	return B;
}

/* =====================================================================
   =================== 主菜单 Widget ===================================
   ===================================================================== */

void UOAMMainMenuWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));

	// 根 Canvas
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;
	if (UPanelWidget* P = Cast<UPanelWidget>(GetRootWidget())) P->ClearChildren();

	// 1) 背景深色渐变
	Img_BG = NewObject<UImage>(this);
	Img_BG->SetColorAndOpacity(FLinearColor(0.06f, 0.04f, 0.035f, 1.f));
	_AddToCanvas(Root, Img_BG, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	// 2) 胶片颗粒效果 (用纯色+暗角模拟)
	UImage* Grain = NewObject<UImage>(this);
	Grain->SetColorAndOpacity(FLinearColor(0.02f, 0.01f, 0.005f, 0.15f));
	_AddToCanvas(Root, Grain, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	// 3) 暗角
	Img_Vignette = NewObject<UImage>(this);
	Img_Vignette->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.7f));
	_AddToCanvas(Root, Img_Vignette, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	// 4) 标题
	Txt_Title = NewObject<UTextBlock>(this);
	Txt_Title->SetText(FText::FromString(TEXT("旧 公 寓")));
	Txt_Title->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Bold.ttf"), 120));
	Txt_Title->SetColorAndOpacity(FSlateColor(FLinearColor(0.9f, 0.7f, 0.45f, 0.95f)));
	Txt_Title->SetShadowOffset(FVector2D(2, 2));
	Txt_Title->SetShadowColorAndOpacity(FLinearColor(0, 0, 0, 0.9f));
	_AddToCanvas(Root, Txt_Title, FVector2D(960 - 400, 200), FVector2D(800, 160), FAnchors(0.5f, 0))
		->SetAlignment(FVector2D(0.5f, 0));

	Txt_Subtitle = NewObject<UTextBlock>(this);
	Txt_Subtitle->SetText(FText::FromString(TEXT("— 遗物整理录 · 三天的整理，二十年的真相 —")));
	Txt_Subtitle->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Regular.ttf"), 28));
	Txt_Subtitle->SetColorAndOpacity(FSlateColor(FLinearColor(0.78f, 0.62f, 0.42f, 0.9f)));
	_AddToCanvas(Root, Txt_Subtitle, FVector2D(960 - 500, 360), FVector2D(1000, 50), FAnchors(0.5f, 0))
		->SetAlignment(FVector2D(0.5f, 0));

	// 5) 按钮 Vertical Box（居中）
	UVerticalBox* VB = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, VB, FVector2D(960 - 240, 500), FVector2D(480, 520), FAnchors(0.5f, 0))
		->SetAlignment(FVector2D(0.5f, 0));

	Btn_Start    = _MakeButton(this, TEXT("开 始 游 戏"), 30);
	Btn_Levels   = _MakeButton(this, TEXT("关 卡 选 择"), 26);
	Btn_Continue = _MakeButton(this, TEXT("继 续 上 次"), 26);
	Btn_Settings = _MakeButton(this, TEXT("设        置"), 26);
	Btn_Export   = _MakeButton(this, TEXT("导出试玩数据"), 26);
	Btn_Quit     = _MakeButton(this, TEXT("退        出"), 26);

	auto AddVB = [&](UButton* B, int32 H = 80)
	{
		UVerticalBoxSlot* S = VB->AddChildToVerticalBox(B);
		S->SetSize(FSlateChildSize(ESlateSizeRule::Automatic));
		S->SetHorizontalAlignment(HAlign_Fill);
		S->SetVerticalAlignment(VAlign_Center);
		S->SetPadding(FMargin(0, 8));
	};
	AddVB(Btn_Start);
	AddVB(Btn_Levels);
	AddVB(Btn_Continue);
	AddVB(Btn_Settings);
	AddVB(Btn_Export);
	AddVB(Btn_Quit);

	Btn_Start->OnClicked.AddDynamic(this, &UOAMMainMenuWidget::HandleStart);
	Btn_Levels->OnClicked.AddDynamic(this, &UOAMMainMenuWidget::HandleLevels);
	Btn_Continue->OnClicked.AddDynamic(this, &UOAMMainMenuWidget::HandleContinue);
	Btn_Settings->OnClicked.AddDynamic(this, &UOAMMainMenuWidget::HandleSettings);
	Btn_Export->OnClicked.AddDynamic(this, &UOAMMainMenuWidget::HandleExport);
	Btn_Quit->OnClicked.AddDynamic(this, &UOAMMainMenuWidget::HandleQuit);

	// 6) 右下版本号
	UTextBlock* V = NewObject<UTextBlock>(this);
	V->SetText(FText::FromString(TEXT("v 1.0.0   Unreal Engine 5.3   C++ 程序化构建")));
	V->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Regular.ttf"), 18));
	V->SetColorAndOpacity(FSlateColor(FLinearColor(0.55f, 0.45f, 0.32f, 0.8f)));
	_AddToCanvas(Root, V, FVector2D(-340, -30), FVector2D(330, 24), FAnchors(1, 1))
		->SetAlignment(FVector2D(1, 1));

	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_OpenMenu"));
}

void UOAMMainMenuWidget::NativeDestruct()
{
	if (Btn_Start) Btn_Start->OnClicked.RemoveAll(this);
	if (Btn_Levels) Btn_Levels->OnClicked.RemoveAll(this);
	if (Btn_Continue) Btn_Continue->OnClicked.RemoveAll(this);
	if (Btn_Settings) Btn_Settings->OnClicked.RemoveAll(this);
	if (Btn_Export) Btn_Export->OnClicked.RemoveAll(this);
	if (Btn_Quit) Btn_Quit->OnClicked.RemoveAll(this);
	Super::NativeDestruct();
}

void UOAMMainMenuWidget::HandleStart()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	GI->StartNewGame(1);
	RemoveFromParent();
}

void UOAMMainMenuWidget::HandleLevels()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	UOAMLevelSelectWidget* W = CreateWidget<UOAMLevelSelectWidget>(this,
		LoadClass<UOAMLevelSelectWidget>(nullptr, TEXT("/Script/OldApartmentMystery.OAMLevelSelectWidget")));
	if (W) W->AddToViewport();
}

void UOAMMainMenuWidget::HandleSettings()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	UOAMSettingsWidget* W = CreateWidget<UOAMSettingsWidget>(this,
		LoadClass<UOAMSettingsWidget>(nullptr, TEXT("/Script/OldApartmentMystery.OAMSettingsWidget")));
	if (W) W->AddToViewport();
}

void UOAMMainMenuWidget::HandleContinue()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->SaveManager) return;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Load"));
	const FOAMSaveSlot* S = GI->SaveManager->GetSlot(UOAMSaveManager::AUTO_SLOT);
	if (!S)
	{
		UE_LOG(LogTemp, Warning, TEXT("[OAM][MainMenu] 无存档，直接开始新游戏"));
		HandleStart();
		return;
	}
	int32 Ch = S->ChapterID > 0 ? S->ChapterID : 1;
	GI->StartNewGame(Ch);
	if (S->SlotIndex >= 0) GI->SaveManager->LoadGame(S->SlotIndex);
	RemoveFromParent();
}

void UOAMMainMenuWidget::HandleExport()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->Telemetry) return;
	GI->Telemetry->BeginSession();
	GI->Telemetry->RecordItemCollected(TEXT("item_mementobox"), FVector(0, 0, 0));
	GI->Telemetry->RecordChapterComplete(3, 1234.5f);
	const bool bOk = GI->Telemetry->DownloadJSONToSavedDir();
	if (GI->AudioManager) GI->AudioManager->PlaySFX(bOk ? TEXT("UI_Save") : TEXT("UI_Click"));
	UE_LOG(LogTemp, Log, TEXT("[OAM][MainMenu] 导出：%d"), (int)bOk);
}

void UOAMMainMenuWidget::HandleQuit()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	UKismetSystemLibrary::QuitGame(this, nullptr, EQuitPreference::Quit, true);
}

/* =====================================================================
   =================== 运行时 HUD Widget ==================================
   ===================================================================== */

void UOAMRuntimeHUDWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = WidgetTree ? Cast<UCanvasPanel>(WidgetTree->RootWidget) : nullptr;
	if (!Root)
	{
		Root = NewObject<UCanvasPanel>(this);
		WidgetTree->RootWidget = Root;
	}

	// 程序化补充：十字准星（若没绑定）
	if (!Img_Crosshair)
	{
		Img_Crosshair = NewObject<UImage>(this);
		Img_Crosshair->SetColorAndOpacity(FLinearColor(0.9f, 0.75f, 0.5f, 0.6f));
		_AddToCanvas(Root, Img_Crosshair, FVector2D(960 - 6, 540 - 6), FVector2D(12, 12), FAnchors(0.5f, 0.5f))
			->SetAlignment(FVector2D(0.5f, 0.5f));
	}

	if (!Txt_InteractPrompt)
	{
		Txt_InteractPrompt = NewObject<UTextBlock>(this);
		Txt_InteractPrompt->SetText(FText::GetEmpty());
		Txt_InteractPrompt->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Bold.ttf"), 28));
		Txt_InteractPrompt->SetColorAndOpacity(FSlateColor(FLinearColor(1.f, 0.85f, 0.55f)));
		Txt_InteractPrompt->SetShadowOffset(FVector2D(1, 1));
		_AddToCanvas(Root, Txt_InteractPrompt, FVector2D(960 - 300, 590), FVector2D(600, 40), FAnchors(0.5f, 0.5f))
			->SetAlignment(FVector2D(0.5f, 0));
	}

	if (!Txt_ObjectiveText)
	{
		Txt_ObjectiveText = NewObject<UTextBlock>(this);
		Txt_ObjectiveText->SetText(FText::FromString(TEXT("目标：查看雇佣信")));
		Txt_ObjectiveText->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Regular.ttf"), 22));
		Txt_ObjectiveText->SetColorAndOpacity(FSlateColor(FLinearColor(0.85f, 0.72f, 0.5f)));
		_AddToCanvas(Root, Txt_ObjectiveText, FVector2D(20, 20), FVector2D(700, 40), FAnchors(0, 0));
	}

	if (!Progress_Objective)
	{
		Progress_Objective = NewObject<UProgressBar>(this);
		Progress_Objective->SetPercent(0.f);
		Progress_Objective->SetFillColorAndOpacity(FLinearColor(0.8f, 0.55f, 0.25f));
		Progress_Objective->SetBackgroundColor(FLinearColor(0.1f, 0.08f, 0.06f));
		_AddToCanvas(Root, Progress_Objective, FVector2D(20, 62), FVector2D(400, 10), FAnchors(0, 0));
	}

	if (!Txt_CurrentRoom)
	{
		Txt_CurrentRoom = NewObject<UTextBlock>(this);
		Txt_CurrentRoom->SetText(FText::FromString(TEXT("客厅 · 第一天")));
		Txt_CurrentRoom->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Medium.ttf"), 22));
		Txt_CurrentRoom->SetColorAndOpacity(FSlateColor(FLinearColor(0.75f, 0.6f, 0.4f)));
		_AddToCanvas(Root, Txt_CurrentRoom, FVector2D(960 - 200, 40), FVector2D(400, 30), FAnchors(0.5f, 0))
			->SetAlignment(FVector2D(0.5f, 0));
	}

	if (!Panel_ToastContainer)
	{
		Panel_ToastContainer = NewObject<UCanvasPanel>(this);
		_AddToCanvas(Root, Panel_ToastContainer, FVector2D(960 - 300, 880), FVector2D(600, 180), FAnchors(0.5f, 1))
			->SetAlignment(FVector2D(0.5f, 1));
	}

	if (!Img_DamageFlash)
	{
		Img_DamageFlash = NewObject<UImage>(this);
		Img_DamageFlash->SetColorAndOpacity(FLinearColor(1.f, 0.2f, 0.15f, 0.f));
		_AddToCanvas(Root, Img_DamageFlash, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));
	}

	if (!Txt_ChapterTitle)
	{
		Txt_ChapterTitle = NewObject<UTextBlock>(this);
		Txt_ChapterTitle->SetText(FText::FromString(TEXT("第一章 · 第一天\n整理客厅 · 1991 年的春天")));
		Txt_ChapterTitle->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Bold.ttf"), 48));
		Txt_ChapterTitle->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f, 0.75f, 0.45f, 0.95f)));
		Txt_ChapterTitle->SetShadowOffset(FVector2D(2, 2));
		_AddToCanvas(Root, Txt_ChapterTitle, FVector2D(960 - 600, 400), FVector2D(1200, 160), FAnchors(0.5f, 0.5f))
			->SetAlignment(FVector2D(0.5f, 0.5f));
		FTimerHandle H;
		GetWorld()->GetTimerManager().SetTimer(H, FTimerDelegate::CreateWeakLambda(this, [this]()
		{
			if (Txt_ChapterTitle) Txt_ChapterTitle->SetVisibility(ESlateVisibility::Collapsed);
		}), 3.5f, false);
	}

	if (!Txt_Clock)
	{
		Txt_Clock = NewObject<UTextBlock>(this);
		Txt_Clock->SetText(FText::FromString(TEXT("第 1 天 09:20")));
		Txt_Clock->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Medium.ttf"), 22));
		Txt_Clock->SetColorAndOpacity(FSlateColor(FLinearColor(0.7f, 0.55f, 0.4f)));
		_AddToCanvas(Root, Txt_Clock, FVector2D(-260, 20), FVector2D(250, 28), FAnchors(1, 0))
			->SetAlignment(FVector2D(1, 0));
	}
}

/* =====================================================================
   =================== 暂停菜单 Widget ==================================
   ===================================================================== */

void UOAMPauseMenuWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetSize(FVector2D(1920, 1080));
	UCanvasPanel* Root = NewObject<UCanvasPanel>(this);
	WidgetTree->RootWidget = Root;

	// 半透明遮罩
	UImage* Dark = NewObject<UImage>(this);
	Dark->SetColorAndOpacity(FLinearColor(0, 0, 0, 0.65f));
	_AddToCanvas(Root, Dark, FVector2D(0, 0), FVector2D(1920, 1080), FAnchors(0, 0, 1, 1));

	UTextBlock* T = NewObject<UTextBlock>(this);
	T->SetText(FText::FromString(TEXT("暂 停")));
	T->SetFont(FSlateFontInfo(FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Bold.ttf"), 72));
	T->SetColorAndOpacity(FSlateColor(FLinearColor(0.9f, 0.72f, 0.45f, 0.95f)));
	_AddToCanvas(Root, T, FVector2D(960 - 150, 200), FVector2D(300, 100), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	UVerticalBox* VB = NewObject<UVerticalBox>(this);
	_AddToCanvas(Root, VB, FVector2D(960 - 240, 400), FVector2D(480, 520), FAnchors(0.5f, 0))->SetAlignment(FVector2D(0.5f, 0));

	Btn_Resume = _MakeButton(this, TEXT("继 续 游 戏"), 28);
	Btn_Settings = _MakeButton(this, TEXT("设        置"), 26);
	Btn_Save = _MakeButton(this, TEXT("手 动 存 档"), 26);
	Btn_Load = _MakeButton(this, TEXT("读 取 存 档"), 26);
	Btn_Menu = _MakeButton(this, TEXT("返回主菜单"), 26);
	auto AddVB = [&](UButton* B) {
		UVerticalBoxSlot* S = VB->AddChildToVerticalBox(B);
		S->SetHorizontalAlignment(HAlign_Fill);
		S->SetPadding(FMargin(0, 8));
	};
	AddVB(Btn_Resume); AddVB(Btn_Settings); AddVB(Btn_Save); AddVB(Btn_Load); AddVB(Btn_Menu);

	Btn_Resume->OnClicked.AddDynamic(this, &UOAMPauseMenuWidget::HandleResume);
	Btn_Settings->OnClicked.AddDynamic(this, &UOAMPauseMenuWidget::HandleSettings);
	Btn_Save->OnClicked.AddDynamic(this, &UOAMPauseMenuWidget::HandleSave);
	Btn_Load->OnClicked.AddDynamic(this, &UOAMPauseMenuWidget::HandleLoad);
	Btn_Menu->OnClicked.AddDynamic(this, &UOAMPauseMenuWidget::HandleBackToMenu);
}

void UOAMPauseMenuWidget::HandleResume()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) { GI->SetInputMode(EOAMInputMode::Exploration); GI->AudioManager->PlaySFX(TEXT("UI_Click")); }
	RemoveFromParent();
}

void UOAMPauseMenuWidget::HandleSettings()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	UOAMSettingsWidget* W = CreateWidget<UOAMSettingsWidget>(this, LoadClass<UOAMSettingsWidget>(nullptr, TEXT("/Script/OldApartmentMystery.OAMSettingsWidget")));
	if (W) W->AddToViewport();
}

void UOAMPauseMenuWidget::HandleSave()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->SaveManager) return;
	GI->SaveManager->AutoSave();
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Save"));
	UOAMSaveLoadWidget* W = CreateWidget<UOAMSaveLoadWidget>(this, LoadClass<UOAMSaveLoadWidget>(nullptr, TEXT("/Script/OldApartmentMystery.OAMSaveLoadWidget")));
	if (W) { W->bIsLoadMode = false; W->AddToViewport(); }
}

void UOAMPauseMenuWidget::HandleLoad()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
	UOAMSaveLoadWidget* W = CreateWidget<UOAMSaveLoadWidget>(this, LoadClass<UOAMSaveLoadWidget>(nullptr, TEXT("/Script/OldApartmentMystery.OAMSaveLoadWidget")));
	if (W) { W->bIsLoadMode = true; W->AddToViewport(); }
}

void UOAMPauseMenuWidget::HandleBackToMenu()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) { if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu")); GI->ReturnToMainMenu(); }
	RemoveFromParent();
}
