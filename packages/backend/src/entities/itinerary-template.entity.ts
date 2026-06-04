import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum TemplateCategory {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  BUDGET = 'budget',
  CUSTOM = 'custom',
}

@Entity('itinerary_templates')
export class ItineraryTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.STANDARD,
  })
  category: TemplateCategory;

  @Column()
  destination: string;

  @Column({ type: 'int' })
  defaultDuration: number;

  @Column({ type: 'jsonb', nullable: true })
  defaultHotels: {
    name: string;
    starRating: number;
    roomType: string;
    costPerNight: number;
    supplier: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  defaultTransportation: {
    type: string;
    description: string;
    vehicleType: string;
    costPerDay: number;
    supplier: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  defaultTickets: {
    attraction: string;
    costPerTicket: number;
    supplier: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  defaultActivities: {
    day: number;
    activities: {
      time: string;
      description: string;
      location: string;
    }[];
  }[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  defaultServiceFeeRate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;
}
