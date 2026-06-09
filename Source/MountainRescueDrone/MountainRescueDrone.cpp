#include "MountainRescueDrone.h"
#include "CoreMinimal.h"

DEFINE_LOG_CATEGORY(LogMountainRescue);

void FMountainRescueDroneModule::StartupModule()
{
	UE_LOG(LogMountainRescue, Log, TEXT("山地救援无人机模拟模块已启动"));
}

void FMountainRescueDroneModule::ShutdownModule()
{
	UE_LOG(LogMountainRescue, Log, TEXT("山地救援无人机模拟模块已关闭"));
}

IMPLEMENT_PRIMARY_GAME_MODULE(FMountainRescueDroneModule, MountainRescueDrone, "MountainRescueDrone");
