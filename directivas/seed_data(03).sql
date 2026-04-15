
-- -- 1. CREAR EL USUARIO 'CARLOS'
-- INSERT INTO usuario (numero_documento, cod_empleado, nombre, correo, username, password_hash, rol) 
-- VALUES ('87654321', 'EMP002', 'Carlos', 'calito@sgs.net', 'carlos', '12345', 'SOLICITANTE');

-- -- 1. CREAR EL USUARIO 'ALVARO'
-- -- Nota: La contraseña está en texto plano para el ejemplo, pero en NestJS usarás hashes.
-- INSERT INTO usuario (numero_documento, cod_empleado, nombre, correo, username, password_hash, rol) 
-- VALUES ('12345678', 'EMP001', 'Alvaro', 'alvaro@sgs.net', 'alvaro', '12345', 'SOLICITANTE');

-- INSERT INTO usuario (numero_documento, cod_empleado, nombre, correo, username, password_hash, rol) 
-- VALUES ('0', 'EMP000', 'Sr Usuario', 'user00@sgs.net', 'usuario_demo', 'usuario_demo', 'DEMO');

-- =====================================================
-- Registro de prueba #1
-- =====================================================

-- 2. CREAR LA SOLICITUD
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-010', 
    (SELECT id FROM usuario WHERE username = 'carlos'),
    (SELECT id FROM estado_solicitud WHERE slug = 'pendiente'),
    'IDA'
);

-- 2.1. DETALLE DE LA SOLICITUD
INSERT INTO detalle_vuelo_solicitud (solicitud_id, preferencia_aerolinea, origen, destino, fecha_ida, fecha_vuelta)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-010'),
    'Avianca',
    'Cali',
    'Medellín',
    '2026-04-29',
    NULL  -- Es solo IDA, no hay fecha de vuelta
);

-- =====================================================
-- Registro de prueba #2
-- =====================================================


-- 2. CREAR LA SOLICITUD
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-020', 
    (SELECT id FROM usuario WHERE username = 'carlos'),
    (SELECT id FROM estado_solicitud WHERE slug = 'en_revision'),
    'IDA_Y_VUELTA'
);

-- 2.1. DETALLE DE LA SOLICITUD
INSERT INTO detalle_vuelo_solicitud (solicitud_id, preferencia_aerolinea, origen, destino, fecha_ida, fecha_vuelta)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-020'),
    'Wingo',
    'Bogota',
    'Cartagena',
    '2026-05-02',
    '2026-05-15'
);




-- =====================================================
-- Registro de prueba #3.1
-- =====================================================



-- 2. CREAR LA SOLICITUD
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-031', 
    (SELECT id FROM usuario WHERE username = 'carlos'),
    (SELECT id FROM estado_solicitud WHERE slug = 'cotizacion_cargada'),
    'IDA'
);

-- 2.1. DETALLE DE LA SOLICITUD
INSERT INTO detalle_vuelo_solicitud (solicitud_id, preferencia_aerolinea, origen, destino, fecha_ida, fecha_vuelta)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-031'),
    'LATAM',
    'Bogotá',
    'Cali',
    '2026-04-15',
    NULL  -- Es solo IDA, no hay fecha de vuelta
);

-- 3. CREAR LA COTIZACIÓN
INSERT INTO cotizacion (solicitud_id, cargada_usuario_id, estado_actual_id, valor_total, cobertura)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-031'),
    (SELECT id FROM usuario WHERE username = 'ar' LIMIT 1),
    (SELECT id FROM estado_cotizacion WHERE slug = 'cotizacion_nueva'),
    850.00,
    'IDA'
);



-- 3.1. SEGMENTO DE IDA (solo hay uno porque el vuelo es de ida)
INSERT INTO segmento_cotizacion (cotizacion_id, aerolinea, tipo_segmento, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-031')),
    'LATAM',
    'IDA',
    'LA4321',
    '2026-04-15 06:30:00',
    'Económica',
    'Solo equipaje de mano'
);

-- =====================================================
-- Registro de prueba #3.2 (para rechazar cotizacion)
-- =====================================================

-- 2. CREAR LA SOLICITUD
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-032', 
    (SELECT id FROM usuario WHERE username = 'carlos'),
    (SELECT id FROM estado_solicitud WHERE slug = 'cotizacion_cargada'),
    'IDA'
);

-- 2.1. DETALLE DE LA SOLICITUD
INSERT INTO detalle_vuelo_solicitud (solicitud_id, preferencia_aerolinea, origen, destino, fecha_ida, fecha_vuelta)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-032'),
    'Avianca',
    'Cali',
    'Medellín',
    '2026-04-29',
    NULL  -- Es solo IDA, no hay fecha de vuelta
);

-- 3. CREAR LA COTIZACIÓN
INSERT INTO cotizacion (solicitud_id,cargada_usuario_id, estado_actual_id, valor_total, cobertura)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-032'),
    (SELECT id FROM usuario WHERE username = 'ar' LIMIT 1),
    (SELECT id FROM estado_cotizacion WHERE slug = 'cotizacion_nueva'),
    850.00,
    'IDA'
);


-- 3.1. SEGMENTO DE IDA (solo hay uno porque el vuelo es de ida)
INSERT INTO segmento_cotizacion (cotizacion_id, aerolinea, tipo_segmento, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-032')),
    'Avianca',
    'IDA',
    'LA4321',
    '2026-04-29 06:30:00',
    'Económica',
    'Solo equipaje de mano'
);

-- =====================================================
-- Registro de prueba #3.3
-- =====================================================


-- 2. CREAR LA SOLICITUD
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-033', 
    (SELECT id FROM usuario WHERE username = 'carlos'),
    (SELECT id FROM estado_solicitud WHERE slug = 'cotizacion_cargada'),
    'IDA_Y_VUELTA'
);

-- 2.1. DETALLE DE LA SOLICITUD
INSERT INTO detalle_vuelo_solicitud (solicitud_id, preferencia_aerolinea, origen, destino, fecha_ida, fecha_vuelta)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-033'),
    'LATAM',
    'Bogotá',
    'Cali',
    '2026-05-5',
    '2026-05-12' 
);

-- 3. CREAR LA COTIZACIÓN
INSERT INTO cotizacion (solicitud_id, cargada_usuario_id, estado_actual_id, valor_total, cobertura)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-033'),
    (SELECT id FROM usuario WHERE username = 'ar' LIMIT 1),
    (SELECT id FROM estado_cotizacion WHERE slug = 'cotizacion_nueva'),
    850.00,
    'IDA_Y_VUELTA'
);

-- 3.1. SEGMENTO DE IDA 
INSERT INTO segmento_cotizacion (cotizacion_id, aerolinea, tipo_segmento, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-033')),
    'LATAM',
    'IDA',
    'LA4321',
    '2026-04-15 06:30:00',
    'Económica',
    'Solo equipaje de mano'
);

-- 3.1. SEGMENTO DE VUELTA 
INSERT INTO segmento_cotizacion (cotizacion_id, aerolinea, tipo_segmento, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-033')),
    'LATAM',
    'IDA',
    'LA4321',
    '2026-04-15 06:30:00',
    'Económica',
    'Solo equipaje de mano'
);



-- =====================================================
-- Registro de prueba  4
-- =====================================================

-- 2. CREAR LA SOLICITUD ('BOLETO CARGADO')
-- Buscamos el ID del usuario que acabamos de crear y el ID del estado 'boleto_cargado'
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-040', 
    (SELECT id FROM usuario WHERE username = 'alvaro'),
    (SELECT id FROM estado_solicitud WHERE slug = 'boleto_cargado'),
    'IDA_Y_VUELTA'
);

-- 2.1. CREAR EL DETALLE DE LA SOLICITUD (¡Nuevo paso!)
INSERT INTO detalle_vuelo_solicitud (solicitud_id, preferencia_aerolinea, origen, destino, fecha_ida, fecha_vuelta)
VALUES ((SELECT id FROM solicitud WHERE radicado = 'RAD-2026-040'), 'Avianca', 'Bogotá', 'Medellín', '2026-03-10', '2026-03-20');


-- 3. CREAR LA COTIZACIÓN ('COTIZACION SELECCIONADA')
-- Relacionada con la solicitud anterior
INSERT INTO cotizacion (solicitud_id, cargada_usuario_id, estado_actual_id, valor_total, cobertura)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-040'),
    (SELECT id FROM usuario WHERE username = 'ar' LIMIT 1),
    (SELECT id FROM estado_cotizacion WHERE slug = 'cotizacion_seleccionada'),
    1500.50,
    'IDA_Y_VUELTA'
);

-- 3.1. CREAR SEGMENTO DE IDA
INSERT INTO segmento_cotizacion (cotizacion_id, aerolinea, tipo_segmento, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-040')),
    'Avianca',
    'IDA',
    'AV9450',
    '2026-03-10 08:00:00',
    'Económica',
    '1 maleta 23kg'
);

-- 3.2. CREAR SEGMENTO DE VUELTA
INSERT INTO segmento_cotizacion (cotizacion_id, aerolinea, tipo_segmento, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-040')),
    'Avianca',
    'VUELTA',
    'AV9451',
    '2026-03-20 18:00:00',
    'Económica',
    '1 maleta 23kg'
);

-- 4. CREAR EL BOLETO (Datos puramente administrativos)
-- Relacionado con la cotización anterior
INSERT INTO boleto (cotizacion_id, emitido_usuario_id, estado_actual_id, cobertura, valor_final)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-040') LIMIT 1),
    (SELECT id FROM usuario WHERE username = 'ar' LIMIT 1),
    (SELECT id FROM estado_boleto WHERE slug = 'boleto_emitido'),
    'IDA_Y_VUELTA',
    1500.50
);


-- 4.1 CREAR SEGMENTO_BOLETO DE IDA 
INSERT INTO segmento_boleto (
    boleto_id, estado_id, tipo_segmento, aerolinea, codigo_reserva, 
    numero_tiquete, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje
)
VALUES (
    LAST_INSERT_ID(), -- Obtiene automáticamente el ID del boleto recién creado
    (SELECT id FROM estado_segmento_boleto WHERE slug = 'confirmado'),
    'IDA',
    'Avianca',
    'ABC123XYZ',
    '005-123456789',
    'AV9450',
    '2026-03-10 08:00:00',
    'Económica',
    '1 maleta 23kg'
);

-- 4.2 CREAR SEGMENTO_BOLETO DE VUELTA
INSERT INTO segmento_boleto (
    boleto_id, estado_id, tipo_segmento, aerolinea, codigo_reserva, 
    numero_tiquete, numero_vuelo, fecha_vuelo, clase_tarifaria, politica_equipaje
)
VALUES (
    LAST_INSERT_ID(), -- Se asegura de vincular al mismo boleto
    (SELECT id FROM estado_segmento_boleto WHERE slug = 'confirmado'),
    'VUELTA',
    'Avianca',
    'ABC123XYZ',
    '005-123456789',
    'AV9451',
    '2026-03-20 18:00:00',
    'Económica',
    '1 maleta 23kg'
);