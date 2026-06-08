// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMPuzzleWidget.generated.h"

class AOAMLockPuzzleActor;
class UButton; class UTextBlock; class UHorizontalBox;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMPuzzleWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Close;
	UPROPERTY(meta = (BindWidget)) UHorizontalBox* HBox_DigitSlots;
	UPROPERTY(meta = (BindWidget)) UVerticalBox* VBox_DigitPad;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Submit;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Clear;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Hint;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Attempts;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Feedback;
	UPROPERTY(meta = (BindWidget)) class UImage* Img_ShakeRoot;

	UPROPERTY(BlueprintReadWrite, Category = "OAM|Puzzle")
	TWeakObjectPtr<AOAMLockPuzzleActor> PuzzleActor;

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void BindToPuzzle(AOAMLockPuzzleActor* Actor);

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void HandleDigitInput(int32 Digit);

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void HandleSubmit();

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void HandleClear();

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void TriggerShake(float Intensity = 12.f);

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void UpdateDigitsDisplay();

protected:
	virtual void NativeConstruct() override;

	UFUNCTION()
	void HandleClose();
};
