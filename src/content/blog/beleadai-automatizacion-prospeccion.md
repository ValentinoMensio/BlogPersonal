---
title: 'BeLeadAI: automatización de prospección con backend y extensión Chrome MV3'
description: 'Arquitectura de una plataforma de prospección para Instagram con FastAPI, MySQL, Redis, colas, WebSockets, contratos públicos y extensión Chrome MV3.'
pubDate: 'May 12 2026'
heroImage: '../../assets/BeLead/logoBeLead.png'
heroImageCompact: true
---

BeLeadAI es una plataforma para convertir Instagram en un canal de prospección comercial. Permite extraer audiencias desde cuentas objetivo, analizar perfiles, seleccionar destinatarios y enviar mensajes desde una extensión Chrome conectada a una API privada.

El sistema está dividido en dos piezas principales: un backend operativo para análisis, colas y control de ejecución, y una extensión Chrome MV3 que actúa como cliente instalado por el usuario.

## Casos de uso principales

BeLeadAI cubre un flujo completo de prospección, desde la configuración inicial hasta el seguimiento del envío:

- Configurar la extensión con `API Base URL` HTTPS y API key.
- Validar conexión contra la API privada con `GET /ext/v2/ping`.
- Detectar la cuenta autorizada desde la que se enviarán mensajes.
- Consultar límites de uso y cuotas disponibles por cliente.
- Extraer followings de una cuenta objetivo para crear una base inicial de leads.
- Encolar análisis de perfiles para clasificar prospectos por rubro, señales de actividad y potencial.
- Elegir profundidad de análisis: básico, profundo, todos los rubros o rubros específicos.
- Seleccionar destinatarios desde resultados previos o desde flujos completos de extracción y análisis.
- Filtrar candidatos pendientes y evitar duplicados o contactos ya enviados.
- Configurar prompts y mensajes manuales o asistidos por IA.
- Encolar campañas de envío desde la extensión instalada en el navegador.
- Mantener liveness del sender con heartbeat, pull de tareas, reporte de resultados y WebSocket.
- Monitorear jobs, progreso, resultados, errores y estado de entrega.
- Bloquear el cliente de forma guiada cuando la API exige actualización de versión (`CLIENT_UPDATE_REQUIRED`).
- Distribuir builds verificables de la extensión mediante GitHub Releases.

El enfoque de producto fue mantener una interfaz simple para el usuario, pero con una arquitectura suficientemente robusta para controlar estado, límites, versionado y comunicación con backend.

> Las capturas usan datos ficticios cargados únicamente para mostrar los casos de uso del sistema.

## Capturas del producto

### Configuración de API y límites

![Configuración de API y límites de uso de BeLeadAI](../../assets/BeLead/api_settings_and_usage_limits.png)

La extensión parte de una configuración explícita: URL HTTPS de la API privada, API key y prueba de conexión. Desde la misma experiencia el usuario puede revisar límites de uso, estado de cuenta y capacidad disponible antes de iniciar una campaña.

### Panel de análisis de leads

![Panel de análisis de leads de BeLeadAI](../../assets/BeLead/lead_analysis_dashboard.png)

El panel de análisis muestra resultados generados desde audiencias objetivo. La intención es transformar una extracción cruda de perfiles en una lista accionable, con estado, métricas y contexto suficiente para decidir a quién contactar.

### Profundidad de análisis

![Selector de profundidad de análisis en BeLeadAI](../../assets/BeLead/analysis_depth_selector.png)

El usuario puede ajustar el costo y la precisión del análisis. El modo básico prioriza velocidad; el modo profundo permite enriquecer la evaluación cuando se necesita más contexto o cuando el flujo apunta a rubros específicos.

### Selección de destinatarios

![Panel de selección de destinatarios en BeLeadAI](../../assets/BeLead/recipient_selection_panel.png)

Los destinatarios se seleccionan desde orígenes ya procesados. El backend mantiene proyecciones de candidatos pendientes, enviados y totales para evitar duplicados y permitir que la extensión trabaje con una lista limpia.

### Configuración avanzada de prompt

![Configuración avanzada de prompts en BeLeadAI](../../assets/BeLead/advanced_prompt_configuration.png)

El envío puede usar mensajes manuales o asistidos por IA. La configuración avanzada permite ajustar instrucciones, tono y contexto para personalizar el mensaje sin mover la lógica sensible al cliente distribuible.

### Estado de entrega de campaña

![Estado de entrega de campaña en BeLeadAI](../../assets/BeLead/campaign_delivery_status.png)

El seguimiento de campaña muestra estado de ejecución, progreso y resultados. El flujo de envío no se ejecuta como scraping server-side: la extensión mantiene el sender vivo, toma tareas y reporta resultados al backend.

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
- `POST /api/auth/login`, `POST /api/auth/token/refresh`, `POST /api/auth/logout`.
- `POST /ext/v2/followings/enqueue`.
- `POST /ext/v2/analyze/enqueue`.
- `POST /ext/v2/send/enqueue`.
- `GET /ext/v2/jobs`, `GET /ext/v2/results`, `GET /ext/v2/recipient-sources`.
- `GET /ext/v2/recipient-sources/{source_id}/recipients`.
- `POST /api/send/pull`, `POST /api/send/result`, `POST /api/send/heartbeat`.
- `GET /metrics` y `GET /metrics/summary` protegidos en producción.

El backend fue pensado como un sistema multi-tenant con JWT, API key, rate limiting y colas con afinidad dura por cuenta o `profile_id`. Esa afinidad evita mezclar trabajos entre cuentas y permite distribuir carga de forma controlada.

La base MySQL funciona como fuente de verdad operacional. Ahí viven clientes, planes, jobs, tasks, resultados, cuotas, idempotencia, deduplicación de destinatarios, flujos y proyecciones. Las migraciones Alembic endurecen el esquema con foreign keys, constraints, triggers y tablas específicas para cuotas y eventos.

## Colas y ejecución

Las tareas de scraping, análisis y envío se encolan desde endpoints externos. El dispatcher consume esas colas y ejecuta trabajo con workers asociados a cuentas. El transporte de colas puede ser local o SQS, según configuración.

Este diseño permite separar la recepción de requests de la ejecución real. También facilita aplicar límites, reintentos, observabilidad y control de estado sin bloquear el proceso HTTP.

El runtime asincrónico no es un consumer simple. El dispatcher escanea jobs pendientes, asegura tasks, enruta por cuenta, controla inflight, aplica cooldowns, reclama leases expirados, reinicia workers caídos, reconcilia cuotas y reconstruye proyecciones para que la extensión pueda leer resultados ya normalizados.

Flujo operativo resumido:

- La extensión llama un endpoint protegido y crea un job.
- El backend valida API key/JWT, cuenta autorizada, payload, cuotas e idempotencia.
- MySQL registra el job y sus tasks.
- El dispatcher toma jobs pendientes y los enruta por cuenta.
- Los workers con Selenium/Chrome ejecutan extracción o análisis cuando corresponde.
- Para `send_message`, el backend deja tareas listas y la extensión las toma con `pull` o WebSocket.
- La extensión reporta heartbeat y resultado de cada envío.
- El backend actualiza estado, cuotas, deduplicación y proyecciones.

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

La extensión exige API sobre HTTPS. Esto evita configurar por error un backend inseguro y simplifica permisos de Chrome para host permissions externos.

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
