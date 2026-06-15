import { DataSource } from 'typeorm';
import { User, UserRole } from './users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const adminExists = await userRepo.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    const admin = userRepo.create({
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      displayName: '系统管理员',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepo.save(admin);
  }

  const supervisorExists = await userRepo.findOne({ where: { username: 'supervisor' } });
  if (!supervisorExists) {
    const supervisor = userRepo.create({
      username: 'supervisor',
      password: await bcrypt.hash('super123', 10),
      displayName: 'IT主管',
      role: UserRole.IT_SUPERVISOR,
      isActive: true,
    });
    await userRepo.save(supervisor);
  }
}
