#include "LevelSystemComponent.h"

ULevelSystemComponent::ULevelSystemComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void ULevelSystemComponent::RegisterBuiltinLevels()
{
	Levels.Add(CreateTutorialLevel());
	Levels.Add(CreateNormalLevel(1, 1.0f));
	Levels.Add(CreateNormalLevel(2, 1.3f));
	Levels.Add(CreateNormalLevel(3, 1.6f));
	Levels.Add(CreateChallengeLevel());
	Levels.Add(CreateFailureTestLevel());

	for (const auto& L : Levels)
	{
		OnLevelRegistered.Broadcast(L.LevelId);
	}
}

void ULevelSystemComponent::RegisterLevel(const FLevelDefinition& Def)
{
	Levels.Add(Def);
	OnLevelRegistered.Broadcast(Def.LevelId);
}

const FLevelDefinition* ULevelSystemComponent::GetLevel(int32 LevelId) const
{
	for (const auto& L : Levels)
	{
		if (L.LevelId == LevelId) return &L;
	}
	return nullptr;
}

const TArray<FLevelDefinition>& ULevelSystemComponent::GetAllLevels() const
{
	return Levels;
}

int32 ULevelSystemComponent::GetLevelCount() const
{
	return Levels.Num();
}

FLevelDefinition ULevelSystemComponent::ExtendLevel(int32 BaseLevelId, const FString& MethodName, const TMap<FString, float>& Params) const
{
	const FLevelDefinition* Base = GetLevel(BaseLevelId);
	if (!Base) return FLevelDefinition();

	FLevelDefinition New = *Base;

	if (MethodName == TEXT("LinearScaling"))
	{
		float CustInc = 0.0f, BudgetDec = 0.0f, ScoreMult = 1.0f;
		if (const float* V = Params.Find(TEXT("CustomerIncrease"))) CustInc = *V;
		if (const float* V = Params.Find(TEXT("BudgetDecrease"))) BudgetDec = *V;
		if (const float* V = Params.Find(TEXT("ScoreMultiplier"))) ScoreMult = *V;
		New.CustomerCount += static_cast<int32>(CustInc);
		New.StartingBudget -= static_cast<int32>(BudgetDec);
		New.TargetScore = static_cast<int32>(New.TargetScore * ScoreMult);
		New.DifficultyMultiplier += 0.2f;
	}
	else if (MethodName == TEXT("ThematicFocus"))
	{
		int32 ThemeCount = 2;
		if (const float* V = Params.Find(TEXT("ThemeCount"))) ThemeCount = static_cast<int32>(*V);
		if (ThemeCount < New.AvailableThemes.Num())
		{
			New.AvailableThemes.SetNum(ThemeCount);
		}
		New.DifficultyMultiplier += 0.3f;
	}
	else if (MethodName == TEXT("TimePressure"))
	{
		float Reduction = 0.3f;
		if (const float* V = Params.Find(TEXT("TimeReductionPercent"))) Reduction = *V;
		New.TimeLimit *= (1.0f - Reduction);
		New.DifficultyMultiplier += 0.25f;
		New.SpecialRules.Add(FString::Printf(TEXT("Time reduced by %d%%"), static_cast<int32>(Reduction * 100)));
	}

	OnLevelExtended.Broadcast(BaseLevelId, MethodName);
	return New;
}

TArray<FLevelDefinition> ULevelSystemComponent::GenerateSequence(int32 StartId, int32 Count, const FString& MethodName, const TMap<FString, float>& BaseParams) const
{
	TArray<FLevelDefinition> Result;
	for (int32 i = 0; i < Count; i++)
	{
		TMap<FString, float> Params = BaseParams;
		for (auto& [Key, Val] : Params)
		{
			Val *= (1.0f + i * 0.5f);
		}
		auto Extended = ExtendLevel(StartId, MethodName, Params);
		Extended.LevelId = 100 + i;
		Extended.LevelName = FString::Printf(TEXT("Extended_%d"), i + 1);
		Result.Add(Extended);
	}
	return Result;
}

FLevelDefinition ULevelSystemComponent::CreateTutorialLevel()
{
	FLevelDefinition Def;
	Def.LevelId = 0;
	Def.LevelName = TEXT("Welcome to Sticker Shop");
	Def.Type = ELevelType::Tutorial;
	Def.Description = TEXT("Learn the basics: design a sticker, print it, set up your stall, and serve customers.");
	Def.TargetScore = 50;
	Def.TimeLimit = 300.0f;
	Def.CustomerCount = 3;
	Def.AvailableThemes = { EThemeType::Floral, EThemeType::Animal };
	Def.StartingBudget = 300;
	Def.StallSlots = 3;
	Def.DifficultyMultiplier = 0.5f;
	Def.SpecialRules = { TEXT("Guided steps"), TEXT("No time pressure"), TEXT("Extra budget") };
	Def.WinConditions.Add(TEXT("SatisfactionRate"), 0.5f);
	Def.bForceFailure = false;
	return Def;
}

FLevelDefinition ULevelSystemComponent::CreateChallengeLevel()
{
	FLevelDefinition Def;
	Def.LevelId = 4;
	Def.LevelName = TEXT("Sticker Festival Rush");
	Def.Type = ELevelType::Challenge;
	Def.Description = TEXT("Comprehensive challenge: many customers, limited budget, diverse themes, tight time.");
	Def.TargetScore = 300;
	Def.TimeLimit = 90.0f;
	Def.CustomerCount = 10;
	Def.AvailableThemes = { EThemeType::Floral, EThemeType::Animal, EThemeType::Food, EThemeType::Travel, EThemeType::Seasonal };
	Def.StartingBudget = 200;
	Def.StallSlots = 6;
	Def.DifficultyMultiplier = 2.0f;
	Def.SpecialRules = { TEXT("Diverse themes"), TEXT("Limited budget"), TEXT("High volume"), TEXT("Time pressure") };
	Def.WinConditions.Add(TEXT("SatisfactionRate"), 0.7f);
	Def.LoseConditions.Add(TEXT("MinSatisfactionRate"), 0.3f);
	Def.LoseConditions.Add(TEXT("MaxErrors"), 5.0f);
	Def.bForceFailure = false;
	return Def;
}

FLevelDefinition ULevelSystemComponent::CreateFailureTestLevel()
{
	FLevelDefinition Def;
	Def.LevelId = 5;
	Def.LevelName = TEXT("Deliberate Failure");
	Def.Type = ELevelType::FailureTest;
	Def.Description = TEXT("Designed to fail. Verify error handling, retry prompts, and settlement feedback.");
	Def.TargetScore = 999;
	Def.TimeLimit = 5.0f;
	Def.CustomerCount = 20;
	Def.AvailableThemes = { EThemeType::Vintage };
	Def.StartingBudget = 10;
	Def.StallSlots = 1;
	Def.DifficultyMultiplier = 5.0f;
	Def.SpecialRules = { TEXT("Forced failure"), TEXT("No budget"), TEXT("Impossible target"), TEXT("Single theme") };
	Def.WinConditions.Add(TEXT("SatisfactionRate"), 1.0f);
	Def.LoseConditions.Add(TEXT("MinSatisfactionRate"), 0.9f);
	Def.bForceFailure = true;
	return Def;
}

FLevelDefinition ULevelSystemComponent::CreateNormalLevel(int32 Id, float Difficulty)
{
	FLevelDefinition Def;
	Def.LevelId = Id;
	Def.LevelName = FString::Printf(TEXT("Day %d"), Id);
	Def.Type = ELevelType::Normal;
	Def.Description = TEXT("Regular business day. Serve customers and make profit.");
	Def.TargetScore = static_cast<int32>(80 + Id * 30 * Difficulty);
	Def.TimeLimit = FMath::Max(60.0f, 180.0f - Id * 15.0f);
	Def.CustomerCount = static_cast<int32>(4 + Id * 1.5f * Difficulty);
	Def.AvailableThemes = { EThemeType::Floral, EThemeType::Animal, EThemeType::Food, EThemeType::Travel };
	Def.StartingBudget = static_cast<int32>(250 - Id * 20);
	Def.StallSlots = 4;
	Def.DifficultyMultiplier = Difficulty;
	Def.WinConditions.Add(TEXT("SatisfactionRate"), 0.6f);
	Def.LoseConditions.Add(TEXT("MinSatisfactionRate"), 0.2f);
	Def.bForceFailure = false;
	return Def;
}
