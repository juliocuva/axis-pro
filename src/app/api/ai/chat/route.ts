import { NextResponse } from 'next/server';

// =========================================================================
// AXISONE COFFEE V2.0 - KNOWLEDGE BASE (SYSTEM PROMPT)
// =========================================================================
const SYSTEM_PROMPT = `
Eres ANEXO, el Auditor Legal en Línea e Inteligencia Artificial central de un software robusto llamado AXISONE COFFEE.
Tu propósito principal es analizar datos, responder dudas técnicas, certificar bioseguridad y validar fricciones legales y aduaneras en la exportación de café de especialidad.

CONTEXTO DEL SISTEMA (¿Qué es AXISONE COFFEE?):
- Es un ecosistema industrial corporativo SaaS para fincas de alto nivel, trilladoras, y exportadores de café.
- Posee trazabilidad inmutable desde la compra en finca hasta la exportación portuaria.
- Reemplaza el papel y Excel; ahora todo es digital, asegurado y visible en línea a través de Pasaportes Digitales escaneables por QR.

MÓDULOS DEL SISTEMA:
1. Origen Inmutable (Inventario): Guarda datos del productor (farmer), lote, variedad, altitud, coordenadas GPS/WGS84. Mide rendimiento de trilla.
2. Estándar Verde (Trilla): Transforma el estado del café. Controla la humedad rigurosamente (ideal < 12.5% para transporte marítimo).
3. Pasaporte Aduanero (Logística/Exportación): Genera la documentación digital para enviar café a 3 mercados:
   - EUROPA (EUDR): Obligatorio adjuntar Polígonos WGS84 de las fincas de origen > 4 hectáreas para prevenir Deforestación. Si no los tiene, el software emite una "Alerta Roja" y detiene la exportación.
   - USA (FDA / FSMA): Verifica eventos de bioseguridad e inocuidad alimentaria desde la recepción hasta la aduana.
   - ASIA / OTROS: Trazabilidad Global verificada.

REGLAS DE TU COMPORTAMIENTO:
1. Actúa como un Auditor Industrial / Consultor Aduanero senior, frío, exacto, y altamente técnico. 
2. NUNCA respondas a cosas que no sean sobre café, exportación o el software de AXISONE COFFEE. 
3. Usa frases y terminología de aduanas, logística, blockchain, trazabilidad, y WGS84/EUDR.
4. Si te preguntan sobre el estado de un lote y no te dan datos, asume ejemplos hiper-realistas para demostrar la potencia del sistema o diles que "el escáner de la base de datos requiere IDs más específicos, pero en base a la simulación..."
5. Tus respuestas deben ser relativamente cortas (máx. 3-4 párrafos) y directas al punto, formateadas amigablemente.
`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Verificamos que contenga mensajes
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Formato de mensajes inválido' }, { status: 400 });
        }

        // Construir el historial para OpenAI
        // Añadimos nuestro SYSTEM_PROMPT robusto oculto al principio para que el bot "aprenda" todo.
        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m: any) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }))
        ];

        // NOTA PARA EL USUARIO:
        // Añade tu propia clave mediante Variables de Entorno (.env.local)
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.warn("ADVERTENCIA: No se detectó GEMINI_API_KEY. Usando simulación local de ANEXO.");
            // SIMULACIÓN LOCAL RAG (En caso de no haber API)
            const lastMessage = apiMessages[apiMessages.length - 1].content.toLowerCase();
            let simulatedResponse = "Verificando base de datos inmutable de AXIS...";

            if (lastMessage.includes('eudr') || lastMessage.includes('europa') || lastMessage.includes('polígono')) {
                simulatedResponse = 'ANEXO (AUDITORÍA EUDR): He escaneado los requerimientos del Parlamento Europeo (2023/1115). Cualquier lote que pretenda cruzar el Atlántico hacia Róterdam requerirá extracción WGS84 del módulo "Origen Inmutable". Sin esto, el "Pasaporte Aduanero" bloqueará la exportación.';
            } else if (lastMessage.includes('humedad') || lastMessage.includes('agua') || lastMessage.includes('trilla')) {
                simulatedResponse = 'ANEXO (ESTÁNDAR VERDE): Recordatorio legal: Si la humedad final de trilla supera el 12.5%, el Módulo de Bioseguridad activará alerta roja riesgo FDA. Se solicitará reproceso antes de emitir certificado marítimo.';
            } else {
                simulatedResponse = 'ANEXO (KNOWLEDGE-BASE ALIVE): Comprendo y vigilo el ecosistema de trazabilidad corporativa AXIS PRO. (Nota: Añade tu OPENAI_API_KEY, GEMINI_API_KEY o ANTHROPIC_API_KEY en .env.local para IA real)';
            }

            await new Promise(r => setTimeout(r, 1200));
            return NextResponse.json({ answer: simulatedResponse });
        }

        let answer = "";

        // ================== GEMINI (GOOGLE) ==================
        // Format for Gemini API
        const geminiContents = messages.map((m: any) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: geminiContents,
                generationConfig: { temperature: 0.3, maxOutputTokens: 400 }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        answer = data.candidates[0].content.parts[0].text;

        return NextResponse.json({ answer });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || 'Error del servidor al procesar LLM' }, { status: 500 });
    }
}
