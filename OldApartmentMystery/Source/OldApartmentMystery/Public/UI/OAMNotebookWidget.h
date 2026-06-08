// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMNotebookWidget.generated.h"

class UButton; class UTextBlock; class UWidgetSwitcher; class UVerticalBox; class UHorizontalBox; class UImage;

UENUM(Blueprintable)
enum class EOAMNotebookTab : uint8 { Notes, Clues, Inventory };

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMNotebookWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Close;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_TabNotes;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_TabClues;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_TabInventory;
	UPROPERTY(meta = (BindWidget)) UWidgetSwitcher* Switcher_Tabs;
	UPROPERTY(meta = (BindWidget)) UVerticalBox* VBox_NotesList;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_NotesPageContent;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_PrevPage;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_NextPage;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_PageIndicator;
	UPROPERTY(meta = (BindWidget)) UVerticalBox* VBox_CluesList;
	UPROPERTY(meta = (BindWidget)) UVerticalBox* VBox_InventoryList;
	UPROPERTY(meta = (BindWidget)) UHorizontalBox* Box_PageControls;
	UPROPERTY(meta = (BindWidget)) UImage* Img_EmotionStamp;

	UFUNCTION(BlueprintCallable, Category = "OAM|Notebook")
	void SetTab(EOAMNotebookTab Tab);

	UFUNCTION(BlueprintCallable, Category = "OAM|Notebook")
	void RefreshAll();

	UFUNCTION(BlueprintCallable, Category = "OAM|Notebook")
	void TurnPage(int32 Direction);

	UFUNCTION(BlueprintCallable, Category = "OAM|Notebook")
	void RefreshNotesList();

	UFUNCTION(BlueprintCallable, Category = "OAM|Notebook")
	void SelectNote(FName NoteID);

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Notebook")
	int32 CurrentPage = 0;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Notebook")
	int32 CurrentNoteIndex = -1;

protected:
	virtual void NativeConstruct() override;

	UFUNCTION()
	void HandleClose();
	UFUNCTION()
	void HandleTabNotes() { SetTab(EOAMNotebookTab::Notes); RefreshAll(); }
	UFUNCTION()
	void HandleTabClues() { SetTab(EOAMNotebookTab::Clues); RefreshAll(); }
	UFUNCTION()
	void HandleTabInventory() { SetTab(EOAMNotebookTab::Inventory); RefreshAll(); }
};
