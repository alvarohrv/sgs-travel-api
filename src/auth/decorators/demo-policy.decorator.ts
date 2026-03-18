import { SetMetadata } from '@nestjs/common'

export type DemoPolicyResource = 'solicitud' | 'cotizacion' | 'boleto'
export type DemoPolicyAction = 'create' | 'update' | 'delete' | 'read'

export interface DemoPolicyMetadata {
  resource: DemoPolicyResource
  action: DemoPolicyAction
}

export const DEMO_POLICY_KEY = 'demo_policy'

export const DemoPolicy = (metadata: DemoPolicyMetadata) =>
  SetMetadata(DEMO_POLICY_KEY, metadata)
