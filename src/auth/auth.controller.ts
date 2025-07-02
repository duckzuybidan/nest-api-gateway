import {
  All,
  Controller,
  Req,
  Res,
  Param,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';

@Controller('auth-service')
export class AuthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @All('*path')
  async proxy(
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authServiceBaseUrl =
      this.configService.get<string>('AUTH_SERVICE_BASE_URL') ||
      'http://localhost:3001';

    const pathAndQuery = req.originalUrl.replace(/^\/auth-service/, '');
    const targetUrl = `${authServiceBaseUrl}${pathAndQuery}`;

    const forwardedHeaders: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (req.headers['cookie']) {
      forwardedHeaders['cookie'] = req.headers['cookie'];
    }

    const { data, status, headers } = await firstValueFrom(
      this.httpService.request({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: forwardedHeaders,
      }),
    );

    res.set(headers);
    res.status(status).send(data);
  }
}
