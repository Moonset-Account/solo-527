#include "OldApartmentEventSystem.h"
#include "Engine/World.h"
#include "GameFramework/GameStateBase.h"

static TWeakObjectPtr<UOldApartmentEventSystem> GEventSystemInstance;
static TWeakObjectPtr<UOldApartmentAmbientSystem> GAmbientSystemInstance;

UOldApartmentEventSystem::UOldApartmentEventSystem()
{
	NextBindingId = 1;
}

UOldApartmentEventSystem* UOldApartmentEventSystem::Get(const UObject* WorldContextObject)
{
	if (GEventSystemInstance.IsValid())
	{
		return GEventSystemInstance.Get();
	}

	UWorld* World = GEngine ? GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::LogAndReturnNull) : nullptr;
	if (!World) return nullptr;

	UOldApartmentEventSystem* NewSystem = NewObject<UOldApartmentEventSystem>(World->GetGameInstance());
	NewSystem->AddToRoot();
	GEventSystemInstance = NewSystem;
	return NewSystem;
}

bool UOldApartmentEventSystem::BroadcastEvent(const UObject* WorldContextObject, const FGameEventData& EventData)
{
	UOldApartmentEventSystem* System = Get(WorldContextObject);
	return System ? System->InternalBroadcastEvent(EventData) : false;
}

int32 UOldApartmentEventSystem::RegisterListener(const UObject* WorldContextObject, FGameplayTag EventTag,
	UObject* Listener, const FGameEventDelegate& Callback)
{
	UOldApartmentEventSystem* System = Get(WorldContextObject);
	return System ? System->InternalRegisterListener(EventTag, Listener, Callback) : INDEX_NONE;
}

void UOldApartmentEventSystem::UnregisterListener(const UObject* WorldContextObject, int32 BindingId)
{
	UOldApartmentEventSystem* System = Get(WorldContextObject);
	if (System) System->InternalUnregisterListener(BindingId);
}

void UOldApartmentEventSystem::UnregisterAllListenersForObject(const UObject* WorldContextObject, UObject* ListenerObject)
{
	UOldApartmentEventSystem* System = Get(WorldContextObject);
	if (System) System->InternalUnregisterAllListenersForObject(ListenerObject);
}

bool UOldApartmentEventSystem::InternalBroadcastEvent(const FGameEventData& EventData)
{
	FScopeLock Lock(&Mutex);

	FGameEventData EventCopy = EventData;
	if (EventCopy.Timestamp.GetTicks() == 0)
	{
		EventCopy.Timestamp = FDateTime::Now();
	}
	if (EventCopy.bShouldLog)
	{
		UE_LOG(LogTemp, Log, TEXT("[EventSystem] Broadcasting: %s | %s"),
			*EventCopy.EventTag.ToString(), *EventCopy.EventId.ToString());
	}

	EventHistory.Insert(EventCopy, 0);
	if (EventHistory.Num() > 1000)
	{
		EventHistory.SetNum(1000);
	}

	int32 Count = 0;
	EventFiredCounts.FindAndAddChecked(EventCopy.EventTag, Count)++;

	TArray<int32> MatchedBindings;
	for (auto It = TagToBindingIds.CreateConstIterator(); It; ++It)
	{
		if (It.Key() == EventCopy.EventTag || EventCopy.EventTag.MatchesTag(It.Key()))
		{
			MatchedBindings.Append(It.Value());
		}
	}

	for (int32 Id : MatchedBindings)
	{
		FGameEventBinding* Binding = Bindings.Find(Id);
		FGameEventDelegate* Callback = BindingCallbacks.Find(Id);
		if (Binding && Binding->bIsValid && Callback && Callback->IsBound())
		{
			Callback->ExecuteIfBound(EventCopy);
		}
	}

	return MatchedBindings.Num() > 0;
}

int32 UOldApartmentEventSystem::InternalRegisterListener(FGameplayTag EventTag, UObject* Listener, const FGameEventDelegate& Callback)
{
	FScopeLock Lock(&Mutex);

	int32 Id = NextBindingId++;
	FGameEventBinding NewBinding;
	NewBinding.EventTag = EventTag;
	NewBinding.ListenerObject = Listener;
	NewBinding.BindingId = Id;
	NewBinding.bIsValid = true;

	Bindings.Add(Id, NewBinding);
	BindingCallbacks.Add(Id, Callback);
	TagToBindingIds.FindOrAdd(EventTag).Add(Id);
	return Id;
}

void UOldApartmentEventSystem::InternalUnregisterListener(int32 BindingId)
{
	FScopeLock Lock(&Mutex);

	if (FGameEventBinding* Binding = Bindings.Find(BindingId))
	{
		Binding->bIsValid = false;
		if (TArray<int32>* Ids = TagToBindingIds.Find(Binding->EventTag))
		{
			Ids->Remove(BindingId);
		}
	}
	BindingCallbacks.Remove(BindingId);
}

void UOldApartmentEventSystem::InternalUnregisterAllListenersForObject(UObject* ListenerObject)
{
	FScopeLock Lock(&Mutex);

	TArray<int32> ToRemove;
	for (const auto& Pair : Bindings)
	{
		if (Pair.Value.ListenerObject == ListenerObject)
		{
			ToRemove.Add(Pair.Key);
		}
	}
	for (int32 Id : ToRemove)
	{
		InternalUnregisterListener(Id);
	}
}

TArray<FGameEventData> UOldApartmentEventSystem::GetEventHistory(int32 MaxCount) const
{
	TArray<FGameEventData> Result = EventHistory;
	if (Result.Num() > MaxCount)
	{
		Result.SetNum(MaxCount);
	}
	return Result;
}

int32 UOldApartmentEventSystem::GetEventCountForTag(FGameplayTag Tag) const
{
	const int32* Count = EventFiredCounts.Find(Tag);
	return Count ? *Count : 0;
}

void UOldApartmentEventSystem::ClearHistory()
{
	EventHistory.Empty();
	EventFiredCounts.Empty();
}

bool UOldApartmentEventSystem::HasEventBeenFired(FGameplayTag EventTag) const
{
	return EventFiredCounts.Contains(EventTag);
}

int32 UOldApartmentEventSystem::GetEventFiredCount(FGameplayTag EventTag) const
{
	return GetEventCountForTag(EventTag);
}

UOldApartmentAmbientSystem::UOldApartmentAmbientSystem()
{
	CurrentTension = 0.0f;
	TargetTension = 0.0f;
}

UOldApartmentAmbientSystem* UOldApartmentAmbientSystem::Get(const UObject* WorldContextObject)
{
	if (GAmbientSystemInstance.IsValid())
	{
		return GAmbientSystemInstance.Get();
	}

	UWorld* World = GEngine ? GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::LogAndReturnNull) : nullptr;
	if (!World) return nullptr;

	UOldApartmentAmbientSystem* NewSystem = NewObject<UOldApartmentAmbientSystem>(World->GetGameInstance());
	NewSystem->AddToRoot();
	GAmbientSystemInstance = NewSystem;
	return NewSystem;
}

void UOldApartmentAmbientSystem::TriggerSpatialCue(const UObject* WorldContextObject, FName CueId,
	FVector WorldLocation, float TriggerRadius, float DelaySeconds)
{
	UE_LOG(LogTemp, Log, TEXT("[AmbientSystem] Spatial cue triggered: %s at %s (delay: %.1fs)"),
		*CueId.ToString(), *WorldLocation.ToString(), DelaySeconds);
	FiredCues.Add(CueId, true);
	CueCooldowns.Add(CueId, FDateTime::Now());
}

void UOldApartmentAmbientSystem::TriggerProximityEvent(const UObject* WorldContextObject, FName RoomId,
	float Intensity, bool bIsScary)
{
	UE_LOG(LogTemp, Log, TEXT("[AmbientSystem] Proximity event in %s, intensity=%.2f, scary=%d"),
		*RoomId.ToString(), Intensity, bIsScary ? 1 : 0);
	SetOverallTension(TargetTension + Intensity * (bIsScary ? 1.5f : 1.0f));
}

void UOldApartmentAmbientSystem::SetOverallTension(float NewTension, float SmoothTime)
{
	TargetTension = FMath::Clamp(NewTension, 0.0f, 1.0f);
	CurrentTension = FMath::FInterpTo(CurrentTension, TargetTension, GetWorld() ? GetWorld()->GetDeltaSeconds() : 0.016f, 1.0f / FMath::Max(0.01f, SmoothTime));
}

void UOldApartmentAmbientSystem::ResetAllCues()
{
	FiredCues.Empty();
	CueCooldowns.Empty();
	CurrentTension = 0.0f;
	TargetTension = 0.0f;
}
