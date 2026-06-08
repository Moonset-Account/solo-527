// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "OAMTypes.h"
#include "OAMSettingsWidget.generated.h"

class USlider; class UCheckBox; class UButton; class UTextBlock;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API UOAMSettingsWidget : public UUserWidget
{
	GENERATED_BODY()
public:
	UPROPERTY(meta = (BindWidget)) USlider* Slider_Master;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_SFX;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_Ambient;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_UI;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_Brightness;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_Sensitivity;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_FOV;
	UPROPERTY(meta = (BindWidget)) USlider* Slider_AutoSave;
	UPROPERTY(meta = (BindWidget)) UCheckBox* Chk_FilmGrain;
	UPROPERTY(meta = (BindWidget)) UCheckBox* Chk_Vignette;
	UPROPERTY(meta = (BindWidget)) UCheckBox* Chk_Hints;
	UPROPERTY(meta = (BindWidget)) UCheckBox* Chk_Subtitles;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Close;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_Defaults;
	UPROPERTY(meta = (BindWidget)) UButton* Btn_ExportTelemetry;
	UPROPERTY(meta = (BindWidget)) UTextBlock* Txt_Version;

	UFUNCTION(BlueprintCallable, Category = "OAM|Settings")
	void LoadFromSettings(const FOAMGameSettings& S);

	UFUNCTION(BlueprintCallable, Category = "OAM|Settings")
	FOAMGameSettings BuildSettings() const;

protected:
	virtual void NativeConstruct() override;

	UFUNCTION() void HandleClose();
	UFUNCTION() void HandleDefaults();
	UFUNCTION() void HandleExport();
	UFUNCTION() void OnValueChanged(float) { }
};
