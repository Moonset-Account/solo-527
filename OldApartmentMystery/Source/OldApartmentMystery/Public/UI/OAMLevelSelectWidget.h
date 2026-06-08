// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMLevelSelectWidget.generated.h"

class UVerticalBox; class UButton; class UTextBlock; class UImage;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMLevelSelectWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) UVerticalBox* VBox_ChapterCards;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Close;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Title;

	UFUNCTION(BlueprintCallable, Category = "OAM|LevelSelect")
	void RefreshCards();

	UFUNCTION(BlueprintCallable, Category = "OAM|LevelSelect")
	void HandleChapterSelected(int32 ChapterID);

protected:
	virtual void NativeConstruct() override;

	UFUNCTION()
	void HandleClose();
};
