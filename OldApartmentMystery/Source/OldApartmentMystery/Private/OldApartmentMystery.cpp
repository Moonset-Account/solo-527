// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "OldApartmentMystery.h"
#include "Modules/ModuleManager.h"

IMPLEMENT_PRIMARY_GAME_MODULE(FOldApartmentMysteryModule, OldApartmentMystery, "OldApartmentMystery");

void FOldApartmentMysteryModule::StartupModule()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 旧公寓悬疑模块启动"));
}

void FOldApartmentMysteryModule::ShutdownModule()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 旧公寓悬疑模块关闭"));
}
