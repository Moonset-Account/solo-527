import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema, ProjectReport, ProjectReportSchema } from './schemas/project.schema';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectReport.name, schema: ProjectReportSchema },
    ]),
    UsersModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
