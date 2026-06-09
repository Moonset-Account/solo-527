#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "ReplaySystem.generated.h"

class ADroneBase;

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API AReplaySystem : public AActor
{
	GENERATED_BODY()

public:
	AReplaySystem();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "回放配置")
	float CaptureInterval = 0.05f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "回放配置")
	float PlaybackSpeed = 1.f;

	UPROPERTY(BlueprintReadOnly, Category = "回放数据")
	FReplayData CurrentReplay;

	UPROPERTY(BlueprintReadOnly, Category = "回放状态")
	bool bIsRecording = false;

	UPROPERTY(BlueprintReadOnly, Category = "回放状态")
	bool bIsPlaying = false;

	UPROPERTY(BlueprintReadOnly, Category = "回放状态")
	float PlaybackTime = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "回放状态")
	int32 CurrentFrameIndex = 0;

public:
	UFUNCTION(BlueprintCallable, Category = "录制")
	void StartRecording();

	UFUNCTION(BlueprintCallable, Category = "录制")
	void StopRecording(const FScoreBreakdown& FinalScore, EFailureReason Failure, EGameState FinalState);

	UFUNCTION(BlueprintCallable, Category = "录制")
	void CaptureFrame(ADroneBase* Drone, int32 WaypointIndex);

	UFUNCTION(BlueprintCallable, Category = "回放")
	bool StartPlayback(ADroneBase* TargetDrone);

	UFUNCTION(BlueprintCallable, Category = "回放")
	void StopPlayback();

	UFUNCTION(BlueprintCallable, Category = "回放")
	void SetPlaybackSpeed(float NewSpeed);

	UFUNCTION(BlueprintCallable, Category = "回放")
	void SeekToTime(float SeekTime);

	UFUNCTION(BlueprintCallable, Category = "回放")
	float GetTotalDuration() const;

	UFUNCTION(BlueprintCallable, Category = "回放")
	FReplayFrame GetInterpolatedFrame(float AtTime) const;

	UFUNCTION(BlueprintCallable, Category = "回放")
	bool HasReplayData() const { return CurrentReplay.Frames.Num() > 0; }

	UFUNCTION(BlueprintCallable, Category = "回放")
	void SaveReplayToSlot(FName SlotName);

	UFUNCTION(BlueprintCallable, Category = "回放")
	bool LoadReplayFromSlot(FName SlotName);

	UFUNCTION(BlueprintImplementableEvent, Category = "回放|事件")
	void OnPlaybackFrameUpdated(const FReplayFrame& Frame);

	UFUNCTION(BlueprintImplementableEvent, Category = "回放|事件")
	void OnPlaybackFinished();

protected:
	UPROPERTY()
	TWeakObjectPtr<ADroneBase> PlaybackDrone;
	float CaptureTimer = 0.f;
	float PlaybackTimer = 0.f;

	FReplayFrame GetFrameAt(int32 Index) const;
	int32 FindFrameIndex(float AtTime) const;
};
