// Estructura estándar de respuesta según directivas

export interface EventoApi {
  type: string;
  affected_entities?: Array<{
    entity: string;
    id: number;
    new_state: string;
  }>;
}

export interface RespuestaApiEstandar<T = any> {
  success: boolean;
  message: string;
  data: T;
  event?: EventoApi;
}
