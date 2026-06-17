import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomStatusLog } from './entities/room-status-log.entity';
import { RoomStatusLogsService } from './room-status-logs.service';
import { RoomStatusLogsController } from './room-status-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoomStatusLog])],
  controllers: [RoomStatusLogsController],
  providers: [RoomStatusLogsService],
  exports: [RoomStatusLogsService],
})
export class RoomStatusLogsModule {}
