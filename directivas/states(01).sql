-- =====================================================
-- INSERT ESTADOS SOLICITUD
-- =====================================================

insert into estado_solicitud (estado, slug, editable) values
('PENDIENTE', 'pendiente', true),
('EN REVISION', 'en_revision', true),
('COTIZACION CARGADA', 'cotizacion_cargada', true),
('BOLETO CARGADO', 'boleto_cargado', true),
('NOVEDAD', 'novedad', true),
('RECHAZADA', 'rechazada', false),
('VIAJE PROGRAMADO', 'viaje_programado', true),
('CERRADA', 'cerrada', false);

-- =====================================================
-- INSERT ESTADOS COTIZACION
-- =====================================================

insert into estado_cotizacion (estado, slug, editable) values
('COTIZACION NUEVA', 'cotizacion_nueva', true),
('COTIZACION RECHAZADA', 'cotizacion_rechazada', false),
('OPCION PRIMARIA', 'opcion_primaria', true),
('OPCION SECUNDARIA', 'opcion_secundaria', true),
('PENDIENTE', 'pendiente', true),
('NOVEDAD', 'novedad', true),
('COTIZACION SELECCIONADA', 'cotizacion_seleccionada', false),
('COTIZACION ANULADA', 'cotizacion_anulada', false),
('COTIZACION DESCARTADA', 'cotizacion_descartada', false);

-- =====================================================
-- INSERT ESTADOS BOLETO
-- =====================================================

insert into estado_boleto (estado, slug, editable) values
('BOLETO EMITIDO', 'boleto_emitido', true),
('CONFORME POR EL EMPLEADO', 'conforme_empleado', false),
('BOLETO ANULADO', 'boleto_anulado', false),
('NOVEDAD', 'novedad', true);

-- =====================================================
-- INSERT ESTADOS SEGMENTO BOLETO
-- =====================================================

insert into estado_segmento_boleto (estado, slug, descripcion) values
('CONFIRMADO', 'confirmado', 'El vuelo está vigente y con espacio reservado.'),
('REPROGRAMADO', 'reprogramado', 'El vuelo sufrió un cambio de horario o fecha (sin costo adicional).'),
('CANCELADO', 'cancelado', 'El vuelo fue anulado por la aerolínea o por cambio de boleto.'),
('NOVEDAD', 'novedad', 'El vuelo posee alguna novedad, contactar con el administrador.'),
('VOLADO', 'volado', 'El pasajero ya completó este trayecto.'),
('EN CHEQUEO', 'check_in', 'El pasajero ya realizó el proceso de check-in.'),
('NO PRESENTADO', 'no_show', 'El pasajero no se presentó al abordaje (vuelo perdido).');



