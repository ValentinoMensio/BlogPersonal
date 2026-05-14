---
title: 'El Switcher: backend, WebSockets, arquitectura y Scrum'
description: 'Experiencia tecnica desarrollando una plataforma web multijugador con FastAPI, WebSockets, React, testing, arquitectura hexagonal y liderazgo Scrum.'
pubDate: 'May 11 2026'
heroImage: '../../assets/blog-placeholder-3.jpg'
---

El Switcher fue una plataforma web interactiva para jugar online a un juego de mesa. El proyecto se desarrollo durante Ingenieria de Software en FAMAF, en un contexto academico que simulaba un entorno profesional con cliente, sprints, entregas, testing, revisiones y roles Scrum.

Mi participacion combino dos responsabilidades: desarrollador backend y Scrum Master durante el Sprint 2.

## Contexto del proyecto

El objetivo era replicar la experiencia del juego fisico en una aplicacion web multijugador. El sistema debia implementar reglas de juego, partidas, jugadores, cartas, turnos, tablero, validaciones y comunicacion en tiempo real.

El equipo trabajo durante tres sprints, aproximadamente dos meses, con entregas al final de cada sprint. Cada entrega incluia demostracion, analisis de cobertura y revision con docentes/clientes responsables de los requerimientos.

Stack principal:

- Backend: FastAPI, Python, WebSockets y SQLite.
- Frontend: React y JavaScript/TypeScript.
- Testing: Pytest y Vitest.
- Gestion: Jira y Scrum.

## Mi rol como Scrum Master

Durante el Sprint 2 facilite reuniones agiles, planning poker, dailies, seguimiento de bloqueos y definicion de tickets. El foco fue mejorar el flujo de trabajo, reducir ambiguedad y mantener criterios de aceptacion claros.

Las tareas de Scrum Master incluyeron:

- Facilitar dailies y planning.
- Crear y priorizar tickets en Jira.
- Definir criterios de aceptacion.
- Dar seguimiento al progreso del sprint.
- Detectar bloqueos y coordinar resolucion.
- Mantener alineado el trabajo tecnico con los objetivos del sprint.

Un punto importante fue que el flujo de tickets se mantuvo corto: cuando una tarea pasaba a `To Do`, avanzaba rapidamente a revision. Esto fue posible por la claridad de tickets y por acordar la API antes de implementar.

## Contribucion backend

Como desarrollador backend trabaje en funcionalidades centrales del juego y en organizacion del repositorio.

Tickets propios:

- Organizacion de la arquitectura del backend.
- Funcionalidad para abandonar partidas no iniciadas.
- Logica para iniciar una partida.
- Sanitizacion y normalizacion de codigo.
- Busqueda y validacion de figuras resaltadas en el tablero.
- Manejo del color prohibido del juego.

Trabajo en pair programming:

- Creacion de jugador.
- Creacion de partida.
- Logica para jugar una carta de figura.

Bugfixes:

- Cambio de color prohibido al bloquear una figura.
- Correccion de errores en cartas de figura.
- Resolucion de conflictos de merge.
- Ajustes en valores esperados para endpoints de usuarios.

## Arquitectura

El backend se organizo con un enfoque de arquitectura hexagonal y vertical slicing. La intencion fue separar reglas de negocio, transporte HTTP/WebSocket, persistencia y casos de uso.

Este enfoque ayudo a que las funcionalidades de juego no quedaran acopladas a detalles de FastAPI o SQLite. Tambien facilito probar modulos por comportamiento y mantener el codigo legible a medida que crecia el numero de reglas.

Vertical slicing fue util porque cada funcionalidad se podia trabajar como una unidad: endpoint o evento, validacion, caso de uso, persistencia y tests asociados.

## WebSockets y experiencia multijugador

El caracter multijugador requeria sincronizar estado entre clientes. FastAPI y WebSockets permitieron comunicar cambios de partidas y acciones relevantes en tiempo real.

El desafio no era solo abrir una conexion, sino mantener reglas consistentes: que una partida se pueda iniciar bajo condiciones validas, que un jugador no realice acciones fuera de turno, que las cartas respeten reglas del tablero y que las acciones invalidas sean rechazadas de forma clara.

## Testing

El proyecto uso Pytest en backend y Vitest en frontend. En backend implemente pruebas unitarias e integracion con tecnica de clases de equivalencia para cubrir comportamientos validos e invalidos.

Resultados destacados del proyecto:

- Frontend: 30 archivos de prueba.
- Frontend: 254 pruebas.
- Frontend: 83.77% de cobertura en declaraciones y lineas.
- Frontend: 87.87% de cobertura en ramas.
- Frontend: 96.42% de cobertura en funciones.
- Backend: 142 pruebas.
- Backend: 3992 lineas analizadas.
- Backend: 95% de cobertura global.

Durante el Sprint 1 hubo deuda tecnica por mockear completamente la API. En el Sprint 2 ajustamos la estrategia hacia mockeo directo de base de datos para obtener pruebas mas precisas y cercanas a las necesidades reales del sistema.

## Proceso de desarrollo

El proceso fue incremental. En funcionalidades con requerimientos poco claros o decisiones de base de datos, usamos pair programming para reducir incertidumbre y mejorar la calidad de las decisiones.

Tambien trabajamos con revision de codigo antes de completar tickets. Esto ayudo a resolver conflictos de merge, detectar errores de reglas y mantener consistencia en el backend.

## Resultado

El Switcher fue valioso porque combino desarrollo tecnico real con coordinacion de equipo. Me permitio practicar backend con reglas de dominio, WebSockets, testing, arquitectura y liderazgo agil en un mismo proyecto.

La principal conclusion tecnica fue que, incluso en un proyecto academico, la claridad de tickets, la definicion temprana de API, una arquitectura separada y una buena estrategia de pruebas tienen impacto directo en la velocidad y calidad del equipo.
