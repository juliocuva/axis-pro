/**
 * AXISONE COFFEE - Telegram Bot Client Library
 * Proporciona notificaciones gratuitas de alta velocidad en tiempo real para operarios y Q Graders.
 */

// Token por defecto para demostración y desarrollo.
// Puede ser sobrescrito por variables de entorno de producción.
const DEFAULT_BOT_TOKEN = '7234857219:AAElJ238f9_sj2Dk8wKsnD2FvE_s9D2J81A'; // Demo Token
const BOT_TOKEN = (
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    DEFAULT_BOT_TOKEN
).trim();

interface InlineButton {
    text: string;
    url: string;
}

/**
 * Envía una notificación de alerta a un operador específico en Telegram.
 * 
 * @param chatId ID de chat de Telegram del operador (viculado a su cuenta)
 * @param text Contenido del mensaje en formato Markdown
 * @param inlineButtons Botones interactivos con enlaces profundos a AxisOne
 * @returns Promesa que indica si el mensaje fue enviado con éxito
 */
export async function sendTelegramAlert(
    chatId: string,
    text: string,
    inlineButtons?: InlineButton[]
): Promise<boolean> {
    if (!chatId) {
        console.warn('⚠️ AXIS Telegram: No se especificó un Chat ID válido.');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        // Estructurar los botones inline de Telegram
        const replyMarkup = inlineButtons && inlineButtons.length > 0
            ? {
                inline_keyboard: [
                    inlineButtons.map(btn => ({
                        text: btn.text,
                        url: btn.url
                    }))
                ]
              }
            : undefined;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup,
            }),
        });

        const data = await response.json();

        if (response.ok && data.ok) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`📡 AXIS Telegram: Alerta enviada con éxito al Chat ID: ${chatId}`);
            }
            return true;
        } else {
            console.error('❌ AXIS Telegram API Error:', data.description || response.statusText);
            return false;
        }
    } catch (error) {
        console.error('❌ AXIS Telegram Exception:', error);
        return false;
    }
}
