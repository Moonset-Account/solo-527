#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StickerShopTypes.h"
#include "W_RetryPrompt.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnRetryConfirmed, int32, LevelId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnRetryCancelled);

UCLASS()
class STICKERSHOP_API UW_RetryPrompt : public UUserWidget
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Retry")
	void ShowPrompt(int32 LevelId, const FString& FailureReason);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Retry")
	void ConfirmRetry();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Retry")
	void CancelRetry();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Retry")
	void BP_OnPromptShown(const FString& FailureReason);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Retry")
	void BP_OnPromptDismissed();

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Retry")
	FOnRetryConfirmed OnRetryConfirmed;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Retry")
	FOnRetryCancelled OnRetryCancelled;

protected:
	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Retry")
	int32 RetryLevelId = -1;

	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Retry")
	FString FailureReasonText;
};
