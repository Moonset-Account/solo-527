#pragma once

#include "CoreMinimal.h"
#include "Engine/DataTable.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.generated.h"

UENUM(BlueprintType)
enum class ERescueTargetType : uint8
{
	MinorInjury		UMETA(DisplayName = "轻伤(急救包)"),
	Hypothermia		UMETA(DisplayName = "失温(保暖+急救)"),
	LostPerson		UMETA(DisplayName = "迷路(定位信标)"),
	MAX				UMETA(Hidden)
};

UENUM(BlueprintType)
enum class ESupplyType : uint8
{
	MedicalKit		UMETA(DisplayName = "急救包"),
	WarmBlanket		UMETA(DisplayName = "保暖毯"),
	LocatorBeacon	UMETA(DisplayName = "定位信标"),
	MAX				UMETA(Hidden)
};

UENUM(BlueprintType)
enum class ETaskPriority : uint8
{
	Low				UMETA(DisplayName = "低优先级"),
	Normal			UMETA(DisplayName = "普通优先级"),
	High			UMETA(DisplayName = "高优先级"),
	Critical		UMETA(DisplayName = "紧急(黄金时间)"),
	MAX				UMETA(Hidden)
};

UENUM(BlueprintType)
enum class EGameState : uint8
{
	EditingRoute	UMETA(DisplayName = "航线编辑阶段"),
	Flying			UMETA(DisplayName = "飞行执行阶段"),
	ReturningHome	UMETA(DisplayName = "返航阶段"),
	Completed		UMETA(DisplayName = "任务完成"),
	Failed			UMETA(DisplayName = "任务失败"),
	Replaying		UMETA(DisplayName = "回放中"),
	MAX				UMETA(Hidden)
};

UENUM(BlueprintType)
enum class EFailureReason : uint8
{
	None					UMETA(DisplayName = "无"),
	BatteryDepleted			UMETA(DisplayName = "电量耗尽"),
	BatteryDepletedMidAir	UMETA(DisplayName = "飞行中电量耗尽导致坠毁"),
	SignalLost				UMETA(DisplayName = "信号丢失超时未返航"),
	AllTargetsTimedOut		UMETA(DisplayName = "全部救援目标超时"),
	CriticalTargetTimedOut	UMETA(DisplayName = "紧急目标超时"),
	SupplyMismatch			UMETA(DisplayName = "物资投放类型错误"),
	CrashTerrain			UMETA(DisplayName = "撞山坠毁"),
	MAX						UMETA(Hidden)
};

UENUM(BlueprintType)
enum class EDeliveryResult : uint8
{
	Success			UMETA(DisplayName = "投放成功"),
	PartialSuccess	UMETA(DisplayName = "投放偏差(位置不准)"),
	WrongSupply		UMETA(DisplayName = "物资错误"),
	FailedNoSupply	UMETA(DisplayName = "无对应物资"),
	Timeout			UMETA(DisplayName = "超时未投放"),
	MAX				UMETA(Hidden)
};

USTRUCT(BlueprintType)
struct FWaypoint
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	FVector Location = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	float DesiredAltitude = 150.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	float SpeedLimit = 12.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	float HoverTime = 0.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	bool bIsDeliveryPoint = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	int32 AssociatedTargetIndex = INDEX_NONE;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线")
	ESupplyType SupplyToDrop = ESupplyType::MAX;
};

USTRUCT(BlueprintType)
struct FDroneFlightParams
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数")
	float MaxHorizontalSpeed = 15.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数")
	float MaxVerticalSpeed = 5.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数")
	float Acceleration = 8.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数")
	float TurnRate = 120.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|电量")
	float BaseBatteryDrainPerSecond = 0.15f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|电量")
	float HeavyLoadBatteryMultiplier = 1.5f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|电量")
	float HeadwindBatteryMultiplier = 1.3f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|电量")
	float HoverBatteryMultiplier = 0.7f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|电量")
	float LowBatteryThreshold = 0.2f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|重量")
	float MaxPayloadWeight = 15.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|信号")
	float MaxSignalRange = 3000.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|信号")
	float SignalLostTimeout = 15.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|信号")
	float SignalLostPenaltyScore = 150.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "飞行参数|投放")
	float MaxDeliveryDistance = 25.f;
};

USTRUCT(BlueprintType)
struct FRescueTargetData : public FTableRowBase
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标")
	FName TargetID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标")
	ERescueTargetType TargetType = ERescueTargetType::MinorInjury;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标")
	ETaskPriority Priority = ETaskPriority::Normal;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标")
	FVector WorldLocation = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标")
	TArray<ESupplyType> RequiredSupplies;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|时间")
	float TimeLimitSeconds = 600.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|时间")
	float GoldenTimeSeconds = 300.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|评分")
	int32 BaseScore = 500;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|评分")
	int32 GoldenTimeBonus = 300;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|评分")
	int32 DelayPenaltyPerSecond = 2;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|描述")
	FText DisplayName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "救援目标|描述")
	FText Description;
};

USTRUCT(BlueprintType)
struct FSupplyPayload
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "物资")
	ESupplyType SupplyType = ESupplyType::MedicalKit;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "物资")
	int32 Count = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "物资")
	float UnitWeightKg = 2.f;

	float GetTotalWeight() const { return Count * UnitWeightKg; }
};

USTRUCT(BlueprintType)
struct FWeatherConfig
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "天气")
	FVector WindDirection = FVector(1.f, 0.f, 0.f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "天气", meta = (ClampMin = "0", ClampMax = "30"))
	float WindSpeed = 5.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "天气")
	bool bIsGusty = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "天气", meta = (EditCondition = "bIsGusty"))
	float GustIntensity = 2.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "天气", meta = (ClampMin = "0", ClampMax = "1"))
	float Visibility = 1.f;

	float GetWindVector() const { return WindDirection.GetSafeNormal() * WindSpeed; }
};

USTRUCT(BlueprintType)
struct FSignalDeadZone
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "信号盲区")
	FVector CenterLocation = FVector::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "信号盲区")
	float Radius = 500.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "信号盲区")
	float SignalBlockStrength = 0.9f;
};

USTRUCT(BlueprintType)
struct FTaskConfig
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	float InitialBatteryPercent = 1.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	TArray<FSupplyPayload> InitialPayload;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	FDroneFlightParams FlightParams;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	FWeatherConfig Weather;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	TArray<FRescueTargetData> RescueTargets;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	TArray<FSignalDeadZone> SignalDeadZones;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "任务配置")
	FVector HomeLocation = FVector::ZeroVector;
};

USTRUCT(BlueprintType)
struct FTargetResult
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	FName TargetID;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	FText DisplayName;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	ERescueTargetType TargetType;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	ETaskPriority Priority;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	EDeliveryResult DeliveryResult = EDeliveryResult::Timeout;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	float ActualDeliveryDistance = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	float TimeToDelivery = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	float DelaySeconds = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	bool bGoldenTimeBonus = false;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	int32 ScoreEarned = 0;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	int32 PenaltyScore = 0;

	UPROPERTY(BlueprintReadOnly, Category = "结果")
	FText FailureExplanation;
};

USTRUCT(BlueprintType)
struct FScoreBreakdown
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 TotalBaseScore = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 TotalGoldenTimeBonus = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 TotalDelayPenalty = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 TotalDeliveryPenalty = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 SignalLostPenalty = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 BatteryEfficiencyBonus = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	int32 FinalScore = 0;

	UPROPERTY(BlueprintReadOnly, Category = "评分")
	TArray<FTargetResult> TargetResults;
};

USTRUCT(BlueprintType)
struct FReplayFrame
{
	GENERATED_BODY()

	UPROPERTY()
	float Timestamp = 0.f;

	UPROPERTY()
	FVector DroneLocation = FVector::ZeroVector;

	UPROPERTY()
	FRotator DroneRotation = FRotator::ZeroRotator;

	UPROPERTY()
	float BatteryPercent = 0.f;

	UPROPERTY()
	float SignalStrength = 1.f;

	UPROPERTY()
	int32 CurrentWaypointIndex = INDEX_NONE;
};

USTRUCT(BlueprintType)
struct FReplayData
{
	GENERATED_BODY()

	UPROPERTY()
	TArray<FReplayFrame> Frames;

	UPROPERTY()
	FScoreBreakdown FinalScore;

	UPROPERTY()
	EFailureReason FailureReason = EFailureReason::None;

	UPROPERTY()
	EGameState FinalGameState = EGameState::Failed;
};

USTRUCT(BlueprintType)
struct FDroneStatusReport
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float BatteryPercent = 1.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float SignalStrength = 1.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float CurrentPayloadWeight = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float CurrentSpeed = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float EstimatedRangeRemaining = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bIsLowBattery = false;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bIsSignalLost = false;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float SignalLostTimer = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	FVector CurrentVelocity = FVector::ZeroVector;
};
