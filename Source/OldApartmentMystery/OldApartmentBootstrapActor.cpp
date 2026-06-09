#include "OldApartmentBootstrapActor.h"
#include "Blueprint/UserWidget.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetSystemLibrary.h"
#include "Blueprint/WidgetLayoutLibrary.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Components/VerticalBox.h"
#include "Components/VerticalBoxSlot.h"
#include "Components/HorizontalBox.h"
#include "Components/HorizontalBoxSlot.h"
#include "Components/SizeBox.h"
#include "Components/Border.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/Image.h"
#include "Components/StaticMeshComponent.h"
#include "Components/BoxComponent.h"
#include "InputMappingContext.h"
#include "EnhancedInputSubsystems.h"
#include "EnhancedInputComponent.h"
#include "OldApartmentPlayerController.h"
#include "HAL/IConsoleManager.h"
#include "Engine/PlayerStart.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/BoxTrigger.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"

AOldApartmentBootstrapActor::AOldApartmentBootstrapActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.bStartWithTickEnabled = true;

	LevelType = EBootstrapLevelType::AutoDetect;
	bAutoSetupInput = true;
	bAutoCreateUI = true;
	bTutorialShown = false;
	bChapterEnded = false;
	bPuzzleSolved = false;
	bPauseActive = false;
	CluesCollected = 0;
	TotalClues = 3;
	ChapterStartTime = 0.0f;
	ActivePauseWidget = nullptr;
	ActivePuzzleWidget = nullptr;
	ActiveChapterResultWidget = nullptr;
	DialCode[0] = 0; DialCode[1] = 0; DialCode[2] = 0; DialCode[3] = 0;
}

void AOldApartmentBootstrapActor::BeginPlay()
{
	Super::BeginPlay();

	FString LevelName = GetWorld()->GetMapName();
	LevelName.RemoveFromStart(GetWorld()->StreamingLevelsPrefix);

	if (LevelType == EBootstrapLevelType::AutoDetect)
	{
		// Check CVar first (from main menu -> chapter flow, etc.)
		IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("OldApartment.StartMode"));
		int32 CVarMode = CVar ? CVar->GetInt() : -1;
		if (CVarMode == 0)
		{
			LevelType = EBootstrapLevelType::MainMenu;
		}
		else if (CVarMode == 1)
		{
			LevelType = EBootstrapLevelType::ChapterLevel;
		}
		else if (LevelName.Contains(TEXT("MainMenu"), ESearchCase::IgnoreCase) ||
				 LevelName.Contains(TEXT("Menu"), ESearchCase::IgnoreCase))
		{
			LevelType = EBootstrapLevelType::MainMenu;
		}
		else if (LevelName.Contains(TEXT("Chapter"), ESearchCase::IgnoreCase) ||
				 LevelName.Contains(TEXT("Apt"), ESearchCase::IgnoreCase) ||
				 LevelName.Contains(TEXT("Level"), ESearchCase::IgnoreCase) ||
				 LevelName.Contains(TEXT("Default"), ESearchCase::IgnoreCase) ||
				 LevelName.Contains(TEXT("Template"), ESearchCase::IgnoreCase))
		{
			static bool bFirstLaunch = true;
			if (bFirstLaunch)
			{
				LevelType = EBootstrapLevelType::MainMenu;
				bFirstLaunch = false;
			}
			else
			{
				LevelType = EBootstrapLevelType::ChapterLevel;
			}
		}
		else
		{
			LevelType = EBootstrapLevelType::MainMenu;
		}
	}

	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Level: %s, Type: %d"), *LevelName, (int32)LevelType);

	if (bAutoSetupInput)
	{
		EnhancedInputAutoSetup();
	}

	if (bAutoCreateUI)
	{
		if (LevelType == EBootstrapLevelType::MainMenu)
		{
			SetupForMainMenu();
		}
		else
		{
			SetupForGameplayLevel();
		}
	}
}

void AOldApartmentBootstrapActor::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	if (LevelType == EBootstrapLevelType::ChapterLevel && !bTutorialShown)
	{
		bTutorialShown = true;
		FTimerHandle Handle;
		GetWorldTimerManager().SetTimer(Handle, this, &AOldApartmentBootstrapActor::CreateFallbackTutorial, 2.5f, false);
	}
}

void AOldApartmentBootstrapActor::SetupForMainMenu()
{
	if (APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0))
	{
		PC->SetShowMouseCursor(true);
		FInputModeUIOnly InputMode;
		InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
		PC->SetInputMode(InputMode);
		PC->bEnableClickEvents = true;
	}
	CreateFallbackMainMenu();
}

void AOldApartmentBootstrapActor::SetupForGameplayLevel()
{
	if (AOldApartmentPlayerController* PC = Cast<AOldApartmentPlayerController>(UGameplayStatics::GetPlayerController(this, 0)))
	{
		PC->SetInteractionMode(EPlayerInteractionMode::Explore);
	}
	else if (APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0))
	{
		PC->SetShowMouseCursor(false);
		FInputModeGameOnly InputMode;
		PC->SetInputMode(InputMode);
	}

	CreateFallbackHUD();
}

void AOldApartmentBootstrapActor::CreateFallbackMainMenu()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Creating Fallback MainMenu..."));
	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;

	UUserWidget* MenuWidget = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	if (!MenuWidget) return;

	UCanvasPanel* RootCanvas = NewObject<UCanvasPanel>(MenuWidget);
	MenuWidget->SetRootWidget(RootCanvas);
	MenuWidget->SetDesiredSizeInViewport(FVector2D(1920, 1080));

	UBorder* BgBorder = NewObject<UBorder>(RootCanvas);
	BgBorder->SetBrushColor(FLinearColor(0.02f, 0.02f, 0.035f, 1.0f));
	UCanvasPanelSlot* BgSlot = RootCanvas->AddChildToCanvas(BgBorder);
	BgSlot->SetAnchors(FAnchors(0, 0, 1, 1));
	BgSlot->SetOffsets(FMargin(0, 0, 0, 0));

	UTextBlock* TitleText = NewObject<UTextBlock>(RootCanvas);
	TitleText->SetText(FText::FromString(TEXT("旧公寓谜案")));
	TitleText->SetColorAndOpacity(FSlateColor(FLinearColor(0.85f, 0.75f, 0.55f, 1.0f)));
	FSlateFontInfo TitleFont;
	TitleFont.Size = 72;
	TitleFont.TypefaceFontName = FName(TEXT("Bold"));
	TitleText->SetFont(TitleFont);
	UCanvasPanelSlot* TitleSlot = RootCanvas->AddChildToCanvas(TitleText);
	TitleSlot->SetAnchors(FAnchors(0.5f, 0.15f, 0.5f, 0.15f));
	TitleSlot->SetAlignment(FVector2D(0.5f, 0.5f));
	TitleSlot->SetPosition(FVector2D(0, 0));

	UTextBlock* SubTitle = NewObject<UTextBlock>(RootCanvas);
	SubTitle->SetText(FText::FromString(TEXT("Old Apartment Mystery — BETA v0.1.0")));
	SubTitle->SetColorAndOpacity(FSlateColor(FLinearColor(0.6f, 0.55f, 0.5f, 1.0f)));
	FSlateFontInfo SubFont;
	SubFont.Size = 22;
	SubTitle->SetFont(SubFont);
	UCanvasPanelSlot* SubSlot = RootCanvas->AddChildToCanvas(SubTitle);
	SubSlot->SetAnchors(FAnchors(0.5f, 0.24f, 0.5f, 0.24f));
	SubSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	UVerticalBox* BtnBox = NewObject<UVerticalBox>(RootCanvas);
	struct FBtnData
	{
		const TCHAR* Label;
		FLinearColor Color;
		int32 Idx;
	};
	TArray<FBtnData> Buttons;
	Buttons.Add({TEXT("► 开始新游戏 / New Game"), FLinearColor(0.75f, 0.55f, 0.3f, 1.0f), 0});
	Buttons.Add({TEXT("⚙ 设置 / Settings"), FLinearColor(0.55f, 0.6f, 0.65f, 1.0f), 1});
	Buttons.Add({TEXT("❌ 退出 / Quit"), FLinearColor(0.75f, 0.35f, 0.3f, 1.0f), 2});

	int32 BtnIdx = 0;
	for (const FBtnData& BD : Buttons)
	{
		UButton* Btn = NewObject<UButton>(BtnBox);
		Btn->SetBackgroundColor(FLinearColor(0.08f, 0.09f, 0.12f, 1.0f));
		Btn->SetColorAndOpacity(FLinearColor(1, 1, 1, 1));
		Btn->SetWidthOverride(520);
		Btn->SetHeightOverride(72);
		Btn->SetIsEnabled(true);

		UTextBlock* BtnTxt = NewObject<UTextBlock>(Btn);
		BtnTxt->SetText(FText::FromString(BD.Label));
		BtnTxt->SetColorAndOpacity(FSlateColor(BD.Color));
		FSlateFontInfo BtnFont;
		BtnFont.Size = 28;
		BtnTxt->SetFont(BtnFont);
		BtnTxt->SetJustification(ETextJustify::Center);
		Btn->SetContent(BtnTxt);

		UVerticalBoxSlot* VSlot = BtnBox->AddChildToVerticalBox(Btn);
		VSlot->SetVerticalAlignment(VAlign_Center);
		VSlot->SetHorizontalAlignment(HAlign_Center);
		VSlot->SetPadding(FMargin(0, 12));

		if (BtnIdx == 0)
		{
			Btn->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnMainMenuStartGame);
		}
		else if (BtnIdx == 1)
		{
			Btn->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnMainMenuSettings);
		}
		else
		{
			Btn->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnMainMenuQuit);
		}
		BtnIdx++;
	}

	UCanvasPanelSlot* BtnBoxSlot = RootCanvas->AddChildToCanvas(BtnBox);
	BtnBoxSlot->SetAnchors(FAnchors(0.5f, 0.55f, 0.5f, 0.55f));
	BtnBoxSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	UTextBlock* HintText = NewObject<UTextBlock>(RootCanvas);
	HintText->SetText(FText::FromString(TEXT("提示: 推荐直接从第一章开始 (Content/Maps/Levels/Chapter01_Apt101.umap)\n进入游戏后：WASD 移动 / 鼠标视角 / E 交互 / F 检查 / Tab 笔记 / Esc 暂停")));
	HintText->SetColorAndOpacity(FSlateColor(FLinearColor(0.45f, 0.45f, 0.45f, 1.0f)));
	FSlateFontInfo HintFont;
	HintFont.Size = 16;
	HintText->SetFont(HintFont);
	HintText->SetJustification(ETextJustify::Center);
	UCanvasPanelSlot* HintSlot = RootCanvas->AddChildToCanvas(HintText);
	HintSlot->SetAnchors(FAnchors(0.5f, 0.9f, 0.5f, 0.9f));
	HintSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	MenuWidget->AddToViewport(50);
	CreatedWidgets.Add(MenuWidget);
}

void AOldApartmentBootstrapActor::OnMainMenuStartGame()
{
	IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("OldApartment.StartMode"));
	if (CVar) CVar->Set(1);  // Next load = Chapter Level
	UGameplayStatics::OpenLevel(this, FName(TEXT("/Engine/Maps/Templates/Template_Default")));
}

void AOldApartmentBootstrapActor::OnMainMenuSettings()
{
	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;

	UUserWidget* SettingsWidget = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	UCanvasPanel* RootCanvas = NewObject<UCanvasPanel>(SettingsWidget);
	SettingsWidget->SetRootWidget(RootCanvas);

	UBorder* Bg = NewObject<UBorder>(RootCanvas);
	Bg->SetBrushColor(FLinearColor(0.04f, 0.045f, 0.06f, 0.95f));
	UCanvasPanelSlot* BgSlot = RootCanvas->AddChildToCanvas(Bg);
	BgSlot->SetAnchors(FAnchors(0.2f, 0.15f, 0.8f, 0.85f));

	UTextBlock* Title = NewObject<UTextBlock>(RootCanvas);
	Title->SetText(FText::FromString(TEXT("⚙ 设置 / Settings")));
	FSlateFontInfo TFont;
	TFont.Size = 42;
	Title->SetFont(TFont);
	Title->SetColorAndOpacity(FSlateColor(FLinearColor(0.9f, 0.75f, 0.5f, 1.0f)));
	UCanvasPanelSlot* TSlot = RootCanvas->AddChildToCanvas(Title);
	TSlot->SetAnchors(FAnchors(0.5f, 0.2f, 0.5f, 0.2f));
	TSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	UVerticalBox* VBox = NewObject<UVerticalBox>(RootCanvas);
	TArray<FString> Lines = {
		TEXT("🔊 音频 / Audio: Master 80%  |  Music 70%  |  SFX 90%  |  Voice 100%"),
		TEXT("🖼 视频 / Video: 1920x1080 (FullHD)  |  Medium Preset  |  Windowed"),
		TEXT("🎮 控制 / Controls: 鼠标灵敏度 1.0x  |  Y轴反转 关  |  震动 开"),
		TEXT("🎯 玩法 / Gameplay: 字幕 开  |  教程 开  |  惊吓强度 克制(低)")
	};
	for (const FString& Line : Lines)
	{
		UTextBlock* Txt = NewObject<UTextBlock>(VBox);
		Txt->SetText(FText::FromString(Line));
		FSlateFontInfo F;
		F.Size = 20;
		Txt->SetFont(F);
		Txt->SetColorAndOpacity(FSlateColor(FLinearColor(0.8f, 0.8f, 0.85f, 1.0f)));
		UVerticalBoxSlot* S = VBox->AddChildToVerticalBox(Txt);
		S->SetPadding(FMargin(0, 10));
		S->SetHorizontalAlignment(HAlign_Center);
	}
	UCanvasPanelSlot* VSlot = RootCanvas->AddChildToCanvas(VBox);
	VSlot->SetAnchors(FAnchors(0.5f, 0.5f, 0.5f, 0.5f));
	VSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	UButton* BackBtn = NewObject<UButton>(RootCanvas);
	BackBtn->SetWidthOverride(260);
	BackBtn->SetHeightOverride(56);
	UTextBlock* BTxt = NewObject<UTextBlock>(BackBtn);
	BTxt->SetText(FText::FromString(TEXT("← 返回 / Back")));
	FSlateFontInfo BFont;
	BFont.Size = 22;
	BTxt->SetFont(BFont);
	BTxt->SetColorAndOpacity(FSlateColor(FLinearColor(0.6f, 0.8f, 1.0f, 1.0f)));
	BackBtn->SetContent(BTxt);
	UCanvasPanelSlot* BkSlot = RootCanvas->AddChildToCanvas(BackBtn);
	BkSlot->SetAnchors(FAnchors(0.5f, 0.78f, 0.5f, 0.78f));
	BkSlot->SetAlignment(FVector2D(0.5f, 0.5f));
	BackBtn->OnClicked.AddDynamic(SettingsWidget, &UUserWidget::RemoveFromParent);

	SettingsWidget->AddToViewport(80);
	CreatedWidgets.Add(SettingsWidget);
}

void AOldApartmentBootstrapActor::OnMainMenuQuit()
{
	UKismetSystemLibrary::QuitGame(this, UGameplayStatics::GetPlayerController(this, 0), EQuitPreference::Quit, true);
}

void AOldApartmentBootstrapActor::CreateFallbackHUD()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Creating Fallback HUD..."));
	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;

	UUserWidget* HUDWidget = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	if (!HUDWidget) return;

	UCanvasPanel* Root = NewObject<UCanvasPanel>(HUDWidget);
	HUDWidget->SetRootWidget(Root);

	// Crosshair
	UTextBlock* Cross = NewObject<UTextBlock>(Root);
	Cross->SetText(FText::FromString(TEXT("•")));
	FSlateFontInfo CFont;
	CFont.Size = 48;
	Cross->SetFont(CFont);
	Cross->SetColorAndOpacity(FSlateColor(FLinearColor(1.0f, 0.9f, 0.7f, 0.7f)));
	Cross->SetJustification(ETextJustify::Center);
	UCanvasPanelSlot* CSlot = Root->AddChildToCanvas(Cross);
	CSlot->SetAnchors(FAnchors(0.5f, 0.5f, 0.5f, 0.5f));
	CSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	// Objective (Top Left)
	UTextBlock* Obj = NewObject<UTextBlock>(Root);
	Obj->SetText(FText::FromString(TEXT("📋 目标：探索 101 公寓，找出 3 条线索并解开密码锁 [0817]")));
	FSlateFontInfo OFont;
	OFont.Size = 18;
	Obj->SetFont(OFont);
	Obj->SetColorAndOpacity(FSlateColor(FLinearColor(0.9f, 0.85f, 0.7f, 1.0f)));
	Obj->SetShadowOffset(FVector2D(1, 1));
	Obj->SetShadowColorAndOpacity(FLinearColor(0, 0, 0, 0.8f));
	UCanvasPanelSlot* OSlot = Root->AddChildToCanvas(Obj);
	OSlot->SetAnchors(FAnchors(0.02f, 0.04f, 0.98f, 0.04f));
	OSlot->SetAlignment(FVector2D(0, 0.5f));

	// Battery (Top Right)
	UTextBlock* Bat = NewObject<UTextBlock>(Root);
	Bat->SetText(FText::FromString(TEXT("🔋 手电: 100%  [T 开关]")));
	Bat->SetFont(OFont);
	Bat->SetColorAndOpacity(FSlateColor(FLinearColor(0.7f, 0.9f, 0.7f, 1.0f)));
	Bat->SetShadowOffset(FVector2D(1, 1));
	Bat->SetShadowColorAndOpacity(FLinearColor(0, 0, 0, 0.8f));
	UCanvasPanelSlot* BSlot = Root->AddChildToCanvas(Bat);
	BSlot->SetAnchors(FAnchors(0.98f, 0.04f, 0.98f, 0.04f));
	BSlot->SetAlignment(FVector2D(1, 0.5f));

	// Interact Hint (Bottom)
	UTextBlock* Hint = NewObject<UTextBlock>(Root);
	Hint->SetText(FText::FromString(TEXT("[E] 交互    [F] 检查    [Tab] 笔记本    [Esc] 暂停    [C] 蹲    [Shift] 冲刺")));
	Hint->SetFont(OFont);
	Hint->SetColorAndOpacity(FSlateColor(FLinearColor(0.8f, 0.8f, 0.85f, 0.85f)));
	Hint->SetShadowOffset(FVector2D(1, 1));
	Hint->SetShadowColorAndOpacity(FLinearColor(0, 0, 0, 0.8f));
	Hint->SetJustification(ETextJustify::Center);
	UCanvasPanelSlot* HSlot = Root->AddChildToCanvas(Hint);
	HSlot->SetAnchors(FAnchors(0.5f, 0.95f, 0.5f, 0.95f));
	HSlot->SetAlignment(FVector2D(0.5f, 0.5f));

	HUDWidget->AddToViewport(10);
	CreatedWidgets.Add(HUDWidget);
}

void AOldApartmentBootstrapActor::CreateFallbackTutorial()
{
	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Creating Fallback Tutorial overlay..."));

	UUserWidget* Tutorial = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	UCanvasPanel* Root = NewObject<UCanvasPanel>(Tutorial);
	Tutorial->SetRootWidget(Root);

	UBorder* Bg = NewObject<UBorder>(Root);
	Bg->SetBrushColor(FLinearColor(0, 0, 0, 0.75f));
	UCanvasPanelSlot* BgSlot = Root->AddChildToCanvas(Bg);
	BgSlot->SetAnchors(FAnchors(0, 0, 1, 1));

	UVerticalBox* VBox = NewObject<UVerticalBox>(Root);

	UTextBlock* Header = NewObject<UTextBlock>(VBox);
	Header->SetText(FText::FromString(TEXT("📖 第一章：101 号公寓")));
	FSlateFontInfo HFont;
	HFont.Size = 44;
	Header->SetFont(HFont);
	Header->SetColorAndOpacity(FSlateColor(FLinearColor(0.9f, 0.7f, 0.45f, 1.0f)));
	Header->SetJustification(ETextJustify::Center);
	UVerticalBoxSlot* HS = VBox->AddChildToVerticalBox(Header);
	HS->SetPadding(FMargin(0, 20, 0, 30));
	HS->SetHorizontalAlignment(HAlign_Center);

	struct TTData { const TCHAR* Icon; const TCHAR* Title; const TCHAR* Desc; };
	TArray<TTData> TutorialSteps = {
		{ TEXT("🚪"), TEXT("1. 房间探索"), TEXT("使用 WASD 移动，鼠标环视四周。走向书桌、床铺、书架、墙上海报查看。") },
		{ TEXT("✋"), TEXT("2. 物品检查 (F)"), TEXT("靠近物体后按 F 进入 3D 检查模式，可旋转/缩放/查看热点。") },
		{ TEXT("🔑"), TEXT("3. 线索收集 (E)"), TEXT("发现 [E] 高亮时点击可拾取线索。本关共 3 条：信件、照片、收据。") },
		{ TEXT("🔐"), TEXT("4. 密码锁谜题"), TEXT("房间右侧的拨号锁需要 4 位密码。线索日期指向：08 / 17。") },
		{ TEXT("📒"), TEXT("5. 笔记本 (Tab)"), TEXT("随时打开笔记本查看已收集线索、做笔记、建立线索关联。") },
		{ TEXT("⏸"), TEXT("6. 暂停/设置 (Esc)"), TEXT("Esc 打开暂停菜单，可调整音频/视频/控制/玩法设置。") },
	};
	FSlateFontInfo TFont; TFont.Size = 20;
	FSlateFontInfo DFont; DFont.Size = 16;
	for (const TTData& Step : TutorialSteps)
	{
		UHorizontalBox* HB = NewObject<UHorizontalBox>(VBox);
		UTextBlock* Icon = NewObject<UTextBlock>(HB);
		Icon->SetText(FText::FromString(Step.Icon));
		FSlateFontInfo IF; IF.Size = 32;
		Icon->SetFont(IF);
		UHorizontalBoxSlot* IS = HB->AddChildToHorizontalBox(Icon);
		IS->SetPadding(FMargin(0, 0, 16, 0));

		UVerticalBox* InnerV = NewObject<UVerticalBox>(HB);
		UTextBlock* TTitle = NewObject<UTextBlock>(InnerV);
		TTitle->SetText(FText::FromString(Step.Title));
		TTitle->SetFont(TFont);
		TTitle->SetColorAndOpacity(FSlateColor(FLinearColor(0.9f, 0.8f, 0.6f, 1.0f)));
		UTextBlock* TDesc = NewObject<UTextBlock>(InnerV);
		TDesc->SetText(FText::FromString(Step.Desc));
		TDesc->SetFont(DFont);
		TDesc->SetColorAndOpacity(FSlateColor(FLinearColor(0.8f, 0.8f, 0.85f, 1.0f)));
		InnerV->AddChildToVerticalBox(TTitle)->SetPadding(FMargin(0, 0, 0, 4));
		InnerV->AddChildToVerticalBox(TDesc);

		UHorizontalBoxSlot* IVS = HB->AddChildToHorizontalBox(InnerV);
		IVS->SetSize(FSlateChildSize(ESlateSizeRule::Fill));

		UVerticalBoxSlot* VBS = VBox->AddChildToVerticalBox(HB);
		VBS->SetPadding(FMargin(20, 8));
		VBS->SetHorizontalAlignment(HAlign_Center);
	}

	UButton* StartBtn = NewObject<UButton>(VBox);
	StartBtn->SetWidthOverride(380);
	StartBtn->SetHeightOverride(64);
	UTextBlock* SBText = NewObject<UTextBlock>(StartBtn);
	SBText->SetText(FText::FromString(TEXT("✅ 开始探索 / Begin Exploration")));
	FSlateFontInfo SBFont; SBFont.Size = 24;
	SBText->SetFont(SBFont);
	SBText->SetColorAndOpacity(FSlateColor(FLinearColor(0.3f, 0.9f, 0.55f, 1.0f)));
	StartBtn->SetContent(SBText);
	UVerticalBoxSlot* SBS = VBox->AddChildToVerticalBox(StartBtn);
	SBS->SetPadding(FMargin(0, 30, 0, 10));
	SBS->SetHorizontalAlignment(HAlign_Center);
	StartBtn->OnClicked.AddDynamic(Tutorial, &UUserWidget::RemoveFromParent);

	UCanvasPanelSlot* VS = Root->AddChildToCanvas(VBox);
	VS->SetAnchors(FAnchors(0.5f, 0.5f, 0.5f, 0.5f));
	VS->SetAlignment(FVector2D(0.5f, 0.5f));
	VS->SetOffsets(FMargin(-420, -340, 420, 340));

	Tutorial->AddToViewport(85);
	CreatedWidgets.Add(Tutorial);

	if (APlayerController* PCC = UGameplayStatics::GetPlayerController(this, 0))
	{
		PCC->SetShowMouseCursor(true);
		FInputModeGameAndUI GAM;
		GAM.SetHideCursorDuringCapture(false);
		PCC->SetInputMode(GAM);
	}
}

void AOldApartmentBootstrapActor::SetupForGameplayLevel()
{
	if (AOldApartmentPlayerController* PC = Cast<AOldApartmentPlayerController>(UGameplayStatics::GetPlayerController(this, 0)))
	{
		PC->SetInteractionMode(EPlayerInteractionMode::Explore);
	}
	else if (APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0))
	{
		PC->SetShowMouseCursor(false);
		FInputModeGameOnly InputMode;
		PC->SetInputMode(InputMode);
	}

	ChapterStartTime = GetWorld()->GetTimeSeconds();

	GenerateRoomAndActors();
	CreateFallbackHUD();
	BindFallbackKeys();
}

void AOldApartmentBootstrapActor::GenerateRoomAndActors()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Generating room geometry and actors..."));
	UWorld* World = GetWorld();
	if (!World) return;

	// ===== 1. PlayerStart =====
	FActorSpawnParameters PSParams;
	PSParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
	APlayerStart* PlayerStart = World->SpawnActor<APlayerStart>(FVector(1000, 300, 0), FRotator(0, -90, 0), PSParams);
	if (PlayerStart) PlayerStart->SetActorLabel(TEXT("Bootstrap_PlayerStart"));

	// ===== 2. 房间尺寸常量 =====
	const float RW = 1200.0f;  // X depth
	const float RL = 1600.0f;  // Y width
	const float RH = 300.0f;   // Z height

	// Helper: Spawn cube mesh actor
	auto SpawnCube = [&](FVector Loc, FVector Scale, const FName& Label) -> AStaticMeshActor*
	{
		AStaticMeshActor* Cube = World->SpawnActor<AStaticMeshActor>(Loc, FRotator(0, 0, 0), PSParams);
		if (Cube)
		{
			Cube->SetActorScale3D(Scale);
			Cube->SetActorLabel(Label);
			if (UStaticMeshComponent* SMC = Cube->GetStaticMeshComponent())
			{
				SMC->SetMobility(EComponentMobility::Static);
				UStaticMesh* CubeMesh = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
				if (CubeMesh) SMC->SetStaticMesh(CubeMesh);
				UMaterialInterface* GridMat = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/EngineMaterials/WorldGridMaterial.WorldGridMaterial"));
				if (GridMat) SMC->SetMaterial(0, GridMat);
			}
		}
		return Cube;
	};

	// ===== 3. 地板/墙/天花板 =====
	SpawnCube(FVector(RW/2,  RL/2,  -10),   FVector(RW/100, RL/100, 0.2f), TEXT("SM_Floor"));
	SpawnCube(FVector(0,      RL/2,  RH/2), FVector(0.2f,  RL/100, RH/100), TEXT("SM_Wall_Back"));
	SpawnCube(FVector(RW,     RL/2,  RH/2), FVector(0.2f,  RL/100, RH/100), TEXT("SM_Wall_Front"));
	SpawnCube(FVector(RW/2,   0,     RH/2), FVector(RW/100, 0.2f,  RH/100), TEXT("SM_Wall_Left"));
	SpawnCube(FVector(RW/2,   RL,    RH/2), FVector(RW/100, 0.2f,  RH/100), TEXT("SM_Wall_Right"));
	SpawnCube(FVector(RW/2,   RL/2,  RH+10),FVector(RW/100, RL/100, 0.2f), TEXT("SM_Ceiling"));

	// ===== 4. 家具 (INT_*) =====
	SpawnCube(FVector(400, 400,  90),  FVector(1.0f, 1.8f, 0.8f), TEXT("INT_Desk"));
	SpawnCube(FVector(800, 1200, 45),  FVector(2.0f, 1.4f, 0.5f), TEXT("INT_Bed"));
	SpawnCube(FVector(500, 600,  50),  FVector(0.8f, 0.8f, 1.0f), TEXT("INT_Chair"));
	SpawnCube(FVector(200, 1300, 100), FVector(0.6f, 2.0f, 2.0f), TEXT("INT_Bookshelf"));
	SpawnCube(FVector(10,  800,  200), FVector(0.1f, 1.0f, 1.0f), TEXT("INT_Picture"));

	// ===== 5. 线索 (CLUE_*) =====
	SpawnCube(FVector(420, 410, 115), FVector(0.3f, 0.5f, 0.05f), TEXT("CLUE_Letter"));
	SpawnCube(FVector(810, 1250,120), FVector(0.3f, 0.5f, 0.05f), TEXT("CLUE_Photo"));
	SpawnCube(FVector(210, 1320,210), FVector(0.3f, 0.5f, 0.05f), TEXT("CLUE_Receipt"));

	// ===== 6. 拨号锁谜题 =====
	SpawnCube(FVector(1050, 800, 110), FVector(0.8f, 0.8f, 1.2f), TEXT("PUZZLE_DialLock4"));

	// ===== 7. 4 个房间触发器 =====
	auto SpawnTrigger = [&](FVector Loc, FVector Extent, const FName& Label) -> ABoxTrigger*
	{
		ABoxTrigger* Box = World->SpawnActor<ABoxTrigger>(Loc, FRotator(0, 0, 0), PSParams);
		if (Box)
		{
			Box->SetActorLabel(Label);
			if (UPrimitiveComponent* BoxComp = Box->GetCollisionComponent())
			{
				BoxComp->SetBoxExtent(Extent);
			}
		}
		return Box;
	};

	SpawnTrigger(FVector(600, 800, 100),  FVector(400, 500, 100), TEXT("TRIGGER_Room_Living"));
	SpawnTrigger(FVector(850, 1200,100),  FVector(150, 200, 100), TEXT("TRIGGER_Room_BedArea"));
	SpawnTrigger(FVector(350, 500, 100),  FVector(150, 150, 100), TEXT("TRIGGER_Room_Study"));
	SpawnTrigger(FVector(1000,300, 100),  FVector(100, 150, 100), TEXT("TRIGGER_Room_Entrance"));

	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Room generated: floor+5 walls+5 furniture+3 clues+1 puzzle+4 triggers"));
}

void AOldApartmentBootstrapActor::BindFallbackKeys()
{
	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;
	UInputComponent* IC = PC->InputComponent;
	if (!IC)
	{
		PC->EnableInput(PC);
		IC = PC->InputComponent;
	}
	if (!IC) return;

	// F-key fallback bindings (work without Enhanced Input assets)
	IC->BindAction(FName(TEXT("InteractFallback")),   IE_Pressed,  this, &AOldApartmentBootstrapActor::HandleQuickInteractFallback);
	IC->BindAction(FName(TEXT("NotebookFallback")),   IE_Pressed,  this, &AOldApartmentBootstrapActor::CreateFallbackNotebook);
	IC->BindAction(FName(TEXT("PauseFallback")),      IE_Pressed,  this, &AOldApartmentBootstrapActor::HandleQuickPause);
	IC->BindAction(FName(TEXT("PuzzleFallback")),     IE_Pressed,  this, &AOldApartmentBootstrapActor::CreateFallbackDialLockPuzzle);
	IC->BindAction(FName(TEXT("ResultFallback")),     IE_Pressed,  this, &AOldApartmentBootstrapActor::HandleTriggerChapterEnd);

	// Also bind via EnhancedInputComponent if available
	UEnhancedInputComponent* EIC = Cast<UEnhancedInputComponent>(IC);
	if (EIC)
	{
		// We'll just rely on legacy key bindings above for now
		UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Enhanced Input Component detected (legacy fallbacks still active)"));
	}

	// Legacy Axis/Action key mappings (work without IMC assets)
	PC->PlayerInput->AddAxisMapping(FName(TEXT("MoveForward")),  EKeys::W,  1.0f);
	PC->PlayerInput->AddAxisMapping(FName(TEXT("MoveForward")),  EKeys::S, -1.0f);
	PC->PlayerInput->AddAxisMapping(FName(TEXT("MoveRight")),    EKeys::D,  1.0f);
	PC->PlayerInput->AddAxisMapping(FName(TEXT("MoveRight")),    EKeys::A, -1.0f);
	PC->PlayerInput->AddAxisMapping(FName(TEXT("Turn")),         EKeys::MouseX, 1.0f);
	PC->PlayerInput->AddAxisMapping(FName(TEXT("LookUp")),       EKeys::MouseY, 1.0f);

	PC->PlayerInput->AddActionMapping(FInputActionKeyMapping(FName(TEXT("InteractFallback")), EKeys::E));
	PC->PlayerInput->AddActionMapping(FInputActionKeyMapping(FName(TEXT("NotebookFallback")), EKeys::Tab));
	PC->PlayerInput->AddActionMapping(FInputActionKeyMapping(FName(TEXT("PauseFallback")),    EKeys::Escape));
	PC->PlayerInput->AddActionMapping(FInputActionKeyMapping(FName(TEXT("PuzzleFallback")),   EKeys::F));
	PC->PlayerInput->AddActionMapping(FInputActionKeyMapping(FName(TEXT("ResultFallback")),   EKeys::R));
	PC->PlayerInput->AddActionMapping(FInputActionKeyMapping(FName(TEXT("FlashlightToggle")), EKeys::T));

	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Legacy key bindings applied: E=Interact, Tab=Notebook, Esc=Pause, F=Puzzle, R=DebugResult"));
}

void AOldApartmentBootstrapActor::HandleQuickInteractFallback()
{
	// Simple "clue collection" for the 3 placed clues
	if (CluesCollected < TotalClues)
	{
		CluesCollected++;
		UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Interact! Collected clue %d of %d"), CluesCollected, TotalClues);
		if (CluesCollected >= TotalClues)
		{
			UE_LOG(LogTemp, Log, TEXT("[Bootstrap] ALL CLUES COLLECTED — check the dial lock (password 0817)"));
		}
	}
}

void AOldApartmentBootstrapActor::CreateFallbackPauseMenu()
{
	if (bPauseActive && ActivePauseWidget)
	{
		OnPauseResume();
		return;
	}

	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Pause Menu opened (Legacy Esc)"));

	UUserWidget* Pause = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	UCanvasPanel* Root = NewObject<UCanvasPanel>(Pause);
	Pause->SetRootWidget(Root);

	UBorder* Bg = NewObject<UBorder>(Root);
	Bg->SetBrushColor(FLinearColor(0.02f, 0.025f, 0.04f, 0.92f));
	UCanvasPanelSlot* BgS = Root->AddChildToCanvas(Bg);
	BgS->SetAnchors(FAnchors(0,0,1,1));

	UTextBlock* Title = NewObject<UTextBlock>(Root);
	Title->SetText(FText::FromString(TEXT("⏸ 已暂停 / Paused")));
	FSlateFontInfo TFont; TFont.Size = 52;
	Title->SetFont(TFont);
	Title->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f, 0.85f, 0.6f, 1.0f)));
	UCanvasPanelSlot* TS = Root->AddChildToCanvas(Title);
	TS->SetAnchors(FAnchors(0.5f, 0.18f, 0.5f, 0.18f));
	TS->SetAlignment(FVector2D(0.5f, 0.5f));

	UVerticalBox* VBox = NewObject<UVerticalBox>(Root);
	struct PBData { const TCHAR* Label; int32 Id; FLinearColor C; };
	TArray<PBData> PauseButtons = {
		{ TEXT("▶ 继续游戏 / Resume"),         0, FLinearColor(0.45f,0.95f,0.6f,1.f) },
		{ TEXT("📖 打开笔记本 / Notebook"),     1, FLinearColor(0.65f,0.85f,0.95f,1.f) },
		{ TEXT("⚙ 设置 / Settings"),           2, FLinearColor(0.7f, 0.75f,0.85f,1.f) },
		{ TEXT("🏁 结束本章 / End Chapter"),    3, FLinearColor(0.95f,0.75f,0.35f,1.f) },
		{ TEXT("🏠 返回主菜单 / To Menu"),      4, FLinearColor(0.9f, 0.5f, 0.4f,1.f) },
	};
	for (const PBData& BD : PauseButtons)
	{
		UButton* B = NewObject<UButton>(VBox);
		B->SetWidthOverride(540); B->SetHeightOverride(68);
		UTextBlock* BT = NewObject<UTextBlock>(B);
		BT->SetText(FText::FromString(BD.Label));
		FSlateFontInfo F; F.Size = 26;
		BT->SetFont(F);
		BT->SetColorAndOpacity(FSlateColor(BD.C));
		BT->SetJustification(ETextJustify::Center);
		B->SetContent(BT);
		UVerticalBoxSlot* VS = VBox->AddChildToVerticalBox(B);
		VS->SetPadding(FMargin(0, 10));
		VS->SetHorizontalAlignment(HAlign_Center);

		if (BD.Id == 0)      B->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnPauseResume);
		else if (BD.Id == 1) B->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnPauseOpenNotebook);
		else if (BD.Id == 2) B->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnPauseSettings);
		else if (BD.Id == 3) B->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::HandleTriggerChapterEnd);
		else if (BD.Id == 4) B->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnPauseToMenu);
	}
	UCanvasPanelSlot* VS = Root->AddChildToCanvas(VBox);
	VS->SetAnchors(FAnchors(0.5f, 0.55f, 0.5f, 0.55f));
	VS->SetAlignment(FVector2D(0.5f, 0.5f));

	Pause->AddToViewport(60);
	CreatedWidgets.Add(Pause);
	ActivePauseWidget = Pause;
	bPauseActive = true;

	PC->SetShowMouseCursor(true);
	FInputModeGameAndUI GAM;
	GAM.SetHideCursorDuringCapture(false);
	PC->SetInputMode(GAM);

	// If user pressed "Notebook" btn (index 1): auto-open notebook too (just make a button for clarity — added above)
}

void AOldApartmentBootstrapActor::CreateFallbackChapterResult()
{
	if (bChapterEnded) return;
	bChapterEnded = true;

	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Chapter Result screen opened"));

	const float Elapsed = GetWorld()->GetTimeSeconds() - ChapterStartTime;
	const float Mistakes = 0.0f;  // placeholder

	// Scoring algorithm (same as GameMode)
	const float ClueRatio = (float)CluesCollected / (float)FMath::Max(1, TotalClues);
	const int32 BaseScore = FMath::RoundToInt(ClueRatio * 1000.0f);
	int32 TimeBonus = 0;
	if (Elapsed <= 300.0f) TimeBonus = 500;
	else if (Elapsed <= 600.0f) TimeBonus = 300;
	else if (Elapsed <= 900.0f) TimeBonus = 150;
	const int32 PerfectBonus = (CluesCollected >= TotalClues && Mistakes == 0 && bPuzzleSolved) ? 200 : 0;
	const int32 Penalty = FMath::RoundToInt(Mistakes * 50.0f);
	const int32 Final = BaseScore + TimeBonus + PerfectBonus - Penalty;
	const float Pct = (float)Final / 1700.0f;
	FString Rank = TEXT("E");
	if (Pct >= 0.95f)      Rank = TEXT("S+");
	else if (Pct >= 0.90f) Rank = TEXT("S");
	else if (Pct >= 0.85f) Rank = TEXT("A+");
	else if (Pct >= 0.80f) Rank = TEXT("A");
	else if (Pct >= 0.70f) Rank = TEXT("B");
	else if (Pct >= 0.60f) Rank = TEXT("C");
	else if (Pct >= 0.50f) Rank = TEXT("D");

	int32 Mins = (int32)(Elapsed / 60.0f);
	int32 Secs = (int32)Elapsed % 60;

	UUserWidget* Result = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	UCanvasPanel* Root = NewObject<UCanvasPanel>(Result);
	Result->SetRootWidget(Root);

	UBorder* Bg = NewObject<UBorder>(Root);
	Bg->SetBrushColor(FLinearColor(0.03f, 0.025f, 0.05f, 0.96f));
	UCanvasPanelSlot* BgS = Root->AddChildToCanvas(Bg);
	BgS->SetAnchors(FAnchors(0,0,1,1));

	UTextBlock* Header = NewObject<UTextBlock>(Root);
	Header->SetText(FText::FromString(TEXT("🏁 第一章 结算 / Chapter 01 Result")));
	FSlateFontInfo HFont; HFont.Size = 48;
	Header->SetFont(HFont);
	Header->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f,0.8f,0.55f,1.0f)));
	UCanvasPanelSlot* HS = Root->AddChildToCanvas(Header);
	HS->SetAnchors(FAnchors(0.5f,0.12f,0.5f,0.12f));
	HS->SetAlignment(FVector2D(0.5f,0.5f));

	UTextBlock* RankT = NewObject<UTextBlock>(Root);
	RankT->SetText(FText::FromString(Rank));
	FSlateFontInfo RFont; RFont.Size = 160; RFont.TypefaceFontName = FName(TEXT("Bold"));
	RankT->SetFont(RFont);
	RankT->SetColorAndOpacity(FSlateColor(FLinearColor(1.0f,0.85f,0.4f,1.0f)));
	UCanvasPanelSlot* RS = Root->AddChildToCanvas(RankT);
	RS->SetAnchors(FAnchors(0.82f,0.28f,0.82f,0.28f));
	RS->SetAlignment(FVector2D(0.5f,0.5f));

	UVerticalBox* StatVBox = NewObject<UVerticalBox>(Root);
	struct SD { const TCHAR* K; FString V; FLinearColor C; };
	TArray<SD> Stats = {
		{ TEXT("📊 基础分 (线索完成度)"),     FString::Printf(TEXT("%d  × %.0f%%"), BaseScore, ClueRatio*100), FLinearColor(0.9f,0.9f,1.f) },
		{ TEXT("⏱ 时间奖励"),                 FString::Printf(TEXT("+%d  (%d:%02d)"), TimeBonus, Mins, Secs),  FLinearColor(0.7f,1.0f,0.75f) },
		{ TEXT("✨ 完美奖励"),                 FString::Printf(TEXT("+%d"), PerfectBonus),                      FLinearColor(1.0f,0.85f,0.5f) },
		{ TEXT("❌ 失误惩罚"),                 FString::Printf(TEXT("-%d (%.0f 次)"), Penalty, Mistakes),        FLinearColor(1.0f,0.6f,0.6f) },
		{ TEXT("🎯 最终分数"),                 FString::Printf(TEXT("%d 分"), Final),                             FLinearColor(1.0f,1.0f,0.7f) },
		{ TEXT("🔑 线索收集"),                 FString::Printf(TEXT("%d / %d"), CluesCollected, TotalClues),     FLinearColor(0.75f,0.9f,1.0f) },
		{ TEXT("🔐 谜题解锁"),                 bPuzzleSolved ? TEXT("✅ 已解开 (0817)") : TEXT("❌ 未解开"),        FLinearColor(0.7f,1.0f,0.8f) },
	};
	FSlateFontInfo SFont; SFont.Size = 24;
	FSlateFontInfo SFontBig; SFontBig.Size = 30;
	for (int32 i = 0; i < Stats.Num(); i++)
	{
		UHorizontalBox* HB = NewObject<UHorizontalBox>(StatVBox);
		UTextBlock* KT = NewObject<UTextBlock>(HB);
		KT->SetText(FText::FromString(Stats[i].K));
		KT->SetFont(i == Stats.Num()-1 ? SFontBig : SFont);
		KT->SetColorAndOpacity(FSlateColor(FLinearColor(0.75f,0.75f,0.8f,1.0f)));
		KT->SetMinDesiredWidth(420);
		UHorizontalBoxSlot* KTS = HB->AddChildToHorizontalBox(KT);
		KTS->SetPadding(FMargin(0,0,20,0));
		UTextBlock* VT = NewObject<UTextBlock>(HB);
		VT->SetText(FText::FromString(Stats[i].V));
		VT->SetFont(i == Stats.Num()-1 ? SFontBig : SFont);
		VT->SetColorAndOpacity(FSlateColor(Stats[i].C));
		HB->AddChildToHorizontalBox(VT);
		UVerticalBoxSlot* VSS = StatVBox->AddChildToVerticalBox(HB);
		VSS->SetPadding(FMargin(0, 8));
	}
	UCanvasPanelSlot* StatSS = Root->AddChildToCanvas(StatVBox);
	StatSS->SetAnchors(FAnchors(0.38f, 0.45f, 0.38f, 0.45f));
	StatSS->SetAlignment(FVector2D(0.5f, 0.0f));

	// Unlocked achievements section
	UTextBlock* UnlockT = NewObject<UTextBlock>(Root);
	UnlockT->SetText(FText::FromString(TEXT("🏆 解锁成就 / Unlocked:")));
	FSlateFontInfo UF; UF.Size = 22;
	UnlockT->SetFont(UF);
	UnlockT->SetColorAndOpacity(FSlateColor(FLinearColor(0.85f,0.7f,1.0f,1.0f)));
	UCanvasPanelSlot* UnlockS = Root->AddChildToCanvas(UnlockT);
	UnlockS->SetAnchors(FAnchors(0.5f,0.82f,0.5f,0.82f));
	UnlockS->SetAlignment(FVector2D(0.5f,0.5f));

	UTextBlock* Achv = NewObject<UTextBlock>(Root);
	Achv->SetText(FText::FromString(
		CluesCollected >= TotalClues
			? TEXT("ACH_FirstStep 初入公寓  ✦  ACH_ClueHunter 线索猎人  ✦  ACH_FirstCase 首个案件")
			: TEXT("ACH_FirstStep 初入公寓")));
	FSlateFontInfo AF; AF.Size = 18;
	Achv->SetFont(AF);
	Achv->SetColorAndOpacity(FSlateColor(FLinearColor(0.75f,0.65f,1.0f,1.0f)));
	Achv->SetJustification(ETextJustify::Center);
	UCanvasPanelSlot* AS = Root->AddChildToCanvas(Achv);
	AS->SetAnchors(FAnchors(0.5f,0.86f,0.5f,0.86f));
	AS->SetAlignment(FVector2D(0.5f,0.5f));
	AS->SetOffsets(FMargin(-600,0,600,0));

	// Buttons
	UHorizontalBox* BtnBox = NewObject<UHorizontalBox>(Root);
	UButton* RBtn = NewObject<UButton>(BtnBox);
	RBtn->SetWidthOverride(320); RBtn->SetHeightOverride(72);
	UTextBlock* RBT = NewObject<UTextBlock>(RBtn);
	RBT->SetText(FText::FromString(TEXT("🔄 重玩本章 / Replay")));
	FSlateFontInfo BF; BF.Size = 24;
	RBT->SetFont(BF);
	RBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.6f,0.95f,0.75f,1.0f)));
	RBtn->SetContent(RBT);
	RBtn->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnChapterResultReplay);
	UHorizontalBoxSlot* RBTS = BtnBox->AddChildToHorizontalBox(RBtn);
	RBTS->SetPadding(FMargin(0,0,30,0));

	UButton* MBtn = NewObject<UButton>(BtnBox);
	MBtn->SetWidthOverride(320); MBtn->SetHeightOverride(72);
	UTextBlock* MBT = NewObject<UTextBlock>(MBtn);
	MBT->SetText(FText::FromString(TEXT("🏠 返回主菜单 / Main Menu")));
	MBT->SetFont(BF);
	MBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f,0.75f,0.6f,1.0f)));
	MBtn->SetContent(MBT);
	MBtn->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::OnChapterResultToMenu);
	BtnBox->AddChildToHorizontalBox(MBtn);

	UCanvasPanelSlot* BtnSS = Root->AddChildToCanvas(BtnBox);
	BtnSS->SetAnchors(FAnchors(0.5f,0.93f,0.5f,0.93f));
	BtnSS->SetAlignment(FVector2D(0.5f,0.5f));

	Result->AddToViewport(95);
	CreatedWidgets.Add(Result);
	ActiveChapterResultWidget = Result;

	PC->SetShowMouseCursor(true);
	FInputModeUIOnly UIM;
	UIM.SetWidgetToFocus(Result->TakeWidget());
	UIM.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
	PC->SetInputMode(UIM);
}

void AOldApartmentBootstrapActor::CreateFallbackDialLockPuzzle()
{
	if (ActivePuzzleWidget) { ActivePuzzleWidget->RemoveFromParent(); ActivePuzzleWidget = nullptr; }

	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] 4-digit Dial Lock puzzle opened (answer = 0817)"));

	UUserWidget* Puzzle = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	UCanvasPanel* Root = NewObject<UCanvasPanel>(Puzzle);
	Puzzle->SetRootWidget(Root);

	UBorder* Bg = NewObject<UBorder>(Root);
	Bg->SetBrushColor(FLinearColor(0, 0, 0, 0.85f));
	UCanvasPanelSlot* BgS = Root->AddChildToCanvas(Bg);
	BgS->SetAnchors(FAnchors(0,0,1,1));

	UBorder* Panel = NewObject<UBorder>(Root);
	Panel->SetBrushColor(FLinearColor(0.10f,0.08f,0.06f, 1.0f));
	Panel->SetDesiredSize(FVector2D(720, 520));
	Panel->SetHorizontalAlignment(HAlign_Center);
	Panel->SetVerticalAlignment(VAlign_Center);
	UCanvasPanelSlot* PS = Root->AddChildToCanvas(Panel);
	PS->SetAnchors(FAnchors(0.5f,0.5f,0.5f,0.5f));
	PS->SetAlignment(FVector2D(0.5f,0.5f));

	UTextBlock* Title = NewObject<UTextBlock>(Root);
	Title->SetText(FText::FromString(TEXT("🔐 四位数拨号锁 / 4-Digit Dial Lock")));
	FSlateFontInfo TFont; TFont.Size = 36;
	Title->SetFont(TFont);
	Title->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f,0.8f,0.5f,1.0f)));
	UCanvasPanelSlot* TS = Root->AddChildToCanvas(Title);
	TS->SetAnchors(FAnchors(0.5f,0.2f,0.5f,0.2f));
	TS->SetAlignment(FVector2D(0.5f,0.5f));

	UTextBlock* Hint = NewObject<UTextBlock>(Root);
	Hint->SetText(FText::FromString(TEXT("提示：信件日期 = 8 月 17 日")));
	FSlateFontInfo HFont; HFont.Size = 20;
	Hint->SetFont(HFont);
	Hint->SetColorAndOpacity(FSlateColor(FLinearColor(0.7f,0.65f,0.55f,1.0f)));
	UCanvasPanelSlot* HintS = Root->AddChildToCanvas(Hint);
	HintS->SetAnchors(FAnchors(0.5f,0.27f,0.5f,0.27f));
	HintS->SetAlignment(FVector2D(0.5f,0.5f));

	UHorizontalBox* DialBox = NewObject<UHorizontalBox>(Root);
	TArray<UTextBlock*> DialTexts;
	TArray<int32> LocalCode = { DialCode[0], DialCode[1], DialCode[2], DialCode[3] };
	for (int32 i = 0; i < 4; i++)
	{
		UVerticalBox* Dial = NewObject<UVerticalBox>(DialBox);
		UButton* UpB = NewObject<UButton>(Dial);
		UpB->SetWidthOverride(120); UpB->SetHeightOverride(64);
		UTextBlock* UpBT = NewObject<UTextBlock>(UpB);
		UpBT->SetText(FText::FromString(TEXT("▲")));
		FSlateFontInfo AF; AF.Size = 28;
		UpBT->SetFont(AF);
		UpBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.6f,0.8f,1.0f,1.0f)));
		UpB->SetContent(UpBT);
		Dial->AddChildToVerticalBox(UpB)->SetPadding(FMargin(0, 0, 0, 8));

		UTextBlock* DT = NewObject<UTextBlock>(Dial);
		DT->SetText(FText::AsNumber(LocalCode[i]));
		FSlateFontInfo DFont; DFont.Size = 72; DFont.TypefaceFontName = FName(TEXT("Bold"));
		DT->SetFont(DFont);
		DT->SetColorAndOpacity(FSlateColor(FLinearColor(1.0f,0.95f,0.75f,1.0f)));
		DT->SetJustification(ETextJustify::Center);
		DialTexts.Add(DT);
		UVerticalBoxSlot* DTS = Dial->AddChildToVerticalBox(DT);
		DTS->SetPadding(FMargin(0, 4, 0, 4));
		DTS->SetHorizontalAlignment(HAlign_Center);

		UButton* DnB = NewObject<UButton>(Dial);
		DnB->SetWidthOverride(120); DnB->SetHeightOverride(64);
		UTextBlock* DnBT = NewObject<UTextBlock>(DnB);
		DnBT->SetText(FText::FromString(TEXT("▼")));
		DnBT->SetFont(AF);
		DnBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.6f,0.8f,1.0f,1.0f)));
		DnB->SetContent(DnBT);
		Dial->AddChildToVerticalBox(DnB)->SetPadding(FMargin(0, 8, 0, 0));

		// Lambda bindings — capture index by copy
		int32 IdxCopy = i;
		UpB->OnClicked.AddWeakLambda(this, [this, IdxCopy, DialTexts]()
		{
			DialCode[IdxCopy] = (DialCode[IdxCopy] + 1) % 10;
			if (DialTexts.IsValidIndex(IdxCopy) && DialTexts[IdxCopy])
			{
				DialTexts[IdxCopy]->SetText(FText::AsNumber(DialCode[IdxCopy]));
			}
			UE_LOG(LogTemp, Log, TEXT("[Puzzle] %d digit up -> %d"), IdxCopy, DialCode[IdxCopy]);
		});
		DnB->OnClicked.AddWeakLambda(this, [this, IdxCopy, DialTexts]()
		{
			DialCode[IdxCopy] = (DialCode[IdxCopy] + 9) % 10;
			if (DialTexts.IsValidIndex(IdxCopy) && DialTexts[IdxCopy])
			{
				DialTexts[IdxCopy]->SetText(FText::AsNumber(DialCode[IdxCopy]));
			}
			UE_LOG(LogTemp, Log, TEXT("[Puzzle] %d digit dn -> %d"), IdxCopy, DialCode[IdxCopy]);
		});

		UHorizontalBoxSlot* DSS = DialBox->AddChildToHorizontalBox(Dial);
		DSS->SetPadding(FMargin(14, 0, 14, 0));
		DSS->SetHorizontalAlignment(HAlign_Center);
	}
	UCanvasPanelSlot* DBSS = Root->AddChildToCanvas(DialBox);
	DBSS->SetAnchors(FAnchors(0.5f,0.52f,0.5f,0.52f));
	DBSS->SetAlignment(FVector2D(0.5f,0.5f));

	UHorizontalBox* BtnBox = NewObject<UHorizontalBox>(Root);
	UButton* SubBtn = NewObject<UButton>(BtnBox);
	SubBtn->SetWidthOverride(280); SubBtn->SetHeightOverride(72);
	UTextBlock* SBT = NewObject<UTextBlock>(SubBtn);
	SBT->SetText(FText::FromString(TEXT("✅ 确认 / Submit")));
	FSlateFontInfo BF; BF.Size = 24;
	SBT->SetFont(BF);
	SBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.45f,0.95f,0.65f,1.0f)));
	SubBtn->SetContent(SBT);
	SubBtn->OnClicked.AddDynamic(this, &AOldApartmentBootstrapActor::HandleInteractDialLock);
	UHorizontalBoxSlot* SubS = BtnBox->AddChildToHorizontalBox(SubBtn);
	SubS->SetPadding(FMargin(0,0,20,0));

	UButton* CloseBtn = NewObject<UButton>(BtnBox);
	CloseBtn->SetWidthOverride(280); CloseBtn->SetHeightOverride(72);
	UTextBlock* CBT = NewObject<UTextBlock>(CloseBtn);
	CBT->SetText(FText::FromString(TEXT("❌ 关闭 / Close")));
	CBT->SetFont(BF);
	CBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f,0.6f,0.55f,1.0f)));
	CloseBtn->SetContent(CBT);
	CloseBtn->OnClicked.AddWeakLambda(this, [this, Puzzle]()
	{
		if (ActivePuzzleWidget == Puzzle) ActivePuzzleWidget = nullptr;
		Puzzle->RemoveFromParent();
		if (APlayerController* P = UGameplayStatics::GetPlayerController(this, 0))
		{
			P->SetShowMouseCursor(false);
			FInputModeGameOnly GM; P->SetInputMode(GM);
		}
	});
	BtnBox->AddChildToHorizontalBox(CloseBtn);

	UCanvasPanelSlot* BtnSS = Root->AddChildToCanvas(BtnBox);
	BtnSS->SetAnchors(FAnchors(0.5f,0.78f,0.5f,0.78f));
	BtnSS->SetAlignment(FVector2D(0.5f,0.5f));

	Puzzle->AddToViewport(70);
	CreatedWidgets.Add(Puzzle);
	ActivePuzzleWidget = Puzzle;

	PC->SetShowMouseCursor(true);
	FInputModeGameAndUI GAM;
	GAM.SetWidgetToFocus(Puzzle->TakeWidget());
	GAM.SetHideCursorDuringCapture(false);
	PC->SetInputMode(GAM);
}

void AOldApartmentBootstrapActor::OnPauseResume()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Resume"));
	if (ActivePauseWidget)
	{
		ActivePauseWidget->RemoveFromParent();
		ActivePauseWidget = nullptr;
	}
	bPauseActive = false;
	if (APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0))
	{
		PC->SetShowMouseCursor(false);
		FInputModeGameOnly GM;
		PC->SetInputMode(GM);
	}
}

void AOldApartmentBootstrapActor::OnPauseOpenNotebook()
{
	// Close pause menu first (bPauseActive=false, restore input)
	OnPauseResume();
	// Then open notebook
	CreateFallbackNotebook();
}

void AOldApartmentBootstrapActor::OnPauseSettings()
{
	// Reuse main menu settings
	OnMainMenuSettings();
}

void AOldApartmentBootstrapActor::OnPauseToMenu()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] -> Main Menu"));
	// Clear all widgets first
	for (UUserWidget* W : CreatedWidgets) if (W) W->RemoveFromParent();
	CreatedWidgets.Empty();
	// Reset static first-launch flag to true so next level load shows main menu
	// (Hack: we reload the SAME level, but the static bool is handled by wrapping)
	// Since level name will still contain Template/Default, we swap mode with a flag:
	// Use a CVar to tell next load we want MainMenu
	IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("OldApartment.StartMode"));
	if (CVar) CVar->Set(0);  // 0 = MainMenu next
	UGameplayStatics::OpenLevel(this, FName(TEXT("/Engine/Maps/Templates/Template_Default")));
}

void AOldApartmentBootstrapActor::OnPuzzleSubmit(int32 Code0, int32 Code1, int32 Code2, int32 Code3)
{
	DialCode[0] = Code0; DialCode[1] = Code1; DialCode[2] = Code2; DialCode[3] = Code3;
	HandleInteractDialLock();
}

void AOldApartmentBootstrapActor::OnChapterResultReplay()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Replay Chapter 01"));
	IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("OldApartment.StartMode"));
	if (CVar) CVar->Set(1);  // 1 = Chapter next
	UGameplayStatics::OpenLevel(this, FName(TEXT("/Engine/Maps/Templates/Template_Default")));
}

void AOldApartmentBootstrapActor::OnChapterResultToMenu()
{
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Chapter Result -> Main Menu"));
	IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("OldApartment.StartMode"));
	if (CVar) CVar->Set(0);
	UGameplayStatics::OpenLevel(this, FName(TEXT("/Engine/Maps/Templates/Template_Default")));
}

void AOldApartmentBootstrapActor::HandleEndLevelOverlap()
{
	// Triggered by TRIGGER_Room_Entrance when all clues + puzzle
	if (CluesCollected >= TotalClues && bPuzzleSolved && !bChapterEnded)
	{
		UE_LOG(LogTemp, Log, TEXT("[Bootstrap] End level overlap — chapter complete"));
		HandleTriggerChapterEnd();
	}
}

void AOldApartmentBootstrapActor::HandleQuickPause()
{
	CreateFallbackPauseMenu();
}

void AOldApartmentBootstrapActor::HandleTriggerChapterEnd()
{
	CreateFallbackChapterResult();
}

void AOldApartmentBootstrapActor::HandleInteractDialLock()
{
	// Answer = 0 8 1 7  (0817 from letter date)
	bool bMatch = (DialCode[0]==0 && DialCode[1]==8 && DialCode[2]==1 && DialCode[3]==7);
	UE_LOG(LogTemp, Log, TEXT("[Puzzle] Submit %d%d%d%d — %s"),
		DialCode[0],DialCode[1],DialCode[2],DialCode[3],
		bMatch? TEXT("CORRECT!") : TEXT("wrong..."));

	if (bMatch)
	{
		bPuzzleSolved = true;
		UE_LOG(LogTemp, Log, TEXT("[Puzzle] Locked opened! (0817)"));
		if (ActivePuzzleWidget)
		{
			ActivePuzzleWidget->RemoveFromParent();
			ActivePuzzleWidget = nullptr;
		}
		if (APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0))
		{
			PC->SetShowMouseCursor(false);
			FInputModeGameOnly GM;
			PC->SetInputMode(GM);
		}
		// If all clues collected + puzzle solved = trigger chapter result after delay
		if (CluesCollected >= TotalClues)
		{
			FTimerHandle H;
			GetWorldTimerManager().SetTimer(H, this, &AOldApartmentBootstrapActor::HandleTriggerChapterEnd, 1.5f, false);
		}
	}
}

void AOldApartmentBootstrapActor::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
}

void AOldApartmentBootstrapActor::CreateFallbackNotebook()
{
	APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;
	UE_LOG(LogTemp, Log, TEXT("[Bootstrap] Notebook (Tab pressed)"));

	UUserWidget* Note = CreateWidget<UUserWidget>(PC, UUserWidget::StaticClass());
	UCanvasPanel* Root = NewObject<UCanvasPanel>(Note);
	Note->SetRootWidget(Root);

	UBorder* Bg = NewObject<UBorder>(Root);
	Bg->SetBrushColor(FLinearColor(0.12f,0.09f,0.06f, 0.97f));
	UCanvasPanelSlot* BgS = Root->AddChildToCanvas(Bg);
	BgS->SetAnchors(FAnchors(0.1f,0.08f,0.9f,0.92f));

	UTextBlock* Title = NewObject<UTextBlock>(Root);
	Title->SetText(FText::FromString(TEXT("📒 调查笔记本 / Investigation Notebook")));
	FSlateFontInfo TFont; TFont.Size = 40;
	Title->SetFont(TFont);
	Title->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f,0.82f,0.55f,1.0f)));
	UCanvasPanelSlot* TS = Root->AddChildToCanvas(Title);
	TS->SetAnchors(FAnchors(0.5f,0.14f,0.5f,0.14f));
	TS->SetAlignment(FVector2D(0.5f,0.5f));

	UHorizontalBox* TabBox = NewObject<UHorizontalBox>(Root);
	TArray<FString> Tabs = { TEXT("📋 线索"), TEXT("📝 笔记"), TEXT("🔗 关联"), TEXT("🗺 地图") };
	for (const FString& Tab : Tabs)
	{
		UButton* B = NewObject<UButton>(TabBox);
		B->SetWidthOverride(220); B->SetHeightOverride(60);
		UTextBlock* BT = NewObject<UTextBlock>(B);
		BT->SetText(FText::FromString(Tab));
		FSlateFontInfo F; F.Size = 22;
		BT->SetFont(F);
		BT->SetColorAndOpacity(FSlateColor(FLinearColor(0.75f,0.8f,0.95f,1.0f)));
		B->SetContent(BT);
		UHorizontalBoxSlot* BSS = TabBox->AddChildToHorizontalBox(B);
		BSS->SetPadding(FMargin(6, 0));
	}
	UCanvasPanelSlot* TabSS = Root->AddChildToCanvas(TabBox);
	TabSS->SetAnchors(FAnchors(0.5f,0.22f,0.5f,0.22f));
	TabSS->SetAlignment(FVector2D(0.5f,0.5f));

	// Content — clues list
	UVerticalBox* ClueList = NewObject<UVerticalBox>(Root);
	struct CL { const TCHAR* Icon; const TCHAR* Name; const TCHAR* Desc; bool bGot; };
	TArray<CL> Clues = {
		{ TEXT("📜"), TEXT("CLUE_Letter  租客遗留的信件"),   TEXT("来自 8月17日 的告别信，署名 A.H."),     CluesCollected >= 1 },
		{ TEXT("🖼"), TEXT("CLUE_Photo  旧照片"),           TEXT("1998年夏季，公寓前合影（三人）"),        CluesCollected >= 2 },
		{ TEXT("🧾"), TEXT("CLUE_Receipt  超市收据"),       TEXT("1998.08.16 晚 22:47，购于楼下便利店"),   CluesCollected >= 3 },
		{ TEXT("🔒"), TEXT("??? 下一条线索"),                TEXT("解锁密码锁后发现……"),                     false },
	};
	for (const CL& C : Clues)
	{
		UHorizontalBox* HB = NewObject<UHorizontalBox>(ClueList);
		UTextBlock* Icon = NewObject<UTextBlock>(HB);
		Icon->SetText(FText::FromString(C.Icon));
		FSlateFontInfo IF; IF.Size = 28;
		Icon->SetFont(IF);
		UHorizontalBoxSlot* IS = HB->AddChildToHorizontalBox(Icon);
		IS->SetPadding(FMargin(0,0,14,0));

		UVerticalBox* VB = NewObject<UVerticalBox>(HB);
		UTextBlock* NT = NewObject<UTextBlock>(VB);
		NT->SetText(FText::FromString(C.bGot ? C.Name : TEXT("【未发现】 —— ???")));
		FSlateFontInfo NF; NF.Size = 22;
		NT->SetFont(NF);
		NT->SetColorAndOpacity(FSlateColor(C.bGot ? FLinearColor(0.95f,0.9f,0.75f,1.0f) : FLinearColor(0.45f,0.45f,0.5f,1.0f)));
		UTextBlock* ND = NewObject<UTextBlock>(VB);
		ND->SetText(FText::FromString(C.bGot ? C.Desc : TEXT("继续探索以发现这条线索……")));
		FSlateFontInfo DF; DF.Size = 16;
		ND->SetFont(DF);
		ND->SetColorAndOpacity(FSlateColor(FLinearColor(0.65f,0.65f,0.7f,1.0f)));
		VB->AddChildToVerticalBox(NT)->SetPadding(FMargin(0,0,0,4));
		VB->AddChildToVerticalBox(ND);

		UHorizontalBoxSlot* VBS = HB->AddChildToHorizontalBox(VB);
		VBS->SetSize(FSlateChildSize(ESlateSizeRule::Fill));

		UVerticalBoxSlot* HBS = ClueList->AddChildToVerticalBox(HB);
		HBS->SetPadding(FMargin(30, 10, 30, 10));
	}
	UCanvasPanelSlot* CLSS = Root->AddChildToCanvas(ClueList);
	CLSS->SetAnchors(FAnchors(0.5f,0.58f,0.5f,0.58f));
	CLSS->SetAlignment(FVector2D(0.5f,0.5f));
	CLSS->SetOffsets(FMargin(-600, -180, 600, 180));

	UTextBlock* Footer = NewObject<UTextBlock>(Root);
	Footer->SetText(FText::FromString(FString::Printf(TEXT("📊 线索收集度: %d / %d   ·   [Tab] 关闭笔记本"), CluesCollected, TotalClues)));
	FSlateFontInfo FF; FF.Size = 20;
	Footer->SetFont(FF);
	Footer->SetColorAndOpacity(FSlateColor(FLinearColor(0.6f,0.7f,0.85f,1.0f)));
	Footer->SetJustification(ETextJustify::Center);
	UCanvasPanelSlot* FS = Root->AddChildToCanvas(Footer);
	FS->SetAnchors(FAnchors(0.5f,0.86f,0.5f,0.86f));
	FS->SetAlignment(FVector2D(0.5f,0.5f));

	UButton* CloseBtn = NewObject<UButton>(Root);
	CloseBtn->SetWidthOverride(240); CloseBtn->SetHeightOverride(56);
	UTextBlock* CBT = NewObject<UTextBlock>(CloseBtn);
	CBT->SetText(FText::FromString(TEXT("✕ 关闭 (Tab)")));
	FSlateFontInfo CBF; CBF.Size = 20;
	CBT->SetFont(CBF);
	CBT->SetColorAndOpacity(FSlateColor(FLinearColor(0.95f,0.65f,0.55f,1.0f)));
	CloseBtn->SetContent(CBT);
	CloseBtn->OnClicked.AddWeakLambda(this, [Note]() { Note->RemoveFromParent(); });
	UCanvasPanelSlot* CSS = Root->AddChildToCanvas(CloseBtn);
	CSS->SetAnchors(FAnchors(0.5f,0.93f,0.5f,0.93f));
	CSS->SetAlignment(FVector2D(0.5f,0.5f));

	Note->AddToViewport(55);
	CreatedWidgets.Add(Note);

	PC->SetShowMouseCursor(true);
	FInputModeGameAndUI GAM;
	GAM.SetWidgetToFocus(Note->TakeWidget());
	GAM.SetHideCursorDuringCapture(false);
	PC->SetInputMode(GAM);
}

void AOldApartmentBootstrapActor::EnhancedInputAutoSetup()
{
	APlayerController* RawPC = UGameplayStatics::GetPlayerController(this, 0);
	if (!RawPC) return;
	if (ULocalPlayer* LP = RawPC->GetLocalPlayer())
	{
		if (UEnhancedInputLocalPlayerSubsystem* Subsystem = LP->GetSubsystem<UEnhancedInputLocalPlayerSubsystem>())
		{
			UInputMappingContext* IMC = LoadObject<UInputMappingContext>(nullptr, TEXT("/Game/Input/IMC_Default.IMC_Default"));
			if (IMC)
			{
				Subsystem->AddMappingContext(IMC, 0);
				UE_LOG(LogTemp, Log, TEXT("[Bootstrap] IMC_Default loaded and applied."));
			}
			else
			{
				UE_LOG(LogTemp, Warning, TEXT("[Bootstrap] IMC_Default not found — using legacy key bindings (E/Tab/Esc/F/R)"));
			}
		}
	}
}
