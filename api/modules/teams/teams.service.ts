import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from '../../schemas/team.schema.js';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<Team>) {}

  async findAll(isSandbox = false): Promise<Team[]> {
    return this.teamModel.find({ isSandbox }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Team | null> {
    const team = await this.teamModel.findById(id).exec();
    if (!team) {
      throw new NotFoundException('班组不存在');
    }
    return team;
  }

  async create(data: Partial<Team> & { isSandbox?: boolean }): Promise<Team> {
    const isSandbox = data.isSandbox ?? false;

    const teamData = {
      ...data,
      isSandbox,
    };

    return this.teamModel.create(teamData);
  }

  async update(id: string, data: Partial<Team>): Promise<Team | null> {
    const existingTeam = await this.teamModel.findById(id).exec();
    if (!existingTeam) {
      throw new NotFoundException('班组不存在');
    }

    return this.teamModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Team | null> {
    const team = await this.teamModel.findByIdAndDelete(id).exec();
    if (!team) {
      throw new NotFoundException('班组不存在');
    }
    return team;
  }
}
