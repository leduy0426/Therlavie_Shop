import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ROLE_ADMIN)
@Controller('api/v1/admin/users')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // UC-40: List users with search, pagination, and filters
  @Get()
  async getUsers(@Query() query: AdminQueryUsersDto) {
    return this.adminService.getUsers(query);
  }

  // UC-40: Update Role or Toggle Status (Lock / Unlock)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @CurrentUser('id') adminId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: AdminUpdateUserDto,
    @Ip() ip: string,
  ) {
    return this.adminService.updateUser(adminId, targetUserId, dto, ip);
  }

  // UC-40: View Audit Logs
  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLogs(Number(page) || 1, Number(limit) || 20);
  }
}

