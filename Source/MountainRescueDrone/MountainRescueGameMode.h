#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "MountainRescueTypes.h"
#include "MountainRescueGameMode.generated.h"

class ADroneBase;
class ARouteManager;
class AWeatherSystem;
class ASignalSystem;
class ARescueTarget;
class AReplaySystem;
class UAudioComponent;
class USoundBase;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnGameStateChanged, EGameState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnScoreUpdated, const FScoreBreakdown&, Score);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTaskFailed, EFailureReason, Reason);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnTaskCompleted, const FScoreBreakdown&, Score, bool, bAllTargetsRescued);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnMissionTimeUpdated, float, RemainingSeconds);

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API AMountainRescueGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	AMountainRescueGameMode();

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	FTaskConfig CurrentTaskConfig;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	float MissionTimeLimit = 1800.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	bool bEnableSignalLostPenalty = true;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "评分")
	int32 BatteryEfficiencyBonusThreshold = 30;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "评分")
	int32 BatteryEfficiencyBonusMax = 500;

	UPROPERTY(BlueprintReadOnly, Category = "游戏状态")
	EGameState CurrentGameState = EGameState::EditingRoute;

	UPROPERTY(BlueprintReadOnly, Category = "游戏状态")
	float MissionTimeRemaining = 1800.f;

	UPROPERTY(BlueprintReadOnly, Category = "游戏状态")
	int32 RescuedTargetCount = 0;

	UPROPERTY(BlueprintReadOnly, Category = "游戏状态")
	int32 TimedOutTargetCount = 0;

	UPROPERTY(BlueprintReadOnly, Category = "游戏状态")
	bool bWasSignalLost = false;

	UPROPERTY(BlueprintReadOnly, Category = "组件")
	TObjectPtr<UAudioComponent> BackgroundMusic;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnGameStateChanged OnGameStateChanged;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnScoreUpdated OnScoreUpdated;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTaskFailed OnTaskFailed;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTaskCompleted OnTaskCompleted;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnMissionTimeUpdated OnMissionTimeUpdated;

public:
	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void InitializeMission();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void LoadTaskConfig(const FTaskConfig& NewConfig);

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void StartMission();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void PauseMission();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void ResumeMission();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void RestartMission();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void ValidateAndStartFlight();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void TriggerReturnHome();

	UFUNCTION(BlueprintCallable, Category = "游戏流程")
	void ForceFailMission(EFailureReason Reason);

	UFUNCTION(BlueprintCallable, Category = "评分")
	FScoreBreakdown CalculateFinalScore() const;

	UFUNCTION(BlueprintCallable, Category = "评分")
	FText GetFailureReasonText(EFailureReason Reason) const;

	UFUNCTION(BlueprintCallable, Category = "评分")
	TArray<FText> GetScoreBreakdownTexts(const FScoreBreakdown& Breakdown) const;

	UFUNCTION(BlueprintCallable, Category = "查询")
	EGameState GetGameState() const { return CurrentGameState; }

	UFUNCTION(BlueprintCallable, Category = "查询")
	bool IsMissionActive() const { return CurrentGameState == EGameState::Flying || CurrentGameState == EGameState::ReturningHome; }

	UFUNCTION(BlueprintCallable, Category = "查询")
	int32 GetTotalTargetCount() const { return RescueTargets.Num(); }

	UFUNCTION(BlueprintCallable, Category = "查询")
	int32 GetActiveTargetCount() const;

	UFUNCTION(BlueprintCallable, Category = "查询")
	ARescueTarget* FindTargetByID(FName TargetID) const;

	UFUNCTION(BlueprintCallable, Category = "查询")
	TArray<ARescueTarget*> GetAllTargets() const { return RescueTargets; }

	UFUNCTION(BlueprintCallable, Category = "查询")
	ADroneBase* GetDrone() const { return CachedDrone; }

	UFUNCTION(BlueprintCallable, Category = "查询")
	ARouteManager* GetRouteManager() const { return CachedRouteManager; }

	UFUNCTION(BlueprintImplementableEvent, Category = "游戏流程")
	void OnMissionInitializationComplete();

	UFUNCTION(BlueprintImplementableEvent, Category = "UI反馈")
	void ShowMissionToast(FText Message, FColor Color);

	UFUNCTION(BlueprintImplementableEvent, Category = "音效")
	void PlaySoundForEvent(USoundBase* SoundToPlay);

protected:
	UPROPERTY()
	TWeakObjectPtr<ADroneBase> CachedDrone;

	UPROPERTY()
	TWeakObjectPtr<ARouteManager> CachedRouteManager;

	UPROPERTY()
	TWeakObjectPtr<AWeatherSystem> CachedWeatherSystem;

	UPROPERTY()
	TWeakObjectPtr<ASignalSystem> CachedSignalSystem;

	UPROPERTY()
	TWeakObjectPtr<AReplaySystem> CachedReplaySystem;

	UPROPERTY()
	TArray<TObjectPtr<ARescueTarget>> RescueTargets;

	EGameState PreviousGameState = EGameState::EditingRoute;
	float ReplayCaptureInterval = 0.05f;
	float ReplayCaptureTimer = 0.f;

	virtual void ChangeGameState(EGameState NewState);
	virtual void SpawnRescueTargets();
	virtual void BindDelegates();
	virtual void UpdateMissionTimer(float DeltaSeconds);
	virtual void CheckMissionCompletion();
	virtual void ProcessDelivery(ESupplyType SupplyType, FVector DropLocation);
	virtual void CaptureReplayFrame();

	UFUNCTION()
	virtual void ForceFailMission_OnBatteryDepleted() { ForceFailMission(EFailureReason::BatteryDepletedMidAir); }

	UFUNCTION()
	virtual void ForceFailMission_OnCrashed() { ForceFailMission(EFailureReason::CrashTerrain); }

	UFUNCTION()
	virtual void HandleSignalLost()
	{
		bWasSignalLost = true;
		if (CachedDrone.IsValid())
		{
			CachedDrone->ReturnToHome();
			ShowMissionToast(FText::FromString(TEXT("信号丢失！自动返航中（扣除150分）")), FColor::Orange);
		}
	}

	UFUNCTION()
	virtual void HandleSupplyDropped(ESupplyType SupplyType)
	{
		if (CachedDrone.IsValid())
		{
			ProcessDelivery(SupplyType, CachedDrone->GetActorLocation() - FVector(0, 0, 50.f));
		}
	}

	UFUNCTION()
	virtual void HandleTargetRescued(FName TargetID)
	{
		RescuedTargetCount++;
		ARescueTarget* T = FindTargetByID(TargetID);
		if (T)
		{
			FString Msg = FString::Printf(TEXT("✓ 救援成功: %s (%s)"),
				*T->TargetData.DisplayName.ToString(),
				*UEnum::GetDisplayValueAsText(T->LastDeliveryResult).ToString());
			ShowMissionToast(FText::FromString(Msg), FColor::Green);
		}
	}

	UFUNCTION()
	virtual void HandleTargetTimedOut(FName TargetID)
	{
		TimedOutTargetCount++;
		ARescueTarget* T = FindTargetByID(TargetID);
		if (T)
		{
			FString Msg = FString::Printf(TEXT("✗ 目标超时: %s"), *T->TargetData.DisplayName.ToString());
			ShowMissionToast(FText::FromString(Msg), FColor::Red);
		}
	}

	UFUNCTION()
	virtual void OnRouteValidationFailed() {}

	int32 GetActiveTargetCount_Internal() const
	{
		int32 Count = 0;
		for (const ARescueTarget* T : RescueTargets)
		{
			if (T && !T->bIsRescued && !T->bIsTimedOut) Count++;
		}
		return Count;
	}
};
