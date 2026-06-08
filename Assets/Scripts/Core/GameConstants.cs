using UnityEngine;

public static class GameConstants
{
    public const int MAX_PLAYERS = 4;
    public const float ORDER_TIMEOUT_BASE = 60f;
    public const float COMBO_TIME_WINDOW = 5f;
    public const int MAX_STARS = 3;
    public const int MAX_ORDERS_ON_SCREEN = 6;
    public const float STATION_INTERACT_RANGE = 1.5f;
    public const float PLAYER_SPEED = 5f;
    public const float CHARACTER_SWITCH_COOLDOWN = 0.3f;
}

public enum GameState
{
    Menu,
    Tutorial,
    LevelSelect,
    Gameplay,
    Paused,
    Settlement,
    Failure
}

public enum StationType
{
    Prep,
    Cooking,
    Plating,
    Cleaning,
    Ingredient
}

public enum IngredientState
{
    Raw,
    Chopped,
    Cooked,
    Burned,
    Plated
}

public enum DishRating
{
    None,
    Silver,
    Gold,
    Perfect
}
