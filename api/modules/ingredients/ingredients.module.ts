import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngredientsService } from './ingredients.service.js';
import { IngredientsController } from './ingredients.controller.js';
import { Ingredient, IngredientSchema } from '../../schemas/ingredient.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ingredient.name, schema: IngredientSchema }]),
  ],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
