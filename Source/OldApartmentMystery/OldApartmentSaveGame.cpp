#include "OldApartmentSaveGame.h"

UOldApartmentSaveGame::UOldApartmentSaveGame()
{
	SaveVersion = 1;
	MasterVolume = 0.8f;
	MusicVolume = 0.6f;
	SFXVolume = 0.8f;
	VoiceVolume = 1.0f;
	AmbientVolume = 0.7f;
	Brightness = 1.0f;
	MouseSensitivity = 1.0f;
	GamepadSensitivity = 1.0f;
	bSubtitlesEnabled = true;
	bInvertYAxis = false;
	bVibrationEnabled = true;
	bTutorialCompleted = false;
}
