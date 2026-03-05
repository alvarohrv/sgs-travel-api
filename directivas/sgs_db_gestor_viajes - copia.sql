-- =====================================================
-- BASE DE DATOS
-- =====================================================

-- create database sgs_db_gestor_viajes;

-- Conectarse a la BD antes de ejecutar lo siguiente
-- \c sgs_db_gestor_viajes;

-- =====================================================
-- USUARIO
-- =====================================================

create table usuario (
    id int unsigned auto_increment primary key,
    numero_documento varchar(50) not null,
    cod_empleado varchar(50),
    nombre varchar(150) not null,
    username varchar(100) unique not null,
    password_hash text not null,
    rol varchar(30) not null check (rol in ('SOLICITANTE', 'ADMINISTRADOR', 'DUAL')),
    created_at timestamp default now()
);

-- =====================================================
-- nota: Unsigned: Solo permite números positivos (empezando desde 0)
-- ESTADO SOLICITUD
-- =====================================================

create table estado_solicitud (
    id int unsigned auto_increment primary key,
    estado varchar(100) not null,
    slug varchar(100) unique not null,
    color_hexa_main varchar(10),
    color_hexa_sec varchar(10),
    editable boolean default true
);

-- =====================================================
-- SOLICITUD
-- =====================================================

create table solicitud (
    id int unsigned auto_increment primary key,
    radicado varchar(100) unique,
    usuario_id int unsigned not null,
    estado_actual_id int unsigned not null,
    tipo_de_vuelo varchar(30) not null check (tipo_de_vuelo in ('IDA', 'IDA_Y_VUELTA', 'RETORNO')),
    created_at timestamp default current_timestamp,
    -- Permitimos NULL y quitamos valores extraños
    -- antes: created_at timestamp default now(), // (NOW() y CURRENT_TIMESTAMP son prácticamente sinónimos.)
    updated_at timestamp null on update current_timestamp, 
    deleted_at timestamp null,

    constraint fk_solicitud_usuario
        foreign key (usuario_id) references usuario(id),

    constraint fk_solicitud_estado
        foreign key (estado_actual_id) references estado_solicitud(id)
);

create index idx_solicitud_usuario on solicitud(usuario_id);





-- =====================================================
-- HISTORIAL ESTADO SOLICITUD
-- =====================================================

create table historial_estado_solicitud (
    id int unsigned auto_increment primary key,
    solicitud_id int unsigned not null,
    estado_id int unsigned not null,
    usuario_id int unsigned not null,
    observacion text,
    created_at timestamp default now(),

    constraint fk_hist_solicitud
        foreign key (solicitud_id) references solicitud(id),

    constraint fk_hist_solicitud_estado
        foreign key (estado_id) references estado_solicitud(id),

    constraint fk_hist_solicitud_usuario
        foreign key (usuario_id) references usuario(id)
);

-- =====================================================
-- ESTADO COTIZACION
-- =====================================================

create table estado_cotizacion (
    id int unsigned auto_increment primary key,
    estado varchar(100) not null,
    slug varchar(100) unique not null,
    editable boolean default true
);

-- =====================================================
-- COTIZACION
-- =====================================================

create table cotizacion (
    id int unsigned auto_increment primary key,
    solicitud_id int unsigned not null,
    cotizacion_anterior_id int unsigned,
    estado_actual_id int unsigned not null,
    cobertura varchar(30) check (cobertura in ('IDA', 'IDA_Y_VUELTA', 'RETORNO')),
    valor_total numeric(14,2) not null,
    aerolinea varchar(100),
    created_at timestamp default now(),

    constraint fk_cotizacion_solicitud
        foreign key (solicitud_id) references solicitud(id),

    constraint fk_cotizacion_estado
        foreign key (estado_actual_id) references estado_cotizacion(id),

    constraint fk_cotizacion_anterior
        foreign key (cotizacion_anterior_id) references cotizacion(id)
);

create index idx_cotizacion_solicitud on cotizacion(solicitud_id);

-- =====================================================
-- HISTORIAL ESTADO COTIZACION
-- =====================================================

create table historial_estado_cotizacion (
    id int unsigned auto_increment primary key,
    cotizacion_id int unsigned not null,
    estado_id int unsigned not null,
    usuario_id int unsigned not null,
    observacion text,
    created_at timestamp default now(),

    constraint fk_hist_cotizacion
        foreign key (cotizacion_id) references cotizacion(id),

    constraint fk_hist_cotizacion_estado
        foreign key (estado_id) references estado_cotizacion(id),

    constraint fk_hist_cotizacion_usuario
        foreign key (usuario_id) references usuario(id)
);

-- =====================================================
-- ESTADO BOLETO
-- =====================================================

create table estado_boleto (
    id int unsigned auto_increment primary key,
    estado varchar(100) not null,
    slug varchar(100) unique not null,
    editable boolean default true
);

-- =====================================================
-- BOLETO
-- =====================================================

create table boleto (
    id int unsigned auto_increment primary key,
    cotizacion_id int unsigned not null,
    reemplaza_boleto_id int unsigned,
    estado_actual_id int unsigned not null,
    aerolinea varchar(100),
    codigo_reserva varchar(20),
    numero_tiquete varchar(50),
    url_archivo_adjunto text,
    valor_final numeric(14,2),
    fecha_compra date,
    created_at timestamp default now(),

    constraint fk_boleto_cotizacion
        foreign key (cotizacion_id) references cotizacion(id),

    constraint fk_boleto_reemplaza
        foreign key (reemplaza_boleto_id) references boleto(id),

    constraint fk_boleto_estado
        foreign key (estado_actual_id) references estado_boleto(id)
);

create index idx_boleto_cotizacion on boleto(cotizacion_id);

-- =====================================================
-- HISTORIAL ESTADO BOLETO
-- =====================================================

create table historial_estado_boleto (
    id int unsigned auto_increment primary key,
    boleto_id int unsigned not null,
    estado_id int unsigned not null,
    usuario_id int unsigned not null,
    observacion text,
    created_at timestamp default now(),

    constraint fk_hist_boleto
        foreign key (boleto_id) references boleto(id),

    constraint fk_hist_boleto_estado
        foreign key (estado_id) references estado_boleto(id),

    constraint fk_hist_boleto_usuario
        foreign key (usuario_id) references usuario(id)
);


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
-- Registro de prueba
-- =====================================================

-- 1. CREAR EL USUARIO 'ALVARO'
-- Nota: La contraseña está en texto plano para el ejemplo, pero en NestJS usarás hashes.
INSERT INTO usuario (numero_documento, cod_empleado, nombre, username, password_hash, rol) 
VALUES ('12345678', 'EMP001', 'Alvaro', 'alvaro', 'password_secreta', 'SOLICITANTE');

-- 2. CREAR LA SOLICITUD ('BOLETO CARGADO')
-- Buscamos el ID del usuario que acabamos de crear y el ID del estado 'boleto_cargado'
INSERT INTO solicitud (radicado, usuario_id, estado_actual_id, tipo_de_vuelo)
VALUES (
    'RAD-2026-001', 
    (SELECT id FROM usuario WHERE username = 'alvaro'),
    (SELECT id FROM estado_solicitud WHERE slug = 'boleto_cargado'),
    'IDA_Y_VUELTA'
);

-- 3. CREAR LA COTIZACIÓN ('COTIZACION SELECCIONADA')
-- Relacionada con la solicitud anterior
INSERT INTO cotizacion (solicitud_id, estado_actual_id, valor_total, aerolinea, cobertura)
VALUES (
    (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-001'),
    (SELECT id FROM estado_cotizacion WHERE slug = 'cotizacion_seleccionada'),
    1500.50,
    'Avianca',
    'IDA_Y_VUELTA'
);

-- 4. CREAR EL BOLETO ('BOLETO EMITIDO')
-- Relacionado con la cotización anterior
INSERT INTO boleto (cotizacion_id, estado_actual_id, aerolinea, codigo_reserva, numero_tiquete, valor_final)
VALUES (
    (SELECT id FROM cotizacion WHERE solicitud_id = (SELECT id FROM solicitud WHERE radicado = 'RAD-2026-001') LIMIT 1),
    (SELECT id FROM estado_boleto WHERE slug = 'boleto_emitido'),
    'Avianca',
    'ABC123XYZ',
    '005-123456789',
    1500.50
);


