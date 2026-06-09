#include "OldApartmentHUD.h"
#include "Blueprint/UserWidget.h"

AOldApartmentHUD::AOldApartmentHUD()
{
	PrimaryActorTick.bCanEverTick = true;
	bMainHUDVisible = false;
	bPauseMenuVisible = false;
	bNotebookVisible = false;
}

void AOldApartmentHUD::BeginPlay()
{
	Super::BeginPlay();
}

void AOldApartmentHUD::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
}

void AOldApartmentHUD::ShowMainHUD()
{
	if (MainHUDWidgetClass && !MainHUDWidget)
	{
		MainHUDWidget = CreateWidget<UUserWidget>(GetOwningPlayerController(), MainHUDWidgetClass);
		if (MainHUDWidget)
		{
			MainHUDWidget->AddToViewport(10);
		}
	}
	else if (MainHUDWidget)
	{
		MainHUDWidget->SetVisibility(ESlateVisibility::Visible);
	}
	bMainHUDVisible = true;
}

void AOldApartmentHUD::HideMainHUD()
{
	if (MainHUDWidget)
	{
		MainHUDWidget->SetVisibility(ESlateVisibility::Hidden);
	}
	bMainHUDVisible = false;
}

void AOldApartmentHUD::ShowPauseMenu()
{
	if (PauseMenuWidgetClass && !PauseMenuWidget)
	{
		PauseMenuWidget = CreateWidget<UUserWidget>(GetOwningPlayerController(), PauseMenuWidgetClass);
		if (PauseMenuWidget)
		{
			PauseMenuWidget->AddToViewport(50);
		}
	}
	else if (PauseMenuWidget)
	{
		PauseMenuWidget->SetVisibility(ESlateVisibility::Visible);
	}
	bPauseMenuVisible = true;
}

void AOldApartmentHUD::HidePauseMenu()
{
	if (PauseMenuWidget)
	{
		PauseMenuWidget->SetVisibility(ESlateVisibility::Hidden);
	}
	bPauseMenuVisible = false;
}

void AOldApartmentHUD::ShowNotebook()
{
	if (NotebookWidgetClass && !NotebookWidget)
	{
		NotebookWidget = CreateWidget<UUserWidget>(GetOwningPlayerController(), NotebookWidgetClass);
		if (NotebookWidget)
		{
			NotebookWidget->AddToViewport(40);
		}
	}
	else if (NotebookWidget)
	{
		NotebookWidget->SetVisibility(ESlateVisibility::Visible);
	}
	bNotebookVisible = true;
}

void AOldApartmentHUD::HideNotebook()
{
	if (NotebookWidget)
	{
		NotebookWidget->SetVisibility(ESlateVisibility::Hidden);
	}
	bNotebookVisible = false;
}

void AOldApartmentHUD::ShowTutorialPage(const FString& TutorialKey)
{
	if (TutorialWidgetClass)
	{
		UUserWidget* Tutorial = CreateWidget<UUserWidget>(GetOwningPlayerController(), TutorialWidgetClass);
		if (Tutorial)
		{
			Tutorial->AddToViewport(80);
		}
	}
}

void AOldApartmentHUD::ShowChapterResult()
{
	if (ChapterResultWidgetClass && !ChapterResultWidget)
	{
		ChapterResultWidget = CreateWidget<UUserWidget>(GetOwningPlayerController(), ChapterResultWidgetClass);
		if (ChapterResultWidget)
		{
			ChapterResultWidget->AddToViewport(90);
		}
	}
	else if (ChapterResultWidget)
	{
		ChapterResultWidget->SetVisibility(ESlateVisibility::Visible);
	}
}
