# Base de datos Supabase

Este directorio prepara la base real para llevar Brasa Marina de demo local a producción.

## Archivos

- `schema.sql`: crea tablas, funciones, triggers, RLS y políticas.
- `seed.sql`: carga productos, mesas, zonas de domicilio, configuración y pedidos demo.

## Orden recomendado

1. Crear un proyecto en Supabase.
2. Ejecutar `schema.sql` en el SQL Editor.
3. Ejecutar `seed.sql`.
4. Crear el usuario administrador desde Supabase Auth.
5. Insertar su `user_id` en `admin_profiles`.
6. Copiar `Project URL` y `anon public key` en `js/services/supabase-config.js`.

Ambos scripts son idempotentes: se pueden volver a ejecutar sobre una base existente
sin duplicar datos y las columnas nuevas se agregan con `add column if not exists`.

## Modelo de pedidos

`orders.order_type` acepta tres canales:

| Canal      | Campos obligatorios                                        |
| ---------- | ---------------------------------------------------------- |
| `table`    | `table_number`                                             |
| `takeaway` | `customer_name`, `customer_phone`                          |
| `delivery` | `customer_name`, `customer_phone`, `delivery_address`, `delivery_zone_name` |

El flujo de estados es `pending → preparing → ready → completed`, con un paso extra
`on_the_way` exclusivo de domicilio. Cada cambio de estado queda registrado en
`order_status_history` mediante un trigger, y ese historial es lo que alimenta la
línea de tiempo que ve el cliente.

Las zonas de entrega viven en `delivery_zones` (costo y tiempo estimado por zona).
El pedido guarda una copia del nombre, el costo y el tiempo de la zona al momento de
crearse, así que cambiar una tarifa después no altera pedidos históricos.

## Seguridad

La autenticación administrativa se apoya en Supabase Auth. No se guardan contraseñas en tablas del proyecto.

Los clientes no tienen lectura abierta sobre `orders`. Para consultar un pedido se usa la función `get_public_order(number, lookup_token)`, que exige el token del pedido.

Los pedidos públicos se deben crear mediante `create_public_order(...)`, que:

- valida que todos los productos estén disponibles,
- calcula precios y subtotal desde la base de datos, nunca desde el payload del cliente,
- resuelve el costo de envío desde `delivery_zones`,
- verifica el pedido mínimo y que los domicilios estén habilitados,
- marca la mesa como ocupada cuando corresponde.

## Modo actual

Mientras `supabase-config.js` no tenga credenciales, el sitio usa `localStorage` como base demo persistente. Esto permite probar todos los flujos sin servidor, pero no reemplaza la configuración real de Supabase para producción.
