import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ChecklistService } from './checklist.service';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  AddChecklistEntryDto,
  ReorderEntriesDto,
} from './dto/checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('checklists')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async createChecklist(@Body() dto: CreateChecklistDto, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.checklistService.createChecklist(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getMyChecklists(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.checklistService.getMyChecklists(userId);
  }

  @Get('users/:username')
  @UseGuards(OptionalJwtAuthGuard)
  async getPublicChecklists(@Param('username') username: string) {
    return this.checklistService.getPublicChecklists(username);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getChecklistDetail(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.checklistService.getChecklistDetail(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async updateChecklist(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.checklistService.updateChecklist(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async deleteChecklist(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.checklistService.deleteChecklist(id, userId);
  }

  @Post(':id/entries')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async addEntry(
    @Param('id') checklistId: string,
    @Body() dto: AddChecklistEntryDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.checklistService.addEntry(checklistId, userId, dto);
  }

  @Patch('entries/:entryId/toggle')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async toggleEntry(@Param('entryId') entryId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.checklistService.toggleEntry(entryId, userId);
  }

  @Delete('entries/:entryId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async removeEntry(@Param('entryId') entryId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.checklistService.removeEntry(entryId, userId);
  }

  @Patch(':id/reorder')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async reorderEntries(
    @Param('id') checklistId: string,
    @Body() dto: ReorderEntriesDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.checklistService.reorderEntries(checklistId, userId, dto.entryIds);
  }
}
