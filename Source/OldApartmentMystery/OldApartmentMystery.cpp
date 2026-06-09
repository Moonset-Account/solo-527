#include "OldApartmentMystery.h"
#include "Modules/ModuleManager.h"
#include "Interfaces/IPluginManager.h"
#include "HAL/IConsoleManager.h"

DEFINE_LOG_CATEGORY(LogOldApartmentMystery);

static TAutoConsoleVariable<int32> CVarOldApartmentStartMode(
	TEXT("OldApartment.StartMode"),
	-1,
	TEXT("-1 = Auto (default)\n0 = Force Main Menu\n1 = Force Chapter Level"),
	ECVF_Default);

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
