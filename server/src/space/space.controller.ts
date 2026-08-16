import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import {
  AcceptSpaceInviteDto,
  CreateFamilySpaceDto,
  CreatePairInviteDto,
  CreateSharedEventDto,
  CreateSharedMemoryDto,
  CreateSpaceInviteDto,
  CreateSpaceMemberDto,
  UpdateSpaceDto,
  UpdateSpaceMemberDto,
} from './dto/space.dto';
import { SpaceService } from './space.service';
import { RateLimit } from '../common/rate-limit.decorator';

@Controller('spaces')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Get()
  list(@CurrentUserId() userId: number) {
    return this.spaceService.listForUser(userId);
  }

  @Post('pair/invites')
  @RateLimit(10)
  createPairInvite(@CurrentUserId() userId: number, @Body() dto: CreatePairInviteDto) {
    return this.spaceService.createPairInvite(userId, dto);
  }

  @Post('families')
  createFamily(@CurrentUserId() userId: number, @Body() dto: CreateFamilySpaceDto) {
    return this.spaceService.createFamilySpace(userId, dto);
  }

  @Get('invites/:token')
  @Public()
  @RateLimit(30)
  invitePreview(@Param('token') token: string) {
    return this.spaceService.getInvitePreview(token);
  }

  @Post('invites/accept')
  @RateLimit(10)
  acceptInvite(@CurrentUserId() userId: number, @Body() dto: AcceptSpaceInviteDto) {
    return this.spaceService.acceptInvite(userId, dto);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.spaceService.getSpace(id, userId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.spaceService.updateSpace(id, userId, dto);
  }

  @Post(':id/invites')
  createInvite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @Body() dto: CreateSpaceInviteDto,
  ) {
    return this.spaceService.createInvite(id, userId, dto);
  }

  @Delete(':id/invites/:inviteId')
  revokeInvite(
    @Param('id', ParseIntPipe) id: number,
    @Param('inviteId', ParseIntPipe) inviteId: number,
    @CurrentUserId() userId: number,
  ) {
    return this.spaceService.revokeInvite(id, inviteId, userId);
  }

  @Get(':id/members')
  members(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.spaceService.listMembers(id, userId);
  }

  @Post(':id/members/profiles')
  addProfile(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @Body() dto: CreateSpaceMemberDto,
  ) {
    return this.spaceService.addFamilyProfile(id, userId, dto);
  }

  @Put(':id/members/:memberId')
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUserId() userId: number,
    @Body() dto: UpdateSpaceMemberDto,
  ) {
    return this.spaceService.updateMember(id, memberId, userId, dto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @CurrentUserId() userId: number,
  ) {
    return this.spaceService.removeMember(id, memberId, userId);
  }

  @Get(':id/events')
  events(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.spaceService.listEvents(id, userId);
  }

  @Post(':id/events')
  createEvent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @Body() dto: CreateSharedEventDto,
  ) {
    return this.spaceService.createEvent(id, userId, dto);
  }

  @Delete(':id/events/:eventId')
  deleteEvent(
    @Param('id', ParseIntPipe) id: number,
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUserId() userId: number,
  ) {
    return this.spaceService.deleteEvent(id, eventId, userId);
  }

  @Get(':id/memories')
  memories(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.spaceService.listMemories(id, userId);
  }

  @Post(':id/memories')
  createMemory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @Body() dto: CreateSharedMemoryDto,
  ) {
    return this.spaceService.createMemory(id, userId, dto);
  }

  @Delete(':id/memories/:memoryId')
  deleteMemory(
    @Param('id', ParseIntPipe) id: number,
    @Param('memoryId', ParseIntPipe) memoryId: number,
    @CurrentUserId() userId: number,
  ) {
    return this.spaceService.deleteMemory(id, memoryId, userId);
  }

  @Delete(':id/leave')
  leave(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.spaceService.leaveSpace(id, userId);
  }

  @Delete(':id')
  dissolve(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.spaceService.dissolveSpace(id, userId);
  }
}
