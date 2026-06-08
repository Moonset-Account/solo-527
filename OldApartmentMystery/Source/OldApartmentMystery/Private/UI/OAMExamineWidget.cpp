// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMExamineWidget.h"
#include "Components/Image.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Kismet/GameplayStatics.h"

void UOAMExamineWidget::NativeConstruct()
{
	Super::NativeConstruct();
	SetIsFocusable(true);
	if (Btn_Close)       Btn_Close->OnClicked.AddDynamic(this, &UOAMExamineWidget::HandleClose);
	if (Btn_Pickup)      Btn_Pickup->OnClicked.AddDynamic(this, &UOAMExamineWidget::HandlePickup);
	if (Btn_PrevFlavor)  Btn_PrevFlavor->OnClicked.AddDynamic(this, &UOAMExamineWidget::HandlePrevFlavor);
	if (Btn_NextFlavor)  Btn_NextFlavor->OnClicked.AddDynamic(this, &UOAMExamineWidget::HandleNextFlavor);
	if (Img_ItemMesh)
	{
		Img_ItemMesh->SetIsFocusable(true);
	}
	ItemRotation = FRotator(0, 0, 0);
}

FReply UOAMExamineWidget::NativeOnMouseMove(const FGeometry& G, const FPointerEvent& E)
{
	if (bDragging)
	{
		const FVector2D Delta = E.GetScreenSpacePosition() - LastMouse;
		AddRotationInput(Delta * 0.4f);
		LastMouse = E.GetScreenSpacePosition();
		return FReply::Handled();
	}
	return Super::NativeOnMouseMove(G, E);
}

FReply UOAMExamineWidget::NativeOnMouseButtonDown(const FGeometry&, const FPointerEvent& E)
{
	if (E.GetEffectingButton() == EKeys::LeftMouseButton)
	{
		bDragging = true;
		LastMouse = E.GetScreenSpacePosition();
		return FReply::Handled();
	}
	return Super::NativeOnMouseButtonDown(FGeometry(), E);
}

FReply UOAMExamineWidget::NativeOnMouseButtonUp(const FGeometry&, const FPointerEvent& E)
{
	if (E.GetEffectingButton() == EKeys::LeftMouseButton)
	{
		bDragging = false;
		return FReply::Handled();
	}
	return Super::NativeOnMouseButtonUp(FGeometry(), E);
}

void UOAMExamineWidget::SetItem(FName ID, const FText& Name, const TArray<FText>& Flavors)
{
	ItemIDBeingExamined = ID;
	if (Txt_ItemName) Txt_ItemName->SetText(Name);
	FlavorTexts = Flavors;
	CurrentFlavorIndex = 0;
	CycleFlavor(0);
}

void UOAMExamineWidget::AddRotationInput(const FVector2D& Delta)
{
	ItemRotation.Yaw += Delta.X;
	ItemRotation.Pitch += Delta.Y;
	if (Img_ItemMesh)
	{
		FWidgetTransform T = Img_ItemMesh->GetRenderTransform();
		T.Angle = ItemRotation.Yaw;
		Img_ItemMesh->SetRenderTransformAngle(ItemRotation.Yaw);
	}
}

void UOAMExamineWidget::CycleFlavor(int32 Direction)
{
	if (FlavorTexts.Num() == 0) return;
	CurrentFlavorIndex = (CurrentFlavorIndex + Direction + FlavorTexts.Num()) % FlavorTexts.Num();
	if (Txt_FlavorText) Txt_FlavorText->SetText(FlavorTexts[CurrentFlavorIndex]);
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
}

void UOAMExamineWidget::HandlePickup()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(this));
	if (!GI || !GS) return;
	GS->AddCollectedItem(ItemIDBeingExamined);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Item_Pickup"));
	if (GI->Telemetry) GI->Telemetry->RecordItemExamine(ItemIDBeingExamined, CurrentFlavorIndex);
	RemoveFromParent();
	GI->SetInputMode(EOAMInputMode::Exploration);
}

void UOAMExamineWidget::HandleClose()
{
	RemoveFromParent();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) GI->SetInputMode(EOAMInputMode::Exploration);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
}
