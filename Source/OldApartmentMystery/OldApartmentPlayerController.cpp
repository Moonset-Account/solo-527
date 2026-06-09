#include "OldApartmentPlayerController.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "DrawDebugHelpers.h"

AOldApartmentPlayerController::AOldApartmentPlayerController()
{
	InteractionDistance = 250.0f;
	InteractionTraceRadius = 30.0f;
	CurrentMode = EPlayerInteractionMode::Explore;
	LastInteractTarget = nullptr;
	CachedInteractCheckTimer = 0.0f;
	SmoothLookInput = FVector2D::ZeroVector;

	bShowMouseCursor = false;
	bEnableClickEvents = false;
	bEnableMouseOverEvents = false;
	DefaultMouseCursor = EMouseCursor::Crosshairs;
}

void AOldApartmentPlayerController::BeginPlay()
{
	Super::BeginPlay();

	if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(GetLocalPlayer()))
	{
		Subsystem->AddMappingContext(DefaultMappingContext, 0);
	}

	SetShowMouseCursor(false);

	FInputModeGameOnly InputMode;
	SetInputMode(InputMode);
}

void AOldApartmentPlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();

	if (UEnhancedInputComponent* EIC = CastChecked<UEnhancedInputComponent>(InputComponent))
	{
		EIC->BindAction(MoveAction, ETriggerEvent::Triggered, this, &AOldApartmentPlayerController::HandleMove);
		EIC->BindAction(LookAction, ETriggerEvent::Triggered, this, &AOldApartmentPlayerController::HandleLook);
		EIC->BindAction(InteractAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleInteract);
		EIC->BindAction(ExamineAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleExamine);
		EIC->BindAction(NotebookAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleNotebook);
		EIC->BindAction(InventoryAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleInventory);
		EIC->BindAction(PauseAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandlePause);
		EIC->BindAction(CrouchAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleCrouch);
		EIC->BindAction(SprintAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleSprintStart);
		EIC->BindAction(SprintAction, ETriggerEvent::Completed, this, &AOldApartmentPlayerController::HandleSprintEnd);
		EIC->BindAction(FlashlightAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleFlashlight);
		EIC->BindAction(BackAction, ETriggerEvent::Started, this, &AOldApartmentPlayerController::HandleBack);
	}
}

void AOldApartmentPlayerController::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	CachedInteractCheckTimer -= DeltaSeconds;
	if (CachedInteractCheckTimer <= 0.0f)
	{
		CachedInteractCheckTimer = 0.1f;
		AActor* CurrentTarget = GetInteractableInView();
		if (CurrentTarget != LastInteractTarget)
		{
			OnInteractTargetChanged(CurrentTarget);
			LastInteractTarget = CurrentTarget;
		}
	}
}

void AOldApartmentPlayerController::PlayerTick(float DeltaSeconds)
{
	Super::PlayerTick(DeltaSeconds);
}

void AOldApartmentPlayerController::HandleMove(const FInputActionValue& Value)
{
	if (CurrentMode != EPlayerInteractionMode::Explore) return;

	FVector2D Input = Value.Get<FVector2D>();
	if (ACharacter* Character = Cast<ACharacter>(GetPawn()))
	{
		const FRotator YawRot(0, GetControlRotation().Yaw, 0);
		const FVector ForwardDir = FRotationMatrix(YawRot).GetUnitAxis(EAxis::X);
		const FVector RightDir = FRotationMatrix(YawRot).GetUnitAxis(EAxis::Y);
		Character->AddMovementInput(ForwardDir, Input.Y);
		Character->AddMovementInput(RightDir, Input.X);
	}
}

void AOldApartmentPlayerController::HandleLook(const FInputActionValue& Value)
{
	if (CurrentMode == EPlayerInteractionMode::UI || CurrentMode == EPlayerInteractionMode::Cinematic) return;

	FVector2D Input = Value.Get<FVector2D>();
	AddYawInput(Input.X);
	AddPitchInput(Input.Y);
}

void AOldApartmentPlayerController::HandleInteract()
{
	if (!CanInteract()) return;
	AActor* Target = GetInteractableInView();
	if (Target)
	{
		Target->TakeDamage(1.0f, FDamageEvent(), this, this);
	}
}

void AOldApartmentPlayerController::HandleExamine()
{
	if (CurrentMode == EPlayerInteractionMode::Explore)
	{
		SetInteractionMode(EPlayerInteractionMode::ExamineItem);
	}
	else if (CurrentMode == EPlayerInteractionMode::ExamineItem)
	{
		SetInteractionMode(EPlayerInteractionMode::Explore);
	}
}

void AOldApartmentPlayerController::HandleNotebook()
{
	if (CurrentMode == EPlayerInteractionMode::Explore || CurrentMode == EPlayerInteractionMode::ExamineItem)
	{
		SetInteractionMode(EPlayerInteractionMode::UI);
	}
	else if (CurrentMode == EPlayerInteractionMode::UI)
	{
		SetInteractionMode(EPlayerInteractionMode::Explore);
	}
}

void AOldApartmentPlayerController::HandleInventory()
{
	HandleNotebook();
}

void AOldApartmentPlayerController::HandlePause()
{
	TogglePauseMenu();
}

void AOldApartmentPlayerController::HandleCrouch()
{
	if (ACharacter* Character = Cast<ACharacter>(GetPawn()))
	{
		Character->ToggleCrouch();
	}
}

void AOldApartmentPlayerController::HandleSprintStart()
{
	if (ACharacter* Character = Cast<ACharacter>(GetPawn()))
	{
		if (UCharacterMovementComponent* MoveComp = Character->GetCharacterMovement())
		{
			MoveComp->MaxWalkSpeed = MoveComp->MaxWalkSpeed * 1.6f;
		}
	}
}

void AOldApartmentPlayerController::HandleSprintEnd()
{
	if (ACharacter* Character = Cast<ACharacter>(GetPawn()))
	{
		if (UCharacterMovementComponent* MoveComp = Character->GetCharacterMovement())
		{
			MoveComp->MaxWalkSpeed = 600.0f;
		}
	}
}

void AOldApartmentPlayerController::HandleFlashlight()
{
}

void AOldApartmentPlayerController::HandleBack()
{
	switch (CurrentMode)
	{
	case EPlayerInteractionMode::ExamineItem:
		SetInteractionMode(EPlayerInteractionMode::Explore);
		break;
	case EPlayerInteractionMode::Puzzle:
		SetInteractionMode(EPlayerInteractionMode::Explore);
		break;
	case EPlayerInteractionMode::UI:
		SetInteractionMode(EPlayerInteractionMode::Explore);
		break;
	case EPlayerInteractionMode::Explore:
		TogglePauseMenu();
		break;
	default:
		break;
	}
}

void AOldApartmentPlayerController::SetInteractionMode(EPlayerInteractionMode NewMode)
{
	CurrentMode = NewMode;

	switch (NewMode)
	{
	case EPlayerInteractionMode::Explore:
	{
		SetShowMouseCursor(false);
		FInputModeGameOnly InputMode;
		SetInputMode(InputMode);
		bEnableClickEvents = false;
		break;
	}
	case EPlayerInteractionMode::ExamineItem:
	case EPlayerInteractionMode::Puzzle:
	case EPlayerInteractionMode::UI:
	{
		SetShowMouseCursor(true);
		FInputModeGameAndUI InputMode;
		InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::LockAlways);
		InputMode.SetHideCursorDuringCapture(false);
		SetInputMode(InputMode);
		bEnableClickEvents = true;
		break;
	}
	case EPlayerInteractionMode::Cinematic:
	{
		SetShowMouseCursor(false);
		FInputModeUIOnly InputMode;
		SetInputMode(InputMode);
		break;
	}
	default:
		break;
	}
}

bool AOldApartmentPlayerController::CanInteract() const
{
	return CurrentMode == EPlayerInteractionMode::Explore;
}

AActor* AOldApartmentPlayerController::GetInteractableInView()
{
	FVector CamLoc;
	FRotator CamRot;
	GetPlayerViewPoint(CamLoc, CamRot);
	FVector TraceStart = CamLoc;
	FVector TraceEnd = CamLoc + CamRot.Vector() * InteractionDistance;

	FCollisionQueryParams Params(SCENE_QUERY_STAT(InteractTrace), false, GetPawn());
	Params.AddIgnoredActor(GetPawn());

	FHitResult Hit;
	bool bHit = GetWorld()->SweepSingleByChannel(
		Hit, TraceStart, TraceEnd,
		FRotator::ZeroRotator.Quaternion(),
		ECC_GameTraceChannel1,
		FCollisionShape::MakeSphere(InteractionTraceRadius),
		Params
	);

	if (bHit && Hit.GetActor())
	{
		return Hit.GetActor();
	}
	return nullptr;
}

void AOldApartmentPlayerController::ShowMainHUD()
{
}

void AOldApartmentPlayerController::HideMainHUD()
{
}

void AOldApartmentPlayerController::TogglePauseMenu()
{
	if (CurrentMode == EPlayerInteractionMode::UI)
	{
		SetInteractionMode(EPlayerInteractionMode::Explore);
	}
	else
	{
		SetInteractionMode(EPlayerInteractionMode::UI);
	}
	OnPauseMenuClosed();
}

void AOldApartmentPlayerController::ShowTutorialPage(const FString& TutorialKey)
{
}

void AOldApartmentPlayerController::QuickSave()
{
}

void AOldApartmentPlayerController::QuickLoad()
{
}

void AOldApartmentPlayerController::OnPauseMenuClosed()
{
}
