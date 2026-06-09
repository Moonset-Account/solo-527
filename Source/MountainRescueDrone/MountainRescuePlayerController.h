#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "MountainRescueTypes.h"
#include "MountainRescuePlayerController.generated.h"

class AMountainRescueHUD;
class AMountainRescueGameMode;
class ADroneBase;
class ARouteManager;
class UInputMappingContext;
class UInputAction;
class UTaskEditorComponent;
struct FInputActionValue;

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API AMountainRescuePlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	AMountainRescuePlayerController();

protected:
	virtual void BeginPlay() override;
	virtual void SetupInputComponent() override;

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入")
	TObjectPtr<UInputMappingContext> InputMappingContext;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> LeftClickAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> RightClickAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> MouseDragAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> ModeAddAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> ModeMoveAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> ModeDeleteAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> StartFlightAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> ReturnHomeAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> ToggleEditorAction;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "输入|动作")
	TObjectPtr<UInputAction> PauseAction;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UTaskEditorComponent> TaskEditor;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bLeftMouseDown = false;
	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bRightMouseDown = false;

public:
	UFUNCTION(BlueprintCallable, Category = "输入|处理")
	void OnLeftClickTriggered(const FInputActionValue& Value);
	UFUNCTION(BlueprintCallable, Category = "输入|处理")
	void OnRightClickTriggered(const FInputActionValue& Value);
	UFUNCTION(BlueprintCallable, Category = "输入|处理")
	void OnMouseDragStarted(const FInputActionValue& Value);
	UFUNCTION(BlueprintCallable, Category = "输入|处理")
	void OnMouseDragOngoing(const FInputActionValue& Value);
	UFUNCTION(BlueprintCallable, Category = "输入|处理")
	void OnMouseDragCompleted(const FInputActionValue& Value);

	UFUNCTION(BlueprintCallable, Category = "输入|模式")
	void SetModeAdd() { SetHUDMode(0); }
	UFUNCTION(BlueprintCallable, Category = "输入|模式")
	void SetModeMove() { SetHUDMode(1); }
	UFUNCTION(BlueprintCallable, Category = "输入|模式")
	void SetModeDelete() { SetHUDMode(2); }

	UFUNCTION(BlueprintCallable, Category = "输入|任务")
	void HandleStartFlight();
	UFUNCTION(BlueprintCallable, Category = "输入|任务")
	void HandleReturnHome();
	UFUNCTION(BlueprintCallable, Category = "输入|任务")
	void HandleToggleEditor();
	UFUNCTION(BlueprintCallable, Category = "输入|任务")
	void HandlePause();

protected:
	void SetHUDMode(int32 ModeIndex);
	FVector2D GetMouseScreenPosition() const;
};
