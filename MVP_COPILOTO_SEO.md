# MVP mínimo: Copiloto SEO especializado

## Objetivo

Convertir Rankerize en una plataforma que no solo genere contenido, sino que ayude a un negocio a decidir qué crear, cómo organizarlo y cómo enlazarlo para ganar tráfico orgánico.

La propuesta no es un chat genérico. Es un sistema operativo SEO con un orquestador central y tres módulos iniciales:

1. Diagnóstico
2. Contenido
3. Interlinking

## Problema que resuelve

El usuario suele llegar con una intención vaga:

- “Quiero posicionar una tienda de colchones”
- “Quiero superar a mi competidor”
- “Quiero saber qué contenidos me faltan”

Hoy esa intención exige muchas herramientas separadas. El MVP debe reducir ese trabajo a una sola ruta:

`Conectar datos -> detectar oportunidades -> generar acciones -> publicar o entregar borradores`.

## Qué incluye el MVP

### 1. Diagnóstico

Entrada:

- Dominio
- Google Search Console
- WordPress o CMS
- País
- Competidores opcionales

Salida:

- Salud SEO general
- Canibalizaciones
- Keywords en distancia de ataque
- Páginas huérfanas o mal conectadas
- Prioridad de acciones

### 2. Contenido

Entrada:

- Keyword o intención
- Tipo de contenido
- CMS destino
- Objetivo SEO

Salida:

- Brief estructurado
- Título sugerido
- H1, H2 y H3
- FAQs
- Schema básico
- Borrador listo para publicar

### 3. Interlinking

Entrada:

- Lista de URLs
- Tema principal
- Páginas objetivo

Salida:

- Sugerencias de enlaces internos
- Motivo del enlace
- Anchors sugeridos
- Prioridad por impacto

## Qué no entra en el MVP

Para no dispersar el producto, dejamos fuera por ahora:

- Ads
- Tendencias sociales
- Automatizaciones avanzadas
- Reportes complejos multi-canal
- Programmatic SEO a gran escala
- Múltiples agentes muy especializados
- Billing complejo

## Experiencia ideal del usuario

### Flujo 1: “Quiero saber qué mejorar”

1. Entra al dashboard.
2. Conecta Search Console y WordPress.
3. El sistema calcula salud SEO.
4. Devuelve 3 a 5 oportunidades más importantes.
5. El usuario entra a una oportunidad y puede crear un borrador.

### Flujo 2: “Quiero crear contenido”

1. Escribe una intención de búsqueda.
2. El sistema propone brief.
3. El sistema genera el contenido.
4. El usuario revisa y publica.

### Flujo 3: “Quiero enlazar mejor”

1. El usuario selecciona una categoría o cluster.
2. El sistema detecta páginas relacionadas.
3. Propone enlaces, anchors y prioridad.
4. El usuario aplica cambios.

## Arquitectura funcional mínima

### Frontend

- Landing pública
- Login
- Dashboard principal
- Vista de diagnóstico
- Vista de creación de contenido
- Vista de interlinking

### Backend

- Sesión de usuario
- Proyectos por dominio
- Integración con GSC
- Integración con WordPress
- Persistencia de historial

### IA

- Generación de briefs
- Generación de contenido
- Clasificación de oportunidades
- Recomendaciones de interlinking

## Pantallas mínimas

### Landing

Debe explicar:

- Qué hace la plataforma
- Para quién es
- Qué módulos resuelve
- Qué la diferencia de Lovable o un chat genérico

### Onboarding

Debe pedir:

- Dominio
- Search Console
- WordPress
- País

### Dashboard

Debe mostrar:

- Salud del sitio
- Oportunidades prioritarias
- Acciones rápidas
- Estado de integraciones

### Diagnóstico

Debe mostrar:

- Canibalizaciones
- Oportunidades de quick wins
- Páginas sin categorías o sin enlaces

### Contenido

Debe mostrar:

- Generador de brief
- Editor de borrador
- Botón de publicación

### Interlinking

Debe mostrar:

- Tabla de oportunidades
- Fuente
- Destino
- Anchor sugerido
- Impacto estimado

## Datos mínimos que necesitamos

- `projectId`
- `domain`
- `gscSiteUrl`
- `wpUrl`
- `country`
- `primaryKeyword`
- `opportunities`
- `contentDrafts`
- `internalLinks`
- `history`

## Orden recomendado de implementación

### Fase 1

- Landing nueva
- Onboarding simple
- Proyecto por dominio
- Dashboard básico

### Fase 2

- Diagnóstico SEO con GSC
- Lista priorizada de oportunidades
- Historial de acciones

### Fase 3

- Generador de contenido
- Editor y publicación en WordPress

### Fase 4

- Interlinking asistido por IA
- Sugerencias por cluster

## Criterio de éxito del MVP

El MVP funciona bien si un usuario puede:

1. Crear un proyecto
2. Conectar sus datos
3. Ver qué debe mejorar
4. Generar un contenido
5. Detectar enlaces internos sugeridos

Si hace eso, ya no es una demo de IA. Ya es un copiloto SEO útil.
