import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // UC-37: View Profile
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: number) {
    return this.userService.getProfile(userId);
  }

  // UC-37: Update Profile Text Info
  @Put('profile')
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  // UC-37: Upload Avatar Image
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024 }, // Max 3MB (NFR-05)
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only JPEG, PNG, and WebP images are allowed (max 3MB).'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide an image file.');
    }

    // In a real environment, store to S3/Cloudinary or local static folder
    // Here we generate a clean data URL or hosted path
    const avatarUrl = `/uploads/avatars/${userId}_${Date.now()}_${file.originalname}`;
    return this.userService.updateAvatar(userId, avatarUrl);
  }

  // UC-37 Alt Flow 1.1: Remove Avatar
  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async removeAvatar(@CurrentUser('id') userId: number) {
    return this.userService.removeAvatar(userId);
  }
}


