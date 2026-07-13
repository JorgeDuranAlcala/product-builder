# Products Config API

Sistema de configuración de productos para aseguradoras — API REST con NestJS, Prisma y PostgreSQL. Replica el flujo SISIP (minuta 06/07/2026).

## Flujo SISIP

1. **Ramo** — Catálogo maestro (ramos, coberturas, tarifas)
2. **Ramo Interno** — Contadores y máscaras de documentos
3. **Cobertura Interna** — Reglas de tratamiento
4. **Tarifa Interna** — Reglas de cálculo
5. **Maestro Reaseguro** — Homologación y reaseguro
6. **Carga de Planes** — Producto final comercial

## Requisitos

- Node.js 20+
- Docker (PostgreSQL 16)

## Inicio rápido

```bash
# Base de datos (Docker)
docker compose up -d

# O crear DB manualmente en PostgreSQL local
psql -U postgres -f scripts/create-db.sql

# Dependencias (redes corporativas con SSL interceptado)
NODE_OPTIONS="--use-system-ca" npm install

# Migraciones y seed
npx prisma migrate deploy
npm run prisma:seed

# Desarrollo
npm run start:dev
```

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

## Autenticación (mutaciones)

Todas las operaciones de escritura requieren el header:

```
X-User-Id: <user_id>
```

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/branches/wizard` | Crear ramo con coberturas y tarifas |
| POST | `/internal-branches/:id/setup` | Configurar contadores y máscaras |
| POST | `/internal-coverages/with-tariff` | Cobertura + tarifa interna |
| POST | `/coverage-master` | Reaseguro y homologación |
| POST | `/products/wizard` | Crear plan completo |
| GET | `/products/:id/full-config` | Configuración completa |
| GET | `/products/:id/emit-preview` | Validar emisibilidad |
| POST | `/products/:id/assign-producers` | Asignar productores |
| POST | `/products/:id/certify` | Certificación QA/Producción |
| GET | `/audit/products/:productId` | Historial de auditoría |

## Tests

```bash
# Unit tests (sin base de datos)
npm run test:unit

# E2E (requiere PostgreSQL configurado en .env)
npm run test:e2e
```

## Estructura

```
src/
├── branches/           # Paso 1 — Catálogo maestro
├── internal-branches/  # Paso 2
├── internal-coverages/ # Paso 3
├── internal-tariffs/   # Paso 4
├── coverage-master/    # Paso 5
├── products/           # Paso 6
├── producers/          # Asignación productores
├── audit/              # Auditoría (user_id)
└── catalogs/           # Monedas, reaseguro
```
