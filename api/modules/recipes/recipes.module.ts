import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipesService } from './recipes.service.js';
import { RecipesController } from './recipes.controller.js';
import { Recipe, RecipeSchema } from '../../schemas/recipe.schema.js';
import { Ingredient, IngredientSchema } from '../../schemas/ingredient.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recipe.name, schema: RecipeSchema },
      { name: Ingredient.name, schema: IngredientSchema },
    ]),
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
