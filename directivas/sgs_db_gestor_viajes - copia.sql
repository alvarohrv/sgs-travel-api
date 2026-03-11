-- =====================================================
-- BASE DE DATOS
-- =====================================================

-- create database sgs_db_gestor_viajes;

-- Conectarse a la BD antes de ejecutar lo siguiente
-- \c sgs_db_gestor_viajes;

-- =====================================================
-- USUARIO
-- =====================================================


CREATE TABLE usuario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    cod_empleado VARCHAR(50) UNIQUE,              
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,           -- Nuevo campo, validar servicios!
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('SOLICITANTE', 'ADMINISTRADOR', 'DUAL'))
);


    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Mysql (estandar)
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- PostgreSQL (estandar)
    -- created_at timestamp default now() -- (propio de mysql, y equivalente a TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    -- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, (estandar)
    -- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  (Solo Mysql) =/
    -- updated_at timestamp null on update current_timestamp, -- MySQL (no recomendado al momento de migrar) = /
    -- disabled_at TIMESTAMP NULL  -- Soft Delete  (estandar) 
    -- closed_at TIMESTAMP NULL  -- Soft Delete  (estandar) 
        
    -- --- SI el ORM prisma genera las columnas: ver el blog: prisma_y_migraciones_con_ORM
    -- created_at   DateTime @default(now()) -- Prisma (DSL)  --- en el archivo schema.prisma
    -- updated_at   DateTime @updatedAt -- Prisma (DSL) con decorador especilizado --- en el archivo schema.prisma

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

    constraint fk_solicitud_usuario
        foreign key (usuario_id) references usuario(id),

    constraint fk_solicitud_estado
        foreign key (estado_actual_id) references estado_solicitud(id)
);

create index idx_solicitud_usuario on solicitud(usuario_id);

-- =====================================================
-- DETALLE DE LA SOLICITUD
-- =====================================================

create table detalle_vuelo_solicitud (
    id int unsigned auto_increment primary key,
    solicitud_id int unsigned not null,
    preferencia_aerolinea varchar(100), -- sin 'not null' por si el usuario no tiene preferencia
    origen varchar(100) not null,      
    destino varchar(100) not null,
    fecha_ida date not null,
    fecha_vuelta date,

    constraint fk_detalle_solicitud foreign key (solicitud_id) references solicitud(id)
);

-- =====================================================
-- HISTORIAL ESTADO SOLICITUD
-- =====================================================

create table historial_estado_solicitud (
    id int unsigned auto_increment primary key,
    solicitud_id int unsigned not null,
    estado_id int unsigned not null,
    usuario_id int unsigned not null,
    observacion text,

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

    constraint fk_cotizacion_solicitud
        foreign key (solicitud_id) references solicitud(id),

    constraint fk_cotizacion_estado
        foreign key (estado_actual_id) references estado_cotizacion(id),

    constraint fk_cotizacion_anterior
        foreign key (cotizacion_anterior_id) references cotizacion(id)
);

create index idx_cotizacion_solicitud on cotizacion(solicitud_id);


-- =====================================================
-- DETALLE DE LA COTIZACIÓN (La oferta formal - tabla generica)
-- =====================================================

create table segmento_cotizacion (
    id int unsigned auto_increment primary key,
    cotizacion_id int unsigned not null,
    tipo_segmento enum('IDA', 'VUELTA') not null, -- Identifica qué es
    numero_vuelo varchar(20) not null,
    fecha_vuelo datetime not null,
    clase_tarifaria varchar(50),
    politica_equipaje text,

    constraint fk_segmento_cotizacion 
        foreign key (cotizacion_id) references cotizacion(id)
);


-- =====================================================
-- HISTORIAL ESTADO COTIZACION
-- =====================================================

create table historial_estado_cotizacion (
    id int unsigned auto_increment primary key,
    cotizacion_id int unsigned not null,
    estado_id int unsigned not null,
    usuario_id int unsigned not null,
    observacion text,

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
    cobertura varchar(20),
    valor_final numeric(14,2),

    constraint fk_boleto_cotizacion
        foreign key (cotizacion_id) references cotizacion(id),

    constraint fk_boleto_reemplaza
        foreign key (reemplaza_boleto_id) references boleto(id),

    constraint fk_boleto_estado
        foreign key (estado_actual_id) references estado_boleto(id)
);

create index idx_boleto_cotizacion on boleto(cotizacion_id);


-- =====================================================
-- ESTADO PARA SEGMENTO DE BOLETOS 
-- =====================================================


create table estado_segmento_boleto (
    id int unsigned auto_increment primary key,
    estado varchar(50) not null,
    slug varchar(50) not null unique,
    editable boolean default true,
    descripcion varchar(255)
);


-- =====================================================
-- DETALLE PARA BOLETOS ( tabla generica)
-- =====================================================

create table segmento_boleto (
    id int unsigned auto_increment primary key,
    boleto_id int unsigned not null,
    estado_id int unsigned not null,
    aerolinea varchar(100),
    codigo_reserva varchar(20),
    numero_tiquete varchar(50),
    tipo_segmento enum('IDA', 'VUELTA', 'ESCALA') not null, -- Identifica qué es
    fecha_compra date,
    numero_vuelo varchar(20) not null,
    fecha_vuelo datetime not null,
    clase_tarifaria varchar(50),
    politica_equipaje text,
    url_archivo_adjunto text,

    constraint fk_segmento_boleto 
        foreign key (boleto_id) references boleto(id),

    constraint fk_segmento_estado
        foreign key (estado_id) references estado_segmento_boleto(id)
);

-- Índice para mejorar el rendimiento en filtros por estado
create index idx_segmento_estado on segmento_boleto(estado_id);



-- =====================================================
-- HISTORIAL ESTADO BOLETO
-- =====================================================

create table historial_estado_boleto (
    id int unsigned auto_increment primary key,
    boleto_id int unsigned not null,
    estado_id int unsigned not null,
    usuario_id int unsigned not null,
    observacion text,

    constraint fk_hist_boleto
        foreign key (boleto_id) references boleto(id),

    constraint fk_hist_boleto_estado
        foreign key (estado_id) references estado_boleto(id),

    constraint fk_hist_boleto_usuario
        foreign key (usuario_id) references usuario(id)
);
