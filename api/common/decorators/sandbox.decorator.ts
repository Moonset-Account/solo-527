import { SetMetadata, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';

export const SANDBOX_MODE_KEY = 'sandboxMode';

export const SandboxMode = (enabled: boolean = true) =>
  SetMetadata(SANDBOX_MODE_KEY, enabled);

@Injectable()
export class SandboxGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const sandboxModeRequired = this.reflector.getAllAndOverride<boolean>(
      SANDBOX_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (sandboxModeRequired === undefined || sandboxModeRequired === null) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const sandboxHeader = request.headers['x-sandbox-mode'];
    const isSandbox = sandboxHeader === 'true' || sandboxHeader === '1';

    if (sandboxModeRequired && !isSandbox) {
      throw new UnauthorizedException('Sandbox mode required');
    }

    return true;
  }
}

export function getSandboxModeFromRequest(request: Request): boolean {
  const sandboxHeader = request.headers['x-sandbox-mode'];
  return sandboxHeader === 'true' || sandboxHeader === '1';
}
