import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roles?: string[];
        permissions?: string[];
      };
    }
  }
}

export {};