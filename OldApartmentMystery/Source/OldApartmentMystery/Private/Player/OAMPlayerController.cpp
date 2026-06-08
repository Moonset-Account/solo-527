// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Player/OAMPlayerController.h"
#include "Player/OAMInteractionComponent.h"
#include "Core/OAMGameInstance.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "InputActionValue.h"
#include "Kismet/GameplayStatics.h"
#include "Camera/CameraShakeBase.h"

AOAMPlayerController::AOAMPlayerController()
{
	InteractionComp = CreateDefaultSubobject<UOAMInteractionComponent>(TEXT("InteractionComponent"));
	bShowMouseCursor = false;
	bEnableClickEvents = false;
	bEnableMouseOverEvents = false;
	DefaultMouseCursor = EMouseCursor::Crosshairs;
}

void AOAMPlayerController::BeginPlay()
{
	Super::BeginPlay();

	if (const auto* GI = UOAMGameInstance::GetOAM(this))
	{
		if (GI->DefaultInputContext) InputContext = GI->DefaultInputContext;
	}

	if (auto* EIS = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(GetLocalPlayer()))
	{
		if (InputContext) EIS->AddMappingContext(InputContext, 10);
	}

	InteractionComp->Initialize(this);
}

void AOAMPlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();
	if (auto* EIC = Cast<UEnhancedInputComponent>(InputComponent))
	{
		if (IA_Move)			EIC->BindAction(IA_Move, ETriggerEvent::Triggered, this, &AOAMPlayerController::OnMove);
		if (IA_Look)			EIC->BindAction(IA_Look, ETriggerEvent::Triggered, this, &AOAMPlayerController::OnLook);
		if (IA_Interact)		EIC->BindAction(IA_Interact, ETriggerEvent::Started, this, &AOAMPlayerController::OnInteractTriggered);
		if (IA_Notebook)		EIC->BindAction(IA_Notebook, ETriggerEvent::Started, this, &AOAMPlayerController::OnToggleNotebook);
		if (IA_Inventory)		EIC->BindAction(IA_Inventory, ETriggerEvent::Started, this, &AOAMPlayerController::OnToggleInventory);
		if (IA_Pause)			EIC->BindAction(IA_Pause, ETriggerEvent::Started, this, &AOAMPlayerController::OnPause);
		if (IA_Back)			EIC->BindAction(IA_Back, ETriggerEvent::Started, this, &AOAMPlayerController::OnBack);

		for (int32 D = 0; D < IA_Digits.Num() && D < 10; ++D)
		{
			if (IA_Digits[D])
			{
				const int32 Capture = D;
				EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigitPressed, Capture);
			}
		}
	}
}

void AOAMPlayerController::OnMove(const FInputActionValue& Value)
{
	APawn* Pawn = GetPawn();
	if (!Pawn) return;
	const FVector2D Ax = Value.Get<FVector2D>();
	const FRotator Yaw(0, GetControlRotation().Yaw, 0);
	const FVector Fwd = FRotationMatrix(Yaw).GetUnitAxis(EAxis::X);
	const FVector Rt = FRotationMatrix(Yaw).GetUnitAxis(EAxis::Y);
	Pawn->AddMovementInput(Fwd, Ax.Y);
	Pawn->AddMovementInput(Rt, Ax.X);
}

void AOAMPlayerController::OnLook(const FInputActionValue& Value)
{
	const FVector2D Ax = Value.Get<FVector2D>();
	AddYawInput(Ax.X);
	AddPitchInput(Ax.Y);
}

void AOAMPlayerController::OnInteractTriggered(const FInputActionValue& Value)
{
	if (InteractionComp) InteractionComp->InteractWithNearest();
}

void AOAMPlayerController::OnToggleNotebook(const FInputActionValue& Value)
{
	if (auto* GI = UOAMGameInstance::GetOAM(this))
	{
		EOAMInputMode M = GI->GetCurrentInputMode();
		if (M == EOAMInputMode::Exploration)
		{
			GI->SetInputMode(EOAMInputMode::UI);
		}
		else if (M == EOAMInputMode::UI)
		{
			GI->SetInputMode(EOAMInputMode::Exploration);
		}
	}
}

void AOAMPlayerController::OnToggleInventory(const FInputActionValue& Value)
{
	OnToggleNotebook(Value);
}

void AOAMPlayerController::OnPause(const FInputActionValue& Value)
{
	if (auto* GI = UOAMGameInstance::GetOAM(this))
	{
		EOAMInputMode M = GI->GetCurrentInputMode();
		if (M == EOAMInputMode::UI) GI->SetInputMode(EOAMInputMode::Exploration);
		else if (M == EOAMInputMode::Exploration) GI->SetInputMode(EOAMInputMode::UI);
	}
}

void AOAMPlayerController::OnDigitPressed(int32 Digit)
{
	if (auto* GI = UOAMGameInstance::GetOAM(this))
	{
		if (GI->GetCurrentInputMode() == EOAMInputMode::Puzzle)
		{
			UE_LOG(LogTemp, Log, TEXT("[OAM] 谜题输入 %d"), Digit);
		}
	}
}

void AOAMPlayerController::OnBack(const FInputActionValue& Value)
{
	if (auto* GI = UOAMGameInstance::GetOAM(this))
	{
		EOAMInputMode M = GI->GetCurrentInputMode();
		if (M == EOAMInputMode::Puzzle || M == EOAMInputMode::Examine)
		{
			GI->SetInputMode(EOAMInputMode::Exploration);
		}
		else if (M == EOAMInputMode::UI)
		{
			GI->SetInputMode(EOAMInputMode::Exploration);
		}
	}
}

void AOAMPlayerController::ShowToast(const FText& Message, EOAMToastType Type, float Duration)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][Toast] %s"), *Message.ToString());
}

void AOAMPlayerController::TriggerScreenShake(float Intensity, float Duration)
{
	UGameplayStatics::PlayWorldCameraShake(this, UCameraShakeBase::StaticClass(), GetPawn() ? GetPawn()->GetActorLocation() : FVector::ZeroVector, 0, 5000);
}

void AOAMPlayerController::TriggerScreenFlash(FLinearColor Color, float Duration)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][Flash] %s %f"), *Color.ToString(), Duration);
}
