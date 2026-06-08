#include "LevelSystem.h"
#include <iostream>

void ULevelSystem::RegisterBuiltinLevels()
{
    Levels.push_back(CreateTutorialLevel());
    Levels.push_back(CreateNormalLevel(1, 1.0f));
    Levels.push_back(CreateNormalLevel(2, 1.3f));
    Levels.push_back(CreateNormalLevel(3, 1.6f));
    Levels.push_back(CreateChallengeLevel());
    Levels.push_back(CreateFailureTestLevel());

    FLevelExtensionConfig Linear;
    Linear.MethodName = "LinearScaling";
    Linear.Description = "Scale difficulty linearly: increase customers, reduce budget, raise target score";
    Linear.Parameters = {"CustomerIncrease", "BudgetDecrease", "ScoreMultiplier"};
    Linear.Generator = [](const FLevelDefinition& Base, const std::map<std::string, float>& P) -> FLevelDefinition
    {
        FLevelDefinition New = Base;
        float CustInc = 0.0f, BudgetDec = 0.0f, ScoreMult = 1.0f;
        auto It = P.find("CustomerIncrease"); if (It != P.end()) CustInc = It->second;
        It = P.find("BudgetDecrease"); if (It != P.end()) BudgetDec = It->second;
        It = P.find("ScoreMultiplier"); if (It != P.end()) ScoreMult = It->second;
        New.CustomerCount += static_cast<int32_t>(CustInc);
        New.StartingBudget -= static_cast<int32_t>(BudgetDec);
        New.TargetScore = static_cast<int32_t>(New.TargetScore * ScoreMult);
        New.DifficultyMultiplier += 0.2f;
        return New;
    };
    Extensions.push_back(Linear);

    FLevelExtensionConfig Thematic;
    Thematic.MethodName = "ThematicFocus";
    Thematic.Description = "Restrict available themes to increase design challenge";
    Thematic.Parameters = {"ThemeCount"};
    Thematic.Generator = [](const FLevelDefinition& Base, const std::map<std::string, float>& P) -> FLevelDefinition
    {
        FLevelDefinition New = Base;
        int32_t ThemeCount = 2;
        auto It = P.find("ThemeCount"); if (It != P.end()) ThemeCount = static_cast<int32_t>(It->second);
        if (ThemeCount < static_cast<int32_t>(New.AvailableThemes.size()))
        {
            New.AvailableThemes.resize(ThemeCount);
        }
        New.DifficultyMultiplier += 0.3f;
        return New;
    };
    Extensions.push_back(Thematic);

    FLevelExtensionConfig TimePressure;
    TimePressure.MethodName = "TimePressure";
    TimePressure.Description = "Reduce time limit to add urgency";
    TimePressure.Parameters = {"TimeReductionPercent"};
    TimePressure.Generator = [](const FLevelDefinition& Base, const std::map<std::string, float>& P) -> FLevelDefinition
    {
        FLevelDefinition New = Base;
        float Reduction = 0.3f;
        auto It = P.find("TimeReductionPercent"); if (It != P.end()) Reduction = It->second;
        New.TimeLimit *= (1.0f - Reduction);
        New.DifficultyMultiplier += 0.25f;
        New.SpecialRules.push_back("Time reduced by " + std::to_string(static_cast<int>(Reduction * 100)) + "%");
        return New;
    };
    Extensions.push_back(TimePressure);
}

void ULevelSystem::RegisterLevel(const FLevelDefinition& Def)
{
    Levels.push_back(Def);
}

void ULevelSystem::RegisterExtension(const FLevelExtensionConfig& Ext)
{
    Extensions.push_back(Ext);
}

const FLevelDefinition* ULevelSystem::GetLevel(int32_t LevelId) const
{
    for (const auto& L : Levels)
    {
        if (L.LevelId == LevelId) return &L;
    }
    return nullptr;
}

const std::vector<FLevelDefinition>& ULevelSystem::GetAllLevels() const
{
    return Levels;
}

int32_t ULevelSystem::GetLevelCount() const
{
    return static_cast<int32_t>(Levels.size());
}

FLevelDefinition ULevelSystem::ExtendLevel(int32_t BaseLevelId, const std::string& MethodName,
                                            const std::map<std::string, float>& Params) const
{
    const FLevelDefinition* Base = GetLevel(BaseLevelId);
    if (!Base) return FLevelDefinition();

    for (const auto& Ext : Extensions)
    {
        if (Ext.MethodName == MethodName)
        {
            return Ext.Generator(*Base, Params);
        }
    }
    return *Base;
}

std::vector<FLevelDefinition> ULevelSystem::GenerateSequence(int32_t StartId, int32_t Count,
                                                              const std::string& MethodName,
                                                              const std::map<std::string, float>& BaseParams) const
{
    std::vector<FLevelDefinition> Result;
    for (int32_t i = 0; i < Count; i++)
    {
        std::map<std::string, float> Params = BaseParams;
        for (auto& [Key, Val] : Params)
        {
            Val *= (1.0f + i * 0.5f);
        }
        auto Extended = ExtendLevel(StartId, MethodName, Params);
        Extended.LevelId = 100 + i;
        Extended.LevelName = "Extended_" + std::to_string(i + 1);
        Result.push_back(Extended);
    }
    return Result;
}

FLevelDefinition ULevelSystem::CreateTutorialLevel()
{
    FLevelDefinition Def;
    Def.LevelId = 0;
    Def.LevelName = "Welcome to Sticker Shop";
    Def.Type = ELevelType::Tutorial;
    Def.Description = "Learn the basics: design a sticker, print it, set up your stall, and serve customers.";
    Def.TargetScore = 50;
    Def.TimeLimit = 300.0f;
    Def.CustomerCount = 3;
    Def.AvailableThemes = {EThemeType::Floral, EThemeType::Animal};
    Def.StartingBudget = 300;
    Def.StallSlots = 3;
    Def.DifficultyMultiplier = 0.5f;
    Def.SpecialRules = {"Guided steps", "No time pressure", "Extra budget"};
    Def.WinConditions = {{"SatisfactionRate", 0.5f}};
    Def.LoseConditions = {};
    Def.bForceFailure = false;
    return Def;
}

FLevelDefinition ULevelSystem::CreateChallengeLevel()
{
    FLevelDefinition Def;
    Def.LevelId = 4;
    Def.LevelName = "Sticker Festival Rush";
    Def.Type = ELevelType::Challenge;
    Def.Description = "A comprehensive challenge: many customers, limited budget, diverse themes, tight time.";
    Def.TargetScore = 300;
    Def.TimeLimit = 90.0f;
    Def.CustomerCount = 10;
    Def.AvailableThemes = {EThemeType::Floral, EThemeType::Animal, EThemeType::Food,
                           EThemeType::Travel, EThemeType::Seasonal};
    Def.StartingBudget = 200;
    Def.StallSlots = 6;
    Def.DifficultyMultiplier = 2.0f;
    Def.SpecialRules = {"Diverse themes required", "Limited budget", "High customer volume", "Time pressure"};
    Def.WinConditions = {{"SatisfactionRate", 0.7f}};
    Def.LoseConditions = {{"MinSatisfactionRate", 0.3f}, {"MaxErrors", 5.0f}};
    Def.bForceFailure = false;
    return Def;
}

FLevelDefinition ULevelSystem::CreateFailureTestLevel()
{
    FLevelDefinition Def;
    Def.LevelId = 5;
    Def.LevelName = "Deliberate Failure";
    Def.Type = ELevelType::FailureTest;
    Def.Description = "This level is designed to fail. Verify error handling, retry prompts, and settlement feedback.";
    Def.TargetScore = 999;
    Def.TimeLimit = 5.0f;
    Def.CustomerCount = 20;
    Def.AvailableThemes = {EThemeType::Vintage};
    Def.StartingBudget = 10;
    Def.StallSlots = 1;
    Def.DifficultyMultiplier = 5.0f;
    Def.SpecialRules = {"Forced failure", "No budget", "Impossible target", "Single theme"};
    Def.WinConditions = {{"SatisfactionRate", 1.0f}};
    Def.LoseConditions = {{"MinSatisfactionRate", 0.9f}};
    Def.bForceFailure = true;
    return Def;
}

FLevelDefinition ULevelSystem::CreateNormalLevel(int32_t Id, float Difficulty)
{
    FLevelDefinition Def;
    Def.LevelId = Id;
    Def.LevelName = "Day " + std::to_string(Id);
    Def.Type = ELevelType::Normal;
    Def.Description = "Regular business day. Serve customers and make profit.";
    Def.TargetScore = static_cast<int32_t>(80 + Id * 30 * Difficulty);
    Def.TimeLimit = std::max(60.0f, 180.0f - Id * 15.0f);
    Def.CustomerCount = static_cast<int32_t>(4 + Id * 1.5f * Difficulty);
    Def.AvailableThemes = {EThemeType::Floral, EThemeType::Animal, EThemeType::Food, EThemeType::Travel};
    Def.StartingBudget = static_cast<int32_t>(250 - Id * 20);
    Def.StallSlots = 4;
    Def.DifficultyMultiplier = Difficulty;
    Def.WinConditions = {{"SatisfactionRate", 0.6f}};
    Def.LoseConditions = {{"MinSatisfactionRate", 0.2f}};
    Def.bForceFailure = false;
    return Def;
}

void ULevelSystem::PrintExtensionGuide() const
{
    std::cout << "=== Level Extension Guide ===" << std::endl;
    std::cout << "To extend levels, use one of the registered extension methods:" << std::endl;
    for (const auto& Ext : Extensions)
    {
        std::cout << "\n  Method: " << Ext.MethodName << std::endl;
        std::cout << "  Description: " << Ext.Description << std::endl;
        std::cout << "  Parameters: ";
        for (const auto& P : Ext.Parameters) std::cout << P << " ";
        std::cout << std::endl;
    }
    std::cout << "\nUsage Example:" << std::endl;
    std::cout << "  LevelSys.ExtendLevel(1, \"LinearScaling\", {{\"CustomerIncrease\", 3}, {\"BudgetDecrease\", 50}, {\"ScoreMultiplier\", 1.5}})" << std::endl;
    std::cout << "  LevelSys.GenerateSequence(1, 5, \"LinearScaling\", {{\"CustomerIncrease\", 2}, {\"BudgetDecrease\", 30}, {\"ScoreMultiplier\", 1.2}})" << std::endl;
    std::cout << "=== End Extension Guide ===" << std::endl;
}
