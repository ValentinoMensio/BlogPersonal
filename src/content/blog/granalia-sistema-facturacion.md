---
title: 'Granalia: sistema de facturacion y gestion operativa'
description: 'Notas sobre el diseno de una aplicacion web usada para gestionar clientes, productos, listas de precios y facturas PDF.'
pubDate: 'May 13 2026'
heroImage: '../../assets/blog-placeholder-1.jpg'
---

Granalia es una aplicacion web para gestionar pedidos, clientes, transportes, productos, listas de precios y facturas de una fabrica.

El sistema combina una API FastAPI, una web React/Vite y una base PostgreSQL. La informacion operativa se persiste en base de datos y los comprobantes PDF se generan desde la API.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, ReportLab y pypdf.
- Frontend: React 18, React Router, Vite y Tailwind CSS.
- Despliegue: Docker Compose y Caddy.

## Funcionalidades principales

- Inicio de sesion con cookie HTTP-only, token CSRF y roles `admin` / `operator`.
- Creacion, edicion, descarga y eliminacion de facturas.
- Generacion de facturas PDF.
- Historial de facturas con estadisticas para administradores.
- Gestion de clientes, productos, presentaciones y transportes.
- Carga de listas de precios PDF y actualizacion del catalogo activo.
- Reglas de bonificacion automaticas por cliente.
- Healthchecks y logging estructurado para operacion.

El objetivo principal fue construir una herramienta mantenible, segura y simple de operar para un flujo administrativo real.
