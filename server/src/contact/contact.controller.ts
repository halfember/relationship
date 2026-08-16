import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AcceptContactInviteDto, CreateContactInviteDto } from './dto/contact.dto';
import { ContactService } from './contact.service';
import { RateLimit } from '../common/rate-limit.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('invites')
  @RateLimit(10)
  createInvite(@CurrentUserId() userId: number, @Body() dto: CreateContactInviteDto) {
    return this.contactService.createInvite(userId, dto);
  }

  @Get('invites/sent')
  listSentInvites(@CurrentUserId() userId: number) {
    return this.contactService.listSentInvites(userId);
  }

  @Delete('invites/:id')
  revokeInvite(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.contactService.revokeInvite(id, userId);
  }

  @Get('invites/:token')
  @Public()
  @RateLimit(30)
  previewInvite(@Param('token') token: string) {
    return this.contactService.previewInvite(token);
  }

  @Post('invites/accept')
  @RateLimit(10)
  acceptInvite(@CurrentUserId() userId: number, @Body() dto: AcceptContactInviteDto) {
    return this.contactService.acceptInvite(userId, dto);
  }

  @Post('invites/reject')
  @RateLimit(10)
  rejectInvite(@CurrentUserId() userId: number, @Body() dto: AcceptContactInviteDto) {
    return this.contactService.rejectInvite(userId, dto);
  }

  @Get('connections')
  list(@CurrentUserId() userId: number) {
    return this.contactService.listConnections(userId);
  }

  @Get('connections/:id')
  detail(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.contactService.getConnection(id, userId);
  }

  @Delete('connections/:id')
  disconnect(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number) {
    return this.contactService.disconnect(id, userId);
  }
}
