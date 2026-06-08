#pragma once

#include "StickerTypes.h"
#include <functional>

class ULevelSystem
{
public:
    ULevelSystem() = default;

    void RegisterBuiltinLevels();
    void RegisterLevel(const FLevelDefinition& Def);
    void RegisterExtension(const FLevelExtensionConfig& Ext);

    const FLevelDefinition* GetLevel(int32_t LevelId) const;
    const std::vector<FLevelDefinition>& GetAllLevels() const;
    int32_t GetLevelCount() const;

    FLevelDefinition ExtendLevel(int32_t BaseLevelId, const std::string& MethodName,
                                  const std::map<std::string, float>& Params) const;
    std::vector<FLevelDefinition> GenerateSequence(int32_t StartId, int32_t Count,
                                                    const std::string& MethodName,
                                                    const std::map<std::string, float>& BaseParams) const;

    static FLevelDefinition CreateTutorialLevel();
    static FLevelDefinition CreateChallengeLevel();
    static FLevelDefinition CreateFailureTestLevel();
    static FLevelDefinition CreateNormalLevel(int32_t Id, float Difficulty);

    void PrintExtensionGuide() const;

private:
    std::vector<FLevelDefinition> Levels;
    std::vector<FLevelExtensionConfig> Extensions;
};
