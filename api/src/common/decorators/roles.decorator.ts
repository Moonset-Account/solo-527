import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../../shared/types.js';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
