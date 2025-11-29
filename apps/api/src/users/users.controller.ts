import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}


