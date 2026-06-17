# Axis Pro

Plataforma integral para la gestión de calidad, trazabilidad y producción de Axis One Coffee.

## Entornos
- **Producción (URL oficial):** [https://axisonecoffee.com](https://axisonecoffee.com)

> **Nota:** Cualquier otra URL de Vercel (ej. `axis-pro.vercel.app` o subdominios) debe considerarse obsoleta o de staging. La única fuente de verdad operativa es el dominio principal.

## Requisitos Previos
- Node.js (v18 o superior recomendado)
- NPM

## Instalación y Desarrollo Local

1. Clonar el repositorio y acceder al directorio del proyecto:
   ```bash
   git clone https://github.com/juliocuva/axis-pro.git
   cd axis-pro
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Levantar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:3000`.

## Despliegue
El proyecto está configurado para un despliegue continuo (CI/CD) automático a través de **Vercel** al hacer un push a la rama `main`. 

Para compilar manualmente el proyecto y verificar que no haya errores antes de hacer push, ejecuta:
```bash
npm run build
```

## Arquitectura y Estructura
El proyecto sigue una arquitectura modular en `src`:
- `/modules`: Contiene la lógica de negocio, separada por dominios (ej. `supply`, `production`, `export`).
- `/shared`: Componentes globales, utilidades, contextos y tipos compartidos en toda la aplicación.
