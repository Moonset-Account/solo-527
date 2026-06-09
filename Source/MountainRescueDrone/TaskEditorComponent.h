#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "MountainRescueTypes.h"
#include "TaskEditorComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTaskConfigChanged, const FTaskConfig&, NewConfig);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPresetApplied, FName, PresetName);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MOUNTAINRESCUEDRONE_API UTaskEditorComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UTaskEditorComponent();

protected:
	virtual void BeginPlay() override;

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "编辑器|配置")
	FTaskConfig EditableConfig;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "编辑器|难度预设")
	TMap<FName, FTaskConfig> DifficultyPresets;

	UPROPERTY(BlueprintReadOnly, Category = "编辑器|状态")
	bool bIsEditorOpen = false;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTaskConfigChanged OnTaskConfigChanged;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnPresetApplied OnPresetApplied;

public:
	UFUNCTION(BlueprintCallable, Category = "编辑器|预设")
	void InitializeDefaultPresets();

	UFUNCTION(BlueprintCallable, Category = "编辑器|预设")
	bool ApplyPreset(FName PresetName);

	UFUNCTION(BlueprintCallable, Category = "编辑器|预设")
	void SaveCurrentAsPreset(FName PresetName);

	UFUNCTION(BlueprintCallable, Category = "编辑器|预设")
	void DeletePreset(FName PresetName);

	UFUNCTION(BlueprintCallable, Category = "编辑器|天气")
	void SetWindSpeed(float NewSpeed);
	UFUNCTION(BlueprintCallable, Category = "编辑器|天气")
	void SetWindDirection(float DegreesFromNorth);
	UFUNCTION(BlueprintCallable, Category = "编辑器|天气")
	void ToggleGusts(bool bEnable, float Intensity = 2.f);

	UFUNCTION(BlueprintCallable, Category = "编辑器|电量")
	void SetInitialBattery(float Percent01);
	UFUNCTION(BlueprintCallable, Category = "编辑器|电量")
	void SetBatteryDrainMultiplier(float Multiplier);

	UFUNCTION(BlueprintCallable, Category = "编辑器|物资")
	void AddSupplyToPayload(ESupplyType Type, int32 Count, float UnitWeightKg);
	UFUNCTION(BlueprintCallable, Category = "编辑器|物资")
	void RemoveSupplyFromPayload(ESupplyType Type, int32 Count);
	UFUNCTION(BlueprintCallable, Category = "编辑器|物资")
	void SetSupplyCount(ESupplyType Type, int32 Count, float UnitWeightKg);
	UFUNCTION(BlueprintCallable, Category = "编辑器|物资")
	void ClearPayload();

	UFUNCTION(BlueprintCallable, Category = "编辑器|目标")
	void AddRescueTarget(const FRescueTargetData& NewTarget);
	UFUNCTION(BlueprintCallable, Category = "编辑器|目标")
	void RemoveRescueTarget(FName TargetID);
	UFUNCTION(BlueprintCallable, Category = "编辑器|目标")
	void UpdateRescueTarget(FName TargetID, const FRescueTargetData& UpdatedData);
	UFUNCTION(BlueprintCallable, Category = "编辑器|目标")
	void SetTargetPriority(FName TargetID, ETaskPriority NewPriority);

	UFUNCTION(BlueprintCallable, Category = "编辑器|信号")
	void AddSignalDeadZone(const FSignalDeadZone& NewZone);
	UFUNCTION(BlueprintCallable, Category = "编辑器|信号")
	void RemoveSignalDeadZone(int32 Index);
	UFUNCTION(BlueprintCallable, Category = "编辑器|信号")
	void SetMaxSignalRange(float NewRangeMeters);

	UFUNCTION(BlueprintCallable, Category = "编辑器|应用")
	void ApplyChanges();
	UFUNCTION(BlueprintCallable, Category = "编辑器|应用")
	void RevertChanges(const FTaskConfig& OriginalConfig);

	UFUNCTION(BlueprintCallable, Category = "编辑器|查询")
	TArray<FName> GetPresetNames() const;
	UFUNCTION(BlueprintCallable, Category = "编辑器|查询")
	int32 GetPayloadTotalCount() const;
	UFUNCTION(BlueprintCallable, Category = "编辑器|查询")
	float GetPayloadTotalWeight() const;
	UFUNCTION(BlueprintCallable, Category = "编辑器|查询")
	bool ValidatePayloadWeight(float& OutWeight, float& OutMax) const;
};
