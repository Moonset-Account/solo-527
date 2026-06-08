// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMSettingsWidget.h"
#include "Components/Slider.h"
#include "Components/CheckBox.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMAudioManager.h"

void UOAMSettingsWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Btn_Close)        Btn_Close->OnClicked.AddDynamic(this, &UOAMSettingsWidget::HandleClose);
	if (Btn_Defaults)     Btn_Defaults->OnClicked.AddDynamic(this, &UOAMSettingsWidget::HandleDefaults);
	if (Btn_ExportTelemetry) Btn_ExportTelemetry->OnClicked.AddDynamic(this, &UOAMSettingsWidget::HandleExport);
	if (Txt_Version) Txt_Version->SetText(FText::FromString(TEXT("v1.0.0 · 旧公寓遗物整理录"));

	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) LoadFromSettings(GI->Settings);
}

void UOAMSettingsWidget::LoadFromSettings(const FOAMGameSettings& S)
{
	if (Slider_Master)      Slider_Master->SetValue(S.MasterVolume);
	if (Slider_SFX)         Slider_SFX->SetValue(S.SFXVolume);
	if (Slider_Ambient)     Slider_Ambient->SetValue(S.AmbientVolume);
	if (Slider_UI)          Slider_UI->SetValue(S.UIVolume);
	if (Slider_Brightness)  Slider_Brightness->SetValue(S.Brightness);
	if (Slider_Sensitivity) Slider_Sensitivity->SetValue(S.MouseSensitivity);
	if (Slider_FOV)         Slider_FOV->SetValue(S.FOV);
	if (Slider_AutoSave)    Slider_AutoSave->SetValue(S.AutoSaveMinutes);
	if (Chk_FilmGrain)   Chk_FilmGrain->SetIsChecked(S.bFilmGrain);
	if (Chk_Vignette)    Chk_Vignette->SetIsChecked(S.bVignette);
	if (Chk_Hints)        Chk_Hints->SetIsChecked(S.bHintsEnabled);
	if (Chk_Subtitles) Chk_Subtitles->SetIsChecked(S.bSubtitlesEnabled);
}

FOAMGameSettings UOAMSettingsWidget::BuildSettings() const
{
	FOAMGameSettings S;
	if (Slider_Master)      S.MasterVolume = Slider_Master->GetValue();
	if (Slider_SFX)         S.SFXVolume = Slider_SFX->GetValue();
	if (Slider_Ambient)     S.AmbientVolume = Slider_Ambient->GetValue();
	if (Slider_UI)          S.UIVolume = Slider_UI->GetValue();
	if (Slider_Brightness)  S.Brightness = Slider_Brightness->GetValue();
	if (Slider_Sensitivity) S.MouseSensitivity = Slider_Sensitivity->GetValue();
	if (Slider_FOV)         S.FOV = Slider_FOV->GetValue();
	if (Slider_AutoSave)    S.AutoSaveMinutes = FMath::RoundToInt(Slider_AutoSave->GetValue());
	if (Chk_FilmGrain)   S.bFilmGrain = Chk_FilmGrain->IsChecked();
	if (Chk_Vignette)    S.bVignette = Chk_Vignette->IsChecked();
	if (Chk_Hints)        S.bHintsEnabled = Chk_Hints->IsChecked();
	if (Chk_Subtitles) S.bSubtitlesEnabled = Chk_Subtitles->IsChecked();
	return S;
}

void UOAMSettingsWidget::HandleClose()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	const FOAMGameSettings S = BuildSettings();
	GI->ApplySettings(S);
	if (GI->SaveManager) GI->SaveManager->SaveSettings(S);
	RemoveFromParent();
	GI->SetInputMode(EOAMInputMode::Exploration);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
}

void UOAMSettingsWidget::HandleDefaults()
{
	LoadFromSettings(FOAMGameSettings());
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
}

void UOAMSettingsWidget::HandleExport()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->Telemetry) return;
	const bool bOk = GI->Telemetry->DownloadJSONToSavedDir();
	UE_LOG(LogTemp, Log, TEXT("[OAM][Telemetry] 导出试玩数据 -> %d"), (int)bOk);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(bOk ? TEXT("UI_Save") : TEXT("UI_Click"));
}
