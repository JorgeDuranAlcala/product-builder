-- Run as PostgreSQL superuser to prepare local development database
CREATE USER products WITH PASSWORD 'products';
CREATE DATABASE products_config OWNER products;
GRANT ALL PRIVILEGES ON DATABASE products_config TO products;
