#include "GameMode_StickerShop.h"
#include "TestRunner.h"
#include <iostream>

static void RunMainDemo()
{
    std::cout << "╔══════════════════════════════════════════════════╗" << std::endl;
    std::cout << "║      手帐贴纸经营店 - Sticker Shop Prototype    ║" << std::endl;
    std::cout << "╚══════════════════════════════════════════════════╝\n" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();

    std::cout << "=== Level Extension Guide ===" << std::endl;
    ULevelSystem LS;
    LS.RegisterBuiltinLevels();
    LS.PrintExtensionGuide();

    std::cout << "\n=== Registered Levels ===" << std::endl;
    for (const auto& L : LS.GetAllLevels())
    {
        std::cout << "  [" << L.LevelId << "] " << L.LevelName
                  << " (" << LevelTypeToString(L.Type) << ")"
                  << " | Target:" << L.TargetScore
                  << " | Budget:" << L.StartingBudget
                  << " | Customers:" << L.CustomerCount << std::endl;
    }

    std::cout << "\n=== Demo: Tutorial Level (Level 0) ===" << std::endl;
    Game.SimulateFullLevel(0, true);

    std::cout << "\n=== Demo: Normal Level (Level 1) ===" << std::endl;
    Game.SimulateFullLevel(1, true);

    std::cout << "\n=== Demo: Challenge Level (Level 4) ===" << std::endl;
    Game.SimulateFullLevel(4, true);

    std::cout << "\n=== Demo: Failure Test Level (Level 5) ===" << std::endl;
    Game.SimulateFullLevel(5, true);

    std::cout << "\n=== Save/Load Verification ===" << std::endl;
    USaveSystem SaveSys;
    FSaveSlot TestSlot;
    TestSlot.SlotIndex = 0;
    TestSlot.PlayerName = "TestPlayer";
    TestSlot.CurrentLevel = 3;
    TestSlot.TotalScore = 500;
    TestSlot.TotalCollections = 5;
    FSettlementData Sample;
    Sample.LevelNumber = 1;
    Sample.Score = 150;
    Sample.Grade = "B";
    Sample.bPassed = true;
    Sample.ErrorReasons = {"Test error"};
    Sample.CollectedItems = {"Rare Cat Sticker"};
    SaveSys.RecordSettlement(TestSlot, Sample);

    std::string SavePath = "/tmp/sticker_shop_save.txt";
    bool Saved = SaveSys.SaveToFile(TestSlot, SavePath);
    std::cout << "Save to file: " << (Saved ? "OK" : "FAIL") << std::endl;

    FSaveSlot LoadedSlot;
    bool Loaded = SaveSys.LoadFromFile(SavePath, LoadedSlot);
    std::cout << "Load from file: " << (Loaded ? "OK" : "FAIL") << std::endl;

    if (Loaded)
    {
        std::cout << "Loaded data matches: "
                  << (LoadedSlot.PlayerName == "TestPlayer" && LoadedSlot.TotalScore == 650 ? "OK" : "MISMATCH")
                  << std::endl;
        SaveSys.PrintSaveSummary(LoadedSlot);
    }
}

int main()
{
    RunMainDemo();

    FTestRunner Tests;
    Tests.RunAll();

    return 0;
}
