import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Request as ExpressRequest } from 'express';

// Type for authenticated request
export type AuthenticatedRequest = ExpressRequest & {
  user: {
    userId: string;
    roles?: string[];
  };
};

// Base controller with common imports and types
export class BaseController {
  protected getUserId(req: AuthenticatedRequest): string {
    return req.user?.userId || '';
  }
}