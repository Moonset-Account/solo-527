import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService, SearchFilters } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  globalSearch(
    @Query('q') keyword: string,
    @Query('types') types?: string,
    @Query('categories') categories?: string,
    @Query('severities') severities?: string,
    @Query('statuses') statuses?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters: SearchFilters = {
      types: types ? (types.split(',') as any) : undefined,
      categories: categories ? categories.split(',') : undefined,
      severities: severities ? severities.split(',') : undefined,
      statuses: statuses ? statuses.split(',') : undefined,
      dateFrom,
      dateTo,
    };

    return this.service.globalSearch(
      keyword,
      filters,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get('suggest')
  suggestKeywords(@Query('q') keyword: string) {
    return this.service.suggestKeywords(keyword);
  }
}
