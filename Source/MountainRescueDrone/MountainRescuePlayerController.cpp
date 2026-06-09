#include "MountainRescuePlayerController.h"
#include "MountainRescueHUD.h"
#include "MountainRescueGameMode.h"
#include "DroneBase.h"
#include "RouteManager.h"
#include "TaskEditorComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "InputMappingContext.h"
#include "InputAction.h"
#include "InputActionValue.h"
#include "MountainRescueDrone.h"

AMountainRescuePlayerController::AMountainRescuePlayerController()
{
	bShowMouseCursor = true;
	bEnableClickEvents = true;
	bEnableMouseOverEvents = true;
	DefaultMouseCursor = EMouseCursor::Crosshairs;

	TaskEditor = CreateDefaultSubobject<UTaskEditorComponent>(TEXT("TaskEditor"));
}

void AMountainRescuePlayerController::BeginPlay()
{
	Super::BeginPlay();

	if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(GetLocalPlayer()))
	{
		if (InputMappingContext)
		{
			Subsystem->AddMappingContext(InputMappingContext, 0);
		}
	}
}

void AMountainRescuePlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();

	if (UEnhancedInputComponent* EIC = Cast<UEnhancedInputComponent>(InputComponent))
	{
		if (LeftClickAction)
			EIC->BindAction(LeftClickAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::OnLeftClickTriggered);

		if (RightClickAction)
			EIC->BindAction(RightClickAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::OnRightClickTriggered);

		if (MouseDragAction)
		{
			EIC->BindAction(MouseDragAction, ETriggerEvent::Started, this, &AMountainRescuePlayerController::OnMouseDragStarted);
			EIC->BindAction(MouseDragAction, ETriggerEvent::Ongoing, this, &AMountainRescuePlayerController::OnMouseDragOngoing);
			EIC->BindAction(MouseDragAction, ETriggerEvent::Completed, this, &AMountainRescuePlayerController::OnMouseDragCompleted);
		}

		if (ModeAddAction)
			EIC->BindAction(ModeAddAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::SetModeAdd);
		if (ModeMoveAction)
			EIC->BindAction(ModeMoveAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::SetModeMove);
		if (ModeDeleteAction)
			EIC->BindAction(ModeDeleteAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::SetModeDelete);

		if (StartFlightAction)
			EIC->BindAction(StartFlightAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::HandleStartFlight);
		if (ReturnHomeAction)
			EIC->BindAction(ReturnHomeAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::HandleReturnHome);
		if (ToggleEditorAction)
			EIC->BindAction(ToggleEditorAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::HandleToggleEditor);
		if (PauseAction)
			EIC->BindAction(PauseAction, ETriggerEvent::Triggered, this, &AMountainRescuePlayerController::HandlePause);
	}
}

void AMountainRescuePlayerController::OnLeftClickTriggered(const FInputActionValue& Value)
{
	bLeftMouseDown = Value.Get<bool>();
	if (!bLeftMouseDown) return;

	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (MRHUD)
	{
		MRHUD->HandleScreenClick(GetMouseScreenPosition(), true);
	}
}

void AMountainRescuePlayerController::OnRightClickTriggered(const FInputActionValue& Value)
{
	bRightMouseDown = Value.Get<bool>();
	if (bRightMouseDown)
	{
		SetHUDMode(-1);
	}
}

void AMountainRescuePlayerController::OnMouseDragStarted(const FInputActionValue& Value)
{
	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (MRHUD) MRHUD->HandleScreenDragStart(GetMouseScreenPosition());
}

void AMountainRescuePlayerController::OnMouseDragOngoing(const FInputActionValue& Value)
{
	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (MRHUD) MRHUD->HandleScreenDragMove(GetMouseScreenPosition());
}

void AMountainRescuePlayerController::OnMouseDragCompleted(const FInputActionValue& Value)
{
	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (MRHUD) MRHUD->HandleScreenDragEnd(GetMouseScreenPosition());
}

void AMountainRescuePlayerController::HandleStartFlight()
{
	AMountainRescueGameMode* GM = Cast<AMountainRescueGameMode>(GetWorld()->GetAuthGameMode());
	if (GM) GM->StartMission();
	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (MRHUD) MRHUD->HideRouteEditor();
}

void AMountainRescuePlayerController::HandleReturnHome()
{
	AMountainRescueGameMode* GM = Cast<AMountainRescueGameMode>(GetWorld()->GetAuthGameMode());
	if (GM) GM->TriggerReturnHome();
}

void AMountainRescuePlayerController::HandleToggleEditor()
{
	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (!MRHUD) return;

	if (TaskEditor && !TaskEditor->bIsEditorOpen)
	{
		MRHUD->ShowTaskEditor();
		if (TaskEditor) TaskEditor->bIsEditorOpen = true;
	}
	else
	{
		MRHUD->HideTaskEditor();
		if (TaskEditor) { TaskEditor->ApplyChanges(); TaskEditor->bIsEditorOpen = false; }
	}
}

void AMountainRescuePlayerController::HandlePause()
{
	AMountainRescueGameMode* GM = Cast<AMountainRescueGameMode>(GetWorld()->GetAuthGameMode());
	if (!GM) return;

	if (GM->IsMissionActive()) GM->PauseMission();
	else GM->ResumeMission();
}

void AMountainRescuePlayerController::SetHUDMode(int32 ModeIndex)
{
	AMountainRescueHUD* MRHUD = Cast<AMountainRescueHUD>(GetHUD());
	if (!MRHUD) return;

	switch (ModeIndex)
	{
	case 0: MRHUD->SetDrawMode(EDrawMode::AddingWaypoint); break;
	case 1: MRHUD->SetDrawMode(EDrawMode::MovingWaypoint); break;
	case 2: MRHUD->SetDrawMode(EDrawMode::DeletingWaypoint); break;
	default: MRHUD->SetDrawMode(EDrawMode::None); break;
	}

	UE_LOG(LogMountainRescue, Log, TEXT("玩家输入模式切换: %d"), ModeIndex);
}

FVector2D AMountainRescuePlayerController::GetMouseScreenPosition() const
{
	float X, Y;
	GetMousePosition(X, Y);
	return FVector2D(X, Y);
}
