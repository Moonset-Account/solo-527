// 关卡生成编辑器工具蓝图基类
// 蓝图名: /Game/Editor/EUB_LevelBuilder
// 通过在编辑器执行：EUB → 工具执行，用 DA_Level 数据资产 → 自动生成关卡 Actor

#pragma once

#include "CoreMinimal.h"
#include "EditorUtilityWidget.h"
#include "OAMLevelBuilder.generated.h"

class UOAMLevelDataAsset;
class AActor;

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMLevelBuilder : public UEditorUtilityWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Builder")
	TSoftObjectPtr<UOAMLevelDataAsset> LevelData;

	UFUNCTION(BlueprintCallable, Category = "OAM|Builder")
	void BuildLevelInEditor();

	UFUNCTION(BlueprintCallable, Category = "OAM|Builder")
	void ClearLevelInEditor();

protected:
	UFUNCTION(BlueprintImplementableEvent, Category = "OAM|Builder")
	void SpawnFurnitureFromData();

	UFUNCTION(BlueprintImplementableEvent, Category = "OAM|Builder")
	void SpawnItemsFromData();

	UFUNCTION(BlueprintImplementableEvent, Category = "OAM|Builder")
	void SpawnDoorsFromData();

	UFUNCTION(BlueprintImplementableEvent, Category = "OAM|Builder")
	void SpawnRoomsFromData();
};
