---
title: 'Granalia: sistema full-stack de gestion comercial y facturacion'
description: 'Diseno tecnico de una aplicacion productiva con React, FastAPI, PostgreSQL, PDFs, roles, snapshots historicos e integracion fiscal con ARCA.'
pubDate: 'May 13 2026'
heroImage: '../../assets/blog-placeholder-1.jpg'
---

Granalia es una aplicacion web desarrollada para digitalizar el circuito operativo de una empresa alimenticia. El sistema reemplaza planillas y tareas manuales por una herramienta centralizada para cargar pedidos, administrar clientes, productos, transportes, listas de precios, comprobantes, PDFs, historial, estadisticas y facturacion fiscal integrada con ARCA.

El proyecto combina frontend React, backend FastAPI y PostgreSQL. La decision principal fue separar la interfaz de la logica de negocio: el frontend se enfoca en formularios, navegacion por rol y experiencia de carga; el backend concentra validaciones, calculos, persistencia, generacion de PDFs e integraciones externas.

## Problema

La operacion necesitaba resolver tres problemas al mismo tiempo:

- Reducir errores de carga manual en pedidos, clientes, productos y transportes.
- Mantener historial confiable aunque cambien precios, productos o datos de clientes.
- Permitir facturacion interna y facturacion fiscal declarada desde un mismo flujo.

Para eso modele el sistema alrededor de comprobantes, items, clientes, catalogos, listas de precios y lotes de facturacion. Cada factura guarda snapshots historicos de los datos relevantes para que un cambio futuro en el catalogo no altere documentos ya emitidos.

## Arquitectura

El backend esta organizado con responsabilidades separadas:

- `app/api/routes`: endpoints HTTP.
- `app/domain`: modelos y conceptos de dominio.
- `app/services`: reglas de negocio, PDFs, catalogos y ARCA.
- `app/infrastructure`: persistencia PostgreSQL.
- `app/core`: configuracion, seguridad y logging.
- `migrations`: versionado de base con Alembic.

El frontend usa React 18, React Router, Vite, Tailwind CSS y Context API. La aplicacion renderiza pantallas protegidas, mantiene estado de sesion, consume la API REST, muestra previews de facturacion y habilita acciones segun permisos.

## Casos de uso principales

El sistema soporta un flujo comercial completo:

- Login seguro con cookie HTTP-only, CSRF y roles `admin` / `operator`.
- Carga de pedidos con cliente, transporte, notas, productos, cantidades, descuentos y bonificaciones.
- Generacion de facturas internas con numeracion independiente.
- Facturacion fiscal declarada con autorizacion de Factura A en ARCA.
- Facturacion dividida entre parte interna y parte fiscal.
- Notas de credito internas y fiscales asociadas a comprobantes existentes.
- Gestion de clientes con datos operativos y fiscales.
- Gestion de productos, presentaciones, precios, peso neto e IVA fiscal.
- Carga de listas de precios PDF con preview, versionado y activacion.
- Historial con filtros, descarga de PDFs, edicion controlada y eliminacion segun reglas.
- Estadisticas comerciales visibles solo para administradores.

## Integracion con ARCA

La parte fiscal fue el mayor desafio tecnico. El sistema implementa emision de Factura A contra servicios de ARCA en produccion.

Servicios utilizados:

- WSAA para autenticacion con certificado y clave privada.
- WSFEv1 para consultar puntos de venta, ultimo comprobante, comprobantes existentes y solicitar CAE.
- Padron fiscal para precargar datos del contribuyente por CUIT.

El flujo fiscal no autoriza automaticamente al guardar. Primero se crea una factura declarada en borrador y luego un administrador ejecuta la accion sensible `Autorizar en ARCA`, protegida con contrasena adicional. Si ARCA responde correctamente, se persisten CAE, vencimiento de CAE, numeracion fiscal, resultado y observaciones.

Las facturas fiscales autorizadas quedan bloqueadas. Esta decision evita que un documento con validez fiscal pueda modificarse luego de haber recibido CAE.

## Manejo de errores fiscales

Una integracion fiscal productiva no puede tratar todos los errores igual. El backend diferencia estados como ARCA deshabilitado, ARCA no configurado, rechazo fiscal, error tecnico, timeout, error de red y conflicto de autorizacion.

Ante errores tecnicos o timeouts, el sistema consulta el ultimo comprobante autorizado y, si corresponde, consulta el comprobante especifico. Esto permite recuperar un CAE ya generado y evita reintentos inseguros que podrian duplicar comprobantes o romper la numeracion fiscal.

Tambien se auditan requests y responses en una tabla dedicada, pero con payloads sanitizados para no persistir secretos como token/sign ni claves privadas.

## Facturacion dividida

Granalia necesitaba resolver pedidos que se separan entre una parte interna y una parte declarada. Para eso implemente un modo de facturacion dividida: el usuario carga un unico pedido, define un porcentaje declarado y el backend genera dos comprobantes vinculados por lote.

La regla central es:

```text
cantidad_declarada = ceil(cantidad_total * porcentaje_declarado / 100)
cantidad_interna = cantidad_total - cantidad_declarada
```

El redondeo favorece la parte declarada. La parte fiscal usa lista declarada e IVA configurado por producto; la parte interna puede conservar reglas comerciales propias como bonificaciones.

## Datos e integridad

La base usa PostgreSQL 16 con claves foraneas, constraints, indices unicos y JSONB para estructuras flexibles como descuentos, notas, reglas comerciales y snapshots.

Tablas relevantes:

- `app_users`.
- `customers`.
- `transports`.
- `products`.
- `product_offerings`.
- `price_lists` y `price_list_versions`.
- `catalogs`.
- `invoice_batches`.
- `invoices` e `invoice_items`.
- `invoice_tax_breakdown`.
- `invoice_sequences`.
- `credit_note_item_sources`.
- `arca_requests`.

Las decisiones de integridad mas importantes fueron separar numeracion interna de numeracion fiscal, guardar snapshots historicos y representar estados explicitos para facturas fiscales: `draft`, `authorizing`, `authorized`, `rejected` y `error`.

## Seguridad

El sistema implementa medidas de seguridad de aplicacion y de operacion:

- Sesiones con cookies HTTP-only.
- Token CSRF.
- Roles `admin` y `operator`.
- Rutas protegidas en backend y frontend.
- Validaciones con Pydantic.
- Constraints en PostgreSQL.
- CORS configurable.
- Cookies seguras en produccion.
- Validacion estricta de secretos productivos.
- Contrasena adicional para autorizacion fiscal.
- Logging sin exposicion de secretos.

## Infraestructura

El despliegue esta preparado con Docker Compose, Caddy y PostgreSQL containerizado. Caddy sirve el frontend estatico y actua como reverse proxy hacia FastAPI. El backend expone healthchecks de vida y disponibilidad, logging estructurado y tiempos de respuesta por request mediante `X-Response-Time-Ms`.

## Resultado

Granalia es un caso de sistema full-stack con dominio real, reglas comerciales complejas, integracion fiscal productiva y necesidades operativas concretas. El valor tecnico estuvo en convertir un flujo manual en una aplicacion mantenible, auditable y preparada para produccion.

El aprendizaje principal fue disenar software alrededor de invariantes de negocio: una factura historica no debe cambiar, un comprobante fiscal autorizado no debe editarse, un timeout no debe duplicar numeracion y una operacion sensible debe ser explicita.
