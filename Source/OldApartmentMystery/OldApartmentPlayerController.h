#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "EnhancedInputSubsystems.h"
#include "OldApartmentPlayerController.generated.h"

class UInputMappingContext;
class UInputAction;
struct FInputActionValue;
class UOldApartmentSaveGame;
class UUserWidget;

UENUM(BlueprintType)
enum class EPlayerInteractionMode : uint8
{
	Explore        UMETA(DisplayName = "探索模式"),
	ExamineItem    UMETA(DisplayName = "物品检查模式"),
	Puzzle         UMETA(DisplayName = "谜题模式"),
	UI             UMETA(DisplayName = "UI模式"),
	Cinematic      UMETA(DisplayName = "过场模式"),
	Disabled       UMETA(DisplayName = "禁用")
};

UCLASS()
class OLDAPARTMENTMYSTERY_API AOldApartmentPlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	AOldApartmentPlayerController();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputMappingContext* DefaultMappingContext;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* MoveAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* LookAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* InteractAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* ExamineAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* NotebookAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* InventoryAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* PauseAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* CrouchAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* SprintAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* FlashlightAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Input")
	UInputAction* BackAction;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "State")
	EPlayerInteractionMode CurrentMode;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "UI")
	UUserWidget* MainHUDWidget;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "UI")
	UUserWidget* PauseMenuWidget;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "UI")
	UUserWidget* TutorialWidget;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interaction")
	float InteractionDistance;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interaction")
	float InteractionTraceRadius;

	UFUNCTION(BlueprintCallable, Category = "State")
	void SetInteractionMode(EPlayerInteractionMode NewMode);

	UFUNCTION(BlueprintPure, Category = "State")
	bool CanInteract() const;

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	AActor* GetInteractableInView();

	UFUNCTION(BlueprintImplementableEvent, Category = "Interaction")
	void OnInteractTargetChanged(AActor* NewTarget);

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowMainHUD();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void HideMainHUD();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void TogglePauseMenu();

	UFUNCTION(BlueprintCallable, Category = "UI")
	void ShowTutorialPage(const FString& TutorialKey);

	UFUNCTION(BlueprintCallable, Category = "Save")
	void QuickSave();

	UFUNCTION(BlueprintCallable, Category = "Save")
	void QuickLoad();

	UFUNCTION(BlueprintImplementableEvent, Category = "Save")
	void OnQuickSaveComplete(bool bSuccess);

	UFUNCTION(BlueprintImplementableEvent, Category = "Save")
	void OnQuickLoadComplete(bool bSuccess);

protected:
	virtual void BeginPlay() override;
	virtual void SetupInputComponent() override;
	virtual void Tick(float DeltaSeconds) override;
	virtual void PlayerTick(float DeltaSeconds) override;

	void HandleMove(const FInputActionValue& Value);
	void HandleLook(const FInputActionValue& Value);
	void HandleInteract();
	void HandleExamine();
	void HandleNotebook();
	void HandleInventory();
	void HandlePause();
	void HandleCrouch();
	void HandleSprintStart();
	void HandleSprintEnd();
	void HandleFlashlight();
	void HandleBack();

	UFUNCTION()
	void OnPauseMenuClosed();

private:
	UPROPERTY()
	AActor* LastInteractTarget;

	FVector2D SmoothLookInput;
	float CachedInteractCheckTimer;
};
