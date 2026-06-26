const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nhhbncogvnocglrymizj.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

const supabase = createClient(supabaseUrl, supabaseKey);

const entriesData = [
  { producer_name: "Juan Pérez", farm_name: "El Recuerdo", municipality: "Pitalito", kg_received: 220, moisture: 10.7, density: 705, price_paid: 14200 },
  { producer_name: "María Gómez", farm_name: "La Esperanza", municipality: "Acevedo", kg_received: 180, moisture: 10.9, density: 710, price_paid: 14200 },
  { producer_name: "Carlos Ruiz", farm_name: "El Bosque", municipality: "Timaná", kg_received: 240, moisture: 10.5, density: 708, price_paid: 14200 },
  { producer_name: "Luis Ramírez", farm_name: "Las Palmas", municipality: "Pitalito", kg_received: 190, moisture: 10.8, density: 704, price_paid: 14200 },
  { producer_name: "Ana Torres", farm_name: "El Cedro", municipality: "Suaza", kg_received: 260, moisture: 10.6, density: 711, price_paid: 14200 },
  { producer_name: "Pedro Martínez", farm_name: "La Pradera", municipality: "Acevedo", kg_received: 210, moisture: 10.9, density: 706, price_paid: 14200 },
  { producer_name: "Jorge López", farm_name: "El Mirador", municipality: "Timaná", kg_received: 170, moisture: 10.7, density: 709, price_paid: 14200 },
  { producer_name: "Ricardo Díaz", farm_name: "Santa Rosa", municipality: "Pitalito", kg_received: 230, moisture: 10.5, density: 712, price_paid: 14200 },
  { producer_name: "Diana Vargas", farm_name: "Villa María", municipality: "Suaza", kg_received: 160, moisture: 10.8, density: 707, price_paid: 14200 },
  { producer_name: "Felipe Moreno", farm_name: "La Cumbre", municipality: "Acevedo", kg_received: 250, moisture: 10.6, density: 710, price_paid: 14200 },
  { producer_name: "Andrés Muñoz", farm_name: "El Paraíso", municipality: "Timaná", kg_received: 190, moisture: 10.7, density: 705, price_paid: 14200 },
  { producer_name: "Camilo Rojas", farm_name: "La Florida", municipality: "Pitalito", kg_received: 210, moisture: 10.8, density: 709, price_paid: 14200 },
  { producer_name: "Sandra Castro", farm_name: "El Jardín", municipality: "Suaza", kg_received: 180, moisture: 10.6, density: 711, price_paid: 14200 },
  { producer_name: "Hernán Gómez", farm_name: "San Isidro", municipality: "Acevedo", kg_received: 160, moisture: 10.9, density: 706, price_paid: 14200 },
  { producer_name: "Gloria Medina", farm_name: "Buenavista", municipality: "Timaná", kg_received: 350, moisture: 10.7, density: 708, price_paid: 14200 }
];

async function seed() {
    try {
        console.log("Buscando el último lote creado...");
        const { data: lotData, error: lotError } = await supabase
            .from('commercial_lots')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (lotError || !lotData) {
            console.error("No se encontró ningún lote comercial. Crea uno desde la interfaz primero.");
            return;
        }

        const lotId = lotData.id;
        console.log(`Lote encontrado: ${lotData.lot_code} (${lotId})`);

        console.log(`Insertando ${entriesData.length} registros...`);
        let totalKg = lotData.accumulated_kg || 0;

        for (let i = 0; i < entriesData.length; i++) {
            const entry = entriesData[i];
            
            // Random yield factor between 90 and 94 to make it realistic
            const yieldFactor = (90 + Math.random() * 4).toFixed(1);

            const { error } = await supabase.from('commercial_entries').insert([{
                lot_id: lotId,
                producer_name: entry.producer_name,
                sica_code: `SICA-${1000 + i}`,
                farm_name: entry.farm_name,
                municipality: entry.municipality,
                kg_received: entry.kg_received,
                c_price_day: 0,
                premium: 0,
                price_paid: entry.price_paid,
                moisture: entry.moisture,
                density: entry.density,
                yield_factor: parseFloat(yieldFactor),
                defects: 1.5
            }]);

            if (error) {
                console.error(`Error insertando a ${entry.producer_name}:`, error);
            } else {
                totalKg += entry.kg_received;
            }
        }

        console.log(`Actualizando acumulado del lote a ${totalKg} KG...`);
        await supabase.from('commercial_lots').update({ accumulated_kg: totalKg }).eq('id', lotId);

        console.log("¡Carga simulada completada exitosamente!");

    } catch (e) {
        console.error("Exception:", e);
    }
}

seed();
