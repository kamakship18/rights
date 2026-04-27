import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { SosService } from './sos.service';
import {
  SosTriggerBodySchema,
  CreateContactBodySchema,
  UpdateContactBodySchema,
} from './sos.dto';
import { ZodError } from 'zod';

@Controller('sos')
export class SosController {
  constructor(private readonly sos: SosService) {}

  private getClerkId(req: Request): string {
    return (req as Request & { userId?: string }).userId || 'dev-user-001';
  }

  @Get('contacts')
  list(@Req() req: Request) {
    return this.sos.listContacts(this.getClerkId(req));
  }

  @Post('contacts')
  create(@Req() req: Request, @Body() body: unknown) {
    let data;
    try {
      data = CreateContactBodySchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.flatten());
      }
      throw e;
    }
    return this.sos.addContact(this.getClerkId(req), data);
  }

  @Patch('contacts/:id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    let data;
    try {
      data = UpdateContactBodySchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.flatten());
      }
      throw e;
    }
    return this.sos.updateContact(this.getClerkId(req), id, data);
  }

  @Delete('contacts/:id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.sos.removeContact(this.getClerkId(req), id);
  }

  @Post('trigger')
  async trigger(@Req() req: Request, @Body() body: unknown) {
    let data;
    try {
      data = SosTriggerBodySchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.flatten());
      }
      throw e;
    }
    return this.sos.trigger(this.getClerkId(req), data);
  }
}
