import { Controller, Get, Param, Query } from '@nestjs/common';
import { DoctorService } from '../services/doctor.service';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @RequiresPermission('slot:view')
  async findAll(
    @Query('isActive') isActive?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.doctorService.findAll(
      user?.clinicId,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get(':id')
  @RequiresPermission('slot:view')
  async findOne(@Param('id') id: string) {
    return this.doctorService.findOne(id);
  }
}
