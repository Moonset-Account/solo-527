#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "Engine/StreamableManager.h"
#include "OldApartmentMysteryGameMode.generated.h"

USTRUCT(BlueprintType)
struct FChapterProgress
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	int32 ChapterId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	FName ChapterName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	bool bCompleted;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	float TimeSpentSeconds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	int32 Score;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	int32 Mistakes;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	int32 CluesFound;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	int32 TotalClues;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Chapter")
	TArray<FName> UnlockedContentIds;
};

USTRUCT(BlueprintType)
struct FGameSessionResult
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	int32 FinalScore;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	float TotalTimeSeconds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	int32 TotalMistakes;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	int32 CluesCollected;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	int32 PuzzlesSolved;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	TArray<FName> UnlockedAchievements;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	TArray<FName> UnlockedContent;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	FString Rank;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Result")
	bool bIsNewRecord;
};

UCLASS(minimalapi)
class AOldApartmentMysteryGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	AOldApartmentMysteryGameMode();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Scoring")
	int32 MaxScorePerChapter;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Scoring")
	int32 BaseTimeBonus;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Scoring")
	int32 PerfectSolveBonus;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Scoring")
	int32 PenaltyPerMistake;

	UFUNCTION(BlueprintCallable, Category = "Scoring")
	virtual int32 CalculateChapterScore(const FChapterProgress& Progress) const;

	UFUNCTION(BlueprintCallable, Category = "Scoring")
	virtual FGameSessionResult CalculateFinalResult(const TArray<FChapterProgress>& Chapters) const;

	UFUNCTION(BlueprintCallable, Category = "Scoring")
	virtual FString GetRankFromScore(int32 Score, int32 MaxScore) const;

protected:
	virtual void BeginPlay() override;
};
