// Fuente única del contenido de perfil y proyectos que usan Inicio, Proyectos y Sobre mí.
// Las cifras se relevaron de los repositorios el 2026-11-25; actualizarlas aquí.
import type { ImageMetadata } from 'astro';
import GestionShot from '../assets/Gestion/pos-venta.webp';
import GranaliaShot from '../assets/Granalia/panel_gestion.png';

export const ROLE_TITLE = 'Desarrollador Full Stack · Backend';
export const LOCATION = 'Córdoba, Argentina';
export const AVAILABILITY = 'Abierto a oportunidades Full Stack / Backend · remoto o híbrido';

export const QUICK_FACTS = [
	{ label: 'Rol', value: 'Full Stack con foco en backend y arquitectura' },
	{ label: 'Formación', value: 'Analista en Computación (FAMAF · UNC) · Licenciatura en curso' },
	{ label: 'Experiencia', value: '2 sistemas propios en producción para clientes reales, 1 producto SaaS y proyectos en equipo con Scrum' },
	{ label: 'Stack principal', value: 'Python, FastAPI, PostgreSQL, React, TypeScript, Docker' },
	{ label: 'Ubicación', value: 'Córdoba, Argentina · remoto o híbrido' },
	{ label: 'Idiomas', value: 'Español nativo · Inglés básico (en formación)' },
];

export const HIGHLIGHTS = [
	{ value: '2', label: 'sistemas en producción', detail: 'usados a diario por clientes reales' },
	{ value: '19', label: 'módulos de dominio', detail: 'en el monolito modular de Gestión' },
	{ value: '3.000+', label: 'tests automatizados', detail: 'unitarios, integración, contratos y E2E' },
	{ value: 'ARCA', label: 'facturación fiscal', detail: 'Factura A y notas de crédito con CAE en producción' },
];

export type Project = {
	slug: string;
	name: string;
	tagline: string;
	period: string;
	status: 'production' | 'product' | 'academic';
	statusLabel: string;
	role: string;
	context: string;
	problem: string;
	solution: string[];
	impact: string[];
	metrics?: { value: string; label: string }[];
	stack: string[];
	caseUrl: string;
	featured?: boolean;
	image?: { src: ImageMetadata; alt: string };
};

export const PROJECTS: Project[] = [
	{
		slug: 'gestion',
		name: 'Gestión',
		tagline: 'Producto de gestión comercial modular, en producción desde noviembre de 2026.',
		period: 'Julio 2026 – actualidad',
		status: 'production',
		statusLabel: 'En producción · v0.10.0',
		role: 'Desarrollador Full Stack · Arquitectura backend',
		context: 'Producto propio. Repositorio privado.',
		problem:
			'Las pymes suelen combinar planillas, un sistema de caja y otro de facturación que no conversan entre sí. Gestión busca una base única y reutilizable para ventas, stock, caja, facturación y finanzas, que se adapte a cada negocio sin mantener un fork por cliente.',
		solution: [
			'Diseñé el backend como monolito modular con 19 módulos de dominio (ventas, inventario, POS, facturación, fiscal, cuentas corrientes, tesorería, consignación, etc.) que colaboran sólo mediante contratos públicos, verificados con pruebas de arquitectura.',
			'Resolví reintentos y fallos parciales con idempotencia persistente, transacciones acotadas, outbox con worker y un checkout POS reanudable que no duplica cobros ante una respuesta perdida.',
			'Contrato OpenAPI con cliente TypeScript generado; CI con lint, tipado, tests unitarios, de integración contra PostgreSQL real, de contratos y E2E con Playwright.',
			'Despliegue por cliente: imágenes versionadas, un perfil YAML que habilita módulos, scripts de actualización con backup previo y restore, y publicación detrás de Cloudflare Tunnel.',
		],
		impact: [
			'Primera instalación productiva: un showroom de indumentaria infantil que vende en consignación, con POS, etiquetas con código de barras, escaneo por cámara o lectora, catálogo con imágenes y liquidaciones a consignantes.',
			'Llevé el producto de la primera línea de código a producción en cuatro meses, con 14 versiones publicadas y entregas iterativas a partir del uso real.',
		],
		metrics: [
			{ value: '19', label: 'módulos' },
			{ value: '3.000+', label: 'tests' },
			{ value: '190+', label: 'pull requests' },
			{ value: '177', label: 'migraciones' },
		],
		stack: ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'Alembic', 'React', 'TypeScript', 'TanStack Query', 'OpenAPI', 'Docker', 'MinIO', 'Pytest', 'Playwright'],
		caseUrl: '/blog/gestion-arquitectura-modular/',
		featured: true,
		image: { src: GestionShot, alt: 'Venta en el mostrador de Gestión v0.10.0 con datos ficticios' },
	},
	{
		slug: 'granalia',
		name: 'Granalia',
		tagline: 'Gestión comercial y facturación electrónica para una fábrica de alimentos.',
		period: 'Abril 2026 – actualidad',
		status: 'production',
		statusLabel: 'En producción',
		role: 'Desarrollador Full Stack',
		context: 'Cliente real. Desarrollo, despliegue y soporte de punta a punta.',
		problem:
			'La empresa cargaba pedidos, listas de precios y facturas en planillas y herramientas separadas, con riesgo de errores de transcripción y sin una visión de costos ni rentabilidad.',
		solution: [
			'Sistema web con roles que centraliza clientes, proveedores, productos, listas de precios, remitos, compras de materia prima, stock y costos de envases.',
			'Integración fiscal con ARCA (WSAA + WSFEv1): Factura A y notas de crédito con CAE, recuperación segura ante timeouts para no duplicar numeración, y auditoría de requests sin secretos.',
			'Estadísticas para la dirección: rankings, costo de reposición, rentabilidad por producto con costos auditados y mapa de presencia comercial con geocodificación cacheada.',
		],
		impact: [
			'Reemplazó planillas y procesos manuales por una herramienta que la empresa usa a diario desde abril de 2026.',
			'Emisión fiscal legal desde el mismo sistema, con documentos autorizados bloqueados y snapshots históricos para auditoría.',
		],
		metrics: [
			{ value: '720+', label: 'commits' },
			{ value: 'Factura A', label: 'con CAE' },
			{ value: '2', label: 'roles' },
		],
		stack: ['FastAPI', 'React', 'PostgreSQL', 'Alembic', 'ARCA WSFEv1', 'ReportLab', 'MapLibre', 'Docker', 'Caddy'],
		caseUrl: '/blog/granalia-sistema-facturacion/',
		featured: true,
		image: { src: GranaliaShot, alt: 'Panel de gestión de Granalia con datos ficticios' },
	},
	{
		slug: 'beleadai',
		name: 'BeLeadAI',
		tagline: 'Plataforma de prospección comercial con extensión Chrome y backend propio.',
		period: 'Noviembre 2025 – marzo 2026',
		status: 'product',
		statusLabel: 'Producto SaaS',
		role: 'Desarrollador Full Stack & Automatización',
		context: 'Producto propio.',
		problem:
			'Prospectar clientes en Instagram de forma manual es lento y difícil de medir: buscar audiencias, analizar perfiles y enviar mensajes sin perder el control de límites y resultados.',
		solution: [
			'Backend FastAPI con jobs, colas en Redis, cuotas por cliente y actualizaciones de estado por WebSockets.',
			'Extensión Chrome MV3 conectada a una API privada con API key, para extraer audiencias, analizar perfiles y encolar campañas.',
			'Mensajes asistidos con OpenAI y distribución de versiones de la extensión con GitHub Releases.',
		],
		impact: [
			'Convirtió un proceso manual de prospección en un flujo guiado con seguimiento de progreso, errores y límites.',
		],
		stack: ['FastAPI', 'MySQL', 'Redis', 'WebSockets', 'Selenium', 'Chrome MV3', 'OpenAI API', 'GitHub Releases'],
		caseUrl: '/blog/beleadai-automatizacion-prospeccion/',
	},
	{
		slug: 'el-switcher',
		name: 'El Switcher',
		tagline: 'Juego de mesa multijugador en tiempo real, desarrollado en equipo con Scrum.',
		period: 'Septiembre – octubre 2024',
		status: 'academic',
		statusLabel: 'Proyecto en equipo · FAMAF',
		role: 'Desarrollador Backend · Scrum Master (Sprint 2)',
		context: 'Ingeniería de Software, FAMAF-UNC. Simulación de un entorno profesional con cliente, sprints y revisiones.',
		problem:
			'Construir en equipo y en tres sprints una aplicación web multijugador con partidas sincronizadas en tiempo real.',
		solution: [
			'Implementé reglas de juego, gestión de partidas, validaciones y eventos por WebSockets en el backend.',
			'Lideré el Sprint 2 como Scrum Master: planificación, dailies, seguimiento en Jira y revisión.',
		],
		impact: ['Tres sprints en unos dos meses, con demo y revisión al cierre de cada uno.', '95% de cobertura de tests en backend y más del 83% en frontend.'],
		stack: ['FastAPI', 'WebSockets', 'React', 'Pytest', 'Vitest', 'Scrum', 'Jira'],
		caseUrl: '/blog/el-switcher-backend-scrum/',
	},
];

export const EXPERIENCE = [
	{
		period: 'Jul 2026 – actualidad',
		title: 'Gestión — producto propio',
		role: 'Full Stack · Arquitectura backend',
		summary:
			'Diseño y desarrollo de un producto de gestión comercial modular. En producción desde noviembre de 2026 en un comercio minorista.',
	},
	{
		period: 'Abr 2026 – actualidad',
		title: 'Granalia — cliente',
		role: 'Full Stack · cliente',
		summary:
			'Sistema de gestión y facturación electrónica con ARCA para una fábrica de alimentos. Desarrollo, despliegue, soporte y evolución continua.',
	},
	{
		period: 'Nov 2025 – Mar 2026',
		title: 'BeLeadAI — producto propio',
		role: 'Full Stack & Automatización',
		summary: 'Plataforma de prospección con backend, colas, WebSockets y extensión Chrome MV3.',
	},
	{
		period: 'Sep – Oct 2024',
		title: 'El Switcher — FAMAF',
		role: 'Backend · Scrum Master',
		summary: 'Aplicación multijugador en tiempo real desarrollada en equipo con Scrum y Jira; 95% de cobertura en backend.',
	},
];

export const WORK_PRINCIPLES = [
	{
		title: 'Del problema al deploy',
		text: 'Me ocupo del ciclo completo: entender el proceso del negocio, modelar el dominio, construir la API y la interfaz, desplegar y dar soporte.',
	},
	{
		title: 'Calidad verificable',
		text: 'Trabajo con issues, ramas y pull requests, CI con lint, tipado y tests, y documentación de decisiones. Separo lo implementado de lo validado.',
	},
	{
		title: 'Sistemas que no pierden datos',
		text: 'Idempotencia, transacciones, snapshots históricos y migraciones versionadas: un reintento o un cambio de precio no deben romper el pasado.',
	},
	{
		title: 'Comunicación con usuarios',
		text: 'Trabajo directo con quienes usan el sistema: relevo procesos, priorizo con ellos y entrego en iteraciones cortas.',
	},
];
