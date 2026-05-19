---
title: 'BeLeadAI: automatización de prospección con backend y extensión Chrome MV3'
description: 'Arquitectura de una plataforma de prospección para Instagram con FastAPI, MySQL, Redis, colas, WebSockets, contratos públicos y extensión Chrome MV3.'
pubDate: 'May 12 2026'
heroImage: '../../assets/blog-placeholder-2.jpg'
---

BeLeadAI es una plataforma para convertir Instagram en un canal de prospección comercial. Permite extraer audiencias desde cuentas objetivo, analizar perfiles, seleccionar destinatarios y enviar mensajes desde una extensión Chrome conectada a una API privada.

El sistema está dividido en dos piezas principales: un backend operativo para análisis, colas y control de ejecución, y una extensión Chrome MV3 que actúa como cliente instalado por el usuario.

## Producto

Desde la extensión, el usuario puede:

- Extraer followings de una cuenta objetivo para generar leads.
- Analizar perfiles y detectar prospectos con mayor potencial.
- Filtrar destinatarios desde resultados previos.
- Enviar mensajes directos desde su cuenta de Instagram.
- Usar mensajes manuales o asistidos por IA.
- Monitorear jobs, progreso, resultados y límites en tiempo real.

El enfoque de producto fue mantener una interfaz simple para el usuario, pero con una arquitectura suficientemente robusta para controlar estado, límites, versionado y comunicación con backend.

## Backend

El backend está construido con Python 3.11+, FastAPI, MySQL 8 y Redis. Redis se usa para estado crítico de autenticación y rate limiting. La arquitectura operativa separa la API HTTP del dispatcher de jobs.

En Docker, la topología queda dividida en:

- `app`: API FastAPI servida con Gunicorn y UvicornWorker.
- `dispatcher`: scheduler y workers por cuenta.
- `db`: MySQL.
- `redis`: estado crítico y rate limiting.
- `db-migrate`: migraciones.

Endpoints principales:

- `GET /health`, `GET /ready`, `GET /live`.
- `POST /ext/v2/followings/enqueue`.
- `POST /ext/v2/analyze/enqueue`.
- `POST /ext/v2/send/enqueue`.
- `GET /metrics` y `GET /metrics/summary` protegidos en producción.

El backend fue pensado como un sistema multi-tenant con JWT, API key, rate limiting y colas con afinidad dura por cuenta o `profile_id`. Esa afinidad evita mezclar trabajos entre cuentas y permite distribuir carga de forma controlada.

## Colas y ejecución

Las tareas de scraping, análisis y envío se encolan desde endpoints externos. El dispatcher consume esas colas y ejecuta trabajo con workers asociados a cuentas. El transporte de colas puede ser local o SQS, según configuración.

Este diseño permite separar la recepción de requests de la ejecución real. También facilita aplicar límites, reintentos, observabilidad y control de estado sin bloquear el proceso HTTP.

## Extensión Chrome MV3

La extensión se distribuye como `BeLeadAI Enqueuer`, versión `0.4.0`, con Manifest V3. Usa service worker, content scripts y una página de opciones.

Permisos relevantes:

- `storage` para persistir configuración.
- `alarms` para tareas programadas.
- `tabs` y `cookies` para integración con navegador.
- `notifications` para feedback operativo.
- `host_permissions` sobre `instagram.com`.

El content script se carga en Instagram y está modularizado en selectores, observers, acciones de input, identidad de cuenta, búsqueda directa, acciones de mensajes y mensajería interna.

La configuración inicial se guarda en `chrome.storage`: API Base URL, API key y datos necesarios para conectar contra la API privada. La extensión también contempla bloqueo guiado cuando la API exige actualización del cliente mediante códigos como `CLIENT_UPDATE_REQUIRED`.

## Contratos públicos

Para reducir acoplamiento entre extensión y backend, el repositorio publica contratos frontend-visibles. Estos contratos documentan los request/response mínimos que la extensión necesita consumir.

La cobertura publicada incluye:

- Auth login.
- Ping.
- Config.
- Limits.
- Recipient sources.
- Recipient source recipients.
- Analyze enqueue request.
- Followings enqueue request.
- Send enqueue request.
- Send pull request/response.
- Send result request.
- Send heartbeat request.
- Send WebSocket events.
- Jobs WebSocket events.

Las respuestas siguen envelopes estables:

```json
{ "data": { } }
```

```json
{ "error": { "code": "string", "message": "string", "details": { } } }
```

El objetivo no fue exponer toda la implementación interna, sino publicar el subconjunto estable que necesita el cliente.

## Distribución y calidad

La extensión se prepara para distribuir por GitHub Releases. Cada release publica:

- `extension-vX.Y.Z.zip`.
- `extension-vX.Y.Z.sha256`.
- `RELEASE_NOTES.md`.

El flujo de mantenimiento incluye lint, format check, tests con `node --test`, validación de contratos, smoke de contratos y empaquetado de release.

Scripts relevantes:

- `npm run lint`.
- `npm run format:check`.
- `npm run test`.
- `npm run check:contract`.
- `npm run pack:release`.

## Seguridad y operación

El backend depende de configuración por entorno para base de datos, secretos, Redis, CORS, HTTPS, concurrencia, transporte de colas y métricas. En producción, las métricas se protegen con bearer token y Redis es requerido para estados críticos.

La extensión se limita a publicar el cliente operativo. El backend privado concentra validación, autorización, límites y política de ejecución. También existe documentación operativa para despliegue, comandos, logs, backups y restore.

## Resultado

BeLeadAI combina producto, automatización y arquitectura backend. La parte visible parece una extensión simple, pero por debajo hay un sistema de jobs, contratos, versionado, distribución, límites y observabilidad.

El principal aprendizaje técnico fue diseñar una frontera clara entre un cliente distribuible y un backend privado: la extensión necesita ser fácil de instalar y actualizar, mientras que el backend debe controlar seguridad, estado, límites y ejecución de tareas sensibles.
