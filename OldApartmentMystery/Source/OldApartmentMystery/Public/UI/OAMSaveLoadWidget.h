// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMSaveLoadWidget.generated.h"

class UVerticalBox; class UButton; class UTextBlock;

USTRUCT(BlueprintType)
struct FOAMSaveSlotUI
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly)	int32 Index = 0;
	UPROPERTY(BlueprintReadOnly)	bool bHasData = false;
	UPROPERTY(BlueprintReadOnly)	FText Display;
};

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMSaveLoadWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Save")
	bool bIsLoadMode = true;

	UPROPERTY(meta = (BindWidget)) UVerticalBox* VBox_Slots;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Close;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_ModeTitle;

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	void RefreshSlots();

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	void HandleSlotClicked(int32 SlotIndex);

protected:
	virtual void NativeConstruct() override;

	UFUNCTION()
	void HandleClose();
};
