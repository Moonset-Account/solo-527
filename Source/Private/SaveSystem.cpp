#include "SaveSystem.h"
#include <iostream>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <fstream>

static std::string EscapeString(const std::string& S)
{
    std::string Result;
    for (char C : S)
    {
        if (C == '|' || C == ';' || C == '{' || C == '}' || C == '\n' || C == '\r')
            Result += '\\';
        Result += C;
    }
    return Result;
}

static std::string JoinStrings(const std::vector<std::string>& V, const std::string& Delim)
{
    std::string Result;
    for (size_t i = 0; i < V.size(); i++)
    {
        if (i > 0) Result += Delim;
        Result += EscapeString(V[i]);
    }
    return Result;
}

static std::vector<std::string> SplitString(const std::string& S, char Delim)
{
    std::vector<std::string> Result;
    std::stringstream SS(S);
    std::string Token;
    while (std::getline(SS, Token, Delim)) Result.push_back(Token);
    return Result;
}

bool USaveSystem::SaveToFile(const FSaveSlot& Slot, const std::string& FilePath)
{
    std::string Data = SerializeSlot(Slot);
    std::ofstream File(FilePath);
    if (!File.is_open()) return false;
    File << Data;
    File.close();
    return true;
}

bool USaveSystem::LoadFromFile(const std::string& FilePath, FSaveSlot& OutSlot)
{
    std::ifstream File(FilePath);
    if (!File.is_open()) return false;
    std::string Data((std::istreambuf_iterator<char>(File)), std::istreambuf_iterator<char>());
    File.close();
    return DeserializeSlot(Data, OutSlot);
}

void USaveSystem::RecordInput(FSaveSlot& Slot, int32_t Level, const std::string& ActionType,
                               const std::string& Detail, float Timestamp, const std::string& Result)
{
    FPlayerInputRecord Record;
    Record.LevelNumber = Level;
    Record.ActionType = ActionType;
    Record.ActionDetail = Detail;
    Record.Timestamp = Timestamp;
    Record.Result = Result;
    Slot.InputRecords.push_back(Record);
}

void USaveSystem::RecordSettlement(FSaveSlot& Slot, const FSettlementData& Data)
{
    Slot.LevelResults.push_back(Data);
    Slot.TotalScore += Data.Score;
    Slot.TotalCollections += Data.CollectionsObtained;
    Slot.CurrentLevel = std::max(Slot.CurrentLevel, Data.LevelNumber + 1);
}

std::string USaveSystem::SerializeSlot(const FSaveSlot& Slot) const
{
    std::stringstream SS;
    auto Now = std::chrono::system_clock::now();
    auto TimeT = std::chrono::system_clock::to_time_t(Now);
    SS << "SAVE_V1\n";
    SS << "SlotIndex:" << Slot.SlotIndex << "\n";
    SS << "PlayerName:" << EscapeString(Slot.PlayerName) << "\n";
    SS << "CurrentLevel:" << Slot.CurrentLevel << "\n";
    SS << "TotalScore:" << Slot.TotalScore << "\n";
    SS << "TotalCollections:" << Slot.TotalCollections << "\n";
    SS << "SaveTime:" << std::put_time(std::localtime(&TimeT), "%Y-%m-%d %H:%M:%S") << "\n";

    SS << "LevelResults:" << Slot.LevelResults.size() << "\n";
    for (const auto& R : Slot.LevelResults)
    {
        SS << "  LR:" << R.LevelNumber << "|" << R.Score << "|" << R.TimeUsed << "|"
           << R.CustomersSatisfied << "|" << R.CustomersTotal << "|" << R.NetProfit << "|"
           << R.CollectionsObtained << "|" << (R.bPassed ? 1 : 0) << "|"
           << R.SatisfactionRate << "|" << R.Grade << "|"
           << JoinStrings(R.ErrorReasons, ",") << "|"
           << JoinStrings(R.CollectedItems, ",") << "\n";
    }

    SS << "InputRecords:" << Slot.InputRecords.size() << "\n";
    for (const auto& R : Slot.InputRecords)
    {
        SS << "  IR:" << R.LevelNumber << "|" << EscapeString(R.ActionType) << "|"
           << EscapeString(R.ActionDetail) << "|" << R.Timestamp << "|"
           << EscapeString(R.Result) << "\n";
    }

    SS << "Inventory:" << Slot.Inventory.size() << "\n";
    for (const auto& I : Slot.Inventory)
    {
        SS << "  INV:" << I.DesignId << "|" << EscapeString(I.DesignName) << "|"
           << static_cast<int32_t>(I.Theme) << "|" << I.Quantity << "|"
           << I.SellPrice << "|" << static_cast<int32_t>(I.Rarity) << "\n";
    }

    SS << "Ledger:" << Slot.Ledger.DayNumber << "|" << Slot.Ledger.TotalIncome << "|"
       << Slot.Ledger.TotalExpense << "|" << Slot.Ledger.NetProfit << "\n";

    SS << "END_SAVE\n";
    return SS.str();
}

bool USaveSystem::DeserializeSlot(const std::string& Data, FSaveSlot& OutSlot) const
{
    std::istringstream SS(Data);
    std::string Line;
    if (!std::getline(SS, Line) || Line != "SAVE_V1") return false;
    OutSlot = FSaveSlot();

    while (std::getline(SS, Line))
    {
        if (Line == "END_SAVE") break;
        if (Line.substr(0, 2) == "  ") continue;

        auto ColonPos = Line.find(':');
        if (ColonPos == std::string::npos) continue;
        std::string Key = Line.substr(0, ColonPos);
        std::string Val = Line.substr(ColonPos + 1);

        if (Key == "SlotIndex") OutSlot.SlotIndex = std::stoi(Val);
        else if (Key == "PlayerName") OutSlot.PlayerName = Val;
        else if (Key == "CurrentLevel") OutSlot.CurrentLevel = std::stoi(Val);
        else if (Key == "TotalScore") OutSlot.TotalScore = std::stoi(Val);
        else if (Key == "TotalCollections") OutSlot.TotalCollections = std::stoi(Val);
        else if (Key == "SaveTime") OutSlot.SaveTime = Val;
        else if (Key == "LevelResults")
        {
            int32_t Count = std::stoi(Val);
            for (int32_t i = 0; i < Count; i++)
            {
                std::getline(SS, Line);
                if (Line.substr(0, 5) != "  LR:") continue;
                std::string LrData = Line.substr(5);
                auto Parts = SplitString(LrData, '|');
                FSettlementData R;
                if (Parts.size() >= 11)
                {
                    R.LevelNumber = std::stoi(Parts[0]);
                    R.Score = std::stoi(Parts[1]);
                    R.TimeUsed = std::stof(Parts[2]);
                    R.CustomersSatisfied = std::stoi(Parts[3]);
                    R.CustomersTotal = std::stoi(Parts[4]);
                    R.NetProfit = std::stoi(Parts[5]);
                    R.CollectionsObtained = std::stoi(Parts[6]);
                    R.bPassed = (std::stoi(Parts[7]) != 0);
                    R.SatisfactionRate = std::stof(Parts[8]);
                    R.Grade = Parts[9];
                    if (!Parts[10].empty())
                    {
                        auto Errs = SplitString(Parts[10], ',');
                        R.ErrorReasons = Errs;
                    }
                    if (Parts.size() > 11 && !Parts[11].empty())
                    {
                        auto Coll = SplitString(Parts[11], ',');
                        R.CollectedItems = Coll;
                    }
                }
                OutSlot.LevelResults.push_back(R);
            }
        }
        else if (Key == "InputRecords")
        {
            int32_t Count = std::stoi(Val);
            for (int32_t i = 0; i < Count; i++)
            {
                std::getline(SS, Line);
                if (Line.substr(0, 5) != "  IR:") continue;
                std::string IrData = Line.substr(5);
                auto Parts = SplitString(IrData, '|');
                FPlayerInputRecord R;
                if (Parts.size() >= 5)
                {
                    R.LevelNumber = std::stoi(Parts[0]);
                    R.ActionType = Parts[1];
                    R.ActionDetail = Parts[2];
                    R.Timestamp = std::stof(Parts[3]);
                    R.Result = Parts[4];
                }
                OutSlot.InputRecords.push_back(R);
            }
        }
        else if (Key == "Inventory")
        {
            int32_t Count = std::stoi(Val);
            for (int32_t i = 0; i < Count; i++)
            {
                std::getline(SS, Line);
                if (Line.substr(0, 6) != "  INV:") continue;
                std::string InvData = Line.substr(6);
                auto Parts = SplitString(InvData, '|');
                FInventoryItem I;
                if (Parts.size() >= 6)
                {
                    I.DesignId = std::stoi(Parts[0]);
                    I.DesignName = Parts[1];
                    I.Theme = static_cast<EThemeType>(std::stoi(Parts[2]));
                    I.Quantity = std::stoi(Parts[3]);
                    I.SellPrice = std::stoi(Parts[4]);
                    I.Rarity = static_cast<EStickerRarity>(std::stoi(Parts[5]));
                }
                OutSlot.Inventory.push_back(I);
            }
        }
        else if (Key == "Ledger")
        {
            auto Parts = SplitString(Val, '|');
            if (Parts.size() >= 4)
            {
                OutSlot.Ledger.DayNumber = std::stoi(Parts[0]);
                OutSlot.Ledger.TotalIncome = std::stoi(Parts[1]);
                OutSlot.Ledger.TotalExpense = std::stoi(Parts[2]);
                OutSlot.Ledger.NetProfit = std::stoi(Parts[3]);
            }
        }
    }
    return true;
}

void USaveSystem::PrintSaveSummary(const FSaveSlot& Slot) const
{
    std::cout << "===== SAVE SLOT " << Slot.SlotIndex << " =====" << std::endl;
    std::cout << "Player:     " << Slot.PlayerName << std::endl;
    std::cout << "Level:      " << Slot.CurrentLevel << std::endl;
    std::cout << "Score:      " << Slot.TotalScore << std::endl;
    std::cout << "Collections:" << Slot.TotalCollections << std::endl;
    std::cout << "Save Time:  " << Slot.SaveTime << std::endl;

    std::cout << "\nLevel Results (" << Slot.LevelResults.size() << "):" << std::endl;
    for (const auto& R : Slot.LevelResults)
    {
        std::cout << "  Lvl " << R.LevelNumber << " | Score:" << R.Score
                  << " | Grade:" << R.Grade
                  << " | " << (R.bPassed ? "PASS" : "FAIL")
                  << " | Errs:" << R.ErrorReasons.size() << std::endl;
    }

    std::cout << "\nInput Records (" << Slot.InputRecords.size() << "):" << std::endl;
    size_t PrintCount = std::min(Slot.InputRecords.size(), size_t(10));
    for (size_t i = 0; i < PrintCount; i++)
    {
        const auto& R = Slot.InputRecords[i];
        std::cout << "  Lvl" << R.LevelNumber << " " << R.ActionType
                  << " | " << R.ActionDetail
                  << " | " << R.Result << std::endl;
    }
    if (Slot.InputRecords.size() > PrintCount)
        std::cout << "  ... and " << (Slot.InputRecords.size() - PrintCount) << " more" << std::endl;

    std::cout << "===========================\n" << std::endl;
}
