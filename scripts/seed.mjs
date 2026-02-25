import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = 'https://nhhbncogvnocglrymizj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const lots = [
    {
        farmer_name: 'CARLOS SALAZAR',
        farm_name: 'FINCA LA ESPERANZA',
        lot_number: 'AX-7721',
        altitude: 1850,
        country: 'Colombia',
        region: 'Huila',
        variety: 'Pink Bourbon',
        process: 'washed',
        purchase_weight: 250,
        purchase_value: 4500000,
        purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: '99999999-9999-9999-9999-999999999999',
        status: 'purchased'
    },
    {
        farmer_name: 'CESAR RAMIREZ',
        farm_name: 'EL MIRADOR',
        lot_number: 'AX-8942',
        altitude: 1720,
        country: 'Colombia',
        region: 'Antioquia',
        variety: 'Caturra',
        process: 'honey',
        purchase_weight: 180,
        purchase_value: 2800000,
        purchase_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: '99999999-9999-9999-9999-999999999999',
        status: 'purchased'
    },
    {
        farmer_name: 'MARIA FORERO',
        farm_name: 'VILLA RICA',
        lot_number: 'AX-3310',
        altitude: 1600,
        country: 'Colombia',
        region: 'Tolima',
        variety: 'Castillo',
        process: 'washed',
        purchase_weight: 400,
        purchase_value: 5200000,
        purchase_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: '99999999-9999-9999-9999-999999999999',
        status: 'purchased'
    },
    {
        farmer_name: 'JUAN VALDEZ',
        farm_name: 'ALTOS DEL CAUCA',
        lot_number: 'AX-5567',
        altitude: 2100,
        country: 'Colombia',
        region: 'Cauca',
        variety: 'Geisha',
        process: 'natural',
        purchase_weight: 120,
        purchase_value: 6500000,
        purchase_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: '99999999-9999-9999-9999-999999999999',
        status: 'purchased'
    },
    {
        farmer_name: 'ALBA LUCIA',
        farm_name: 'SANTA HELENA',
        lot_number: 'AX-1289',
        altitude: 1950,
        country: 'Colombia',
        region: 'Nariño',
        variety: 'Tabi',
        process: 'semi-washed',
        purchase_weight: 300,
        purchase_value: 3900000,
        purchase_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        company_id: '99999999-9999-9999-9999-999999999999',
        status: 'purchased'
    }
]

async function seed() {
    console.log('🚀 Iniciando siembra de datos en AXIS Cloud...')

    for (const lot of lots) {
        process.stdout.write(`Insertando lote ${lot.lot_number}... `)
        const { error } = await supabase
            .from('coffee_purchase_inventory')
            .upsert([lot], { onConflict: 'lot_number' })

        if (error) {
            console.log('❌ Error:', error.message)
        } else {
            console.log('✅ OK')
        }
    }

    console.log('✨ Proceso completado.')
}

seed()
