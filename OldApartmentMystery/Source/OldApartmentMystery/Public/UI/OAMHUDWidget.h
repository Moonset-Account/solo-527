// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMHUDWidget.generated.h"

class UTextBlock;
class UProgressBar;
class UCanvasPanel;
class UImage;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMHUDWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_InteractPrompt;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_ObjectiveText;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_ChapterTitle;
	UPROPERTY(meta = (BindWidget)) UProgressBar* Progress_Objective;
	UPROPERTY(meta = (BindWidget)) UCanvasPanel* Panel_ToastContainer;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_CurrentRoom;
	UPROPERTY(meta = (BindWidget)) UImage* Img_Crosshair;
	UPROPERTY(meta = (BindWidget)) UImage* Img_DamageFlash;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Clock;

	UFUNCTION(BlueprintCallable, Category = "OAM|HUD")
	void UpdateInteractPrompt(const FText& NewText);

	UFUNCTION(BlueprintCallable, Category = "OAM|HUD")
	void UpdateObjective(const FText& Desc, float CompletionPercent);

	UFUNCTION(BlueprintCallable, Category = "OAM|HUD")
	void ShowToast(const FText& Message, EOAMToastType Type, float Duration = 2.5f);

	UFUNCTION(BlueprintCallable, Category = "OAM|HUD")
	void SetChapterTitle(const FText& Title, const FText& Subtitle);

	UFUNCTION(BlueprintCallable, Category = "OAM|HUD")
	void TriggerDamageFlash(float Duration = 0.4f);

	UFUNCTION(BlueprintCallable, Category = "OAM|HUD")
	void SetCurrentRoom(const FText& Room);

protected:
	virtual void NativeConstruct() override;

	UFUNCTION()
	void HideChapterTitle();

	UPROPERTY()
	FTimerHandle HideTitleTimer;
};
