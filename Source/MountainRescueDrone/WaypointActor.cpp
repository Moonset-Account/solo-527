#include "WaypointActor.h"
#include "Components/SphereComponent.h"
#include "Components/BillboardComponent.h"
#include "Components/TextRenderComponent.h"

AWaypointActor::AWaypointActor()
{
	PrimaryActorTick.bCanEverTick = false;

	CollisionSphere = CreateDefaultSubobject<USphereComponent>(TEXT("CollisionSphere"));
	RootComponent = CollisionSphere;
	CollisionSphere->InitSphereRadius(100.f);
	CollisionSphere->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	CollisionSphere->SetCollisionResponseToAllChannels(ECR_Block);

	Billboard = CreateDefaultSubobject<UBillboardComponent>(TEXT("Billboard"));
	Billboard->SetupAttachment(RootComponent);

	IndexLabel = CreateDefaultSubobject<UTextRenderComponent>(TEXT("IndexLabel"));
	IndexLabel->SetupAttachment(RootComponent);
	IndexLabel->SetRelativeLocation(FVector(0, 0, 150.f));
	IndexLabel->SetHorizontalAlignment(EHTA_Center);
	IndexLabel->SetVerticalAlignment(EVRTA_TextCenter);
	IndexLabel->SetTextRenderColor(FColor::Yellow);
	IndexLabel->SetWorldSize(40.f);

	InfoLabel = CreateDefaultSubobject<UTextRenderComponent>(TEXT("InfoLabel"));
	InfoLabel->SetupAttachment(RootComponent);
	InfoLabel->SetRelativeLocation(FVector(0, 0, 100.f));
	InfoLabel->SetHorizontalAlignment(EHTA_Center);
	InfoLabel->SetVerticalAlignment(EVRTA_TextCenter);
	InfoLabel->SetTextRenderColor(FColor::White);
	InfoLabel->SetWorldSize(24.f);

	CurrentColor = NormalColor;
}

void AWaypointActor::BeginPlay()
{
	Super::BeginPlay();
	UpdateLabels();
}

void AWaypointActor::UpdateVisualState(bool bIsSelected, bool bHasBatteryWarning, bool bHasSignalWarning)
{
	FColor NewColor;

	if (bIsSelected)
	{
		NewColor = SelectedColor;
	}
	else if (bHasBatteryWarning || bHasSignalWarning)
	{
		NewColor = WarningColor;
	}
	else if (WaypointData.bIsDeliveryPoint)
	{
		NewColor = DeliveryColor;
	}
	else
	{
		NewColor = NormalColor;
	}

	CurrentColor = NewColor;
	OnVisualStateChanged(NewColor, bHasBatteryWarning || bHasSignalWarning);

	IndexLabel->SetTextRenderColor(NewColor);
}

void AWaypointActor::UpdateLabels()
{
	IndexLabel->SetText(FText::FromString(FString::FromInt(WaypointIndex)));

	FString InfoText;
	if (WaypointData.bIsDeliveryPoint)
	{
		InfoText += FString::Printf(TEXT("[投放] "));
		if (WaypointData.SupplyToDrop != ESupplyType::MAX)
		{
			InfoText += UEnum::GetDisplayValueAsText(WaypointData.SupplyToDrop).ToString();
		}
	}
	if (WaypointData.HoverTime > 0.f)
	{
		InfoText += FString::Printf(TEXT(" 悬停%.0fs"), WaypointData.HoverTime);
	}
	InfoText += FString::Printf(TEXT("\n高度%.0fm"), WaypointData.Location.Z);
	InfoLabel->SetText(FText::FromString(InfoText));
}

void AWaypointActor::SetWaypointData(const FWaypoint& NewData)
{
	WaypointData = NewData;
	SetActorLocation(WaypointData.Location);
	UpdateLabels();
}
