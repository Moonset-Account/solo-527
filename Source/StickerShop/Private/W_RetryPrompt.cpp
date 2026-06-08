#include "W_RetryPrompt.h"

void UW_RetryPrompt::ShowPrompt(int32 LevelId, const FString& FailureReason)
{
	RetryLevelId = LevelId;
	FailureReasonText = FailureReason;
	BP_OnPromptShown(FailureReason);
}

void UW_RetryPrompt::ConfirmRetry()
{
	OnRetryConfirmed.Broadcast(RetryLevelId);
	BP_OnPromptDismissed();
}

void UW_RetryPrompt::CancelRetry()
{
	OnRetryCancelled.Broadcast();
	BP_OnPromptDismissed();
}
