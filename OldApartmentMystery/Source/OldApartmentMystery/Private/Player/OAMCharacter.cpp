// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Player/OAMCharacter.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/WidgetComponent.h"
#include "Core/OAMGameInstance.h"

AOAMCharacter::AOAMCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(RootComponent);
	CameraBoom->TargetArmLength = 380.f;
	CameraBoom->SetRelativeRotation(FRotator(-55.f, 0.f, 0.f));
	CameraBoom->bUsePawnControlRotation = false;
	CameraBoom->bInheritPitch = CameraBoom->bInheritYaw = CameraBoom->bInheritRoll = false;

	FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
	FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
	FollowCamera->bUsePawnControlRotation = false;

	InteractHintWidget = CreateDefaultSubobject<UWidgetComponent>(TEXT("InteractHint"));
	InteractHintWidget->SetupAttachment(RootComponent);
	InteractHintWidget->SetWidgetSpace(EWidgetSpace::Screen);
	InteractHintWidget->SetDrawSize(FVector2D(240, 48));
	InteractHintWidget->SetVisibility(false);

	GetCharacterMovement()->MaxWalkSpeed = BaseWalkSpeed;
	GetCharacterMovement()->bOrientRotationToMovement = true;
	GetCharacterMovement()->RotationRate = FRotator(0, 360, 0);
	GetCharacterMovement()->JumpZVelocity = 0;
	GetCharacterMovement()->AirControl = 0;
	bUseControllerRotationPitch = bUseControllerRotationYaw = bUseControllerRotationRoll = false;

}

void AOAMCharacter::BeginPlay()
{
	Super::BeginPlay();
}

void AOAMCharacter::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
}

void AOAMCharacter::SetCurrentRoom(FName RoomID)
{
	if (CurrentRoom != RoomID)
	{
		CurrentRoom = RoomID;
		UE_LOG(LogTemp, Log, TEXT("[OAM] 进入房间: %s"), *RoomID.ToString());
		if (auto* GI = UOAMGameInstance::GetOAM(this))
		{
			if (GI->ChapterManager)
			{
				GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::EnterRoom, RoomID);
			}
		}
	}
}
