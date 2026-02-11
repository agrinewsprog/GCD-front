# GCD Frontend

Frontend de la aplicación de Gestión de Campañas Digitales (GCD).

## Stack Tecnológico

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **React Router** - Enrutamiento
- **Zustand** - Estado global
- **Axios** - Cliente HTTP

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor de desarrollo se iniciará en http://localhost:5173

## Variables de Entorno

Crea un archivo `.env` con:

```
VITE_API_URL=http://localhost:3000/api
```

## Credenciales de Prueba

- **Email:** admin@gcd.com
- **Contraseña:** admin123

## Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── layouts/         # Layouts de la aplicación
├── pages/          # Páginas principales
├── services/       # Servicios de API
├── stores/         # Stores de Zustand
├── types/          # Tipos TypeScript
├── lib/            # Configuraciones (Axios)
├── App.tsx         # Componente principal
└── main.tsx        # Punto de entrada
```

## Build

```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`
