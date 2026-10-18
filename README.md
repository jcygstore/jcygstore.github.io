# JCYG STORE — catálogo con GitHub Pages + Firebase

Versión editada de la página original, con el logo entregado por el propietario y el nombre **JCYG STORE**.

## Qué incluye

- Página de productos a pantalla completa (diseño vertical original, adaptable a celulares).
- Logo JCYG STORE en cabecera y favicon.
- Botón **Catálogo 2026** que abre el acceso de administrador.
- Inicio de sesión con **correo y contraseña de Firebase Authentication**.
- Administración para crear, editar, publicar como borrador o eliminar productos.
- Nombre, descripción, stock, precio actual y precio anterior con descuento automático.
- Hasta 10 imágenes por producto: se suben a Firebase Storage y se asocian a colores.
- Color seleccionable por el comprador: la foto principal cambia a la correspondiente, si se asignó una imagen a ese color.
- Galería con miniaturas y sección de características detalladas.
- Configuración desde el panel del número de WhatsApp de recepción de consultas, con nombre/precio/color en el mensaje.
- Tres productos originales convertidos en ejemplos. Sin Firebase configurado, la página los muestra como **catálogo de ejemplo**. Una vez conectada a Firebase, el catálogo usa los productos de Firestore, y los ejemplos se pueden importar desde el panel si se desean publicar.

## 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto para **JCYG STORE** (o utiliza uno propio).
2. En **Configuración del proyecto → General → Tus apps**, añade una **app web** (`</>`).
3. Copia la configuración de Firebase Web SDK y rellena `firebase-config.js`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket` (usa el valor exacto que proporciona Firebase, que puede variar según la fecha de creación del bucket)
   - `messagingSenderId`
   - `appId`

> La configuración web identifica el proyecto, pero **no es una contraseña privada**. La protección real se hace con Firebase Authentication y las reglas de Firestore/Storage. Nunca pegues contraseñas ni credenciales de servicio en GitHub.

## 2. Crear el usuario administrador

1. En **Authentication → Sign-in method**, activa el proveedor **Correo electrónico/Contraseña**.
2. En **Authentication → Users**, crea **un usuario administrador** con el correo y la contraseña que elijas.
3. Copia el **UID** exacto de ese usuario.
4. Sustituye `REEMPLAZAR_UID_DEL_ADMINISTRADOR` con ese UID **en los tres archivos**:
   - `firebase-config.js`
   - `firestore.rules`
   - `storage.rules`
5. En Authentication → Settings → **Authorized domains**, incorpora el dominio de GitHub Pages que utilizarás si no está ya permitido, por ejemplo `tuusuario.github.io`. No copies `https://` ni la ruta del repositorio, solo el dominio.

Cuando toques **Catálogo 2026**, se abrirá el inicio de sesión. Solo el UID especificado podrá guardar datos (las reglas también lo comprueban). **No hay una contraseña predeterminada**: la contraseña es la que creas en Authentication y nunca queda escrita en el código.

## 3. Activar Firestore

1. En **Firestore Database**, crea la base de datos.
2. Abre **Rules** y sustituye las reglas por el contenido de `firestore.rules` (ya con el UID actualizado).
3. Publica las reglas.
4. No necesitas crear manualmente las colecciones: el panel crea `products` y el documento `settings/storefront` cuando los guardes.

En el catálogo público solamente se leen los productos marcados como publicados. Los borradores y todas las escrituras están restringidos al UID administrador.

## 4. Activar Firebase Storage para fotos

1. En **Storage**, crea/activa el bucket de almacenamiento.
2. En **Rules** pega las reglas de `storage.rules` (con tu UID) y publícalas.
3. Asegúrate de que `storageBucket` en `firebase-config.js` coincide exactamente con el nombre que muestra el proyecto Firebase.

Las fotos nuevas se guardan bajo `product-images/<idProducto>/<idImagen>.webp`. Las reglas permiten consultar las fotos públicas y solo dejan subir, cambiar o borrar imágenes al UID administrador. Se limita el tamaño de cada subida a 10 MB y el tipo a imágenes. El formulario acepta JPG/PNG/WebP y optimiza antes de subir.

**Importante:** La habilitación de Cloud Storage para Firebase puede requerir un plan de facturación **Blaze** según las condiciones vigentes de tu proyecto. Revisa lo que indica Firebase Console antes de habilitarlo. Firestore y Authentication también tienen cuotas y límites.

## 5. Subir el sitio a GitHub Pages

Sube a la raíz de tu repositorio **todos** estos archivos manteniendo su estructura:

```text
index.html
app.js
styles.css
firebase-config.js
firestore.rules
storage.rules
README.md
assets/
  jcyg-store-logo.png
  imagen-no-disponible.svg
  producto-ejemplo-1.webp
  producto-ejemplo-2.webp
  producto-ejemplo-3.webp
```

En el repositorio, abre **Settings → Pages → Build and deployment**, elige **Deploy from a branch**, selecciona la rama principal (normalmente `main`) y la carpeta `/ (root)`. Espera a que Pages publique la web y abre la URL que te indique GitHub.

**No basta con subir `index.html`:** incluye `app.js`, `styles.css`, `firebase-config.js` y la carpeta `assets` para que la página funcione. GitHub Pages solo sirve archivos estáticos; Firebase almacena los datos y las imágenes.

## 6. Primer inicio de sesión y productos

1. Abre la web publicada.
2. Toca **Catálogo 2026**, arriba a la derecha.
3. Ingresa con el correo y la contraseña del administrador creada en Firebase.
4. En **Productos**, pulsa **Agregar producto** o **Importar los 3 productos de ejemplo**.
5. Para agregar uno nuevo: completa nombre, descripción, precios y cantidad; selecciona colores; agrega hasta 10 fotografías; asigna un color a cada foto; escribe características (una por línea con `Nombre: Valor`); guarda.
6. En **WhatsApp de la tienda**, guarda el celular con código internacional, sin `+`, espacios ni guiones. Por ejemplo, en Perú el formato tiene el prefijo `51` seguido de los nueve dígitos del móvil.
7. Prueba desde otro dispositivo que se muestran las fotos y que el botón Comprar abre el WhatsApp correcto. No olvides publicar al menos un producto.

## Recomendaciones y límites

- Los 3 productos de ejemplo se derivan del HTML original. La fotografía de ejemplo que acompaña un producto **no equivale a fotografías para todos sus colores**: sube fotos reales y asígnalas a cada color al editar.
- El stock es una cantidad mostrada en el catálogo, **no un inventario con reserva o pago automático**. La compra se coordina mediante WhatsApp.
- Eliminar un producto intenta borrar también sus fotografías almacenadas bajo `product-images/`; las imágenes históricas que están incluidas en `assets/` no se borran de GitHub.
- La sesión de administrador puede mantenerse iniciada según el comportamiento estándar de Firebase Authentication; usa el botón **Salir de administración** en un dispositivo compartido.
- La web no incluye pagos en línea ni panel de gestión de pedidos.
- Prueba en el dominio publicado o en un servidor local (por ejemplo `python -m http.server 8000`), porque los módulos JavaScript ES pueden no funcionar al abrir `index.html` con `file://`.

## Seguridad

No uses una contraseña hardcodeada en JavaScript. La seguridad depende de activar **Authentication**, reemplazar el **UID autorizado en las reglas** y **publicar esas reglas**. No selecciones reglas de prueba abiertas en un proyecto en producción.
