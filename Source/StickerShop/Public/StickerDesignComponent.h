#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "StickerDesignComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnStickerDesigned, int32, DesignId, const FStickerDesign&, Design);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDesignPhaseComplete);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API UStickerDesignComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UStickerDesignComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Design")
	bool DesignSticker(const FString& Name, EThemeType Theme, EStickerRarity Rarity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Design")
	const TArray<FStickerDesign>& GetDesignedStickers() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Design")
	bool HasDesign(int32 DesignId) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Design")
	const FStickerDesign& GetDesign(int32 DesignId) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Design")
	void ClearDesigns();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Design")
	int32 GetDesignCount() const;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Design")
	FOnStickerDesigned OnStickerDesigned;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Design")
	FOnDesignPhaseComplete OnDesignPhaseComplete;

private:
	UPROPERTY()
	TArray<FStickerDesign> DesignedStickers;

	int32 NextDesignId = 0;
};
