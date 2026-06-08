// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMExamineWidget.generated.h"

class UImage; class UButton; class UTextBlock;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMExamineWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) UImage* Img_ItemMesh;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Close;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Pickup;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_PrevFlavor;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_NextFlavor;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_ItemName;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_FlavorText;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_RotateHint;

	UPROPERTY(BlueprintReadWrite, Category = "OAM|Examine")
	FName ItemIDBeingExamined;

	UPROPERTY(BlueprintReadWrite, Category = "OAM|Examine")
	int32 CurrentFlavorIndex = 0;

	UFUNCTION(BlueprintCallable, Category = "OAM|Examine")
	void SetItem(FName ID, const FText& Name, const TArray<FText>& Flavors);

	UFUNCTION(BlueprintCallable, Category = "OAM|Examine")
	void AddRotationInput(const FVector2D& Delta);

	UFUNCTION(BlueprintCallable, Category = "OAM|Examine")
	void CycleFlavor(int32 Direction);

	UFUNCTION(BlueprintCallable, Category = "OAM|Examine")
	void HandlePickup();

protected:
	virtual void NativeConstruct() override;
	virtual FReply NativeOnMouseMove(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent) override;
	virtual FReply NativeOnMouseButtonDown(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent) override;
	virtual FReply NativeOnMouseButtonUp(const FGeometry& InGeometry, const FPointerEvent& InMouseEvent) override;

	UFUNCTION()
	void HandleClose();

	UFUNCTION()
	void HandlePrevFlavor() { CycleFlavor(-1); }
	UFUNCTION()
	void HandleNextFlavor() { CycleFlavor(1); }

	UPROPERTY()
	TArray<FText> FlavorTexts;

	bool bDragging = false;
	FVector2D LastMouse;
	FRotator ItemRotation;
};
