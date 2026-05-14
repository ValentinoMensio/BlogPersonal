---
title: 'BeLeadAI: automatizacion de prospeccion con backend y extension Chrome MV3'
description: 'Arquitectura de una plataforma de prospeccion para Instagram con FastAPI, MySQL, Redis, colas, WebSockets, contratos publicos y extension Chrome MV3.'
pubDate: 'May 12 2026'
heroImage: '../../assets/blog-placeholder-2.jpg'
---

BeLeadAI es una plataforma para convertir Instagram en un canal de prospeccion comercial. Permite extraer audiencias desde cuentas objetivo, analizar perfiles, seleccionar destinatarios y enviar mensajes desde una extension Chrome conectada a una API privada.

El sistema esta dividido en dos piezas principales: un backend operativo para analisis, colas y control de ejecucion, y una extension Chrome MV3 que actua como cliente instalado por el usuario.

## Producto

Desde la extension, el usuario puede:

- Extraer followings de una cuenta objetivo para generar leads.
- Analizar perfiles y detectar prospectos con mayor potencial.
- Filtrar destinatarios desde resultados previos.
- Enviar mensajes directos desde su cuenta de Instagram.
- Usar mensajes manuales o asistidos por IA.
- Monitorear jobs, progreso, resultados y limites en tiempo real.

El enfoque de producto fue mantener una interfaz simple para el usuario, pero con una arquitectura suficientemente robusta para controlar estado, limites, versionado y comunicacion con backend.

## Backend

El backend esta construido con Python 3.11+, FastAPI, MySQL 8 y Redis. Redis se usa para estado critico de autenticacion y rate limiting. La arquitectura operativa separa la API HTTP del dispatcher de jobs.

En Docker, la topologia queda dividida en:

- `app`: API FastAPI servida con Gunicorn y UvicornWorker.
- `dispatcher`: scheduler y workers por cuenta.
- `db`: MySQL.
- `redis`: estado critico y rate limiting.
- `db-migrate`: migraciones.

Endpoints principales:

- `GET /health`, `GET /ready`, `GET /live`.
- `POST /ext/v2/followings/enqueue`.
- `POST /ext/v2/analyze/enqueue`.
- `POST /ext/v2/send/enqueue`.
- `GET /metrics` y `GET /metrics/summary` protegidos en produccion.

El backend fue pensado como un sistema multi-tenant con JWT, API key, rate limiting y colas con afinidad dura por cuenta o `profile_id`. Esa afinidad evita mezclar trabajos entre cuentas y permite distribuir carga de forma controlada.

## Colas y ejecucion

Las tareas de scraping, analisis y envio se encolan desde endpoints externos. El dispatcher consume esas colas y ejecuta trabajo con workers asociados a cuentas. El transporte de colas puede ser local o SQS, segun configuracion.

Este diseno permite separar la recepcion de requests de la ejecucion real. Tambien facilita aplicar limites, reintentos, observabilidad y control de estado sin bloquear el proceso HTTP.

## Extension Chrome MV3

La extension se distribuye como `BeLeadAI Enqueuer`, version `0.4.0`, con Manifest V3. Usa service worker, content scripts y una pagina de opciones.

Permisos relevantes:

- `storage` para persistir configuracion.
- `alarms` para tareas programadas.
- `tabs` y `cookies` para integracion con navegador.
- `notifications` para feedback operativo.
- `host_permissions` sobre `instagram.com`.

El content script se carga en Instagram y esta modularizado en selectores, observers, acciones de input, identidad de cuenta, busqueda directa, acciones de mensajes y mensajeria interna.

La configuracion inicial se guarda en `chrome.storage`: API Base URL, API key y datos necesarios para conectar contra la API privada. La extension tambien contempla bloqueo guiado cuando la API exige actualizacion del cliente mediante codigos como `CLIENT_UPDATE_REQUIRED`.

## Contratos publicos

Para reducir acoplamiento entre extension y backend, el repositorio publica contratos frontend-visibles. Estos contratos documentan los request/response minimos que la extension necesita consumir.

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

El objetivo no fue exponer toda la implementacion interna, sino publicar el subconjunto estable que necesita el cliente.

## Distribucion y calidad

La extension se prepara para distribuir por GitHub Releases. Cada release publica:

- `extension-vX.Y.Z.zip`.
- `extension-vX.Y.Z.sha256`.
- `RELEASE_NOTES.md`.

El flujo de mantenimiento incluye lint, format check, tests con `node --test`, validacion de contratos, smoke de contratos y empaquetado de release.

Scripts relevantes:

- `npm run lint`.
- `npm run format:check`.
- `npm run test`.
- `npm run check:contract`.
- `npm run pack:release`.

## Seguridad y operacion

El backend depende de configuracion por entorno para base de datos, secretos, Redis, CORS, HTTPS, concurrencia, transporte de colas y metricas. En produccion, las metricas se protegen con bearer token y Redis es requerido para estados criticos.

La extension se limita a publicar el cliente operativo. El backend privado concentra validacion, autorizacion, limites y politica de ejecucion. Tambien existe documentacion operativa para despliegue, comandos, logs, backups y restore.

## Resultado

BeLeadAI combina producto, automatizacion y arquitectura backend. La parte visible parece una extension simple, pero por debajo hay un sistema de jobs, contratos, versionado, distribucion, limites y observabilidad.

El principal aprendizaje tecnico fue disenar una frontera clara entre un cliente distribuible y un backend privado: la extension necesita ser facil de instalar y actualizar, mientras que el backend debe controlar seguridad, estado, limites y ejecucion de tareas sensibles.
