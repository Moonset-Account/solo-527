#include "MountainRescueHUD.h"
#include "MountainRescueGameMode.h"
#include "DroneBase.h"
#include "RouteManager.h"
#include "WaypointActor.h"
#include "RescueTarget.h"
#include "SignalSystem.h"
#include "Blueprint/UserWidget.h"
#include "Engine/Canvas.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "Kismet/GameplayStatics.h"
#include "MountainRescueDrone.h"

AMountainRescueHUD::AMountainRescueHUD()
{
	PrimaryActorTick.bCanEverTick = true;
}

void AMountainRescueHUD::BeginPlay()
{
	Super::BeginPlay();
	CacheReferences();
	InitializeWidgets();
}

void AMountainRescueHUD::DrawHUD()
{
	Super::DrawHUD();

	if (!Canvas) return;

	DrawDeliveryZones();
	DrawSignalDeadZones();
	DrawRouteDistances();
	DrawPreviewWaypoint();
	DrawBatteryIndicator();
	DrawSignalIndicator();
}

void AMountainRescueHUD::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	UpdateHoveredLocation();

	if (bDragInProgress && DraggingWaypointIndex != INDEX_NONE && CachedRouteManager.IsValid())
	{
		if (bIsHoveringValidGround)
		{
			CachedRouteManager->MoveWaypoint(DraggingWaypointIndex, HoveredWorldLocation);
		}
	}
}

void AMountainRescueHUD::SetDrawMode(EDrawMode NewMode)
{
	CurrentDrawMode = NewMode;
	UE_LOG(LogMountainRescue, Log, TEXT("HUD绘制模式: %s"), *UEnum::GetValueAsString(NewMode));
}

bool AMountainRescueHUD::HandleScreenClick(FVector2D ScreenPos, bool bLeftClick)
{
	if (!CachedRouteManager.IsValid()) return false;

	FVector GroundPos;
	bool bHasGround = GetGroundLocationAtScreen(ScreenPos, GroundPos);

	if (bLeftClick)
	{
		switch (CurrentDrawMode)
		{
		case EDrawMode::AddingWaypoint:
			if (bHasGround)
			{
				CachedRouteManager->AddWaypointAtLocation(GroundPos, false, -1);
				return true;
			}
			break;
		case EDrawMode::DeletingWaypoint:
		{
			int32 HitIdx = INDEX_NONE;
			for (int32 i = 0; i < CachedRouteManager->WaypointActors.Num(); i++)
			{
				AWaypointActor* WP = CachedRouteManager->WaypointActors[i];
				if (!WP) continue;
				FVector2D WPScreen;
				if (UGameplayStatics::ProjectWorldToScreen(GetOwningPlayerController(), WP->GetActorLocation(), WPScreen))
				{
					if (FVector2D::Distance(WPScreen, ScreenPos) < 40.f)
					{
						HitIdx = i;
						break;
					}
				}
			}
			if (HitIdx != INDEX_NONE)
			{
				CachedRouteManager->RemoveWaypoint(HitIdx);
				return true;
			}
		}
		break;
		default: break;
		}
	}

	return false;
}

bool AMountainRescueHUD::HandleScreenDragStart(FVector2D ScreenPos)
{
	if (CurrentDrawMode != EDrawMode::MovingWaypoint || !CachedRouteManager.IsValid()) return false;

	int32 HitIdx = INDEX_NONE;
	for (int32 i = 0; i < CachedRouteManager->WaypointActors.Num(); i++)
	{
		AWaypointActor* WP = CachedRouteManager->WaypointActors[i];
		if (!WP) continue;
		FVector2D WPScreen;
		if (UGameplayStatics::ProjectWorldToScreen(GetOwningPlayerController(), WP->GetActorLocation(), WPScreen))
		{
			if (FVector2D::Distance(WPScreen, ScreenPos) < 40.f)
			{
				HitIdx = i;
				break;
			}
		}
	}

	if (HitIdx != INDEX_NONE)
	{
		DraggingWaypointIndex = HitIdx;
		bDragInProgress = true;
		DragStartLocation = CachedRouteManager->WaypointData[HitIdx].Location;
		return true;
	}
	return false;
}

bool AMountainRescueHUD::HandleScreenDragMove(FVector2D ScreenPos)
{
	if (!bDragInProgress) return false;
	LastMouseScreenPos = ScreenPos;
	return true;
}

bool AMountainRescueHUD::HandleScreenDragEnd(FVector2D ScreenPos)
{
	bDragInProgress = false;
	DraggingWaypointIndex = INDEX_NONE;
	return true;
}

bool AMountainRescueHUD::DeprojectScreenToWorld(FVector2D ScreenPos, FVector& OutWorldPos, FVector& OutWorldDir) const
{
	APlayerController* PC = GetOwningPlayerController();
	if (!PC) return false;
	return UGameplayStatics::DeprojectScreenToWorld(PC, ScreenPos, OutWorldPos, OutWorldDir);
}

bool AMountainRescueHUD::GetGroundLocationAtScreen(FVector2D ScreenPos, FVector& OutGroundPos, float MinHeight) const
{
	FVector WorldPos, WorldDir;
	if (!DeprojectScreenToWorld(ScreenPos, WorldPos, WorldDir)) return false;

	FHitResult Hit;
	FVector TraceStart = WorldPos;
	FVector TraceEnd = WorldPos + WorldDir * 50000.f;

	FCollisionQueryParams Params;
	Params.AddIgnoredActor(this);

	if (GetWorld()->LineTraceSingleByChannel(Hit, TraceStart, TraceEnd, ECC_WorldStatic, Params))
	{
		OutGroundPos = Hit.ImpactPoint;
		OutGroundPos.Z = FMath::Max(OutGroundPos.Z + 80.f, MinHeight + 80.f);
		return true;
	}
	return false;
}

void AMountainRescueHUD::ShowMainHUD()
{
	if (MainHUDWidgetClass && !MainHUDWidget)
	{
		MainHUDWidget = CreateWidget<UUserWidget>(GetWorld(), MainHUDWidgetClass);
	}
	if (MainHUDWidget) MainHUDWidget->AddToViewport();
}

void AMountainRescueHUD::HideMainHUD()
{
	if (MainHUDWidget) MainHUDWidget->RemoveFromParent();
}

void AMountainRescueHUD::ShowRouteEditor()
{
	if (RouteEditorWidgetClass && !RouteEditorWidget)
	{
		RouteEditorWidget = CreateWidget<UUserWidget>(GetWorld(), RouteEditorWidgetClass);
	}
	if (RouteEditorWidget) RouteEditorWidget->AddToViewport();
	SetDrawMode(EDrawMode::AddingWaypoint);
}

void AMountainRescueHUD::HideRouteEditor()
{
	if (RouteEditorWidget) RouteEditorWidget->RemoveFromParent();
	SetDrawMode(EDrawMode::None);
}

void AMountainRescueHUD::ShowResultScreen(const FScoreBreakdown& Score, EFailureReason Failure)
{
	if (ResultScreenWidgetClass && !ResultScreenWidget)
	{
		ResultScreenWidget = CreateWidget<UUserWidget>(GetWorld(), ResultScreenWidgetClass);
	}
	if (ResultScreenWidget) ResultScreenWidget->AddToViewport();
}

void AMountainRescueHUD::HideResultScreen()
{
	if (ResultScreenWidget) ResultScreenWidget->RemoveFromParent();
}

void AMountainRescueHUD::ShowTaskEditor()
{
	if (TaskEditorWidgetClass && !TaskEditorWidget)
	{
		TaskEditorWidget = CreateWidget<UUserWidget>(GetWorld(), TaskEditorWidgetClass);
	}
	if (TaskEditorWidget) TaskEditorWidget->AddToViewport();
}

void AMountainRescueHUD::HideTaskEditor()
{
	if (TaskEditorWidget) TaskEditorWidget->RemoveFromParent();
}

void AMountainRescueHUD::ShowReplayControls()
{
	if (ReplayWidgetClass && !ReplayWidget)
	{
		ReplayWidget = CreateWidget<UUserWidget>(GetWorld(), ReplayWidgetClass);
	}
	if (ReplayWidget) ReplayWidget->AddToViewport();
}

void AMountainRescueHUD::HideReplayControls()
{
	if (ReplayWidget) ReplayWidget->RemoveFromParent();
}

void AMountainRescueHUD::DrawWaypointProjection(int32 WaypointIndex, FLinearColor Color, float ScreenOffset)
{
	if (!CachedRouteManager.IsValid() || !CachedRouteManager->WaypointActors.IsValidIndex(WaypointIndex)) return;
	AWaypointActor* WP = CachedRouteManager->WaypointActors[WaypointIndex];
	if (!WP) return;

	APlayerController* PC = GetOwningPlayerController();
	FVector2D ScreenPos;
	if (UGameplayStatics::ProjectWorldToScreen(PC, WP->GetActorLocation() + FVector(0, 0, ScreenOffset), ScreenPos))
	{
		DrawText(FString::Printf(TEXT("%d"), WaypointIndex + 1), Color, ScreenPos.X, ScreenPos.Y, nullptr, 1.5f);
	}
}

void AMountainRescueHUD::DrawRouteDistances()
{
	if (!CachedRouteManager.IsValid() || !Canvas) return;

	APlayerController* PC = GetOwningPlayerController();
	for (int32 i = 0; i < CachedRouteManager->WaypointData.Num() - 1; i++)
	{
		const FWaypoint& A = CachedRouteManager->WaypointData[i];
		const FWaypoint& B = CachedRouteManager->WaypointData[i + 1];

		FVector MidPoint = (A.Location + B.Location) * 0.5f;
		FVector2D ScreenPos;
		if (UGameplayStatics::ProjectWorldToScreen(PC, MidPoint, ScreenPos))
		{
			float Dist = FVector::Dist(A.Location, B.Location) / 100.f;
			DrawText(FString::Printf(TEXT("%.0fm"), Dist),
				FLinearColor(0.5f, 1.f, 1.f, 0.9f),
				ScreenPos.X - 20, ScreenPos.Y, nullptr, 1.0f);
		}
	}
}

void AMountainRescueHUD::DrawDeliveryZones()
{
	if (!CachedGameMode.IsValid() || !Canvas) return;

	APlayerController* PC = GetOwningPlayerController();
	TArray<ARescueTarget*> Targets = CachedGameMode->GetAllTargets();
	for (ARescueTarget* Target : Targets)
	{
		if (!Target || Target->bIsRescued) continue;

		FVector2D CenterScreen;
		if (UGameplayStatics::ProjectWorldToScreen(PC, Target->GetActorLocation(), CenterScreen))
		{
			float RadiusMeters = 50.f;
			FVector EdgePoint = Target->GetActorLocation() + FVector(RadiusMeters * 100.f, 0, 0);
			FVector2D EdgeScreen;
			if (UGameplayStatics::ProjectWorldToScreen(PC, EdgePoint, EdgeScreen))
			{
				float ScreenRadius = FMath::Abs(EdgeScreen.X - CenterScreen.X);
				FColor ZoneColor = Target->GetPriority() == ETaskPriority::Critical ? FColor(255, 50, 50)
					: Target->GetPriority() == ETaskPriority::High ? FColor(255, 180, 50)
					: FColor(50, 255, 100);
				DrawCircle(CenterScreen.X, CenterScreen.Y, ScreenRadius, ScreenRadius, 32, ZoneColor);
			}
		}
	}
}

void AMountainRescueHUD::DrawSignalDeadZones()
{
	if (!Canvas) return;

	ASignalSystem* SigSys = nullptr;
	for (TActorIterator<ASignalSystem> It(GetWorld()); It; ++It) { SigSys = *It; break; }
	if (!SigSys) return;

	APlayerController* PC = GetOwningPlayerController();
	for (const FSignalDeadZone& Zone : SigSys->DeadZones)
	{
		FVector2D CenterScreen;
		if (UGameplayStatics::ProjectWorldToScreen(PC, Zone.CenterLocation, CenterScreen))
		{
			FVector EdgePoint = Zone.CenterLocation + FVector(Zone.Radius, 0, 0);
			FVector2D EdgeScreen;
			if (UGameplayStatics::ProjectWorldToScreen(PC, EdgePoint, EdgeScreen))
			{
				float ScreenRadius = FMath::Abs(EdgeScreen.X - CenterScreen.X);
				DrawCircle(CenterScreen.X, CenterScreen.Y, ScreenRadius, ScreenRadius, 48,
					FColor(255, 120, 0, 100));
				DrawText(TEXT("信号盲区"), FLinearColor(1.f, 0.5f, 0.f),
					CenterScreen.X - 40, CenterScreen.Y, nullptr, 1.0f);
			}
		}
	}
}

void AMountainRescueHUD::InitializeWidgets()
{
	ShowMainHUD();
}

void AMountainRescueHUD::CacheReferences()
{
	for (TActorIterator<AMountainRescueGameMode> It(GetWorld()); It; ++It) { CachedGameMode = *It; break; }
	for (TActorIterator<ADroneBase> It(GetWorld()); It; ++It) { CachedDrone = *It; break; }
	for (TActorIterator<ARouteManager> It(GetWorld()); It; ++It) { CachedRouteManager = *It; break; }
}

void AMountainRescueHUD::UpdateHoveredLocation()
{
	APlayerController* PC = GetOwningPlayerController();
	if (!PC) return;

	float MouseX, MouseY;
	PC->GetMousePosition(MouseX, MouseY);
	LastMouseScreenPos = FVector2D(MouseX, MouseY);
	bIsHoveringValidGround = GetGroundLocationAtScreen(LastMouseScreenPos, HoveredWorldLocation);
}

void AMountainRescueHUD::DrawPreviewWaypoint()
{
	if (CurrentDrawMode != EDrawMode::AddingWaypoint || !bIsHoveringValidGround || !Canvas) return;

	APlayerController* PC = GetOwningPlayerController();
	FVector2D ScreenPos;
	if (UGameplayStatics::ProjectWorldToScreen(PC, HoveredWorldLocation, ScreenPos))
	{
		DrawCircle(ScreenPos.X, ScreenPos.Y, 30, 30, 16, FColor(255, 255, 255, 150));
		DrawText(TEXT("点击添加"), FLinearColor::White, ScreenPos.X + 35, ScreenPos.Y, nullptr, 0.9f);
	}
}

void AMountainRescueHUD::DrawBatteryIndicator()
{
	if (!CachedDrone.IsValid() || !Canvas) return;

	float Battery = CachedDrone->GetBatteryPercent();
	FVector2D BarSize(200, 20);
	FVector2D BarPos(20, Canvas->SizeY - 40);

	FColor BarColor = Battery > 0.5f ? FColor::Green
		: Battery > 0.2f ? FColor::Yellow
		: FColor::Red;

	DrawRect(FColor(50, 50, 50, 200), BarPos.X, BarPos.Y, BarSize.X, BarSize.Y);
	DrawRect(BarColor, BarPos.X + 2, BarPos.Y + 2, (BarSize.X - 4) * Battery, BarSize.Y - 4);

	FString BatteryText = FString::Printf(TEXT("电量 %d%%"), FMath::RoundToInt(Battery * 100));
	DrawText(BatteryText, FLinearColor::White, BarPos.X, BarPos.Y - 22, nullptr, 1.0f);
}

void AMountainRescueHUD::DrawSignalIndicator()
{
	if (!CachedDrone.IsValid() || !Canvas) return;

	float Signal = CachedDrone->GetSignalStrength();
	FVector2D BarSize(200, 20);
	FVector2D BarPos(240, Canvas->SizeY - 40);

	FColor BarColor = Signal > 0.7f ? FColor::Green
		: Signal > 0.3f ? FColor::Yellow
		: FColor::Red;

	DrawRect(FColor(50, 50, 50, 200), BarPos.X, BarPos.Y, BarSize.X, BarSize.Y);
	DrawRect(BarColor, BarPos.X + 2, BarPos.Y + 2, (BarSize.X - 4) * Signal, BarSize.Y - 4);

	FString SignalText = FString::Printf(TEXT("信号 %d%%"), FMath::RoundToInt(Signal * 100));
	DrawText(SignalText, FLinearColor::White, BarPos.X, BarPos.Y - 22, nullptr, 1.0f);

	if (CachedDrone->IsSignalLost())
	{
		DrawText(TEXT("⚠ 信号丢失！自动返航中"), FLinearColor::Red, BarPos.X, BarPos.Y - 44, nullptr, 1.1f);
	}
}
