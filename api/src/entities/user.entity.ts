import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'username', unique: true, length: 50 })
  username: string;

  @Column({ name: 'password', length: 255 })
  password: string;

  @Column({ name: 'real_name', length: 50 })
  realName: string;

  @Column({ name: 'phone', length: 20 })
  phone: string;

  @Column({ name: 'email', length: 100, nullable: true })
  email: string;

  @Column({ name: 'role', type: 'enum', enum: ['admin', 'owner', 'tenant', 'staff'] })
  role: 'admin' | 'owner' | 'tenant' | 'staff';

  @Column({ name: 'status', type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
