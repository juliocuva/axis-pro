# AXIS COFFEE PRO V2.0 - Documentación Funcional (TRL 7)

**AXIS COFFEE PRO** es una solución de software industrial de alta fidelidad diseñada para el control integral de la cadena de valor del café de especialidad. La plataforma ha alcanzado un nivel de madurez tecnológica **TRL 7 (Sistema operativo demostrado en entorno real)**.

---

## 1. Módulos y Funcionalidades Principales

### I. Supply & Quality (Gestión de Suministros y Protocolos SCA)
*   **Trilla Automatizada:** Cálculo automático del rendimiento de trilla, factor de rendimiento y mermas.
*   **Formularios SCA Blindados:** Protocolos de catación (Cupping) con métricas estandarizadas (Fragancia, Cuerpo, Acidez, Balance).
*   **Control de Lotes Verdes:** Gestión de inventario de café en pergamino y café verde con trazabilidad de origen (finca, altura, variedad).
*   **Gestión de Inventario Dinámica:** Visualización en tiempo real del stock disponible para transformación.

### II. Roast Intelligence (Inteligencia de Tostión y Análisis Espectral)
*   **Monitoreo Espectral en Vivo:** Interfaz HUD inspirada en termografía infrarroja para seguir la curva de tueste en tiempo real.
*   **Ghost Profile (Perfil Espejo):** Capacidad de cargar perfiles maestros para comparar la tuesta actual contra la ideal, garantizando consistencia.
*   **AI Roast Copilot:** Asistente integrado que sugiere ajustes en Gas, Aire y Velocidad de Tambor basado en la telemetría del PLC.
*   **Análisis Post-Proceso:** Gráficos avanzados de Rate of Rise (RoR), temperaturas críticas (TP, Drying, FC, Drop) y desarrollo porcentual.

### III. Global Trade (Comercio y Logística Internacional)
*   **Pasaporte Digital del Café:** Generación de un certificado de exportación único vía QR que contiene toda la vida del grano (siembra, tueste, puntaje SCA).
*   **Motor de Desgasificación Dinámica:** Algoritmo predictivo que calcula la curva de presión interna del empaque y recomienda la fecha óptima de despacho para evitar explosiones de válvulas.
*   **Historial Cloud de Manifiestos:** Archivo histórico blindado en la nube para auditoría de exportaciones y certificados sanitarios.
*   **Dashboard de Calibración:** Correlación entre telemetría industrial y puntajes sensoriales.

### IV. Retail Connect (Gestión Comercial y Multi-Origen)
*   **Gestión Multi-Roaster:** Único módulo diseñado para retailers que venden café de su propia tostadora y también de tostadores aliados externos.
*   **Conversión Kilo-Bolsa:** Registro de empaque que descuenta automáticamente del stock a granel y crea unidades de retail (250g, 340g, 500g).
*   **Diseñador de Etiquetas QR:** Generación de etiquetas térmicas con códigos QR vinculados a la historia de trazabilidad para el consumidor final.
*   **Venta Omni-Canal:** Registro de transacciones tanto en tienda física como vía e-commerce con centralización de stock.

---

## 2. Características de Seguridad e Infraestructura

*   **Activación In-Situ:** Los módulos críticos (Roast, Trade, Retail) requieren una confirmación de desbloqueo manual por sesión, garantizando que el operador esté consciente del inicio de procesos industriales.
*   **Arquitectura Serverless:** Desarrollada con **Next.js 14** y **Supabase**, asegurando una respuesta ultra-rápida (menos de 200ms) y escalabilidad global.
*   **Diseño Industrial Premium:** UI diseñada para entornos de alto estrés operativo, con tipografía de alto peso (Bold 700), modos oscuros para evitar fatiga visual y micro-animaciones HUD.
*   **Persistencia de Datos:** Sincronización automática con bases de datos PostgreSQL para garantizar que nunca se pierda un registro de tueste.

---

## 3. Propuesta de Valor para el Usuario

1.  **Eliminación de Mermas:** El control exacto de pesos en cada etapa reduce el desperdicio hasta en un 15%.
2.  **Consistencia de Sabor:** La tecnología de perfiles espejo permite que cualquier operador replique el tueste de un maestro tostador.
3.  **Transparencia Radical:** El Pasaporte Digital permite cobrar un **Premium de Calidad** al demostrar con datos irrefutables la excelencia del producto.
4.  **Omnipresencia:** Controla tu planta de proceso en Colombia desde una oficina en Dubai o Nueva York mediante la nube de AXIS.

---
**AXIS COFFEE PRO**
*Transformando la tradición en precisión digital.*
