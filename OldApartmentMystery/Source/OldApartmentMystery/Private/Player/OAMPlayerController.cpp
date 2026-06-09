// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Player/OAMPlayerController.h"
#include "Player/OAMInteractionComponent.h"
#include "Core/OAMGameInstance.h"
#include "Bootstrap/OAMUIFactory.h"
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

		// 从 GI 程序化创建的 Input 缓存中读取（无需 Content/Input/*.uasset）
		if (!IA_Move)      IA_Move      = GI->InputCache_IA_Move;
		if (!IA_Look)      IA_Look      = GI->InputCache_IA_Look;
		if (!IA_Interact)  IA_Interact  = GI->InputCache_IA_Interact;
		if (!IA_Notebook)  IA_Notebook  = GI->InputCache_IA_Notebook;
		if (!IA_Inventory) IA_Inventory = GI->InputCache_IA_Inventory;
		if (!IA_Pause)     IA_Pause     = GI->InputCache_IA_Pause;
		if (!IA_Back)      IA_Back      = GI->InputCache_IA_Back;
		if (IA_Digits.Num() == 0)
		{
			IA_Digits = GI->InputCache_IA_Digits;
		}
	}

	if (auto* EIS = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(GetLocalPlayer()))
	{
		if (InputContext) EIS->AddMappingContext(InputContext, 10);
	}

	InteractionComp->Initialize(this);
	UE_LOG(LogTemp, Log, TEXT("[OAM][Input] PlayerController 初始化完成：%d 个数字键绑定"),
		IA_Digits.Num());
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
				switch (D)
				{
				case 0: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit0); break;
				case 1: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit1); break;
				case 2: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit2); break;
				case 3: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit3); break;
				case 4: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit4); break;
				case 5: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit5); break;
				case 6: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit6); break;
				case 7: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit7); break;
				case 8: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit8); break;
				case 9: EIC->BindAction(IA_Digits[D], ETriggerEvent::Started, this, &AOAMPlayerController::OnDigit9); break;
				}
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
			// 打开笔记本 UI
			UOAMUIFactory::CreateNotebook(this);
			GI->SetInputMode(EOAMInputMode::UI);
		}
		else if (M == EOAMInputMode::UI)
		{
			// 关闭：移除最上层非暂停/非HUD的 Widget（简单处理：切回 Exploration）
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
		if (M == EOAMInputMode::Exploration)
		{
			if (!GI->IsInMainMenu())
			{
				UOAMUIFactory::CreatePauseMenu(this);
				GI->SetInputMode(EOAMInputMode::UI);
			}
		}
		else if (M == EOAMInputMode::UI)
		{
			if (!GI->IsInMainMenu())
				GI->SetInputMode(EOAMInputMode::Exploration);
		}
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
