#include "TaskEditorComponent.h"
#include "MountainRescueDrone.h"

UTaskEditorComponent::UTaskEditorComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UTaskEditorComponent::BeginPlay()
{
	Super::BeginPlay();
	InitializeDefaultPresets();
}

void UTaskEditorComponent::InitializeDefaultPresets()
{
	DifficultyPresets.Empty();

	FTaskConfig Easy;
	Easy.InitialBatteryPercent = 1.f;
	Easy.Weather.WindSpeed = 3.f;
	Easy.Weather.bIsGusty = false;
	Easy.FlightParams.BaseBatteryDrainPerSecond = 0.12f;
	Easy.FlightParams.MaxSignalRange = 4000.f;
	Easy.FlightParams.MaxPayloadWeight = 20.f;
	{
		FSupplyPayload P; P.SupplyType = ESupplyType::MedicalKit; P.Count = 5; P.UnitWeightKg = 1.5f; Easy.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::WarmBlanket; P.Count = 3; Easy.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::LocatorBeacon; P.Count = 3; Easy.InitialPayload.Add(P);
	}
	DifficultyPresets.Add(TEXT("简单"), Easy);

	FTaskConfig Normal;
	Normal.InitialBatteryPercent = 0.9f;
	Normal.Weather.WindSpeed = 7.f;
	Normal.Weather.bIsGusty = true;
	Normal.Weather.GustIntensity = 1.5f;
	Normal.FlightParams.BaseBatteryDrainPerSecond = 0.15f;
	Normal.FlightParams.MaxSignalRange = 3000.f;
	Normal.FlightParams.MaxPayloadWeight = 15.f;
	{
		FSupplyPayload P; P.SupplyType = ESupplyType::MedicalKit; P.Count = 4; P.UnitWeightKg = 2.f; Normal.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::WarmBlanket; P.Count = 2; P.UnitWeightKg = 2.5f; Normal.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::LocatorBeacon; P.Count = 2; P.UnitWeightKg = 1.5f; Normal.InitialPayload.Add(P);
	}
	{
		FSignalDeadZone Z1; Z1.CenterLocation = FVector(150000.f, 50000.f, 20000.f); Z1.Radius = 40000.f; Z1.SignalBlockStrength = 0.85f;
		Normal.SignalDeadZones.Add(Z1);
	}
	DifficultyPresets.Add(TEXT("普通"), Normal);

	FTaskConfig Hard;
	Hard.InitialBatteryPercent = 0.75f;
	Hard.Weather.WindSpeed = 12.f;
	Hard.Weather.bIsGusty = true;
	Hard.Weather.GustIntensity = 2.5f;
	Hard.FlightParams.BaseBatteryDrainPerSecond = 0.2f;
	Hard.FlightParams.MaxSignalRange = 2200.f;
	Hard.FlightParams.MaxPayloadWeight = 12.f;
	{
		FSupplyPayload P; P.SupplyType = ESupplyType::MedicalKit; P.Count = 3; P.UnitWeightKg = 2.5f; Hard.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::WarmBlanket; P.Count = 2; P.UnitWeightKg = 3.f; Hard.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::LocatorBeacon; P.Count = 2; P.UnitWeightKg = 2.f; Hard.InitialPayload.Add(P);
	}
	{
		FSignalDeadZone Z1; Z1.CenterLocation = FVector(100000.f, 80000.f, 15000.f); Z1.Radius = 50000.f; Z1.SignalBlockStrength = 0.9f;
		Hard.SignalDeadZones.Add(Z1);
		FSignalDeadZone Z2; Z2.CenterLocation = FVector(200000.f, 30000.f, 25000.f); Z2.Radius = 35000.f; Z2.SignalBlockStrength = 0.8f;
		Hard.SignalDeadZones.Add(Z2);
	}
	DifficultyPresets.Add(TEXT("困难"), Hard);

	FTaskConfig Expert;
	Expert.InitialBatteryPercent = 0.6f;
	Expert.Weather.WindSpeed = 18.f;
	Expert.Weather.bIsGusty = true;
	Expert.Weather.GustIntensity = 3.5f;
	Expert.FlightParams.BaseBatteryDrainPerSecond = 0.25f;
	Expert.FlightParams.MaxSignalRange = 1800.f;
	Expert.FlightParams.MaxPayloadWeight = 10.f;
	{
		FSupplyPayload P; P.SupplyType = ESupplyType::MedicalKit; P.Count = 2; P.UnitWeightKg = 3.f; Expert.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::WarmBlanket; P.Count = 1; P.UnitWeightKg = 3.5f; Expert.InitialPayload.Add(P);
		P.SupplyType = ESupplyType::LocatorBeacon; P.Count = 2; P.UnitWeightKg = 2.5f; Expert.InitialPayload.Add(P);
	}
	{
		FSignalDeadZone Z1; Z1.CenterLocation = FVector(80000.f, 100000.f, 20000.f); Z1.Radius = 60000.f; Z1.SignalBlockStrength = 0.95f;
		Expert.SignalDeadZones.Add(Z1);
		FSignalDeadZone Z2; Z2.CenterLocation = FVector(180000.f, 60000.f, 25000.f); Z2.Radius = 45000.f; Z2.SignalBlockStrength = 0.9f;
		Expert.SignalDeadZones.Add(Z2);
		FSignalDeadZone Z3; Z3.CenterLocation = FVector(250000.f, 150000.f, 30000.f); Z3.Radius = 50000.f; Z3.SignalBlockStrength = 0.85f;
		Expert.SignalDeadZones.Add(Z3);
	}
	DifficultyPresets.Add(TEXT("专家"), Expert);

	UE_LOG(LogMountainRescue, Log, TEXT("任务编辑器: 已初始化 %d 个难度预设"), DifficultyPresets.Num());
}

bool UTaskEditorComponent::ApplyPreset(FName PresetName)
{
	FTaskConfig* Found = DifficultyPresets.Find(PresetName);
	if (!Found) return false;

	EditableConfig = *Found;
	bIsEditorOpen = true;
	OnTaskConfigChanged.Broadcast(EditableConfig);
	OnPresetApplied.Broadcast(PresetName);

	UE_LOG(LogMountainRescue, Log, TEXT("已应用预设: %s"), *PresetName.ToString());
	return true;
}

void UTaskEditorComponent::SaveCurrentAsPreset(FName PresetName)
{
	DifficultyPresets.Add(PresetName, EditableConfig);
}

void UTaskEditorComponent::DeletePreset(FName PresetName)
{
	DifficultyPresets.Remove(PresetName);
}

void UTaskEditorComponent::SetWindSpeed(float NewSpeed)
{
	EditableConfig.Weather.WindSpeed = FMath::Clamp(NewSpeed, 0.f, 30.f);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::SetWindDirection(float DegreesFromNorth)
{
	float Rad = FMath::DegreesToRadians(DegreesFromNorth);
	EditableConfig.Weather.WindDirection = FVector(FMath::Cos(Rad), FMath::Sin(Rad), 0.f);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::ToggleGusts(bool bEnable, float Intensity)
{
	EditableConfig.Weather.bIsGusty = bEnable;
	EditableConfig.Weather.GustIntensity = Intensity;
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::SetInitialBattery(float Percent01)
{
	EditableConfig.InitialBatteryPercent = FMath::Clamp(Percent01, 0.1f, 1.f);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::SetBatteryDrainMultiplier(float Multiplier)
{
	EditableConfig.FlightParams.BaseBatteryDrainPerSecond = FMath::Clamp(0.1f * Multiplier, 0.05f, 0.5f);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::AddSupplyToPayload(ESupplyType Type, int32 Count, float UnitWeightKg)
{
	for (FSupplyPayload& P : EditableConfig.InitialPayload)
	{
		if (P.SupplyType == Type)
		{
			P.Count += Count;
			P.UnitWeightKg = UnitWeightKg;
			OnTaskConfigChanged.Broadcast(EditableConfig);
			return;
		}
	}
	FSupplyPayload NewP;
	NewP.SupplyType = Type;
	NewP.Count = Count;
	NewP.UnitWeightKg = UnitWeightKg;
	EditableConfig.InitialPayload.Add(NewP);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::RemoveSupplyFromPayload(ESupplyType Type, int32 Count)
{
	for (int32 i = 0; i < EditableConfig.InitialPayload.Num(); i++)
	{
		FSupplyPayload& P = EditableConfig.InitialPayload[i];
		if (P.SupplyType == Type)
		{
			P.Count -= Count;
			if (P.Count <= 0) EditableConfig.InitialPayload.RemoveAt(i);
			OnTaskConfigChanged.Broadcast(EditableConfig);
			return;
		}
	}
}

void UTaskEditorComponent::SetSupplyCount(ESupplyType Type, int32 Count, float UnitWeightKg)
{
	for (FSupplyPayload& P : EditableConfig.InitialPayload)
	{
		if (P.SupplyType == Type)
		{
			P.Count = FMath::Max(0, Count);
			P.UnitWeightKg = UnitWeightKg;
			if (P.Count == 0)
			{
				EditableConfig.InitialPayload.Remove(P);
			}
			OnTaskConfigChanged.Broadcast(EditableConfig);
			return;
		}
	}
	if (Count > 0) AddSupplyToPayload(Type, Count, UnitWeightKg);
}

void UTaskEditorComponent::ClearPayload()
{
	EditableConfig.InitialPayload.Empty();
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::AddRescueTarget(const FRescueTargetData& NewTarget)
{
	EditableConfig.RescueTargets.Add(NewTarget);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::RemoveRescueTarget(FName TargetID)
{
	for (int32 i = 0; i < EditableConfig.RescueTargets.Num(); i++)
	{
		if (EditableConfig.RescueTargets[i].TargetID == TargetID)
		{
			EditableConfig.RescueTargets.RemoveAt(i);
			OnTaskConfigChanged.Broadcast(EditableConfig);
			return;
		}
	}
}

void UTaskEditorComponent::UpdateRescueTarget(FName TargetID, const FRescueTargetData& UpdatedData)
{
	for (FRescueTargetData& T : EditableConfig.RescueTargets)
	{
		if (T.TargetID == TargetID)
		{
			T = UpdatedData;
			OnTaskConfigChanged.Broadcast(EditableConfig);
			return;
		}
	}
}

void UTaskEditorComponent::SetTargetPriority(FName TargetID, ETaskPriority NewPriority)
{
	for (FRescueTargetData& T : EditableConfig.RescueTargets)
	{
		if (T.TargetID == TargetID)
		{
			T.Priority = NewPriority;
			OnTaskConfigChanged.Broadcast(EditableConfig);
			return;
		}
	}
}

void UTaskEditorComponent::AddSignalDeadZone(const FSignalDeadZone& NewZone)
{
	EditableConfig.SignalDeadZones.Add(NewZone);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::RemoveSignalDeadZone(int32 Index)
{
	if (EditableConfig.SignalDeadZones.IsValidIndex(Index))
	{
		EditableConfig.SignalDeadZones.RemoveAt(Index);
		OnTaskConfigChanged.Broadcast(EditableConfig);
	}
}

void UTaskEditorComponent::SetMaxSignalRange(float NewRangeMeters)
{
	EditableConfig.FlightParams.MaxSignalRange = FMath::Clamp(NewRangeMeters, 500.f, 10000.f);
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

void UTaskEditorComponent::ApplyChanges()
{
	bIsEditorOpen = false;
	OnTaskConfigChanged.Broadcast(EditableConfig);
	UE_LOG(LogMountainRescue, Log, TEXT("任务配置已应用: 风速=%.1f, 初始电量=%.0f%%, 目标数=%d"),
		EditableConfig.Weather.WindSpeed,
		EditableConfig.InitialBatteryPercent * 100,
		EditableConfig.RescueTargets.Num());
}

void UTaskEditorComponent::RevertChanges(const FTaskConfig& OriginalConfig)
{
	EditableConfig = OriginalConfig;
	bIsEditorOpen = false;
	OnTaskConfigChanged.Broadcast(EditableConfig);
}

TArray<FName> UTaskEditorComponent::GetPresetNames() const
{
	TArray<FName> Names;
	DifficultyPresets.GetKeys(Names);
	return Names;
}

int32 UTaskEditorComponent::GetPayloadTotalCount() const
{
	int32 C = 0;
	for (const FSupplyPayload& P : EditableConfig.InitialPayload) C += P.Count;
	return C;
}

float UTaskEditorComponent::GetPayloadTotalWeight() const
{
	float W = 0;
	for (const FSupplyPayload& P : EditableConfig.InitialPayload) W += P.GetTotalWeight();
	return W;
}

bool UTaskEditorComponent::ValidatePayloadWeight(float& OutWeight, float& OutMax) const
{
	OutWeight = GetPayloadTotalWeight();
	OutMax = EditableConfig.FlightParams.MaxPayloadWeight;
	return OutWeight <= OutMax;
}
