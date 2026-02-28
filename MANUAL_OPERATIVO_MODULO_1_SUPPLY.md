# MANUAL OPERATIVO - MÓDULO 1: SUPPLY & QUALITY (ACOPIO Y CALIDAD)

**AXIS COFFEE PRO V2.0**
*Nivel de Madurez Tecnológica: TRL 7*

Este documento constituye el manual de usuario y guía procedimental oficial para el uso del **Módulo I: Supply & Quality**. Este módulo es la base sobre la cual se asienta la trazabilidad de todo el sistema, y su correcta ejecución asegura la integridad de los datos en toda la cadena de valor (desde el origen hasta el consumidor final).

---

## ☕ 1. VISIÓN GENERAL DEL MÓDULO

El módulo de *Supply & Quality* es responsable de gestionar y registrar el ingreso de la materia prima, controlar las mermas de transformación inicial y evaluar exhaustivamente las características de calidad tanto físicas como sensoriales del café. 

**Funcionalidades Principales:**
1.  **Recepción y Control de Lotes:** Ingreso de inventario de las fincas aliadas y clasificación del estado inicial del café (Cereza, Pergamino, Verde).
2.  **Operación de Trilla:** Flujo para registrar el proceso de pilado/trilla, calculando automáticamente el rendimiento (Factor de Rendimiento o FR) y mermas (Cisco, Pasillas, etc.).
3.  **Evaluación SCA (Calidad):** Creación de Certificados de Lote utilizando metodologías rigurosas de la *Specialty Coffee Association* (Análisis Físico y Análisis Sensorial/Cupping).
4.  **Inventario Dinámico:** Consulta en tiempo real del stock disponible para la siguiente fase (Roast Intelligence).

---

## 📥 2. RECEPCIÓN DE CAFÉ Y CREACIÓN DE LOTES

El primer paso dentro de la plataforma es registrar físicamente el café que ingresa a la planta.

### PASO 2.1 - Ingreso al submódulo de Compras (Acopio)
1. En el panel principal (Dashboard), navegue a la sección **"Supply"** o **"Acopio"**.
2. Seleccione la opción **"Nuevo Ingreso"** o **"Añadir Lote"**.

### PASO 2.2 - Registro de la Trazabilidad Inicial
El operador de báscula o líder de calidad debe ingresar la siguiente información obligatoria:
*   **Productor / Finca:** Seleccionar de la base de datos el nombre de la finca de donde proviene el café. (La finca trae consigo metadatos como altura, región y coordenadas).
*   **Variedad:** Identificar genéticamente el lote (Borbón, Geisha, Caturra, Castillo, etc.).
*   **Proceso:** Seleccionar el beneficio (Lavado, Natural, Honey Macerado, etc.).
*   **Peso de Recepción y Estado:** Cuántos kilogramos ingresan y en qué estado (Ej. 100 kg de Café Pergamino Seco).

> ⚠️ **IMPORTANTE:** Al guardar este formulario, el sistema generará automáticamente un **Internal Lot ID** irrepetible (Ej. `LOT-2026-X1Y2`). Este código acompañará al café por el resto de su historia.

---

## ⚙️ 3. OPERACIÓN DE TRILLA Y RENDIMIENTO

Si el café fue recibido en *Pergamino Seco*, debe pasar por el proceso de trilla antes de ser tostado o evaluado.

### PASO 3.1 - Iniciar Orden de Trilla
1. Navegue al apartado **"Trilla"** o seleccione el lote en pergamino desde el inventario.
2. Inicie el proceso de trilla registrando el "Peso Original" que se va a procesar.

### PASO 3.2 - Registro de Salidas y Cálculo de FR
Después de completada la tarea física por la maquinaria de trilla, el operador debe documentar los subproductos obtenidos:
*   **Peso de Café Verde (Excelso/Exportación):** Kilogramos de almendra limpia de alta calidad.
*   **Pasillas y Descartes:** Kilogramos de grano brocado, negro, vinagre y otros defectos físicos.
*   **Cisco / Cascarilla:** Kilogramos de la envoltura seca.
*   **Merma Invisible:** Calculada automáticamente por la diferencia de sumatorias, generalmente por humedad o pérdida de polvo.

### PASO 3.3 - Aprobación
El sistema confirmará que la suma total sea equivalente al 100% de ingreso y guardará los datos, generando el **Factor de Rendimiento**, una métrica crítica de rentabilidad de origen.

---

## 🔬 4. EVALUACIÓN Y PROTOCOLO SCA (CERTIFICADO DE LOTE)

Con el lote en verde disponible, el panel de calidad y el Q-Grader deberán auditar el lote para emitir su pasaporte o certificado de calidad.

### PASO 4.1 - Análisis Físico
1. Ingrese a **"Certificados"** o **"Análisis de Lote"**.
2. Registre las variables ambientales métricas: **Humedad (%)** y **Actividad Acuosa (aW)**.
3. Evalúe una muestra de 350g, ingresando los conteos de defectos primarios y secundarios, obteniendo un *Grading Count* verificado y determinando el nivel de granulometría (mallas).

### PASO 4.2 - Análisis Sensorial (Cupping)
1. Complete el formulario digital SCA.
2. Usando una escala del 6-10 (según normativa Specialty), asigne los puntajes individuales para las siguientes diez áreas:
   *  Fragancia/Aroma, Sabor, Sabor Residual, Acidez, Cuerpo, Balance, Uniformidad, Taza Limpia, Dulzor y Apreciación General.
3. El sistema validará la sumatoria y otorgará el **Puntaje Final SCA**.

> 📊 **NOTA VISUAL:** Esta evaluación genera automáticamente el Radar Chart o Matriz Sensorial ("Sensory Footprint"), que es visible en primera plana dentro del Certificado de exportación de dos páginas.

---

## 📦 5. INVENTARIO Y SALIDA HACIA PRODUCCIÓN (ROAST)

Una vez el lote está evaluado y en estado verde, pasa formalmente al stock general disponible.
*   El módulo de **Supply** permite ver métricas de inventario (Kilos disponibles, valorización en origen).
*   Desde esta vista, el Maestro Tostador podrá seleccionar ("halar" o solicitar) este lote para alimentar el módulo **Roast Intelligence**, cerrando efectivamente el ciclo del primer sistema de la herramienta.

---

**FIN DEL MANUAL DEL MÓDULO 1.**
*Para consultas sobre resolución de problemas (Troubleshooting), contacte a la administración del sistema y consulte el log de eventos históricos del operador de turno.*
