import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get('categories')
  @UseGuards(OptionalJwtAuthGuard)
  async getCategories() {
    return this.collectionService.getCategories();
  }

  @Get('categories/:slug/series')
  @UseGuards(OptionalJwtAuthGuard)
  async getSeriesByCategory(@Param('slug') slug: string, @Req() req: Request) {
    const viewerId = (req.user as any)?.userId || null;
    return this.collectionService.getSeriesByCategory(slug, viewerId);
  }

  @Get('series/:categorySlug/:seriesSlug/items')
  @UseGuards(OptionalJwtAuthGuard)
  async getItemsBySeries(
    @Param('categorySlug') categorySlug: string,
    @Param('seriesSlug') seriesSlug: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
    @Req() req?: Request,
  ) {
    const viewerId = (req?.user as any)?.userId || null;
    const takeNum = take ? parseInt(take, 10) : undefined;
    return this.collectionService.getItemsBySeries(
      categorySlug,
      seriesSlug,
      viewerId,
      cursor,
      takeNum,
    );
  }

  @Get('items/search')
  @UseGuards(OptionalJwtAuthGuard)
  async searchItems(
    @Query('q') q: string,
    @Query('categoryId') categoryId?: string,
    @Query('seriesId') seriesId?: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
    @Req() req?: Request,
  ) {
    const viewerId = (req?.user as any)?.userId || null;
    const takeNum = take ? parseInt(take, 10) : undefined;
    return this.collectionService.searchItems(
      q,
      { categoryId, seriesId, cursor, take: takeNum },
      viewerId,
    );
  }

  @Get('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getItemDetail(@Param('id') id: string, @Req() req: Request) {
    const viewerId = (req.user as any)?.userId || null;
    return this.collectionService.getItemDetail(id, viewerId);
  }

  @Post('items/:id/owned')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async toggleOwned(@Param('id') itemId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.collectionService.toggleOwned(userId, itemId);
  }

  @Post('items/:id/wishlist')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async toggleWishlist(@Param('id') itemId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.collectionService.toggleWishlist(userId, itemId);
  }

  @Post('categories/:id/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async followCategory(@Param('id') categoryId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.collectionService.followCategory(userId, categoryId);
  }

  @Post('series/:id/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async followSeries(@Param('id') seriesId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.collectionService.followSeries(userId, seriesId);
  }

  @Get('users/:username/owned')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserOwnedItems(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Req() req?: Request,
  ) {
    const viewerId = (req?.user as any)?.userId || null;
    return this.collectionService.getUserOwnedItems(username, viewerId, cursor);
  }
}
