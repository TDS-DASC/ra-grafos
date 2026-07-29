# Árboles binarios en realidad aumentada

Prototipo web estático para apoyar la enseñanza de árboles binarios de búsqueda en Matemáticas Discretas y Estructuras de Datos.

## Ejecutar

Abre `index.html` desde un servidor estático. Por ejemplo:

```bash
python3 -m http.server 4173
```

Luego visita `http://127.0.0.1:4173/`.

También puede publicarse directamente en GitHub Pages porque no requiere backend, base de datos ni proceso de build.

## Dependencias externas

Todas se cargan por HTTPS desde CDN:

- A-Frame `1.5.0`: renderizado 3D declarativo sobre WebXR/WebGL.
- AR.js `3.4.5`: realidad aumentada basada en marcador Hiro.
- QRCode `1.5.3`: generación del código QR de la URL actual para abrir la experiencia en un teléfono.

## Uso

- En escritorio, usa **Explorar en 3D** para observar el árbol, arrastrar para rotar y usar rueda/gestos para acercar.
- En móvil, pulsa **Iniciar realidad aumentada** y apunta la cámara al marcador Hiro.
- Si la cámara no está disponible o se deniega el permiso, la app conserva el modo alternativo 3D.
