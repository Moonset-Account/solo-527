#include "OldApartmentMystery.h"
#include "Modules/ModuleManager.h"
#include "Interfaces/IPluginManager.h"

DEFINE_LOG_CATEGORY(LogOldApartmentMystery);

IMPLEMENT_PRIMARY_GAME_MODULE(FOldApartmentMysteryModule, OldApartmentMystery, "OldApartmentMystery");

void FOldApartmentMysteryModule::StartupModule()
{
	UE_LOG(LogOldApartmentMystery, Log, TEXT("========================================"));
	UE_LOG(LogOldApartmentMystery, Log, TEXT("[OldApartmentMystery] Module Startup - v0.1.0-BETA"));
	UE_LOG(LogOldApartmentMystery, Log, TEXT("========================================"));

	RegisterSettings();
}

void FOldApartmentMysteryModule::ShutdownModule()
{
	UE_LOG(LogOldApartmentMystery, Log, TEXT("[OldApartmentMystery] Module Shutdown"));
	UnregisterSettings();
}

void FOldApartmentMysteryModule::RegisterSettings()
{
}

void FOldApartmentMysteryModule::UnregisterSettings()
{
}
