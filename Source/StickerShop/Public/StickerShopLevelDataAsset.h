#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "StickerShopTypes.h"
#include "StickerShopLevelDataAsset.generated.h"

UCLASS(BlueprintType)
class STICKERSHOP_API UStickerShopLevelDataAsset : public UPrimaryDataAsset
{
	GENERATED_BODY()

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	FLevelDefinition LevelDef;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	FString MapAssetPath;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	bool bIsUnlocked = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	bool bIsCompleted = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	int32 BestScore = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	FString BestGrade;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Level")
	bool CanPlay() const { return bIsUnlocked; }

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Level")
	bool IsCompleted() const { return bIsCompleted; }
};

UCLASS(BlueprintType)
class STICKERSHOP_API UStickerShopLevelCollection : public UPrimaryDataAsset
{
	GENERATED_BODY()

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Levels")
	TArray<UStickerShopLevelDataAsset*> Levels;

	UFUNCTION(BlueprintCallable, Category = "Levels")
	static UStickerShopLevelCollection* GetCollection(UObject* Context);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Levels")
	int32 GetUnlockedCount() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Levels")
	UStickerShopLevelDataAsset* GetLevelByIndex(int32 Index) const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Levels")
	UStickerShopLevelDataAsset* FindLevelById(int32 LevelId) const;
};
