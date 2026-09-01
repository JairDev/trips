# Guía de Desarrollo para Claude: MVP Web App Mobile-First de Senderismo

Este documento está diseñado y optimizado para ser copiado y pegado directamente en **Claude** como el contexto principal de tu proyecto. Aplica las mejores prácticas de ingeniería de prompts de Claude (incluyendo asignación de roles especializados, delimitación clara de entidades y un enfoque de desarrollo modular e incremental).

---

## 📌 Contexto General del Proyecto (Información de Base para Claude)

> [!IMPORTANT]
> **Claude debe asimilar este contexto antes de escribir una sola línea de código.**
>
> **Nombre del Proyecto:** Web App Mobile-First de Gestión Logística para Senderismo y Viajes.
> **Usuarios Destino:** Coordinadores y organizadores de **tres grupos de senderismo aliados**.
>
> ### 1. El Problema de Origen
> Actualmente, la gestión de inscritos, pagos y logística de transporte para las salidas organizadas se realiza a través de cadenas de texto manuales en grupos de **WhatsApp**. Esto ocasiona errores constantes de tipeo, duplicidad de nombres en los cupos y descoordinación sobre la disponibilidad real de asientos en la unidad de transporte.
>
> ### 2. Objetivos Fundamentales del MVP
> *   **Centralización Colaborativa:** Permitir que los coordinadores de los tres grupos aliados puedan registrar pasajeros de forma simultánea en una sola base de datos común, evitando la duplicidad de nombres.
> *   **Control de Cupos y Capacidad:** Mostrar un balance preciso en tiempo real de asientos ocupados vs. disponibles según la capacidad total de la unidad de transporte contratada.
> *   **Sincronización en Tiempo Real:** Lograr que cualquier cambio o nuevo registro se refleje de manera instantánea en las pantallas de todos los coordinadores en campo, sin necesidad de refrescar el navegador.
> *   **Control Financiero Integrado:** Llevar el registro de pagos parciales (abonos), montos pendientes y métodos de pago habituales (Pago Móvil o Efectivo) para un control de caja transparente.
> *   **Optimización de Paradas de Autobús:** Agrupar y contar automáticamente a los excursionistas por su zona de recogida (ej. "Santa Rosa", "El Cafetal") para coordinar de forma óptima el trayecto del autobús.
> *   **Exportación Autónoma sin Servidor:** Permitir la descarga local de la lista consolidada de pasajeros en formato Microsoft Excel (.xlsx) directamente desde el navegador del dispositivo móvil del coordinador, cuidando el consumo de datos móviles (3G/4G).
>
> ### 💻 Stack Tecnológico Definido
> *   **Frontend:** Next.js (React) + Tailwind CSS para una interfaz táctil rápida, limpia y optimizada para uso fluido a una sola mano en smartphones.
> *   **Backend & Base de Datos:** Supabase (PostgreSQL con suscripciones *Realtime* activas).
> *   **Exportación local:** Librería de cliente `xlsx` (SheetJS) ejecutada de manera local en el smartphone.

---

## 🛠️ Metodología de Desarrollo con Claude

Para obtener código limpio, funcional y libre de bugs, sigue estas recomendaciones al chatear con Claude:
1. **Contexto Primero:** En tu primer mensaje a Claude, pega este archivo completo para que comprenda el panorama general.
2. **Desarrollo Modular:** Trabaja un prompt a la vez. No intentes saltar a la lógica de tiempo real antes de tener la base de datos SQL bien estructurada.
3. **Manejo de Errores:** Si encuentras algún error en la consola o compilación, no intentes adivinar; copia el error literal, pégalo en Claude y pídele que actúe como depurador principal.

---

## 📝 Prompts de Desarrollo Paso a Paso

### 📁 Prompt 1: Configuración de la Base de Datos en Supabase (Fase 1)
**Objetivo:** Crear el esquema relacional de datos en Supabase, definir restricciones seguras e implementar canales de tiempo real.

```markdown
Actúa como un Administrador de Bases de Datos experto en PostgreSQL y Supabase. 
Necesito crear el backend relacional para un MVP de una Web App de gestión de viajes de senderismo utilizada por 3 grupos aliados de forma simultánea.

La base de datos debe constar de dos tablas principales con integridad referencial:

1. Tabla `trips` (Viajes):
   - `id_viaje` (UUID, Primary Key, autogenerado por default).
   - `destino` (Text, ej. "Pico Naiguatá").
   - `fecha_salida` (Date).
   - `puestos_totales` (Integer, capacidad máxima de puestos del autobús).

2. Tabla `passengers` (Viajeros/Pasajeros):
   - `id_viajero` (UUID, Primary Key, autogenerado por default).
   - `id_viaje` (UUID, Foreign Key que referencia a `trips.id_viaje` con borrado en cascada `ON DELETE CASCADE`).
   - `nombre_completo` (Text).
   - `grupo_origen` (Text, restringido mediante un constraint CHECK para admitir únicamente 'Grupo 1', 'Grupo 2' o 'Grupo 3').
   - `zona_recogida` (Text, ej. 'Santa Rosa', 'El Cafetal').
   - `metodo_pago` (Text, constraint CHECK para admitir únicamente 'Pago Móvil' o 'Efectivo').
   - `estado_pago` (Text, constraint CHECK para admitir únicamente 'Pendiente', 'Abonado' o 'Completo').
   - `monto_abonado` (Numeric/Decimal, default 0).
   - `monto_pendiente` (Numeric/Decimal, default 0).

Por favor, genera:
1. El script SQL completo para ejecutar directamente en el Editor SQL de Supabase, incluyendo la creación de las tablas, claves y sus restricciones de dominio.
2. Las instrucciones y scripts SQL necesarios para activar de forma segura las suscripciones en Tiempo Real (Supabase Realtime) en la tabla `passengers`.
3. Sugerencias de políticas RLS (Row Level Security) iniciales que permitan lectura y escritura pública por ahora para fines de pruebas rápidas del MVP en campo.
```

---

### 🎨 Prompt 2: Interfaz UI Mobile-First con Tailwind CSS (Fase 1)
**Objetivo:** Crear la página principal de Next.js (`page.tsx`) estructurando un cascarón responsive adaptado al uso móvil con una sola mano.

```markdown
Actúa como un Desarrollador Frontend senior experto en React, Next.js (App Router) y Tailwind CSS.
Vamos a diseñar la interfaz visual de nuestra Web App de gestión de senderismo. Debe ser estrictamente mobile-first (para pantallas de smartphones) y estar optimizada ergonómicamente para el uso cómodo a una sola mano (elementos táctiles interactivos grandes, botones flotantes accesibles en la parte inferior).

Requiero que crees la página principal del dashboard móvil (`page.tsx`) estructurando y maquetando visualmente los siguientes componentes (utiliza inicialmente datos estáticos de prueba/mock para el viaje "Pico Naiguatá"):

1. **Header Fijo de Cupos (Sticky Seat Counter Header):** Un panel superior fijo en pantalla que muestre en tiempo real de forma muy visual el balance de cupos ocupados vs. disponibles (Fórmula: Disponibles = Totales - Registrados). Debe cambiar de color si los cupos se agotan (ej. rojo).
2. **Formulario Exprés de Registro:** Un formulario simple pero intuitivo para registrar excursionistas rápidamente:
   - Nombre completo (Input text)
   - Grupo responsable (Select con las opciones de Grupo 1, Grupo 2 o Grupo 3)
   - Zona de recogida (Select/Input con sugerencias para Santa Rosa, El Cafetal, etc.)
   - Modalidad de pago (Pago Móvil / Efectivo)
   - Estado de pago (Pendiente / Abonado / Completo) con campos numéricos dinámicos de monto abonado y pendiente.
3. **Panel de Control de Zonas de Logística:** Una sección compacta que agrupe dinámicamente a los pasajeros inscritos por su zona de recogida y muestre el conteo rápido (ej. "Santa Rosa: 3 personas", "El Cafetal: 5 personas") para facilitar las paradas de la unidad de autobús en ruta.
4. **Lista Maestra de Pasajeros:** Una lista o tarjeta táctil con scroll interactivo, que incluya filtros rápidos por "Estado de Pago" y "Grupo Responsable".
5. **Botón Flotante de Acción (FAB) para Exportar:** Un botón flotante circular de diseño moderno situado en la esquina inferior derecha para exportar a Excel.

Por favor, genera todo el código de esta página (`page.tsx`) utilizando Tailwind CSS. Hazlo estético, limpio, con buenos espaciados aptos para dedos en pantallas táctiles.
```

---

### ⚡ Prompt 3: Conexión con Supabase y Lógica de Sincronización Realtime (Fase 2)
**Objetivo:** Conectar el frontend al cliente de Supabase SDK, implementar consultas/inserciones lógicas y configurar el canal Realtime.

```markdown
Actúa como un Desarrollador Full-stack especializado en Next.js (React Hooks) y Supabase Client SDK.
Ya tenemos maquetada nuestra interfaz móvil. Ahora debemos darle vida conectándola a la base de datos de Supabase que configuramos en el paso 1.

Necesito que generes:
1. El archivo de inicialización del cliente del navegador de Supabase (`utils/supabase/client.ts`).
2. La lógica del componente (`page.tsx`) para realizar un fetch inicial al cargar la página: obtener los detalles del viaje activo (`trips`) y todos los excursionistas registrados (`passengers`) para ese viaje.
3. La lógica de inserción en el "Formulario Exprés", que incluya una validación del lado del cliente que verifique que el número de pasajeros registrados no supere los `puestos_totales` definidos para el viaje antes de proceder con el guardado.
4. La suscripción al canal Realtime de Supabase en la tabla `passengers`. Al ocurrir un evento de INSERT, UPDATE o DELETE por parte de otros coordinadores, el estado de React (`passengers`) debe actualizarse de forma automática e inmediata, recalculando al instante el contador de asientos del encabezado fijo y el control de zonas.

Utiliza hooks estándar de React (`useState`, `useEffect`) de manera óptima para evitar fugas de memoria y suscripciones duplicadas.
```

---

### 📊 Prompt 4: Agrupación Logística de Ruta y Exportación local de Excel (Fase 3)
**Objetivo:** Implementar las operaciones lógicas de agrupación por zona de recogida e integrar SheetJS para exportar a Excel localmente sin uso de servidor.

```markdown
Actúa como un Desarrollador Frontend experto en análisis de datos y procesamiento en cliente.
En nuestra Web App de logística de senderismo, requerimos finalizar las dos características lógicas cruciales de la Fase 3:

1. **Lógica de Agrupación por Zonas (Control de Zonas):**
   - Escribe una función de JavaScript/TypeScript pura que tome el estado de pasajeros (`passengers[]`) y calcule un recuento agrupado según el campo `zona_recogida`.
   - El resultado debe utilizarse para renderizar dinámicamente las tarjetas de la sección "Control de Zonas" (ej. "Santa Rosa: 4 excursionistas", "El Cafetal: 2 excursionistas").

2. **Generación Local de Reporte Excel con SheetJS (`xlsx`):**
   - Implementa la función JavaScript para que, al presionar el Botón Flotante de Acción (FAB) de exportación, se compile toda la lista actual de pasajeros desde el estado local.
   - Debe estructurar los datos de manera limpia en filas y columnas: Nombre, Grupo de Origen, Zona de Recogida, Método de Pago, Estado de Pago, Monto Abonado y Monto Pendiente.
   - Utiliza la librería `xlsx` (SheetJS) para escribir el libro de trabajo (.xlsx) directamente en memoria y disparar la descarga local en el navegador del teléfono móvil. Esto debe hacerse enteramente en el lado del cliente para asegurar un nulo consumo de ancho de banda móvil de servidor al descargar reportes en plena montaña.

Indícame las dependencias exactas que debo instalar mediante npm y cómo integrar estas funciones con el código actual del dashboard.
```
