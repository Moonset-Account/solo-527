import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipesModule } from './modules/recipes/recipes.module.js';
import { IngredientsModule } from './modules/ingredients/ingredients.module.js';
import { TeamsModule } from './modules/teams/teams.module.js';
import { BatchesModule } from './modules/batches/batches.module.js';
import { SchedulesModule } from './modules/schedules/schedules.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { ProfitModule } from './modules/profit/profit.module.js';
import { AnomaliesModule } from './modules/anomalies/anomalies.module.js';
import { SeedModule } from './modules/seed/seed.module.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/order-fulfillment'),
    RecipesModule,
    IngredientsModule,
    TeamsModule,
    BatchesModule,
    SchedulesModule,
    InventoryModule,
    ProfitModule,
    AnomaliesModule,
    SeedModule,
    RedisModule,
  ],
})
export class AppModule {}
