// 关卡生成编辑器工具实现

#include "Editor/OAMLevelBuilder.h"
#include "Data/OAMLevelDataAsset.h"

void UOAMLevelBuilder::BuildLevelInEditor()
{
	const UOAMLevelDataAsset* Data = LevelData.LoadSynchronous();
	if (!Data)
	{
		UE_LOG(LogTemp, Log, TEXT("[OAM][Builder] 开始生成关卡：%s"), *Data->LevelName.ToString());
		SpawnFurnitureFromData();
		SpawnItemsFromData();
		SpawnDoorsFromData();
		SpawnRoomsFromData();
	}
}

void UOAMLevelBuilder::ClearLevelInEditor()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][Builder] 清空关卡"));
}
