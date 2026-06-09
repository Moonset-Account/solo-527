#include "MountainRescueGameMode.h"
#include "DroneBase.h"
#include "RouteManager.h"
#include "WeatherSystem.h"
#include "SignalSystem.h"
#include "RescueTarget.h"
#include "ReplaySystem.h"
#include "DroppedSupply.h"
#include "Components/AudioComponent.h"
#include "EngineUtils.h"
#include "MountainRescueDrone.h"

AMountainRescueGameMode::AMountainRescueGameMode()
{
	PrimaryActorTick.bCanEverTick = true;

	BackgroundMusic = CreateDefaultSubobject<UAudioComponent>(TEXT("BackgroundMusic"));
	BackgroundMusic->SetupAttachment(RootComponent);
	BackgroundMusic->bAutoActivate = false;
}

void AMountainRescueGameMode::BeginPlay()
{
	Super::BeginPlay();

	for (TActorIterator<ADroneBase> It(GetWorld()); It; ++It) { CachedDrone = *It; break; }
	for (TActorIterator<ARouteManager> It(GetWorld()); It; ++It) { CachedRouteManager = *It; break; }
	for (TActorIterator<AWeatherSystem> It(GetWorld()); It; ++It) { CachedWeatherSystem = *It; break; }
	for (TActorIterator<ASignalSystem> It(GetWorld()); It; ++It) { CachedSignalSystem = *It; break; }
	for (TActorIterator<AReplaySystem> It(GetWorld()); It; ++It) { CachedReplaySystem = *It; break; }

	if (!CachedWeatherSystem && CurrentTaskConfig.Weather.WindSpeed > 0.f)
	{
		FActorSpawnParameters Params;
		CachedWeatherSystem = GetWorld()->SpawnActor<AWeatherSystem>(AWeatherSystem::StaticClass(), FVector::ZeroVector, FRotator::ZeroRotator, Params);
	}
	if (!CachedSignalSystem)
	{
		FActorSpawnParameters Params;
		CachedSignalSystem = GetWorld()->SpawnActor<ASignalSystem>(ASignalSystem::StaticClass(), FVector::ZeroVector, FRotator::ZeroRotator, Params);
	}
	if (!CachedReplaySystem)
	{
		FActorSpawnParameters Params;
		CachedReplaySystem = GetWorld()->SpawnActor<AReplaySystem>(AReplaySystem::StaticClass(), FVector::ZeroVector, FRotator::ZeroRotator, Params);
	}

	MissionTimeRemaining = MissionTimeLimit;
}

void AMountainRescueGameMode::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	if (CurrentGameState == EGameState::Flying || CurrentGameState == EGameState::ReturningHome)
	{
		UpdateMissionTimer(DeltaSeconds);
		CheckMissionCompletion();

		ReplayCaptureTimer += DeltaSeconds;
		if (ReplayCaptureTimer >= ReplayCaptureInterval && CachedReplaySystem.IsValid() && CachedReplaySystem->bIsRecording)
		{
			ReplayCaptureTimer = 0.f;
			int32 WPIdx = CachedRouteManager.IsValid() ? CachedRouteManager->CurrentWaypointIndex : INDEX_NONE;
			CachedReplaySystem->CaptureFrame(CachedDrone.Get(), WPIdx);
		}
	}
}

void AMountainRescueGameMode::InitializeMission()
{
	UE_LOG(LogMountainRescue, Log, TEXT("=== 初始化任务 ==="));

	if (CachedDrone.IsValid())
	{
		CachedDrone->InitializeDrone(CurrentTaskConfig);
	}
	if (CachedWeatherSystem.IsValid())
	{
		CachedWeatherSystem->ConfigureWeather(CurrentTaskConfig.Weather);
	}
	if (CachedSignalSystem.IsValid())
	{
		CachedSignalSystem->ConfigureDeadZones(CurrentTaskConfig.SignalDeadZones);
	}
	if (CachedRouteManager.IsValid())
	{
		CachedRouteManager->ClearRoute();
		if (CurrentTaskConfig.HomeLocation == FVector::ZeroVector && CachedDrone.IsValid())
		{
			CurrentTaskConfig.HomeLocation = CachedDrone->GetActorLocation();
		}
	}

	SpawnRescueTargets();
	BindDelegates();
	MissionTimeRemaining = MissionTimeLimit;
	RescuedTargetCount = 0;
	TimedOutTargetCount = 0;
	bWasSignalLost = false;

	ChangeGameState(EGameState::EditingRoute);
	OnMissionInitializationComplete();

	UE_LOG(LogMountainRescue, Log, TEXT("救援目标数量: %d"), RescueTargets.Num());
}

void AMountainRescueGameMode::LoadTaskConfig(const FTaskConfig& NewConfig)
{
	CurrentTaskConfig = NewConfig;
	InitializeMission();
}

void AMountainRescueGameMode::StartMission()
{
	if (!CachedRouteManager.IsValid()) return;

	FText FailReason;
	if (!CachedRouteManager->ValidateRoute(CurrentTaskConfig, FailReason))
	{
		OnRouteValidationFailed();
		ShowMissionToast(FailReason, FColor::Red);
		return;
	}

	if (CachedReplaySystem.IsValid())
	{
		CachedReplaySystem->StartRecording();
	}

	for (ARescueTarget* Target : RescueTargets)
	{
		if (Target) Target->StartCountdown();
	}

	CachedRouteManager->StartRouteExecution();
	ChangeGameState(EGameState::Flying);

	if (BackgroundMusic) BackgroundMusic->Play();

	UE_LOG(LogMountainRescue, Log, TEXT("=== 任务开始 ==="));
}

void AMountainRescueGameMode::PauseMission()
{
	PreviousGameState = CurrentGameState;
	ChangeGameState(EGameState::EditingRoute);
}

void AMountainRescueGameMode::ResumeMission()
{
	if (PreviousGameState == EGameState::Flying || PreviousGameState == EGameState::ReturningHome)
	{
		ChangeGameState(PreviousGameState);
	}
}

void AMountainRescueGameMode::RestartMission()
{
	InitializeMission();
}

void AMountainRescueGameMode::ValidateAndStartFlight()
{
	StartMission();
}

void AMountainRescueGameMode::TriggerReturnHome()
{
	if (CachedDrone.IsValid())
	{
		CachedDrone->ReturnToHome();
		ChangeGameState(EGameState::ReturningHome);
	}
}

void AMountainRescueGameMode::ForceFailMission(EFailureReason Reason)
{
	ChangeGameState(EGameState::Failed);

	if (CachedReplaySystem.IsValid())
	{
		FScoreBreakdown Dummy;
		CachedReplaySystem->StopRecording(Dummy, Reason, EGameState::Failed);
	}

	FText ReasonText = GetFailureReasonText(Reason);
	UE_LOG(LogMountainRescue, Error, TEXT("任务失败: %s"), *ReasonText.ToString());

	OnTaskFailed.Broadcast(Reason);
	ShowMissionToast(ReasonText, FColor::Red);
}

FScoreBreakdown AMountainRescueGameMode::CalculateFinalScore() const
{
	FScoreBreakdown Breakdown;

	int32 GoldenCount = 0;
	for (const ARescueTarget* Target : RescueTargets)
	{
		if (!Target) continue;

		FTargetResult Result = Target->GetResultData();
		Breakdown.TargetResults.Add(Result);

		Breakdown.TotalBaseScore += FMath::Max(0, Result.ScoreEarned);
		if (Result.bGoldenTimeBonus)
		{
			Breakdown.TotalGoldenTimeBonus += Target->TargetData.GoldenTimeBonus;
			GoldenCount++;
		}
		Breakdown.TotalDelayPenalty += Result.PenaltyScore;

		if (Result.DeliveryResult == EDeliveryResult::PartialSuccess)
		{
			Breakdown.TotalDeliveryPenalty += FMath::FloorToInt(Result.ActualDeliveryDistance * 2);
		}
	}

	if (bWasSignalLost && bEnableSignalLostPenalty)
	{
		Breakdown.SignalLostPenalty = CurrentTaskConfig.FlightParams.SignalLostPenaltyScore;
	}

	float BatteryRemaining = CachedDrone.IsValid() ? CachedDrone->GetBatteryPercent() : 0.f;
	if (BatteryRemaining * 100 >= BatteryEfficiencyBonusThreshold && RescueTargets.Num() > 0)
	{
		float Efficiency = FMath::Clamp((BatteryRemaining * 100 - BatteryEfficiencyBonusThreshold) / (100 - BatteryEfficiencyBonusThreshold), 0.f, 1.f);
		Breakdown.BatteryEfficiencyBonus = FMath::FloorToInt(BatteryEfficiencyBonusMax * Efficiency * (float)RescuedTargetCount / FMath::Max(1, RescueTargets.Num()));
	}

	Breakdown.FinalScore = Breakdown.TotalBaseScore
		+ Breakdown.TotalGoldenTimeBonus
		+ Breakdown.BatteryEfficiencyBonus
		- Breakdown.TotalDelayPenalty
		- Breakdown.TotalDeliveryPenalty
		- Breakdown.SignalLostPenalty;

	Breakdown.FinalScore = FMath::Max(0, Breakdown.FinalScore);

	UE_LOG(LogMountainRescue, Log, TEXT("=== 评分结算 ==="));
	UE_LOG(LogMountainRescue, Log, TEXT("  基础得分: %d"), Breakdown.TotalBaseScore);
	UE_LOG(LogMountainRescue, Log, TEXT("  黄金时间奖励: +%d"), Breakdown.TotalGoldenTimeBonus);
	UE_LOG(LogMountainRescue, Log, TEXT("  电量效率奖励: +%d"), Breakdown.BatteryEfficiencyBonus);
	UE_LOG(LogMountainRescue, Log, TEXT("  延误扣分: -%d"), Breakdown.TotalDelayPenalty);
	UE_LOG(LogMountainRescue, Log, TEXT("  投放偏差扣分: -%d"), Breakdown.TotalDeliveryPenalty);
	UE_LOG(LogMountainRescue, Log, TEXT("  信号丢失扣分: -%d"), Breakdown.SignalLostPenalty);
	UE_LOG(LogMountainRescue, Log, TEXT("  最终得分: %d"), Breakdown.FinalScore);

	return Breakdown;
}

FText AMountainRescueGameMode::GetFailureReasonText(EFailureReason Reason) const
{
	switch (Reason)
	{
	case EFailureReason::BatteryDepleted:
		return FText::FromString(TEXT("电量耗尽 - 请在航线编辑阶段重新规划，预留返航电量（建议预留≥30%）"));
	case EFailureReason::BatteryDepletedMidAir:
		return FText::FromString(TEXT("飞行中电量耗尽导致坠毁 - 减少航程或减轻物资重量"));
	case EFailureReason::SignalLost:
		return FText::FromString(TEXT("信号丢失超时未返航 - 避开信号盲区，或规划提前返航路线"));
	case EFailureReason::AllTargetsTimedOut:
		return FText::FromString(TEXT("全部救援目标超时 - 优化航线顺序，优先处理高优先级目标"));
	case EFailureReason::CriticalTargetTimedOut:
		return FText::FromString(TEXT("紧急目标超时 - 紧急目标需在黄金时间内送达，建议作为第一站"));
	case EFailureReason::SupplyMismatch:
		return FText::FromString(TEXT("物资配置错误 - 检查每类目标所需物资，装载对应物资"));
	case EFailureReason::CrashTerrain:
		return FText::FromString(TEXT("无人机撞山 - 提高航线飞行高度，避开山体"));
	default:
		return FText::FromString(TEXT("任务失败"));
	}
}

TArray<FText> AMountainRescueGameMode::GetScoreBreakdownTexts(const FScoreBreakdown& Breakdown) const
{
	TArray<FText> Lines;

	Lines.Add(FText::FromString(FString::Printf(TEXT("基础救援得分:        %8d 分"), Breakdown.TotalBaseScore)));
	if (Breakdown.TotalGoldenTimeBonus > 0)
		Lines.Add(FText::FromString(FString::Printf(TEXT("黄金时间完成奖励:  + %6d 分"), Breakdown.TotalGoldenTimeBonus)));
	if (Breakdown.BatteryEfficiencyBonus > 0)
		Lines.Add(FText::FromString(FString::Printf(TEXT("电量效率奖励:      + %6d 分"), Breakdown.BatteryEfficiencyBonus)));
	if (Breakdown.TotalDelayPenalty > 0)
		Lines.Add(FText::FromString(FString::Printf(TEXT("延误扣分:          - %6d 分"), Breakdown.TotalDelayPenalty)));
	if (Breakdown.TotalDeliveryPenalty > 0)
		Lines.Add(FText::FromString(FString::Printf(TEXT("投放偏差扣分:      - %6d 分"), Breakdown.TotalDeliveryPenalty)));
	if (Breakdown.SignalLostPenalty > 0)
		Lines.Add(FText::FromString(FString::Printf(TEXT("信号丢失处罚:      - %6d 分"), Breakdown.SignalLostPenalty)));
	Lines.Add(FText::FromString(TEXT("——————————————————")));
	Lines.Add(FText::FromString(FString::Printf(TEXT("最终得分:          %8d 分"), Breakdown.FinalScore)));

	return Lines;
}

void AMountainRescueGameMode::ChangeGameState(EGameState NewState)
{
	if (CurrentGameState == NewState) return;

	UE_LOG(LogMountainRescue, Log, TEXT("游戏状态变更: %s → %s"),
		*UEnum::GetValueAsString(CurrentGameState),
		*UEnum::GetValueAsString(NewState));

	CurrentGameState = NewState;
	OnGameStateChanged.Broadcast(NewState);
}

void AMountainRescueGameMode::SpawnRescueTargets()
{
	for (ARescueTarget* OldTarget : RescueTargets)
	{
		if (OldTarget) OldTarget->Destroy();
	}
	RescueTargets.Empty();

	for (const FRescueTargetData& TargetData : CurrentTaskConfig.RescueTargets)
	{
		FActorSpawnParameters Params;
		Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
		ARescueTarget* NewTarget = GetWorld()->SpawnActor<ARescueTarget>(
			ARescueTarget::StaticClass(), TargetData.WorldLocation, FRotator::ZeroRotator, Params);

		if (NewTarget)
		{
			NewTarget->InitializeTarget(TargetData);
			RescueTargets.Add(NewTarget);
		}
	}
}

void AMountainRescueGameMode::BindDelegates()
{
	if (CachedDrone.IsValid())
	{
		CachedDrone->OnBatteryDepleted.AddDynamic(this, &AMountainRescueGameMode::ForceFailMission_OnBatteryDepleted);
		CachedDrone->OnDroneCrashed.AddDynamic(this, &AMountainRescueGameMode::ForceFailMission_OnCrashed);
		CachedDrone->OnSignalLost.AddDynamic(this, &AMountainRescueGameMode::HandleSignalLost);
		CachedDrone->OnSupplyDropped.AddDynamic(this, &AMountainRescueGameMode::HandleSupplyDropped);
	}

	for (ARescueTarget* Target : RescueTargets)
	{
		if (Target)
		{
			Target->OnTargetRescued.AddDynamic(this, &AMountainRescueGameMode::HandleTargetRescued);
			Target->OnTargetTimedOut.AddDynamic(this, &AMountainRescueGameMode::HandleTargetTimedOut);
		}
	}
}

void AMountainRescueGameMode::UpdateMissionTimer(float DeltaSeconds)
{
	MissionTimeRemaining -= DeltaSeconds;
	OnMissionTimeUpdated.Broadcast(MissionTimeRemaining);

	if (MissionTimeRemaining <= 0.f)
	{
		ForceFailMission(EFailureReason::AllTargetsTimedOut);
	}
}

void AMountainRescueGameMode::CheckMissionCompletion()
{
	if (CurrentGameState != EGameState::Flying && CurrentGameState != EGameState::ReturningHome) return;

	bool bAllRescuedOrTimedOut = true;
	bool bHasCriticalTimeout = false;

	for (ARescueTarget* Target : RescueTargets)
	{
		if (!Target) continue;
		if (!Target->bIsRescued && !Target->bIsTimedOut)
		{
			bAllRescuedOrTimedOut = false;
		}
		if (Target->bIsTimedOut && Target->GetPriority() == ETaskPriority::Critical)
		{
			bHasCriticalTimeout = true;
		}
	}

	bool bReturnedHome = false;
	if (CachedRouteManager.IsValid() && CachedDrone.IsValid())
	{
		bReturnedHome = CachedRouteManager->IsLastWaypointReached()
			&& CachedDrone->HasReachedLocation(CurrentTaskConfig.HomeLocation, 100.f);
	}

	bool bShouldComplete = bAllRescuedOrTimedOut && (RescuedTargetCount > 0 || TimedOutTargetCount == RescueTargets.Num());
	bool bShouldFail = bHasCriticalTimeout || (TimedOutTargetCount == RescueTargets.Num() && RescueTargets.Num() > 0);

	if (bShouldFail && !bShouldComplete)
	{
		ForceFailMission(bHasCriticalTimeout ? EFailureReason::CriticalTargetTimedOut : EFailureReason::AllTargetsTimedOut);
		return;
	}

	if ((bAllRescuedOrTimedOut && bReturnedHome) || (bReturnedHome && RescuedTargetCount > 0))
	{
		FScoreBreakdown FinalScore = CalculateFinalScore();
		bool bAllRescued = RescuedTargetCount == RescueTargets.Num();

		if (CachedReplaySystem.IsValid())
		{
			EFailureReason FailReason = TimedOutTargetCount > 0 ? EFailureReason::AllTargetsTimedOut : EFailureReason::None;
			EGameState FinalState = bAllRescued ? EGameState::Completed : EGameState::Failed;
			CachedReplaySystem->StopRecording(FinalScore, FailReason, FinalState);
		}

		OnScoreUpdated.Broadcast(FinalScore);
		ChangeGameState(EGameState::Completed);
		OnTaskCompleted.Broadcast(FinalScore, bAllRescued);
	}
}

void AMountainRescueGameMode::ProcessDelivery(ESupplyType SupplyType, FVector DropLocation)
{
	ARescueTarget* ClosestTarget = nullptr;
	float MinDist = FLT_MAX;

	for (ARescueTarget* Target : RescueTargets)
	{
		if (!Target || Target->bIsRescued || Target->bIsTimedOut) continue;
		float Dist = FVector::Dist(DropLocation, Target->GetActorLocation());
		if (Dist < MinDist && Dist < 150.f)
		{
			MinDist = Dist;
			ClosestTarget = Target;
		}
	}

	if (ClosestTarget)
	{
		EDeliveryResult Result = ClosestTarget->ProcessDelivery(SupplyType, DropLocation);

		FActorSpawnParameters Params;
		ADroppedSupply* DroppedSupply = GetWorld()->SpawnActor<ADroppedSupply>(
			ADroppedSupply::StaticClass(), DropLocation, FRotator::ZeroRotator, Params);

		if (DroppedSupply)
		{
			DroppedSupply->SupplyType = SupplyType;
			DroppedSupply->TargetDeliveryLocation = ClosestTarget->GetActorLocation();
			DroppedSupply->SetActorLocation(DropLocation);
		}
	}
}

void AMountainRescueGameMode::CaptureReplayFrame()
{
	if (CachedReplaySystem.IsValid() && CachedReplaySystem->bIsRecording)
	{
		int32 WPIdx = CachedRouteManager.IsValid() ? CachedRouteManager->CurrentWaypointIndex : INDEX_NONE;
		CachedReplaySystem->CaptureFrame(CachedDrone.Get(), WPIdx);
	}
}

int32 AMountainRescueGameMode::GetActiveTargetCount() const
{
	int32 Count = 0;
	for (const ARescueTarget* T : RescueTargets)
	{
		if (T && !T->bIsRescued && !T->bIsTimedOut) Count++;
	}
	return Count;
}

ARescueTarget* AMountainRescueGameMode::FindTargetByID(FName TargetID) const
{
	for (ARescueTarget* T : RescueTargets)
	{
		if (T && T->TargetData.TargetID == TargetID) return T;
	}
	return nullptr;
}
