#include "OldApartmentMysteryGameMode.h"
#include "UObject/ConstructorHelpers.h"

AOldApartmentMysteryGameMode::AOldApartmentMysteryGameMode()
{
	MaxScorePerChapter = 1000;
	BaseTimeBonus = 500;
	PerfectSolveBonus = 200;
	PenaltyPerMistake = 50;
}

void AOldApartmentMysteryGameMode::BeginPlay()
{
	Super::BeginPlay();
	UE_LOG(LogTemp, Log, TEXT("[GameMode] OldApartmentMystery GameMode initialized"));
}

int32 AOldApartmentMysteryGameMode::CalculateChapterScore(const FChapterProgress& Progress) const
{
	int32 BaseScore = (Progress.TotalClues > 0)
		? FMath::RoundToInt((float)Progress.CluesFound / (float)Progress.TotalClues * (float)MaxScorePerChapter)
		: 0;

	int32 MistakePenalty = Progress.Mistakes * PenaltyPerMistake;
	float TimeFactor = Progress.TimeSpentSeconds < 300.0f ? 1.0f : FMath::Max(0.5f, 300.0f / Progress.TimeSpentSeconds);
	int32 TimeBonus = FMath::RoundToInt((float)BaseTimeBonus * TimeFactor);
	int32 PerfectBonus = (Progress.Mistakes == 0 && Progress.CluesFound == Progress.TotalClues) ? PerfectSolveBonus : 0;

	int32 FinalScore = FMath::Max(0, BaseScore + TimeBonus + PerfectBonus - MistakePenalty);
	return FMath::Min(FinalScore, MaxScorePerChapter + BaseTimeBonus + PerfectSolveBonus);
}

FGameSessionResult AOldApartmentMysteryGameMode::CalculateFinalResult(const TArray<FChapterProgress>& Chapters) const
{
	FGameSessionResult Result;
	int32 TotalScore = 0;
	int32 TotalMaxScore = 0;
	float TotalTime = 0.0f;
	int32 TotalMistakes = 0;
	int32 TotalClues = 0;
	int32 PuzzlesSolvedCount = 0;
	TSet<FName> AllContent;
	TSet<FName> AllAchievements;

	for (const FChapterProgress& Chapter : Chapters)
	{
		TotalScore += CalculateChapterScore(Chapter);
		TotalMaxScore += MaxScorePerChapter + BaseTimeBonus + PerfectSolveBonus;
		TotalTime += Chapter.TimeSpentSeconds;
		TotalMistakes += Chapter.Mistakes;
		TotalClues += Chapter.CluesFound;

		for (FName UnlockId : Chapter.UnlockedContentIds)
		{
			AllContent.Add(UnlockId);
		}
	}

	Result.FinalScore = TotalScore;
	Result.TotalTimeSeconds = TotalTime;
	Result.TotalMistakes = TotalMistakes;
	Result.CluesCollected = TotalClues;
	Result.PuzzlesSolved = PuzzlesSolvedCount;
	Result.UnlockedContent = AllContent.Array();
	Result.UnlockedAchievements = AllAchievements.Array();
	Result.Rank = GetRankFromScore(TotalScore, TotalMaxScore);
	Result.bIsNewRecord = false;

	return Result;
}

FString AOldApartmentMysteryGameMode::GetRankFromScore(int32 Score, int32 MaxScore) const
{
	if (MaxScore <= 0) return TEXT("N/A");

	float Ratio = (float)Score / (float)MaxScore;

	if (Ratio >= 0.95f) return TEXT("S+");
	if (Ratio >= 0.90f) return TEXT("S");
	if (Ratio >= 0.85f) return TEXT("A+");
	if (Ratio >= 0.80f) return TEXT("A");
	if (Ratio >= 0.70f) return TEXT("B");
	if (Ratio >= 0.60f) return TEXT("C");
	if (Ratio >= 0.50f) return TEXT("D");

	return TEXT("E");
}
