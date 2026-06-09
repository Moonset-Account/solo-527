#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "GameplayTagContainer.h"
#include "OldApartmentEventSystem.generated.h"

class UOldApartmentEventSystem;

USTRUCT(BlueprintType)
struct FGameEventData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	FGameplayTag EventTag;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	FName EventId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	FText EventTitle;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	FText EventDescription;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	TMap<FName, FString> StringParameters;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	TMap<FName, int32> IntParameters;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	TMap<FName, float> FloatParameters;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	TMap<FName, bool> BoolParameters;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	UObject* Sender;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	AActor* InstigatorActor;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	FDateTime Timestamp;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Event")
	bool bShouldLog;
};

DECLARE_DYNAMIC_DELEGATE_OneParam(FGameEventDelegate, const FGameEventData&, EventData);

USTRUCT()
struct FGameEventBinding
{
	GENERATED_BODY()

	UPROPERTY()
	FGameplayTag EventTag;

	UPROPERTY()
	UObject* ListenerObject;

	int32 BindingId;
	bool bIsValid;
};

UCLASS(BlueprintType, Blueprintable, Config = Game, DefaultConfig)
class OLDAPARTMENTMYSTERY_API UOldApartmentEventSystem : public UObject
{
	GENERATED_BODY()

public:
	UOldApartmentEventSystem();

	static UOldApartmentEventSystem* Get(const UObject* WorldContextObject);

	UFUNCTION(BlueprintCallable, Category = "Events", meta = (WorldContext = "WorldContextObject"))
	static bool BroadcastEvent(const UObject* WorldContextObject, const FGameEventData& EventData);

	UFUNCTION(BlueprintCallable, Category = "Events", meta = (WorldContext = "WorldContextObject"))
	static int32 RegisterListener(const UObject* WorldContextObject, FGameplayTag EventTag,
		UObject* Listener, const FGameEventDelegate& Callback);

	UFUNCTION(BlueprintCallable, Category = "Events", meta = (WorldContext = "WorldContextObject"))
	static void UnregisterListener(const UObject* WorldContextObject, int32 BindingId);

	UFUNCTION(BlueprintCallable, Category = "Events", meta = (WorldContext = "WorldContextObject"))
	static void UnregisterAllListenersForObject(const UObject* WorldContextObject, UObject* ListenerObject);

	UFUNCTION(BlueprintPure, Category = "Events")
	TArray<FGameEventData> GetEventHistory(int32 MaxCount = 100) const;

	UFUNCTION(BlueprintPure, Category = "Events")
	int32 GetEventCountForTag(FGameplayTag Tag) const;

	UFUNCTION(BlueprintCallable, Category = "Events")
	void ClearHistory();

	UFUNCTION(BlueprintPure, Category = "Events")
	bool HasEventBeenFired(FGameplayTag EventTag) const;

	UFUNCTION(BlueprintPure, Category = "Events")
	int32 GetEventFiredCount(FGameplayTag EventTag) const;

protected:
	bool InternalBroadcastEvent(const FGameEventData& EventData);
	int32 InternalRegisterListener(FGameplayTag EventTag, UObject* Listener, const FGameEventDelegate& Callback);
	void InternalUnregisterListener(int32 BindingId);
	void InternalUnregisterAllListenersForObject(UObject* ListenerObject);

	UPROPERTY()
	TArray<FGameEventData> EventHistory;

	UPROPERTY()
	TMap<FGameplayTag, int32> EventFiredCounts;

	TMap<int32, FGameEventBinding> Bindings;
	TMap<FGameplayTag, TArray<int32>> TagToBindingIds;
	TMap<int32, FGameEventDelegate> BindingCallbacks;

	int32 NextBindingId;
	FCriticalSection Mutex;
};

UCLASS(BlueprintType, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOldApartmentAmbientSystem : public UObject
{
	GENERATED_BODY()

public:
	UOldApartmentAmbientSystem();

	static UOldApartmentAmbientSystem* Get(const UObject* WorldContextObject);

	UFUNCTION(BlueprintCallable, Category = "Ambient", meta = (WorldContext = "WorldContextObject"))
	void TriggerSpatialCue(const UObject* WorldContextObject, FName CueId, FVector WorldLocation,
		float TriggerRadius = 500.0f, float DelaySeconds = 0.0f);

	UFUNCTION(BlueprintCallable, Category = "Ambient", meta = (WorldContext = "WorldContextObject"))
	void TriggerProximityEvent(const UObject* WorldContextObject, FName RoomId,
		float Intensity = 1.0f, bool bIsScary = false);

	UFUNCTION(BlueprintCallable, Category = "Ambient")
	void SetOverallTension(float NewTension, float SmoothTime = 2.0f);

	UFUNCTION(BlueprintPure, Category = "Ambient")
	float GetCurrentTension() const { return CurrentTension; }

	UFUNCTION(BlueprintCallable, Category = "Ambient")
	void ResetAllCues();

protected:
	UPROPERTY(VisibleAnywhere, Category = "Ambient")
	float CurrentTension;

	UPROPERTY(VisibleAnywhere, Category = "Ambient")
	float TargetTension;

	UPROPERTY(VisibleAnywhere, Category = "Ambient")
	TMap<FName, bool> FiredCues;

	UPROPERTY(VisibleAnywhere, Category = "Ambient")
	TMap<FName, FDateTime> CueCooldowns;
};
