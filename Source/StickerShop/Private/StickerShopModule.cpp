#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

class FStickerShopModule : public FDefaultGameModuleImpl
{
public:
	virtual void StartupModule() override
	{
		FDefaultGameModuleImpl::StartupModule();
		UE_LOG(LogTemp, Log, TEXT("StickerShop module started"));
	}

	virtual void ShutdownModule() override
	{
		FDefaultGameModuleImpl::ShutdownModule();
		UE_LOG(LogTemp, Log, TEXT("StickerShop module shutdown"));
	}
};

IMPLEMENT_PRIMARY_GAME_MODULE(FStickerShopModule, StickerShop, "StickerShop");
