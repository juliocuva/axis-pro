# AXIS COFFEE PRO V2.1 - Documentación de Ingeniería (TRL 7)

**AXIS COFFEE PRO** es una solución de software industrial de alta fidelidad diseñada para el control integral de la cadena de valor del café de especialidad. La plataforma ha alcanzado un nivel de madurez tecnológica **TRL 7 (Sistema operativo demostrado en entorno real)**.

---

## 1. Módulos y Flujos de Operación Industrial

### I. Supply Intelligence & Traceability (Protocolo 3+1)
El sistema utiliza un flujo de trabajo optimizado para separar los datos de campo de la analítica técnica de laboratorio, garantizando integridad en la trazabilidad.

#### A. Módulo de Ingreso de Lote (PurchaseForm - 3 Pasos)
Diseñado para operadores de báscula y acopiadores.
1.  **Origen y Productor:** Identificación SICA/Cédula, georreferenciación satelital y validación automática de cumplimiento **EUDR** (para fincas ≥ 4 Hectáreas).
2.  **Comercialización:** Registro de pesos, precios (COP) y destino del lote (Exportación/Internal).
3.  **Beneficio (Datos de Campo):** Información básica del proceso según el productor:
    *   **Variedad:** Selección dinámica desde catálogo industrial.
    *   **Tipo de Proceso:** Lavado, Honey, Natural, Anaeróbicos, Co-fermentados.
    *   **Método de Secado:** Marquesina, Camas Africanas, Silo Mecánico, Patio.
    *   **Tiempo de Secado:** Registro de duración para control de humedad inicial.

#### B. Módulo de Laboratorio Integral (PhysicalAnalysisForm)
Ubicado en la pestaña de **Lab Físico**, centraliza la analítica técnica avanzada:
*   **Análisis Físico:** Humedad (rango 9-13%), Densidad (g/L), Actividad de Agua (aw), Granulometría (Mallas 12 a 18) y Conteo de Defectos (Primarios/Secundarios).
*   **Análisis Fisicoquímico:** Registro de pH (Inicial/Final), Grados Brix (°Bx), Temperatura Máxima de Masa y Tiempos de Fermentación Controlada.
*   **Certificación Industrial:** El sistema sella el lote como "Validado Técnicamente" tras el ingreso de estos parámetros, habilitando el paso a Catación SCA.

### II. Calidad y Protocolos SCA (Cupping)
*   **Formularios SCA Blindados:** Registro de perfiles sensoriales con métricas estandarizadas (Fragancia, Sabor, Acidez, Cuerpo).
*   **Certificado de Lote Automático:** Generación de Pasaporte Digital con visualización de Radar Chart y desglose de mallas.
*   **Control de Privacidad:** El certificado permite alternar entre vista de "Productor" (Full Know-how técnico) y "Comprador" (Export Report).

### III. Roast Intelligence (Inteligencia de Tostión)
*   **Monitoreo Espectral en Vivo:** Interfaz HUD inspirada en termografía infrarroja para seguir la curva de tueste en tiempo real.
*   **Ghost Profile (Perfil Espejo):** Comparativa contra perfiles maestros para garantizar consistencia.
*   **AI Roast Copilot:** Sugerencias tácticas de Gas y Aire basadas en la telemetría del PLC.

---

## 2. Características de Seguridad e Infraestructura

*   **Validación EUDR In-Situ:** Bloqueo de registro para exportaciones a Europa si la finca excede el área mínima y no posee polígono de georreferenciación.
*   **Arquitectura Serverless:** Desarrollada con **Next.js 14** y **Supabase**, asegurando latencias inferiores a 200ms en el Core de datos.
*   **UI Industrial Low-Fatigue:** Diseño premium en modo oscuro con tipografía *Outfit* de alta legibilidad, optimizado para laboratorios y plantas de proceso.
*   **Persistencia Atómica:** Actualización de estados del lote (Ingresado, Trillado, Analizado, Catado) garantizando trazabilidad inmutable.

---

## 3. Propuesta de Valor para el Usuario

1.  **Cero Mermas Administrativas:** Control exacto de pesos y rendimientos desde el ingreso en pergamino hasta el excelso.
2.  **Diferenciación de Especialidad:** Capacidad de demostrar científicamente (pH/Brix) por qué un proceso fermentativo es superior.
3.  **Transparencia de Exportación:** Cumplimiento total con normativas internacionales mediante el Pasaporte Digital del Café.

---
# AXIS COFFEE PRO V2.1 - Documentación de Ingeniería (TRL 7)

**AXIS COFFEE PRO** es una solución de software industrial de alta fidelidad diseñada para el control integral de la cadena de valor del café de especialidad. La plataforma ha alcanzado un nivel de madurez tecnológica **TRL 7 (Sistema operativo demostrado en entorno real)**.

---

## 1. Módulos y Flujos de Operación Industrial

### I. Supply Intelligence & Traceability (Protocolo 3+1)
El sistema utiliza un flujo de trabajo optimizado para separar los datos de campo de la analítica técnica de laboratorio, garantizando integridad en la trazabilidad.

#### A. Módulo de Ingreso de Lote (PurchaseForm - 3 Pasos)
Diseñado para operadores de báscula y acopiadores.
1.  **Origen y Productor:** Identificación SICA/Cédula, georreferenciación satelital y validación automática de cumplimiento **EUDR** (para fincas ≥ 4 Hectáreas).
2.  **Comercialización:** Registro de pesos, precios (COP) y destino del lote (Exportación/Internal).
3.  **Beneficio (Datos de Campo):** Información básica del proceso según el productor:
    *   **Variedad:** Selección dinámica desde catálogo industrial.
    *   **Tipo de Proceso:** Lavado, Honey, Natural, Anaeróbicos, Co-fermentados.
    *   **Método de Secado:** Marquesina, Camas Africanas, Silo Mecánico, Patio.
    *   **Tiempo de Secado:** Registro de duración para control de humedad inicial.

#### B. Módulo de Laboratorio Integral (PhysicalAnalysisForm)
Ubicado en la pestaña de **Lab Físico**, centraliza la analítica técnica avanzada:
*   **Análisis Físico:** Humedad (rango 9-13%), Densidad (g/L), Actividad de Agua (aw), Granulometría (Mallas 12 a 18) y Conteo de Defectos (Primarios/Secundarios).
*   **Análisis Fisicoquímico:** Registro de pH (Inicial/Final), Grados Brix (°Bx), Temperatura Máxima de Masa y Tiempos de Fermentación Controlada.
*   **Certificación Industrial:** El sistema sella el lote como "Validado Técnicamente" tras el ingreso de estos parámetros, habilitando el paso a Catación SCA.

### II. Calidad y Protocolos SCA (Cupping)
*   **Formularios SCA Blindados:** Registro de perfiles sensoriales con métricas estandarizadas (Fragancia, Sabor, Acidez, Cuerpo).
*   **Certificado de Lote Automático:** Generación de Pasaporte Digital con visualización de Radar Chart y desglose de mallas.
*   **Control de Privacidad:** El certificado permite alternar entre vista de "Productor" (Full Know-how técnico) y "Comprador" (Export Report).

### III. Roast Intelligence (Inteligencia de Tostión)
*   **Monitoreo Espectral en Vivo:** Interfaz HUD inspirada en termografía infrarroja para seguir la curva de tueste en tiempo real.
*   **Ghost Profile (Perfil Espejo):** Comparativa contra perfiles maestros para garantizar consistencia.
*   **AI Roast Copilot:** Sugerencias tácticas de Gas y Aire basadas en la telemetría del PLC.

---

## 2. Características de Seguridad e Infraestructura

*   **Validación EUDR In-Situ:** Bloqueo de registro para exportaciones a Europa si la finca excede el área mínima y no posee polígono de georreferenciación.
*   **Arquitectura Serverless:** Desarrollada con **Next.js 14** y **Supabase**, asegurando latencias inferiores a 200ms en el Core de datos.
*   **UI Industrial Low-Fatigue:** Diseño premium en modo oscuro con tipografía *Outfit* de alta legibilidad, optimizado para laboratorios y plantas de proceso.
*   **Persistencia Atómica:** Actualización de estados del lote (Ingresado, Trillado, Analizado, Catado) garantizando trazabilidad inmutable.

---

## 3. Propuesta de Valor para el Usuario

1.  **Cero Mermas Administrativas:** Control exacto de pesos y rendimientos desde el ingreso en pergamino hasta el excelso.
2.  **Diferenciación de Especialidad:** Capacidad de demostrar científicamente (pH/Brix) por qué un proceso fermentativo es superior.
3.  **Transparencia de Exportación:** Cumplimiento total con normativas internacionales mediante el Pasaporte Digital del Café.

---

## 4. Modelo de Gobernanza y Roles Cooperativos
El sistema está diseñado para acoplarse de manera fluida y democrática a la realidad operativa de las asociaciones, cooperativas y exportadores en Colombia, reduciendo la fricción administrativa:

*   **Propietario del Sistema (Importador o Tostador):** El cliente internacional (dueño de la marca o comprador en destino) es el promotor del sistema, entregando la herramienta a la asociación para estandarizar el Banco Técnico y el control de calidad.
*   **Rol de Gobernanza (Super Admin - Gerente, Director Comercial, Importador):** Comparten el mismo nivel de acceso. Tienen ingreso exclusivo al **Centro de Gobernanza** para auditar lotes completados, revisar los pasaportes digitales firmados, registrar nuevos operadores en la red y supervisar las métricas de adopción cooperativa.
*   **Rol de Operaciones (Operadores, Catadores, Q Graders):** Utilizan un **único acceso y contraseña delegada compartida** para simplificar la logística en las oficinas de la asociación. Permite a múltiples personas de la planta e ingenieros de laboratorio ingresar la información técnica (Paso 1 a 5: Origen -> Trilla -> Laboratorio Físico -> Tostión -> Catación), consultar el historial dinámico de lotes validados o pendientes, y sellar de manera flexible cuando el Q Grader de la firma definitiva.

### V. Filosofía Democrática de Soberanía de Datos (Banco Técnico)
El sistema opera bajo un acuerdo ético de propiedad de la información:
1.  **El Caficultor es el Dueño del Banco Técnico:** El productor (identificado por su Cédula Cafetera y clave) tiene derecho de acceso irrestricto y de por vida a todo su registro técnico (humedad, mermas, pH/Brix, curvas de tueste y perfiles de taza). Esta información es de su exclusiva propiedad y sirve como su portafolio técnico independiente para negociar con cualquier actor en el mercado global.
2.  **El Importador y la Asociación son Dueños de Reportes:** El importador (quien financia el software) y la cooperativa son los propietarios exclusivos de los Reportes de Exportación, Pasaportes Criptográficos de Embarque y Certificaciones que se generan a partir de los lotes comprados.
3.  **Transparencia Radical:** El conocimiento técnico es un "regalo" del importador al productor, empoderando el origen mediante la entrega de su ADN técnico digital.

---
**AXIS COFFEE PRO**
*Transformando la tradición en precisión digital.*
V2.1 - Rev: 2026.05.28
