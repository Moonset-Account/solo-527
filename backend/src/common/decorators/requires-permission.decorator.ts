import { SetMetadata } from '@nestjs/common';

export const REQUIRES_PERMISSION_KEY = 'requires_permission';

export const RequiresPermission = (...permissions: string[]) =>
  SetMetadata(REQUIRES_PERMISSION_KEY, permissions);
