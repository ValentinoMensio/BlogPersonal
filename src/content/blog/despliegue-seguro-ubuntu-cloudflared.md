---
title: 'Despliegue seguro con Ubuntu Server, Docker y Cloudflared'
description: 'Cómo desplegué proyectos web en un servidor propio usando Ubuntu Server, Docker Compose, Caddy y Cloudflared, evitando exponer puertos y servicios internos.'
pubDate: 'May 14 2026'
heroImage: '../../assets/blog-placeholder-4.jpg'
---

En los proyectos Granalia y BeLeadAI usé una estrategia de despliegue pensada para reducir superficie de ataque: ejecutar los servicios en Ubuntu Server con Docker Compose y publicar la aplicación mediante Cloudflared, sin abrir directamente los puertos web del servidor a Internet.

La idea central fue separar dos responsabilidades:

- El servidor ejecuta la aplicación, la base de datos, workers y servicios internos.
- Cloudflare expone el dominio público, termina HTTPS y enruta tráfico hacia el servidor mediante un túnel saliente.

## Problema

El despliegue tradicional suele abrir puertos como `80` y `443` en el servidor, configurar un reverse proxy público y exponerlo directamente a Internet. Ese modelo funciona, pero aumenta la superficie visible: cualquier escaneo puede detectar el host, probar rutas, intentar fingerprints del servidor o atacar servicios mal configurados.

Para estos proyectos preferí otro enfoque: que el servidor no acepte conexiones web entrantes. En lugar de abrir puertos públicos, el servidor inicia una conexión saliente hacia Cloudflare mediante `cloudflared`. Desde afuera, el usuario accede por HTTPS al dominio; internamente, Cloudflare entrega el tráfico al origen privado por el túnel.

## Topología general

La arquitectura queda dividida así:

- Ubuntu Server como host base.
- Docker Compose para levantar servicios de forma reproducible.
- Caddy como origen interno y reverse proxy local cuando el proyecto lo necesita.
- FastAPI como API backend.
- PostgreSQL o MySQL como base de datos, sin exposición pública.
- Redis para estado operativo, colas o rate limiting cuando corresponde.
- Cloudflared como túnel saliente hacia Cloudflare.

El punto importante es que los servicios sensibles no se publican en `0.0.0.0`. Cuando un puerto necesita existir en el host, se liga a `127.0.0.1`, por ejemplo:

```text
127.0.0.1:8088 -> Caddy / Web interno
127.0.0.1:8000 -> API interna
127.0.0.1:5433 -> PostgreSQL para administración local o túnel SSH
```

Eso significa que el servicio está disponible para el propio servidor, pero no queda abierto como puerto público de red.

## Cloudflared

Cloudflared permite crear un túnel entre el servidor y Cloudflare. El servidor ejecuta un agente que mantiene una conexión saliente autenticada. Cloudflare recibe el tráfico HTTPS del dominio y lo envía por ese túnel al servicio local configurado.

Ejemplo conceptual:

```text
Usuario -> HTTPS -> Cloudflare -> Cloudflared tunnel -> 127.0.0.1:8088
```

La ventaja es que el firewall del servidor puede permanecer cerrado para tráfico web entrante. No hace falta publicar `80`, `443`, la base de datos ni Redis. Cloudflare se convierte en la frontera pública y el servidor queda como origen privado.

## Granalia

Granalia usa Docker Compose con PostgreSQL, FastAPI y Caddy. Caddy sirve el frontend estático y enruta las rutas de API hacia FastAPI.

En este caso, Caddy puede escuchar solo en localhost y Cloudflared publica el sitio hacia el dominio. PostgreSQL también queda publicado solo en localhost para tareas administrativas mediante túnel SSH, no como servicio accesible desde Internet.

Decisiones relevantes:

- Caddy como origen web interno.
- PostgreSQL con volumen persistente y acceso local.
- API detrás de Caddy, no expuesta directamente.
- Cookies seguras, CSRF y roles de usuario.
- Backups de base de datos y documentación de restauración.

## BeLeadAI

BeLeadAI tiene una topología más compleja porque no es solo una API. El runtime productivo separa API, MySQL, Redis, migraciones, dispatchers y Cloudflared.

Servicios principales:

- `app`: API FastAPI servida con Gunicorn/Uvicorn.
- `db`: MySQL con volumen persistente.
- `redis`: estado crítico, rate limiting y coordinación operativa.
- `db-migrate`: migraciones Alembic antes de iniciar los servicios principales.
- `dispatcher-scheduler`: ejecución de jobs por cuenta.
- `dispatcher-maintenance`: mantenimiento y recuperación.
- `dispatcher-projections`: reconstrucción de proyecciones para resultados y destinatarios.
- `cloudflared`: túnel saliente para publicar la API.

Este despliegue es especialmente útil para una extensión Chrome MV3. La extensión exige una API sobre HTTPS, pero el backend no necesita escuchar directamente en Internet. Cloudflare entrega HTTPS al cliente y enruta internamente hacia la API por túnel.

## Seguridad

El objetivo no fue solo “hacer deploy”, sino controlar qué queda expuesto.

Medidas aplicadas:

- No publicar bases de datos a Internet.
- No publicar Redis a Internet.
- Evitar abrir puertos web públicos en el host cuando Cloudflared puede actuar como entrada.
- Usar red Docker para comunicación interna entre servicios.
- Mantener secretos en variables de entorno o archivos fuera del código fuente.
- Proteger métricas y endpoints operativos.
- Usar HTTPS desde Cloudflare hacia el usuario final.
- Confiar en headers de proxy solo cuando el tráfico pasa por Cloudflare.
- Mantener backups y procedimientos de restauración.

Este enfoque reduce el impacto de errores comunes. Si una base de datos está mal configurada, no debería estar accesible desde Internet. Si una API interna existe, no debería poder alcanzarse saltando Cloudflare. Si hay métricas o health checks, no deberían quedar publicados sin control.

## Puertos

La diferencia práctica está en cómo se publican los puertos.

Evité este patrón para servicios sensibles:

```text
0.0.0.0:5432 -> PostgreSQL
0.0.0.0:6379 -> Redis
0.0.0.0:8000 -> API
```

Y prioricé este:

```text
127.0.0.1:5433 -> PostgreSQL
127.0.0.1:8000 -> API
127.0.0.1:8088 -> Caddy
Cloudflared -> origen local
```

Con esto, el servicio puede operar localmente, Docker puede conectarse por red interna y Cloudflared puede publicar lo necesario sin convertir cada componente en un servicio público.

## Operación

El despliegue también necesita operación básica:

- Health checks para saber si API, base de datos y workers están vivos.
- Logs persistentes para diagnosticar errores.
- Límites de CPU y memoria en contenedores cuando hay procesos pesados como Chrome/Selenium.
- Migraciones ejecutadas antes de arrancar servicios dependientes.
- Volúmenes separados para datos, logs, perfiles de navegador y archivos operativos.
- Backups automatizables y restore documentado.

En BeLeadAI, esto fue clave porque Selenium/Chrome puede consumir recursos y los workers necesitan aislamiento. En Granalia, lo más importante fue proteger la base de datos y mantener una operación simple para un sistema de gestión real.

## Resultado

El resultado fue una forma de despliegue más segura y mantenible para proyectos propios: Ubuntu Server como base, Docker Compose como runtime reproducible, Cloudflare como frontera pública y servicios internos no expuestos directamente.

La lección principal fue que desplegar no es solo levantar contenedores. También es decidir qué no se publica, qué queda detrás de un túnel, cómo se guardan los secretos, cómo se restauran datos y cómo se limita el daño si algo falla.
