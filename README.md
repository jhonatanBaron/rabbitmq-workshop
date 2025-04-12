# Taller RabbitMQ - UPTC

Este proyecto implementa una arquitectura de microservicios simple utilizando Docker, Traefik y RabbitMQ para demostrar la comunicación asíncrona entre servicios. Es una adaptación de un ejercicio previo, modificado para incorporar un message broker.

## Arquitectura

La arquitectura consiste en los siguientes servicios orquestados por Docker Compose:

*   **Traefik:** Reverse proxy que expone los servicios a la red externa, maneja el enrutamiento basado en rutas (path-based routing) y aplica autenticación básica para el endpoint de reportes.
*   **RabbitMQ:** Message broker que desacopla los servicios cliente del servicio de analíticas.
    *   **Exchange:** `events_exchange` (tipo `direct`)
    *   **Queue:** `analytics_queue` (durable)
    *   **Routing Key:** `event.analytics`
*   **cliente-uno / cliente-dos:** Servicios Node.js/Express que simulan clientes. Envían periódicamente mensajes (eventos `clientAccess`) a RabbitMQ en lugar de llamar directamente a `api-reporte`.
*   **api-reporte:** Servicio Node.js/Express que consume mensajes de la cola `analytics_queue` de RabbitMQ. Cuenta los eventos por cliente y expone dos endpoints:
    *   `/reporte`: Muestra un reporte en texto plano de los conteos (protegido con Basic Auth: `admin`/`password`).
    *   `/reporte/recent`: Muestra los últimos 5 eventos recibidos en formato JSON (protegido con Basic Auth).
*   **panel:** Servicio Node.js/Express dinámico que consulta periódicamente los endpoints `/reporte` y `/reporte/recent` de `api-reporte` y muestra la información en una página HTML auto-refrescante.
*   **logger-central:** Servicio Node.js/Express simple para recibir logs vía POST (actualmente no es utilizado por otros servicios).

Para una descripción visual detallada, consulta el archivo `ARCHITECTURE.md`.

## Requisitos Previos

*   Docker
*   Docker Compose (generalmente incluido con Docker Desktop o instalable por separado en Linux)

## Implementación y Ejecución

1.  **Clonar el Repositorio:**

    ```bash
    git clone <URL_DEL_REPOSITORIO> # Reemplaza con la URL de tu repo
    cd rabbitmq-workshop
    ```

2.  **Construir y Ejecutar los Contenedores:**

    Desde el directorio raíz del proyecto (`rabbitmq-workshop`), ejecuta:

    ```bash
    docker compose up --build -d
    ```

    *   `--build`: Fuerza la reconstrucción de las imágenes si los Dockerfiles o el código fuente han cambiado.
    *   `-d`: Ejecuta los contenedores en segundo plano (detached mode).

3.  **Acceder a los Servicios:**

    Una vez que los contenedores estén en ejecución, puedes acceder a los siguientes endpoints en tu navegador:

    *   **Clientes (simulados):**
        *   `http://localhost/cliente/uno`
        *   `http://localhost/cliente/dos`
        (Estos solo muestran un mensaje de confirmación, pero inician el envío de eventos a RabbitMQ en segundo plano).
    *   **Panel de Monitoreo:**
        *   `http://localhost/panel`
        (Muestra el reporte agregado y los últimos eventos recibidos vía RabbitMQ. Se auto-refresca cada 5 segundos).
    *   **Reporte (API):**
        *   `http://localhost/reporte` (Requiere autenticación: usuario `admin`, contraseña `password`)
        *   `http://localhost/reporte/recent` (Requiere autenticación: usuario `admin`, contraseña `password`)
    *   **RabbitMQ Management UI:**
        *   `http://localhost:15672` (Credenciales: `user`/`password`)
        (Permite ver colas, exchanges, mensajes, etc.)
    *   **Traefik Dashboard:**
        *   `http://localhost:8080`
        (Muestra los servicios descubiertos y las rutas configuradas).

4.  **Ver Logs:**

    Puedes ver los logs de todos los servicios combinados con:

    ```bash
    docker compose logs -f
    ```

    O para un servicio específico (p.ej., `api-reporte`):

    ```bash
    docker compose logs -f api-reporte
    ```

    *   Verás logs de `cliente-uno` y `cliente-dos` indicando el envío de eventos.
    *   Verás logs de `api-reporte` indicando la recepción y procesamiento de eventos.
    *   Verás logs de `panel` indicando la consulta periódica a `api-reporte`.

5.  **Detener los Servicios:**

    Para detener y eliminar los contenedores:

    ```bash
    docker compose down
    ```
