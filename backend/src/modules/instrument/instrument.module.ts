import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Instrument, InstrumentSchema, InstrumentBooking, InstrumentBookingSchema } from './schemas/instrument.schema';
import { InstrumentService } from './instrument.service';
import { InstrumentController } from './instrument.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Instrument.name, schema: InstrumentSchema },
      { name: InstrumentBooking.name, schema: InstrumentBookingSchema },
    ]),
    UsersModule,
  ],
  controllers: [InstrumentController],
  providers: [InstrumentService],
  exports: [InstrumentService],
})
export class InstrumentModule {}
