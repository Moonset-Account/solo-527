#pragma once

#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "StickerShopTypes.h"
#include "StickerShopGameInstance.generated.h"

class UStickerShopSaveGame;
class UW_StickerDesign;
class UW_Printing;
class UW_StallLayout;
class UW_Settlement;
class UW_RetryPrompt;

UCLASS()
class STICKERSHOP_API UStickerShopGameInstance : public UGameInstance
{
	GENERATED_BODY()

public:
	UStickerShopGameInstance();

	virtual void Init() override;
	virtual void Shutdown() override;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	void StartNewGame();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	void ContinueGame();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	void LoadLevelById(int32 LevelId);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	void OnLevelCompleted(const FSettlementData& SettlementData);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	void RetryCurrentLevel();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|GameInstance")
	int32 GetCurrentLevelId() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|GameInstance")
	UStickerShopSaveGame* GetSaveData() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	bool SaveCurrentGame(const FString& SlotName);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	bool LoadSavedGame(const FString& SlotName);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|GameInstance")
	void RegisterWidgetClasses();

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_StickerDesign> DesignWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_Printing> PrintWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_StallLayout> StallWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_Settlement> SettlementWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_RetryPrompt> RetryWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|Maps")
	FString TutorialMapPath;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|Maps")
	FString ChallengeMapPath;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|Maps")
	FString FailureTestMapPath;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|Maps")
	FString NormalMapPath;

private:
	UPROPERTY()
	UStickerShopSaveGame* CurrentSaveData;

	int32 CurrentLevelId = 0;

	FString GetMapPathForLevel(int32 LevelId) const;
};
