#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "MountainRescueTypes.h"
#include "MountainRescueHUD.generated.h"

class AMountainRescueGameMode;
class ADroneBase;
class ARouteManager;
class UCanvas;
class UUserWidget;

UENUM(BlueprintType)
enum class EDrawMode : uint8
{
	None				UMETA(DisplayName = "无"),
	AddingWaypoint		UMETA(DisplayName = "添加航线点"),
	MovingWaypoint		UMETA(DisplayName = "移动航线点"),
	DeletingWaypoint	UMETA(DisplayName = "删除航线点"),
	MAX					UMETA(Hidden)
};

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API AMountainRescueHUD : public AHUD
{
	GENERATED_BODY()

public:
	AMountainRescueHUD();

protected:
	virtual void BeginPlay() override;

public:
	virtual void DrawHUD() override;
	virtual void Tick(float DeltaSeconds) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "HUD|Widget")
	TSubclassOf<UUserWidget> MainHUDWidgetClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "HUD|Widget")
	TSubclassOf<UUserWidget> RouteEditorWidgetClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "HUD|Widget")
	TSubclassOf<UUserWidget> ResultScreenWidgetClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "HUD|Widget")
	TSubclassOf<UUserWidget> TaskEditorWidgetClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "HUD|Widget")
	TSubclassOf<UUserWidget> ReplayWidgetClass;

	UPROPERTY(BlueprintReadOnly, Category = "HUD|状态")
	EDrawMode CurrentDrawMode = EDrawMode::None;

	UPROPERTY(BlueprintReadOnly, Category = "HUD|状态")
	int32 DraggingWaypointIndex = INDEX_NONE;

	UPROPERTY(BlueprintReadOnly, Category = "HUD|状态")
	FVector HoveredWorldLocation = FVector::ZeroVector;

	UPROPERTY(BlueprintReadOnly, Category = "HUD|状态")
	bool bIsHoveringValidGround = false;

public:
	UFUNCTION(BlueprintCallable, Category = "HUD|输入")
	void SetDrawMode(EDrawMode NewMode);

	UFUNCTION(BlueprintCallable, Category = "HUD|输入")
	bool HandleScreenClick(FVector2D ScreenPos, bool bLeftClick);

	UFUNCTION(BlueprintCallable, Category = "HUD|输入")
	bool HandleScreenDragStart(FVector2D ScreenPos);
	UFUNCTION(BlueprintCallable, Category = "HUD|输入")
	bool HandleScreenDragMove(FVector2D ScreenPos);
	UFUNCTION(BlueprintCallable, Category = "HUD|输入")
	bool HandleScreenDragEnd(FVector2D ScreenPos);

	UFUNCTION(BlueprintCallable, Category = "HUD|查询")
	bool DeprojectScreenToWorld(FVector2D ScreenPos, FVector& OutWorldPos, FVector& OutWorldDir) const;

	UFUNCTION(BlueprintCallable, Category = "HUD|查询")
	bool GetGroundLocationAtScreen(FVector2D ScreenPos, FVector& OutGroundPos, float MinHeight = 0.f) const;

	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void ShowMainHUD();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void HideMainHUD();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void ShowRouteEditor();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void HideRouteEditor();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void ShowResultScreen(const FScoreBreakdown& Score, EFailureReason Failure);
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void HideResultScreen();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void ShowTaskEditor();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void HideTaskEditor();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void ShowReplayControls();
	UFUNCTION(BlueprintCallable, Category = "HUD|UI")
	void HideReplayControls();

	UFUNCTION(BlueprintCallable, Category = "HUD|绘制")
	void DrawWaypointProjection(int32 WaypointIndex, FLinearColor Color, float ScreenOffset = 50.f);

	UFUNCTION(BlueprintCallable, Category = "HUD|绘制")
	void DrawRouteDistances();

	UFUNCTION(BlueprintCallable, Category = "HUD|绘制")
	void DrawDeliveryZones();

	UFUNCTION(BlueprintCallable, Category = "HUD|绘制")
	void DrawSignalDeadZones();

protected:
	UPROPERTY()
	TWeakObjectPtr<AMountainRescueGameMode> CachedGameMode;

	UPROPERTY()
	TWeakObjectPtr<ADroneBase> CachedDrone;

	UPROPERTY()
	TWeakObjectPtr<ARouteManager> CachedRouteManager;

	UPROPERTY()
	TObjectPtr<UUserWidget> MainHUDWidget;

	UPROPERTY()
	TObjectPtr<UUserWidget> RouteEditorWidget;

	UPROPERTY()
	TObjectPtr<UUserWidget> ResultScreenWidget;

	UPROPERTY()
	TObjectPtr<UUserWidget> TaskEditorWidget;

	UPROPERTY()
	TObjectPtr<UUserWidget> ReplayWidget;

	bool bDragInProgress = false;
	FVector DragStartLocation;
	FVector2D LastMouseScreenPos;

	virtual void InitializeWidgets();
	virtual void CacheReferences();
	virtual void UpdateHoveredLocation();
	virtual void DrawPreviewWaypoint();
	virtual void DrawBatteryIndicator();
	virtual void DrawSignalIndicator();
};
