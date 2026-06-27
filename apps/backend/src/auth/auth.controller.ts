import { Controller, Post, Get, Body, Request, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.authService.login(req.user);
    res.cookie(
      this.authService.refreshTokenCookieName,
      refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    return response;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.authService.refreshToken(req.user.refreshToken);
    res.cookie(
      this.authService.refreshTokenCookieName,
      refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
    return response;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.refreshToken);
    res.clearCookie(
      this.authService.refreshTokenCookieName,
      this.authService.getClearRefreshCookieOptions(),
    );
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.userId);
  }
}
