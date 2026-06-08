// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMChapterCompleteWidget.generated.h"

class UButton; class UTextBlock; class UProgressBar;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMChapterCompleteWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_ChapterTitle;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_TimeValue;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_ItemsValue;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_NotesValue;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_PuzzlesValue;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_FailsValue;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_CompletionValue;
	UPROPERTY(meta = (BindWidget)) UProgressBar* Bar_Completion;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_NextChapter;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_MainMenu;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Narration;

	UPROPERTY(BlueprintReadWrite, Category = "OAM|Complete")
	int32 CompletedChapterID = 1;

	UFUNCTION(BlueprintCallable, Category = "OAM|Complete")
	void PopulateFromRecord(const FOAMChapterRecord& Record, int32 TotalObjectivesDone, int32 TotalObjectives, bool bHasNextChapter);

protected:
	virtual void NativeConstruct() override;

	UFUNCTION()
	void HandleNext();
	UFUNCTION()
	void HandleMenu();
};
