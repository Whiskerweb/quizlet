import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.searchService.searchPublicSets(
      query || '',
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0
    );
  }
}











