-- =====================================================
-- INSERT ESTADOS SOLICITUD
-- =====================================================

insert into estado_solicitud (estado, slug, color_hexa_main, color_hexa_sec, editable) values
('PENDIENTE', 'pendiente', '#6c757d', '#adb5bd', true),
('EN REVISION', 'en_revision', '#0d6efd', '#6ea8fe', true),
('COTIZACION CARGADA', 'cotizacion_cargada', '#ffc107', '#ffda6a', true),
('BOLETO CARGADO', 'boleto_cargado', '#20c997', '#63e6be', true),
('NOVEDAD', 'novedad', '#fd7e14', '#ffb070', true),
('RECHAZADA', 'rechazada', '#dc3545', '#f1aeb5', false),
('VIAJE PROGRAMADO', 'viaje_programado', '#20c997', '#63e6be', true),
('CERRADA', 'cerrada', '#198754', '#75b798', false);

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
('VOLADO', 'volado', 'El pasajero ya completó este trayecto.'),
('EN CHEQUEO', 'check_in', 'El pasajero ya realizó el proceso de check-in.'),
('NO PRESENTADO', 'no_show', 'El pasajero no se presentó al abordaje (vuelo perdido).');



