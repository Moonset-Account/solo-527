#include "RescueTarget.h"
#include "Components/SphereComponent.h"
#include "Components/BillboardComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/WidgetComponent.h"
#include "NiagaraComponent.h"
#include "Components/AudioComponent.h"
#include "MountainRescueDrone.h"

ARescueTarget::ARescueTarget()
{
	PrimaryActorTick.bCanEverTick = true;

	DeliverySphere = CreateDefaultSubobject<USphereComponent>(TEXT("DeliverySphere"));
	RootComponent = DeliverySphere;
	DeliverySphere->InitSphereRadius(25.f);
	DeliverySphere->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	DeliverySphere->SetCollisionResponseToAllChannels(ECR_Overlap);

	TargetBillboard = CreateDefaultSubobject<UBillboardComponent>(TEXT("TargetBillboard"));
	TargetBillboard->SetupAttachment(RootComponent);

	TargetMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("TargetMesh"));
	TargetMesh->SetupAttachment(RootComponent);
	TargetMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

	StatusWidget = CreateDefaultSubobject<UWidgetComponent>(TEXT("StatusWidget"));
	StatusWidget->SetupAttachment(RootComponent);
	StatusWidget->SetRelativeLocation(FVector(0, 0, 150.f));
	StatusWidget->SetWidgetSpace(EWidgetSpace::Screen);

	SOSBeaconEffect = CreateDefaultSubobject<UNiagaraComponent>(TEXT("SOSBeaconEffect"));
	SOSBeaconEffect->SetupAttachment(RootComponent);

	SOSBeepSound = CreateDefaultSubobject<UAudioComponent>(TEXT("SOSBeepSound"));
	SOSBeepSound->SetupAttachment(RootComponent);
	SOSBeepSound->bAutoActivate = true;
}

void ARescueTarget::BeginPlay()
{
	Super::BeginPlay();
	TimeRemaining = TargetData.TimeLimitSeconds;
}

void ARescueTarget::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
	UpdateCountdown(DeltaTime);
	UpdateVisualUrgency();
}

void ARescueTarget::InitializeTarget(const FRescueTargetData& Data)
{
	TargetData = Data;
	SetActorLocation(Data.WorldLocation);
	TimeRemaining = Data.TimeLimitSeconds;
	TimeElapsed = 0.f;
	bIsRescued = false;
	bIsTimedOut = false;
	bCountdownActive = true;

	UE_LOG(LogMountainRescue, Log, TEXT("救援目标初始化: %s [%s] 优先级:%s 时限:%.0fs"),
		*Data.DisplayName.ToString(),
		*UEnum::GetValueAsString(Data.TargetType),
		*UEnum::GetValueAsString(Data.Priority),
		Data.TimeLimitSeconds);
}

EDeliveryResult ARescueTarget::ProcessDelivery(ESupplyType DeliveredSupply, FVector DropLocation)
{
	if (bIsRescued || bIsTimedOut)
	{
		return EDeliveryResult::Timeout;
	}

	LastDeliveryDistance = FVector::Dist(DropLocation, TargetData.WorldLocation);
	float MaxDeliveryDist = TargetData.WorldLocation != FVector::ZeroVector ? 25.f : 25.f;
	MaxDeliveryDist = 50.f;

	bool bSupplyCorrect = IsSupplyCorrect(DeliveredSupply);
	bool bLocationOK = LastDeliveryDistance <= MaxDeliveryDist;

	if (!bSupplyCorrect)
	{
		LastDeliveryResult = EDeliveryResult::WrongSupply;
	}
	else if (LastDeliveryDistance <= MaxDeliveryDist * 0.3f)
	{
		LastDeliveryResult = EDeliveryResult::Success;
		bIsRescued = true;
		bCountdownActive = false;
	}
	else if (bLocationOK)
	{
		LastDeliveryResult = EDeliveryResult::PartialSuccess;
		bIsRescued = true;
		bCountdownActive = false;
	}
	else
	{
		LastDeliveryResult = EDeliveryResult::PartialSuccess;
		bIsRescued = true;
		bCountdownActive = false;
	}

	OnTargetDelivered.Broadcast(TargetData.TargetID, LastDeliveryResult);
	OnDeliveryAttempt(LastDeliveryResult);

	if (bIsRescued)
	{
		OnTargetRescued.Broadcast(TargetData.TargetID);
		OnStatusChanged(true, false);

		if (SOSBeaconEffect) SOSBeaconEffect->Deactivate();
		if (SOSBeepSound) SOSBeepSound->Stop();
	}

	return LastDeliveryResult;
}

bool ARescueTarget::IsSupplyCorrect(ESupplyType Supply) const
{
	for (ESupplyType Required : TargetData.RequiredSupplies)
	{
		if (Required == Supply) return true;
	}
	return TargetData.RequiredSupplies.Num() == 0;
}

float ARescueTarget::GetTimeRemainingRatio() const
{
	if (TargetData.TimeLimitSeconds <= 0.f) return 1.f;
	return FMath::Clamp(TimeRemaining / TargetData.TimeLimitSeconds, 0.f, 1.f);
}

FTargetResult ARescueTarget::GetResultData() const
{
	FTargetResult Result;
	Result.TargetID = TargetData.TargetID;
	Result.DisplayName = TargetData.DisplayName;
	Result.TargetType = TargetData.TargetType;
	Result.Priority = TargetData.Priority;
	Result.DeliveryResult = LastDeliveryResult;
	Result.ActualDeliveryDistance = LastDeliveryDistance;
	Result.TimeToDelivery = TargetData.TimeLimitSeconds - TimeRemaining;
	Result.DelaySeconds = FMath::Max(0.f, TargetData.GoldenTimeSeconds - Result.TimeToDelivery);
	Result.bGoldenTimeBonus = Result.TimeToDelivery <= TargetData.GoldenTimeSeconds;

	int32 Score = TargetData.BaseScore;

	switch (LastDeliveryResult)
	{
	case EDeliveryResult::Success:
		Score = TargetData.BaseScore;
		if (Result.bGoldenTimeBonus) Score += TargetData.GoldenTimeBonus;
		if (Result.TimeToDelivery > TargetData.GoldenTimeSeconds)
		{
			int32 Delay = FMath::FloorToInt(Result.TimeToDelivery - TargetData.GoldenTimeSeconds);
			Result.PenaltyScore = Delay * TargetData.DelayPenaltyPerSecond;
			Score -= Result.PenaltyScore;
		}
		break;
	case EDeliveryResult::PartialSuccess:
		Score = FMath::FloorToInt(TargetData.BaseScore * 0.6f);
		Result.PenaltyScore = FMath::FloorToInt(TargetData.BaseScore * 0.4f);
		break;
	case EDeliveryResult::WrongSupply:
		Score = 0;
		Result.PenaltyScore = FMath::FloorToInt(TargetData.BaseScore * 0.5f);
		break;
	case EDeliveryResult::FailedNoSupply:
		Score = 0;
		Result.PenaltyScore = TargetData.BaseScore;
		break;
	case EDeliveryResult::Timeout:
		Score = 0;
		Result.PenaltyScore = TargetData.BaseScore * 2;
		break;
	default: break;
	}

	Result.ScoreEarned = FMath::Max(0, Score);
	Result.FailureExplanation = GetFailureExplanation(LastDeliveryResult);
	return Result;
}

void ARescueTarget::StartCountdown()
{
	bCountdownActive = true;
}

void ARescueTarget::PauseCountdown()
{
	bCountdownActive = false;
}

FText ARescueTarget::GetPriorityColorTag() const
{
	switch (TargetData.Priority)
	{
	case ETaskPriority::Critical:	return FText::FromString(TEXT("<RichTextBlock.ImageDecorator><Img id=\"Critical\"/></> 紧急"));
	case ETaskPriority::High:		return FText::FromString(TEXT("<Color=#FF6060>高</>"));
	case ETaskPriority::Normal:		return FText::FromString(TEXT("<Color=#FFFF60>普通</>"));
	case ETaskPriority::Low:		return FText::FromString(TEXT("<Color=#60FF60>低</>"));
	default: return FText::GetEmpty();
	}
}

void ARescueTarget::UpdateCountdown(float DeltaTime)
{
	if (!bCountdownActive || bIsRescued || bIsTimedOut) return;

	TimeRemaining -= DeltaTime;
	TimeElapsed += DeltaTime;
	OnTargetTimeUpdated.Broadcast(TargetData.TargetID, GetTimeRemainingRatio());

	if (TimeRemaining <= 0.f)
	{
		TimeRemaining = 0.f;
		bIsTimedOut = true;
		bCountdownActive = false;
		LastDeliveryResult = EDeliveryResult::Timeout;
		OnTargetTimedOut.Broadcast(TargetData.TargetID);
		OnStatusChanged(false, true);
		UE_LOG(LogMountainRescue, Warning, TEXT("救援目标超时: %s"), *TargetData.DisplayName.ToString());
	}
}

void ARescueTarget::UpdateVisualUrgency()
{
	float Ratio = GetTimeRemainingRatio();
	float Urgency = 1.f - Ratio;
	OnUrgencyLevelChanged(Urgency);

	if (SOSBeepSound)
	{
		float Interval = FMath::Lerp(3.f, 0.5f, Urgency);
		static float BeepTimer = 0.f;
		BeepTimer += GetWorld()->GetDeltaSeconds();
		if (BeepTimer >= Interval)
		{
			BeepTimer = 0.f;
			SOSBeepSound->Play(0.f);
		}
	}

	if (TargetData.Priority == ETaskPriority::Critical)
	{
		float FlashAlpha = FMath::Sin(GetWorld()->GetTimeSeconds() * 4.f) * 0.5f + 0.5f;
		if (SOSBeaconEffect)
		{
			SOSBeaconEffect->SetVariableFloat(TEXT("Intensity"), 0.5f + FlashAlpha * 0.5f);
		}
	}
}

FText ARescueTarget::GetFailureExplanation(EDeliveryResult Result) const
{
	switch (Result)
	{
	case EDeliveryResult::Success:
		return FText::FromString(TEXT("投放位置精准，救援成功！"));
	case EDeliveryResult::PartialSuccess:
		return FText::FromString(FString::Printf(
			TEXT("投放偏差 %.0f 米，物资已送达但位置不够精准（建议≤25米）"),
			LastDeliveryDistance));
	case EDeliveryResult::WrongSupply:
	{
		FString RequiredStr;
		for (int32 i = 0; i < TargetData.RequiredSupplies.Num(); i++)
		{
			if (i > 0) RequiredStr += TEXT("、");
			RequiredStr += UEnum::GetDisplayValueAsText(TargetData.RequiredSupplies[i]).ToString();
		}
		return FText::FromString(FString::Printf(
			TEXT("物资类型错误！%s 需要 %s"),
			*TargetData.DisplayName.ToString(),
			*RequiredStr));
	}
	case EDeliveryResult::FailedNoSupply:
		return FText::FromString(TEXT("无人机未携带对应物资"));
	case EDeliveryResult::Timeout:
	{
		FString TypeStr;
		switch (TargetData.TargetType)
		{
		case ERescueTargetType::MinorInjury:	TypeStr = TEXT("轻伤伤者伤情可能恶化"); break;
		case ERescueTargetType::Hypothermia:	TypeStr = TEXT("失温者面临生命危险"); break;
		case ERescueTargetType::LostPerson:		TypeStr = TEXT("迷路者可能移动出搜索范围"); break;
		default: break;
		}
		return FText::FromString(FString::Printf(
			TEXT("超过救援时限！%s，任务失败"), *TypeStr));
	}
	default:
		return FText::GetEmpty();
	}
}
