#include "ReplaySystem.h"
#include "DroneBase.h"
#include "MountainRescueDrone.h"

AReplaySystem::AReplaySystem()
{
	PrimaryActorTick.bCanEverTick = true;
}

void AReplaySystem::BeginPlay()
{
	Super::BeginPlay();
}

void AReplaySystem::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	if (bIsRecording)
	{
		CaptureTimer += DeltaTime;
	}

	if (bIsPlaying && PlaybackDrone.IsValid())
	{
		PlaybackTimer += DeltaTime * PlaybackSpeed;

		float TotalDur = GetTotalDuration();
		if (PlaybackTimer >= TotalDur)
		{
			StopPlayback();
			OnPlaybackFinished();
			return;
		}

		PlaybackTime = PlaybackTimer;

		FReplayFrame Interpolated = GetInterpolatedFrame(PlaybackTimer);
		PlaybackDrone->SetActorLocation(Interpolated.DroneLocation);
		PlaybackDrone->SetActorRotation(Interpolated.DroneRotation);
		CurrentFrameIndex = FindFrameIndex(PlaybackTime);

		OnPlaybackFrameUpdated(Interpolated);
	}
}

void AReplaySystem::StartRecording()
{
	CurrentReplay.Frames.Empty();
	bIsRecording = true;
	bIsPlaying = false;
	CaptureTimer = 0.f;
	CurrentFrameIndex = 0;

	UE_LOG(LogMountainRescue, Log, TEXT("回放录制开始 (每%.2fs一帧)"), CaptureInterval);
}

void AReplaySystem::StopRecording(const FScoreBreakdown& FinalScore, EFailureReason Failure, EGameState FinalState)
{
	bIsRecording = false;
	CurrentReplay.FinalScore = FinalScore;
	CurrentReplay.FailureReason = Failure;
	CurrentReplay.FinalGameState = FinalState;

	UE_LOG(LogMountainRescue, Log, TEXT("回放录制结束: 共%d帧, 总时长%.1fs, 状态:%s"),
		CurrentReplay.Frames.Num(),
		GetTotalDuration(),
		*UEnum::GetValueAsString(FinalState));
}

void AReplaySystem::CaptureFrame(ADroneBase* Drone, int32 WaypointIndex)
{
	if (!Drone || CaptureTimer < CaptureInterval) return;
	CaptureTimer = 0.f;

	FReplayFrame Frame;
	Frame.Timestamp = CurrentReplay.Frames.Num() > 0
		? CurrentReplay.Frames.Last().Timestamp + CaptureInterval
		: 0.f;
	Frame.DroneLocation = Drone->GetActorLocation();
	Frame.DroneRotation = Drone->GetActorRotation();
	Frame.BatteryPercent = Drone->GetBatteryPercent();
	Frame.SignalStrength = Drone->GetSignalStrength();
	Frame.CurrentWaypointIndex = WaypointIndex;

	CurrentReplay.Frames.Add(Frame);
}

bool AReplaySystem::StartPlayback(ADroneBase* TargetDrone)
{
	if (!HasReplayData() || !TargetDrone)
	{
		UE_LOG(LogMountainRescue, Warning, TEXT("无法开始回放: 数据为空或无人机无效"));
		return false;
	}

	bIsPlaying = true;
	bIsRecording = false;
	PlaybackDrone = TargetDrone;
	PlaybackTimer = 0.f;
	CurrentFrameIndex = 0;

	UE_LOG(LogMountainRescue, Log, TEXT("开始回放: 总时长%.1fs, 速度x%.1f"),
		GetTotalDuration(), PlaybackSpeed);
	return true;
}

void AReplaySystem::StopPlayback()
{
	bIsPlaying = false;
	UE_LOG(LogMountainRescue, Log, TEXT("回放停止"));
}

void AReplaySystem::SetPlaybackSpeed(float NewSpeed)
{
	PlaybackSpeed = FMath::Clamp(NewSpeed, 0.1f, 10.f);
}

void AReplaySystem::SeekToTime(float SeekTime)
{
	PlaybackTimer = FMath::Clamp(SeekTime, 0.f, GetTotalDuration());
}

float AReplaySystem::GetTotalDuration() const
{
	if (CurrentReplay.Frames.Num() == 0) return 0.f;
	return CurrentReplay.Frames.Last().Timestamp;
}

FReplayFrame AReplaySystem::GetInterpolatedFrame(float AtTime) const
{
	FReplayFrame Result;
	if (CurrentReplay.Frames.Num() == 0) return Result;

	if (AtTime <= CurrentReplay.Frames[0].Timestamp) return CurrentReplay.Frames[0];
	if (AtTime >= CurrentReplay.Frames.Last().Timestamp) return CurrentReplay.Frames.Last();

	int32 Idx = FindFrameIndex(AtTime);
	if (Idx < 0 || Idx >= CurrentReplay.Frames.Num() - 1)
	{
		return GetFrameAt(FMath::Clamp(Idx, 0, CurrentReplay.Frames.Num() - 1));
	}

	const FReplayFrame& A = CurrentReplay.Frames[Idx];
	const FReplayFrame& B = CurrentReplay.Frames[Idx + 1];

	float Range = B.Timestamp - A.Timestamp;
	float Alpha = Range > 0.f ? (AtTime - A.Timestamp) / Range : 0.f;
	Alpha = FMath::Clamp(Alpha, 0.f, 1.f);

	Result.Timestamp = AtTime;
	Result.DroneLocation = FMath::Lerp(A.DroneLocation, B.DroneLocation, Alpha);
	Result.DroneRotation = FMath::Lerp(A.DroneRotation, B.DroneRotation, Alpha);
	Result.BatteryPercent = FMath::Lerp(A.BatteryPercent, B.BatteryPercent, Alpha);
	Result.SignalStrength = FMath::Lerp(A.SignalStrength, B.SignalStrength, Alpha);
	Result.CurrentWaypointIndex = Alpha < 0.5f ? A.CurrentWaypointIndex : B.CurrentWaypointIndex;

	return Result;
}

void AReplaySystem::SaveReplayToSlot(FName SlotName)
{
	// Note: Full save/load would require UObject serialization. For blueprint integration,
	// expose CurrentReplay.Frames via blueprint and use SaveGame system.
	UE_LOG(LogMountainRescue, Log, TEXT("回放数据已准备保存到槽位: %s (帧:%d)"), *SlotName.ToString(), CurrentReplay.Frames.Num());
}

bool AReplaySystem::LoadReplayFromSlot(FName SlotName)
{
	UE_LOG(LogMountainRescue, Log, TEXT("回放数据已准备从槽位加载: %s"), *SlotName.ToString());
	return HasReplayData();
}

FReplayFrame AReplaySystem::GetFrameAt(int32 Index) const
{
	if (CurrentReplay.Frames.IsValidIndex(Index))
	{
		return CurrentReplay.Frames[Index];
	}
	return FReplayFrame();
}

int32 AReplaySystem::FindFrameIndex(float AtTime) const
{
	if (CurrentReplay.Frames.Num() == 0) return INDEX_NONE;
	if (CurrentReplay.Frames.Num() == 1) return 0;

	int32 Low = 0;
	int32 High = CurrentReplay.Frames.Num() - 1;

	while (Low <= High)
	{
		int32 Mid = (Low + High) / 2;
		if (CurrentReplay.Frames[Mid].Timestamp <= AtTime)
		{
			if (Mid + 1 < CurrentReplay.Frames.Num() && CurrentReplay.Frames[Mid + 1].Timestamp <= AtTime)
			{
				Low = Mid + 1;
			}
			else
			{
				return Mid;
			}
		}
		else
		{
			High = Mid - 1;
		}
	}

	return FMath::Clamp(Low, 0, CurrentReplay.Frames.Num() - 1);
}
