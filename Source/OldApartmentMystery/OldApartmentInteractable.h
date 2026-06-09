#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "GameplayTagContainer.h"
#include "OldApartmentInteractable.generated.h"

class UWidgetComponent;
class UStaticMeshComponent;
class USphereComponent;
class UNiagaraSystem;
class USoundBase;

UENUM(BlueprintType)
enum class EInteractableType : uint8
{
	Clue          UMETA(DisplayName = "线索物品"),
	PuzzleLock    UMETA(DisplayName = "谜题锁"),
	Door          UMETA(DisplayName = "门"),
	Furniture     UMETA(DisplayName = "家具检查"),
	Note          UMETA(DisplayName = "笔记"),
	Trigger       UMETA(DisplayName = "触发器"),
	Container     UMETA(DisplayName = "容器"),
	LightSwitch   UMETA(DisplayName = "开关")
};

USTRUCT(BlueprintType)
struct FInteractableData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	FName InteractableId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	EInteractableType Type;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	FText DisplayName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	FText HintText;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	FGameplayTagContainer GameplayTags;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	bool bIsCollectable;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	bool bCanBeExamined;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	bool bDestroyOnInteract;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	int32 ScoreReward;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Interactable")
	int32 MistakePenalty;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnInteracted, AOldApartmentInteractable*, Interactable, APawn*, InstigatorPawn);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnExamined, AOldApartmentInteractable*, Interactable);

UCLASS()
class OLDAPARTMENTMYSTERY_API AOldApartmentInteractable : public AActor
{
	GENERATED_BODY()

public:
	AOldApartmentInteractable();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	USphereComponent* InteractCollision;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UStaticMeshComponent* InteractableMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UWidgetComponent* InteractionWidget;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Data")
	FInteractableData InteractableData;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Visual")
	bool bHighlightOnHover;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Visual")
	UNiagaraSystem* InteractVFX;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	USoundBase* InteractSound;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	USoundBase* ExamineSound;

	UPROPERTY(BlueprintAssignable, Category = "Events")
	FOnInteracted OnInteracted;

	UPROPERTY(BlueprintAssignable, Category = "Events")
	FOnExamined OnExamined;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "State")
	bool bHasBeenInteracted;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "State")
	bool bIsActive;

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	virtual void Interact(APawn* InstigatorPawn);

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	virtual void BeginExamine();

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	virtual void EndExamine();

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	virtual void SetHighlight(bool bEnabled);

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	virtual void ActivateInteractable();

	UFUNCTION(BlueprintCallable, Category = "Interaction")
	virtual void DeactivateInteractable();

	UFUNCTION(BlueprintNativeEvent, Category = "Interaction")
	void OnInteractEvent(APawn* InstigatorPawn);
	virtual void OnInteractEvent_Implementation(APawn* InstigatorPawn);

	UFUNCTION(BlueprintNativeEvent, Category = "Interaction")
	void OnExamineEvent();
	virtual void OnExamineEvent_Implementation();

	UFUNCTION(BlueprintPure, Category = "UI")
	virtual FText GetInteractionLabel() const;

protected:
	virtual void BeginPlay() override;

	UFUNCTION()
	virtual void HandleBeginOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor,
		UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

	UFUNCTION()
	virtual void HandleEndOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor,
		UPrimitiveComponent* OtherComp, int32 OtherBodyIndex);

	UPROPERTY()
	UMaterialInstanceDynamic* HighlightMID;
};
