#pragma once

#include "StickerTypes.h"
#include <fstream>

class USaveSystem
{
public:
    USaveSystem() = default;

    bool SaveToFile(const FSaveSlot& Slot, const std::string& FilePath);
    bool LoadFromFile(const std::string& FilePath, FSaveSlot& OutSlot);

    void RecordInput(FSaveSlot& Slot, int32_t Level, const std::string& ActionType,
                     const std::string& Detail, float Timestamp, const std::string& Result);

    void RecordSettlement(FSaveSlot& Slot, const FSettlementData& Data);

    std::string SerializeSlot(const FSaveSlot& Slot) const;
    bool DeserializeSlot(const std::string& Data, FSaveSlot& OutSlot) const;

    void PrintSaveSummary(const FSaveSlot& Slot) const;
};
