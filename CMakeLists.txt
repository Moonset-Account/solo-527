cmake_minimum_required(VERSION 3.16)
project(StickerShopGame CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(PUBLIC_HEADERS
    Source/Public/StickerTypes.h
    Source/Public/InventoryComponent.h
    Source/Public/CustomerSystem.h
    Source/Public/StallLayout.h
    Source/Public/DailyLedger.h
    Source/Public/LevelSystem.h
    Source/Public/SettlementSystem.h
    Source/Public/SaveSystem.h
    Source/Public/GameMode_StickerShop.h
    Source/Public/TestRunner.h
)

set(SOURCES
    Source/Private/InventoryComponent.cpp
    Source/Private/CustomerSystem.cpp
    Source/Private/StallLayout.cpp
    Source/Private/DailyLedger.cpp
    Source/Private/LevelSystem.cpp
    Source/Private/SettlementSystem.cpp
    Source/Private/SaveSystem.cpp
    Source/Private/GameMode_StickerShop.cpp
    Source/Private/TestRunner.cpp
    Source/main.cpp
    ${PUBLIC_HEADERS}
)

add_executable(StickerShopGame ${SOURCES})
target_include_directories(StickerShopGame PRIVATE Source/Public)
