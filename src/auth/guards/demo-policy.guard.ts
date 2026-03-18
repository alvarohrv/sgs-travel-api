import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  DEMO_POLICY_KEY,
  DemoPolicyMetadata,
} from '../decorators/demo-policy.decorator'
import { DemoPolicyService } from '../demo-policy.service'

@Injectable()
export class DemoPolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly demoPolicyService: DemoPolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<DemoPolicyMetadata>(
      DEMO_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!metadata) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const userId = request.user?.id
    const role = request.user?.role

    if (metadata.action === 'create' && typeof userId === 'number') {
      await this.demoPolicyService.assertCanCreate(metadata.resource, userId, role)
    }

    return true
  }
}
