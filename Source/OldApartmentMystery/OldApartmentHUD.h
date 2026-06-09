#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "OldApartmentHUD.generated.h"

class UUserWidget;

UCLASS(Blueprintable, BlueprintType)
class OLDAPARTMENTMYSTERY_API AOldApartmentHUD : public AHUD
{
	GENERATED_BODY()

public:
	AOldApartmentHUD();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowMainHUD();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HideMainHUD();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowPauseMenu();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HidePauseMenu();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowNotebook();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HideNotebook();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowTutorialPage(const FString& TutorialKey);

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowChapterResult();

protected:
	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "UI|MainHUD")
	TSubclassOf<UUserWidget> MainHUDWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "UI|Pause")
	TSubclassOf<UUserWidget> PauseMenuWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "UI|Notebook")
	TSubclassOf<UUserWidget> NotebookWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "UI|Tutorial")
	TSubclassOf<UUserWidget> TutorialWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "UI|Chapter")
	TSubclassOf<UUserWidget> ChapterResultWidgetClass;

	UPROPERTY()
	UUserWidget* MainHUDWidget;

	UPROPERTY()
	UUserWidget* PauseMenuWidget;

	UPROPERTY()
	UUserWidget* NotebookWidget;

	UPROPERTY()
	UUserWidget* TutorialWidget;

	UPROPERTY()
	UUserWidget* ChapterResultWidget;

	UPROPERTY(BlueprintReadOnly, Category = "UI|State")
	bool bMainHUDVisible;

	UPROPERTY(BlueprintReadOnly, Category = "UI|State")
	bool bPauseMenuVisible;

	UPROPERTY(BlueprintReadOnly, Category = "UI|State")
	bool bNotebookVisible;
};
