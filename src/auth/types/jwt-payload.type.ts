// Interfaz compartida para el payload del JWT
export interface JwtPayloadType {
  sub: number; // ID del usuario
  role: string; // Rol del usuario
}

// Tipo para el objeto previo al payload del JWT
export interface PreJwtPayload {
  id: number; // ID del usuario
  username: string; // Nombre de usuario
  rol: string; // Rol del usuario
}

export interface ResponseLoginJwt {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      username: string;
      role: string;
    };
  };
}
