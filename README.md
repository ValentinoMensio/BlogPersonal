# Astro Starter Kit: Blog

## Calendario de GitHub del portfolio

El hero consulta la **API GraphQL oficial de GitHub** una vez por build para
`ValentinoMensio`. Publica únicamente fecha, cantidad e intensidad de las
contribuciones de los últimos 12 meses (hasta el día de build, en UTC). Los meses,
el total y los niveles de intensidad provienen de esos datos; no hay una serie
de actividad de respaldo ni consultas desde el navegador.

### Configuración

Copiar `.env.example` a `.env` y configurar `GITHUB_CONTRIBUTIONS_TOKEN` sólo en
el entorno de build. `.env` está ignorado por Git. En el proveedor de hosting,
guardar el valor como secreto de build, **nunca** con prefijo `PUBLIC_`.

GitHub GraphQL requiere autenticación. Se puede crear un token personal en
GitHub → Settings → Developer settings → Personal access tokens. Para consultar
actividad pública, usar un token de permisos mínimos, sin acceso a repositorios
privados; un token fine-grained de lectura de información pública es suficiente.
Si se usa un token classic, no conceder `repo` sólo para este calendario.
Respetar las políticas de la organización y la expiración del token.

El recuento privado depende de la visibilidad que GitHub permita y de la opción
**Contribution settings → Private contributions** en el perfil. El calendario
puede incluir esos recuentos anónimos cuando GitHub los devuelve. No solicita
nombres de repositorios, commits, títulos ni detalles de actividad privada, y no
intenta eludir restricciones de visibilidad. Una cifra no garantiza que incluya
toda la actividad privada del usuario.

### Actualización y fallos

El sitio sigue siendo estático: los datos quedan fijados al ejecutar
`npm run build`. Para actualizarlos diariamente, configurar en la plataforma
de despliegue una reconstrucción programada diaria con ese secreto. No se agrega
un workflow de publicación porque este repositorio no define el proveedor ni el
mecanismo de despliegue. Hacer sólo un build en CI no actualiza el sitio público:
el proveedor debe publicar sus artefactos mediante su flujo habitual autorizado.

No hay sondeo, caché persistente ni reintentos automáticos: como máximo una
consulta por build, con timeout de 8 segundos. Si falta el token, hay un error
HTTP/GraphQL, se agota el tiempo o los datos están incompletos, el build continúa
y muestra un mensaje de indisponibilidad con enlace al perfil, sin cifras
ficticias ni un calendario vacío presentado como actividad real. Los logs no
incluyen credenciales ni respuestas de GitHub.

### Pruebas del calendario

Sin dependencias adicionales (Node 22.12 o posterior):

```sh
node --experimental-strip-types --test tests/github-contributions.test.ts
npm run build
```

Las pruebas usan respuestas sintéticas aisladas; esos datos no se incorporan al
sitio. Para validar datos reales, configurar el secreto de build y ejecutar el
build. Sin credenciales se puede comprobar el estado de indisponibilidad.

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
