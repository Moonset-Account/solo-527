#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "OldApartmentBootstrapActor.generated.h"

class UUserWidget;

UENUM(BlueprintType)
enum class EBootstrapLevelType : uint8
{
	AutoDetect   UMETA(DisplayName = "自动检测关卡名"),
	MainMenu     UMETA(DisplayName = "主菜单"),
	ChapterLevel UMETA(DisplayName = "游戏关卡"),
};

UCLASS()
class OLDAPARTMENTMYSTERY_API AOldApartmentBootstrapActor : public AActor
{
	GENERATED_BODY()

public:
	AOldApartmentBootstrapActor();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bootstrap")
	EBootstrapLevelType LevelType;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bootstrap")
	bool bAutoSetupInput;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Bootstrap")
	bool bAutoCreateUI;

protected:
	UFUNCTION()
	void SetupForMainMenu();

	UFUNCTION()
	void SetupForGameplayLevel();

	UFUNCTION()
	void CreateFallbackMainMenu();

	UFUNCTION()
	void CreateFallbackHUD();

	UFUNCTION()
	void CreateFallbackTutorial();

	UFUNCTION()
	void CreateFallbackPauseMenu();

	UFUNCTION()
	void CreateFallbackChapterResult();

	UFUNCTION()
	void CreateFallbackDialLockPuzzle();

	UFUNCTION()
	void EnhancedInputAutoSetup();

	UFUNCTION()
	void OnMainMenuStartGame();

	UFUNCTION()
	void OnMainMenuSettings();

	UFUNCTION()
	void OnMainMenuQuit();

	UFUNCTION()
	void OnPauseResume();

	UFUNCTION()
	void OnPauseSettings();

	UFUNCTION()
	void OnPauseToMenu();

	UFUNCTION()
	void OnPauseOpenNotebook();

	UFUNCTION()
	void OnPuzzleSubmit(int32 Code0, int32 Code1, int32 Code2, int32 Code3);

	UFUNCTION()
	void OnChapterResultReplay();

	UFUNCTION()
	void OnChapterResultToMenu();

	UFUNCTION()
	void HandleEndLevelOverlap();

	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	UFUNCTION()
	void HandleQuickPause();

	UFUNCTION()
	void HandleTriggerChapterEnd();

	UFUNCTION()
	void HandleInteractDialLock();

private:
	UPROPERTY()
	TArray<UUserWidget*> CreatedWidgets;

	bool bTutorialShown;
	bool bChapterEnded;
	bool bPuzzleSolved;
	bool bPauseActive;
	int32 CluesCollected;
	int32 TotalClues;
	float ChapterStartTime;

	UPROPERTY()
	UUserWidget* ActivePauseWidget;

	UPROPERTY()
	UUserWidget* ActivePuzzleWidget;

	UPROPERTY()
	UUserWidget* ActiveChapterResultWidget;

	int32 DialCode[4];
};
