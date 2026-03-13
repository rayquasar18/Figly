import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@Controller('media')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    const media = await this.mediaService.upload(file, userId);
    return { media };
  }

  @Get(':id')
  async getMedia(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.mediaService.getMedia(id, userId);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.mediaService.getMediaStatus(id);
  }
}
