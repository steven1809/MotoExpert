import { Controller, Get, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { StatsService } from './stats.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin/stats')
@UseGuards(AuthGuard('jwt'))
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  private checkAdminRole(req: any) {
    const userRole = (req.user.rol || req.user.role)?.toLowerCase();
    if (userRole !== 'admin') {
      throw new ForbiddenException('Solo administradores pueden acceder a las estadísticas');
    }
  }

  @Get('today')
  getTodayStats(@Request() req) {
    this.checkAdminRole(req);
    return this.statsService.getTodayStats();
  }

  @Get('yesterday')
  getYesterdayStats(@Request() req) {
    this.checkAdminRole(req);
    return this.statsService.getYesterdayStats();
  }

  @Get('week')
  getWeekStats(@Request() req) {
    this.checkAdminRole(req);
    return this.statsService.getWeekStats();
  }

  @Get('month')
  getMonthStats(@Request() req) {
    this.checkAdminRole(req);
    return this.statsService.getMonthStats();
  }

  @Get('year')
  getYearStats(@Request() req) {
    this.checkAdminRole(req);
    return this.statsService.getYearStats();
  }

  @Get('range')
  getRangeStats(@Request() req, @Query('from') from: string, @Query('to') to: string) {
    this.checkAdminRole(req);
    return this.statsService.getRangeStats(from, to);
  }

  @Get('detail')
  getDetailStats(
    @Request() req,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.checkAdminRole(req);
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.statsService.getDetailStats(date, from, to, pageNum, limitNum);
  }

  @Get('summary')
  getSummaryStats(@Request() req) {
    this.checkAdminRole(req);
    return this.statsService.getSummaryStats();
  }
}
