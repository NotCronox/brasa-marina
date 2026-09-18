# Brasa Marina

Proyecto conceptual de plataforma web para restaurante, desarrollado para el portafolio de Rasec Dev.

Brasa Marina es un restaurante ficticio de cocina caribena contemporanea ubicado en Getsemani, Cartagena. El objetivo del sitio es demostrar una experiencia comercial completa: pagina publica premium, menu digital, carrito, pedidos en mesa, para llevar y a domicilio, seguimiento del pedido y panel administrativo.

## Tecnologias

- HTML
- CSS
- JavaScript
- Sin frameworks
- Supabase preparado como backend de produccion
- Modo demo local con `localStorage`

## Estructura

- `index.html`: estructura principal de la pagina.
- `css/styles.css`: estilos base y diseno visual.
- `css/responsive.css`: ajustes para tablet y celular.
- `css/admin.css`: interfaz administrativa con la identidad visual del restaurante.
- `js/main.js`: menu movil, animaciones y arranque de la experiencia publica.
- `js/client/`: experiencia del cliente, carrito, checkout y seguimiento.
- `js/admin/`: login, dashboard, pedidos, productos, mesas y configuracion.
- `js/services/`: persistencia local, carrito, autenticacion y configuracion Supabase.
- `js/utils/`: utilidades de formato, fechas, moneda, telefonos e identificadores.
- `admin/`: rutas administrativas.
- `menu/`: ruta preparada para QR por mesa.
- `database/`: SQL de Supabase, seed y guia de configuracion.
- `assets/images/`: imagenes libres descargadas y optimizadas para el proyecto.

## Funcionalidades

### Cliente

- Menu dinamico con productos, categorias, imagenes, precios y disponibilidad.
- Carrito funcional con cantidades, subtotal y persistencia en el navegador.
- Barra de pedido fija en movil con total y acceso rapido al carrito.
- Tres canales de pedido: **en mesa**, **para llevar** y **domicilio**.
- Domicilio con direccion, telefono, punto de referencia, zona de entrega, costo de envio calculado por zona, metodo de pago y campo de cambio.
- Pedido minimo y cobertura configurables desde el panel.
- Deteccion de mesa desde URL tipo `menu/?mesa=8`.
- Seguimiento del pedido con linea de tiempo, hora de cada estado y hora estimada de llegada.
- Historial de los ultimos pedidos hechos desde ese navegador.

### Administracion

- Panel protegido con sesion demo local o Supabase Auth cuando se configure.
- Dashboard con ventas del dia, ticket promedio, domicilios activos, pedidos en camino y ventas por canal.
- Tablero de pedidos con filtros por estado y por canal, buscador por numero, cliente, telefono o direccion.
- Ficha de domicilio con direccion, referencia, pago, cambio y accesos directos a llamada y WhatsApp.
- Gestion de productos, disponibilidad, mesas, zonas de entrega y datos del restaurante.
- La configuracion del panel se refleja en el sitio publico (WhatsApp, telefono, direccion, zonas y pedido minimo).

## Estados del pedido

`Recibido → En preparacion → Listo → Entregado`

Los domicilios suman un paso intermedio: `Listo para despacho → En camino → Entregado`.
Cada cambio queda registrado con su hora, tanto en el seguimiento del cliente como en el panel.

## Como abrirlo

El proyecto usa modulos ES (`type="module"`), asi que necesita servirse por HTTP.
Abrirlo con doble clic (`file://`) hara que el JavaScript no cargue.

Opciones:

- Live Server desde VS Code (clic derecho sobre `index.html` → *Open with Live Server*).
- O un servidor estatico rapido:

```bash
npx serve .
```

Rutas principales:

- Publica: `index.html`
- QR / menu digital: `menu/index.html?mesa=8`
- Admin: `admin/index.html`

## Como entrar y usar el panel administrativo

### 1. Entrar

1. Abre `admin/` (o el enlace **Panel interno** del pie de pagina).
2. En modo demo local **cualquier correo y contrasena funcionan**.
3. El boton **Entrar con la cuenta demo** llena y envia las credenciales sugeridas:
   `admin@brasamarina.co` / `demo1234`.

La sesion vive en `sessionStorage`, asi que se cierra al cerrar la pestana.
Si configuras Supabase, el boton demo desaparece y se exige el usuario real de Supabase Auth.

### 2. Dashboard

Resumen del dia: pedidos, ventas, ticket promedio, pedidos activos, domicilios,
pedidos en camino, ingresos por envio y ventas por canal.
Si hay un domicilio sin confirmar aparece una alerta arriba con acceso directo al pedido.

### 3. Pedidos

Es la pantalla de operacion diaria.

- Filtra por estado (Recibidos, En preparacion, Listos, En camino, Entregados, Cancelados).
- Filtra por canal (Mesa, Para llevar, Domicilio).
- Busca por numero de pedido, nombre, telefono o direccion.
- Cada tarjeta muestra los productos, las notas y el total.
- Los domicilios muestran ademas direccion, zona, referencia, metodo de pago,
  cambio solicitado y botones para llamar o escribir por WhatsApp.
- El boton naranja avanza el pedido al siguiente estado. En domicilio la secuencia es
  *En preparacion → Listo para despacho → En camino → Entregado*.
- **Cancelar** cierra el pedido y libera la mesa si estaba asociada.

El numero rojo junto a "Pedidos" en el menu lateral indica cuantos pedidos siguen abiertos.

### 4. Menu

Crea, edita, activa, desactiva o elimina productos.
Desactivar un producto lo marca como *Agotado* en la carta publica al instante y
bloquea que se pueda pedir.

### 5. Mesas

Vista de ocupacion del salon. Las mesas se marcan ocupadas solas cuando entra un
pedido en mesa y se liberan al entregarlo o cancelarlo. Tambien se pueden cambiar a mano.

### 6. Configuracion

- Datos del restaurante: nombre, telefono, WhatsApp, Instagram, direccion, horario y numero de mesas.
- **Domicilios**: activar o desactivar el canal, definir el pedido minimo y administrar
  las zonas de entrega (nombre, costo de envio y tiempo estimado).
- **Restaurar demo** devuelve productos, pedidos, mesas y configuracion al estado inicial.

Al desactivar los domicilios, la opcion desaparece del checkout publico y la seccion
de domicilios del sitio avisa que el canal esta pausado.

### Probar el flujo completo

1. Abre el sitio publico en una pestana y el panel en otra.
2. Agrega platos al carrito, elige **Domicilio**, completa direccion y telefono, confirma.
3. En el panel, el pedido aparece al instante en **Pedidos**.
4. Avanza los estados desde el panel y observa como cambia la linea de tiempo del
   cliente en la otra pestana sin recargar.

Ambas pestanas comparten el mismo `localStorage` y se sincronizan con `BroadcastChannel`.

## Imagenes

Las fotos base fueron reemplazadas por imagenes libres de Unsplash y se guardaron localmente en `assets/images/` para que el sitio no dependa de enlaces remotos al cargar.

Fuentes principales:

- Seafood platter: Vitalii Kyktov y Sunira Moses / Unsplash.
- Pescado a la brasa: Chefitt / Unsplash.
- Arroz de mariscos: Lee Milo / Unsplash.
- Costillas BBQ: Diego Arenas de Rodrigo / Unsplash.
- Coctel tropical: Brett Wharton / Unsplash.
- Cocina / plancha: Emmanuel M y Tomi Saputra / Unsplash.
- Interiores de restaurante: Raymond Yeung y Diego Arenas de Rodrigo / Unsplash.
- Calles de Cartagena: Ricky Beron y Juan Nino / Unsplash.
- Entradas, bebidas y postres: Meg von Haartman, Rafael Rodrigues, Brenda Godinez, Jonathan Borba y You Le / Unsplash.

## Nota de portafolio

Este proyecto no representa un cliente real. Es una pieza conceptual desarrollada para mostrar capacidades de diseno y desarrollo web de Rasec Dev.
