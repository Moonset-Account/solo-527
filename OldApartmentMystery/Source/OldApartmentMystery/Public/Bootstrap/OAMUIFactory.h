// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "UI/OAMHUDWidget.h"
#include "OAMUIFactory.generated.h"

class UTextBlock;
class UButton;
class UCanvasPanel;
class UImage;
class UVerticalBox;
class UHorizontalBox;
class UScrollBox;
class USlider;
class UCheckBox;
class UProgressBar;
class APlayerController;

/**
 * UI 程序化工厂（静态方法入口）。
 * 不依赖蓝图 Widget，所有控件树在 C++ NativeConstruct 中构建。
 */
UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMUIFactory : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateMainMenu(APlayerController* PC);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateGameplayHUD(APlayerController* PC);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreatePauseMenu(APlayerController* PC);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateSettings(APlayerController* PC);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateLevelSelect(APlayerController* PC);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateSaveLoad(APlayerController* PC, bool bLoadMode = true);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateNotebook(APlayerController* PC);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreatePuzzle(APlayerController* PC, FName PuzzleID);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateExamine(APlayerController* PC, FName ItemID);

	UFUNCTION(BlueprintCallable, Category = "OAM|UIFactory")
	static UUserWidget* CreateChapterComplete(APlayerController* PC, int32 ChapterID);
};

/* =====================================================================
   =================== 程序化 Widget 类（NativeConstruct）==============
   ===================================================================== */

/* ------------------------ 主菜单 Widget ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMMainMenuWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	virtual void NativeConstruct() override;
	virtual void NativeDestruct() override;

protected:
	UFUNCTION() void HandleStart();
	UFUNCTION() void HandleLevels();
	UFUNCTION() void HandleSettings();
	UFUNCTION() void HandleContinue();
	UFUNCTION() void HandleExport();
	UFUNCTION() void HandleQuit();

	UPROPERTY() TObjectPtr<UButton> Btn_Start;
	UPROPERTY() TObjectPtr<UButton> Btn_Levels;
	UPROPERTY() TObjectPtr<UButton> Btn_Settings;
	UPROPERTY() TObjectPtr<UButton> Btn_Continue;
	UPROPERTY() TObjectPtr<UButton> Btn_Export;
	UPROPERTY() TObjectPtr<UButton> Btn_Quit;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Title;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Subtitle;
	UPROPERTY() TObjectPtr<UImage> Img_BG;
	UPROPERTY() TObjectPtr<UImage> Img_Vignette;
};

/* ------------------------ 程序化 HUD Widget ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeHUDWidget : public UOAMHUDWidget
{
	GENERATED_BODY()
public:
	virtual void NativeConstruct() override;
};

/* ------------------------ 程序化 暂停菜单 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMPauseMenuWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleResume();
	UFUNCTION() void HandleSettings();
	UFUNCTION() void HandleSave();
	UFUNCTION() void HandleLoad();
	UFUNCTION() void HandleBackToMenu();
	UPROPERTY() TObjectPtr<UButton> Btn_Resume, *Btn_Settings, *Btn_Save, *Btn_Load, *Btn_Menu;
};

/* ------------------------ 程序化 设置面板 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeSettingsWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleApply();
	UFUNCTION() void HandleDefaults();
	UFUNCTION() void HandleClose();
	UPROPERTY() TObjectPtr<USlider> Sld_Master, *Sld_Music, *Sld_SFX, *Sld_Ambient, *Sld_Sens, *Sld_FOV, *Sld_Brightness, *Sld_Grain;
	UPROPERTY() TObjectPtr<UCheckBox> Chk_VSync, *Chk_Shake, *Chk_Flash, *Chk_Subtitle;
	UPROPERTY() TObjectPtr<UButton> Btn_Apply, *Btn_Defaults, *Btn_Close;
};

/* ------------------------ 程序化 关卡选择 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeLevelSelectWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleCh1();
	UFUNCTION() void HandleCh2();
	UFUNCTION() void HandleCh3();
	UFUNCTION() void HandleBack();
	UPROPERTY() TObjectPtr<UButton> Btn_Ch1, *Btn_Ch2, *Btn_Ch3, *Btn_Back;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Ch1_Title, *Txt_Ch2_Title, *Txt_Ch3_Title;
};

/* ------------------------ 程序化 存档/读档 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeSaveLoadWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite) bool bLoadMode = true;
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleSlot(int32 I);
	UFUNCTION() void HandleClose();
	UPROPERTY() TArray<TObjectPtr<UButton>> Btn_Slots;
	UPROPERTY() TArray<TObjectPtr<UButton>> Btn_Actions;
	UPROPERTY() TObjectPtr<UButton> Btn_Close;
};

/* ------------------------ 程序化 笔记本 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeNotebookWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleTab(int32 Tab);
	UFUNCTION() void HandlePage(int32 Delta);
	UFUNCTION() void HandleClose();
	UPROPERTY() TObjectPtr<UButton> Btn_Tab1, *Btn_Tab2, *Btn_Tab3, *Btn_Prev, *Btn_Next, *Btn_Close;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Content, *Txt_Title, *Txt_Page;
	UPROPERTY() TObjectPtr<UCanvasPanel> RootCanvas;
	int32 CurrentTab = 0;
	int32 CurrentPage = 0;
	void RefreshView();
};

/* ------------------------ 程序化 谜题锁 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimePuzzleWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FName PuzzleID;
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleDigit(int32 D);
	UFUNCTION() void HandleClear();
	UFUNCTION() void HandleSubmit();
	UFUNCTION() void HandleClose();
	UPROPERTY() TArray<TObjectPtr<UButton>> Btn_Digits;
	UPROPERTY() TObjectPtr<UButton> Btn_Clear, *Btn_Submit, *Btn_Close;
	UPROPERTY() TArray<TObjectPtr<UTextBlock>> Txt_Slots;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Hint, *Txt_Attempts, *Txt_Title;
	TArray<int32> CurrentInput;
	int32 MaxDigits = 4;
	void RefreshSlots();
};

/* ------------------------ 程序化 物品检查 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeExamineWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FName ItemID;
	virtual void NativeConstruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;
protected:
	UFUNCTION() void HandleRotateLeft();
	UFUNCTION() void HandleRotateRight();
	UFUNCTION() void HandleNext();
	UFUNCTION() void HandleHotspot(int32 I);
	UFUNCTION() void HandleClose();
	UPROPERTY() TObjectPtr<UCanvasPanel> RootCanvas;
	UPROPERTY() TObjectPtr<UImage> Img_Item;
	UPROPERTY() TObjectPtr<UButton> Btn_RotL, *Btn_RotR, *Btn_Next, *Btn_Close;
	UPROPERTY() TArray<TObjectPtr<UButton>> Btn_Hotspots;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Name, *Txt_Flavor, *Txt_Page;
	float CurrentYaw = 0;
	int32 CurrentFlavor = 0;
};

/* ------------------------ 程序化 章节结算 ------------------------ */

UCLASS(Abstract)
class OLDAPARTMENTMYSTERY_API UOAMRuntimeChapterCompleteWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 ChapterID = 1;
	virtual void NativeConstruct() override;
protected:
	UFUNCTION() void HandleNext();
	UFUNCTION() void HandleMenu();
	UFUNCTION() void HandleReplay();
	UPROPERTY() TObjectPtr<UButton> Btn_Next, *Btn_Menu, *Btn_Replay;
	UPROPERTY() TObjectPtr<UTextBlock> Txt_Title, *Txt_Time, *Txt_Items, *Txt_Notes, *Txt_Obj, *Txt_Fails, *Txt_Sub;
};
