// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Managers/OAMAudioManager.h"
#include "Core/OAMGameInstance.h"
#include "Components/AudioComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundBase.h"
#include "Sound/SoundCue.h"

void UOAMAudioManager::Initialize(UOAMGameInstance* InGI)
{
	GI = InGI;
	CurrentSettings = GI->Settings;
	BuildSFXCache();
}

void UOAMAudioManager::BuildSFXCache()
{
	struct TK { const TCHAR* K; const TCHAR* P; };
	const TK Pairs[] = {
		{ TEXT("UI_Click"), TEXT("/Game/Audio/UI/SFX_UI_Click") },
		{ TEXT("UI_Hover"), TEXT("/Game/Audio/UI/SFX_UI_Hover") },
		{ TEXT("UI_OpenMenu"), TEXT("/Game/Audio/UI/SFX_UI_OpenMenu") },
		{ TEXT("UI_CloseMenu"), TEXT("/Game/Audio/UI/SFX_UI_CloseMenu") },
		{ TEXT("UI_OpenPuzzle"), TEXT("/Game/Audio/UI/SFX_UI_OpenPuzzle") },
		{ TEXT("UI_ClosePuzzle"), TEXT("/Game/Audio/UI/SFX_UI_ClosePuzzle") },
		{ TEXT("UI_Typewriter"), TEXT("/Game/Audio/UI/SFX_UI_Typewriter") },
		{ TEXT("UI_Clear"), TEXT("/Game/Audio/UI/SFX_UI_Clear") },
		{ TEXT("UI_Interact"), TEXT("/Game/Audio/UI/SFX_UI_Interact") },
		{ TEXT("UI_PageFlip"), TEXT("/Game/Audio/UI/SFX_UI_PageFlip") },
		{ TEXT("UI_Save"), TEXT("/Game/Audio/UI/SFX_UI_Save") },
		{ TEXT("UI_Load"), TEXT("/Game/Audio/UI/SFX_UI_Load") },
		{ TEXT("Item_Pickup"), TEXT("/Game/Audio/Interact/SFX_Item_Pickup") },
		{ TEXT("Item_Drop"), TEXT("/Game/Audio/Interact/SFX_Item_Drop") },
		{ TEXT("Note_Open"), TEXT("/Game/Audio/Interact/SFX_Note_Open") },
		{ TEXT("Note_Close"), TEXT("/Game/Audio/Interact/SFX_Note_Close") },
		{ TEXT("Note_TurnPage"), TEXT("/Game/Audio/Interact/SFX_Note_TurnPage") },
		{ TEXT("Puzzle_Digit"), TEXT("/Game/Audio/Puzzle/SFX_Puzzle_Digit") },
		{ TEXT("Puzzle_Clear"), TEXT("/Game/Audio/Puzzle/SFX_Puzzle_Clear") },
		{ TEXT("Puzzle_Shake"), TEXT("/Game/Audio/Puzzle/SFX_Puzzle_Shake") },
		{ TEXT("Puzzle_Success"), TEXT("/Game/Audio/Puzzle/SFX_Puzzle_Success") },
		{ TEXT("Puzzle_Fail"), TEXT("/Game/Audio/Puzzle/SFX_Puzzle_Fail") },
		{ TEXT("Puzzle_Locked"), TEXT("/Game/Audio/Puzzle/SFX_Puzzle_Locked") },
		{ TEXT("Door_Open"), TEXT("/Game/Audio/Door/SFX_Door_Open") },
		{ TEXT("Door_Close"), TEXT("/Game/Audio/Door/SFX_Door_Close") },
		{ TEXT("Door_Unlock"), TEXT("/Game/Audio/Door/SFX_Door_Unlock") },
		{ TEXT("Door_Shake"), TEXT("/Game/Audio/Door/SFX_Door_Shake") },
		{ TEXT("Ambient_FloorCreak"), TEXT("/Game/Audio/Ambient/SFX_Ambient_FloorCreak") },
		{ TEXT("Ambient_WindowRattle"), TEXT("/Game/Audio/Ambient/SFX_Ambient_WindowRattle") },
		{ TEXT("Ambient_Drip"), TEXT("/Game/Audio/Ambient/SFX_Ambient_Drip") },
		{ TEXT("Ambient_Rattle"), TEXT("/Game/Audio/Ambient/SFX_Ambient_Rattle") },
		{ TEXT("Objective_Complete"), TEXT("/Game/Audio/UI/SFX_Objective_Complete") },
		{ TEXT("Chapter_Complete"), TEXT("/Game/Audio/UI/SFX_Chapter_Complete") },
	};
	for (const auto& P : Pairs)
	{
		SFXCache.Add(FName(P.K), TSoftObjectPtr<USoundBase>(FSoftObjectPath(FString(P.P) + TEXT(".") + FPaths::GetBaseFilename(FString(P.P)))));
	}
}

float UOAMAudioManager::PlaySFX(FName Key, float VolumeMultiplier, float PitchMultiplier)
{
	if (!GI) return 0.f;
	auto* It = SFXCache.Find(Key);
	if (!It) return 0.f;
	const float V = CurrentSettings.MasterVolume * CurrentSettings.SFXVolume * VolumeMultiplier;
	USoundBase* SB = It->LoadSynchronous();
	if (SB) UGameplayStatics::PlaySound2D(GI->GetWorld(), SB, V, PitchMultiplier);
	return V;
}

void UOAMAudioManager::PlaySFXEnum(EOAMSFXKey K, float VolMul)
{
	PlaySFX(*SFXKeyToString(K), VolMul);
}

void UOAMAudioManager::SetAmbient(USoundBase* AmbientSound, float TargetVolume, float FadeSeconds)
{
	if (!GI || !AmbientSound) return;
	UWorld* W = GI->GetWorld();
	if (!W) return;

	if (!CurrentAmbientComp)
	{
		CurrentAmbientComp = UGameplayStatics::CreateSound2D(W, AmbientSound, TargetVolume, 1.f, 0.f, nullptr, true, true);
		if (CurrentAmbientComp) CurrentAmbientComp->Play(FadeSeconds);
	}
	else
	{
		CurrentAmbientComp->SetSound(AmbientSound);
		CurrentAmbientComp->AdjustVolume(FadeSeconds, CurrentSettings.MasterVolume * CurrentSettings.AmbientVolume * TargetVolume);
		if (!CurrentAmbientComp->IsPlaying()) CurrentAmbientComp->Play(FadeSeconds);
	}
}

void UOAMAudioManager::FadeOutAmbient(float FadeSeconds)
{
	if (CurrentAmbientComp) CurrentAmbientComp->Stop();
}

void UOAMAudioManager::ApplyVolumeSettings(const FOAMGameSettings& Settings)
{
	CurrentSettings = Settings;
	if (CurrentAmbientComp)
	{
		CurrentAmbientComp->AdjustVolume(1.f, Settings.MasterVolume * Settings.AmbientVolume);
	}
}

FString UOAMAudioManager::SFXKeyToString(EOAMSFXKey K)
{
	switch (K)
	{
	case EOAMSFXKey::UI_Click: return TEXT("UI_Click");
	case EOAMSFXKey::UI_Hover: return TEXT("UI_Hover");
	case EOAMSFXKey::UI_OpenMenu: return TEXT("UI_OpenMenu");
	case EOAMSFXKey::UI_CloseMenu: return TEXT("UI_CloseMenu");
	case EOAMSFXKey::UI_OpenPuzzle: return TEXT("UI_OpenPuzzle");
	case EOAMSFXKey::UI_ClosePuzzle: return TEXT("UI_ClosePuzzle");
	case EOAMSFXKey::UI_Typewriter: return TEXT("UI_Typewriter");
	case EOAMSFXKey::UI_Clear: return TEXT("UI_Clear");
	case EOAMSFXKey::UI_Interact: return TEXT("UI_Interact");
	case EOAMSFXKey::UI_PageFlip: return TEXT("UI_PageFlip");
	case EOAMSFXKey::UI_Save: return TEXT("UI_Save");
	case EOAMSFXKey::UI_Load: return TEXT("UI_Load");
	case EOAMSFXKey::Item_Pickup: return TEXT("Item_Pickup");
	case EOAMSFXKey::Item_Drop: return TEXT("Item_Drop");
	case EOAMSFXKey::Note_Open: return TEXT("Note_Open");
	case EOAMSFXKey::Note_Close: return TEXT("Note_Close");
	case EOAMSFXKey::Note_TurnPage: return TEXT("Note_TurnPage");
	case EOAMSFXKey::Puzzle_Digit: return TEXT("Puzzle_Digit");
	case EOAMSFXKey::Puzzle_Clear: return TEXT("Puzzle_Clear");
	case EOAMSFXKey::Puzzle_Shake: return TEXT("Puzzle_Shake");
	case EOAMSFXKey::Puzzle_Success: return TEXT("Puzzle_Success");
	case EOAMSFXKey::Puzzle_Fail: return TEXT("Puzzle_Fail");
	case EOAMSFXKey::Puzzle_Locked: return TEXT("Puzzle_Locked");
	case EOAMSFXKey::Door_Open: return TEXT("Door_Open");
	case EOAMSFXKey::Door_Close: return TEXT("Door_Close");
	case EOAMSFXKey::Door_Unlock: return TEXT("Door_Unlock");
	case EOAMSFXKey::Door_Shake: return TEXT("Door_Shake");
	case EOAMSFXKey::Ambient_FloorCreak: return TEXT("Ambient_FloorCreak");
	case EOAMSFXKey::Ambient_WindowRattle: return TEXT("Ambient_WindowRattle");
	case EOAMSFXKey::Ambient_Drip: return TEXT("Ambient_Drip");
	case EOAMSFXKey::Ambient_Rattle: return TEXT("Ambient_Rattle");
	case EOAMSFXKey::Objective_Complete: return TEXT("Objective_Complete");
	case EOAMSFXKey::Chapter_Complete: return TEXT("Chapter_Complete");
	default: return TEXT("None");
	}
}
