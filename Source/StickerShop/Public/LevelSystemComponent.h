#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "LevelSystemComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnLevelRegistered, int32, LevelId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnLevelExtended, int32, BaseId, const FString&, MethodName);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API ULevelSystemComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	ULevelSystemComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	void RegisterBuiltinLevels();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	void RegisterLevel(const FLevelDefinition& Def);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Level")
	const FLevelDefinition* GetLevel(int32 LevelId) const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Level")
	const TArray<FLevelDefinition>& GetAllLevels() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Level")
	int32 GetLevelCount() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	FLevelDefinition ExtendLevel(int32 BaseLevelId, const FString& MethodName, const TMap<FString, float>& Params) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	TArray<FLevelDefinition> GenerateSequence(int32 StartId, int32 Count, const FString& MethodName, const TMap<FString, float>& BaseParams) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	static FLevelDefinition CreateTutorialLevel();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	static FLevelDefinition CreateChallengeLevel();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	static FLevelDefinition CreateFailureTestLevel();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Level")
	static FLevelDefinition CreateNormalLevel(int32 Id, float Difficulty);

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Level")
	FOnLevelRegistered OnLevelRegistered;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Level")
	FOnLevelExtended OnLevelExtended;

private:
	UPROPERTY()
	TArray<FLevelDefinition> Levels;
};
