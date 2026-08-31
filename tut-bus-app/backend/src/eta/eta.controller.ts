import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { EtaService } from './eta.service';

/**
 * Live arrival estimates. Read-only and public so the student app and the
 * web dashboard can poll (or hydrate a socket view) without a token.
 */
@Controller('eta')
export class EtaController {
  constructor(private readonly eta: EtaService) {}

  @Public()
  @Get('route/:routeId')
  forRoute(@Param('routeId') routeId: string) {
    return this.eta.forRoute(routeId);
  }

  @Public()
  @Get('stop/:stopId')
  forStop(@Param('stopId') stopId: string) {
    return this.eta.forStop(stopId);
  }
}
