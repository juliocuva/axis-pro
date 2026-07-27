import { NextResponse } from 'next/server';

export async function GET() {
    try {
        let trm = 3940.50;
        let trmChange = '-0.12%';
        let trmIsUp = false;

        // 1. Fetch Official TRM (USD/COP) from Colombia Superfinanciera (datos.gov.co OData API)
        try {
            const trmRes = await fetch('https://www.datos.gov.co/resource/ceyp-9c7c.json?$limit=2&$order=vigenciadesde%20DESC', {
                next: { revalidate: 3600 } // cache for 1 hour
            });
            if (trmRes.ok) {
                const trmRaw = await trmRes.json();
                // Handle both flat array and OData wrapped { value: [...] } responses
                const trmData = Array.isArray(trmRaw) ? trmRaw : (trmRaw?.value || []);
                if (trmData.length >= 1) {
                    const currentTrm = parseFloat(trmData[0].valor);
                    if (!isNaN(currentTrm)) trm = currentTrm;
                    if (trmData.length >= 2) {
                        const prevTrm = parseFloat(trmData[1].valor);
                        const diffPct = ((currentTrm - prevTrm) / prevTrm) * 100;
                        trmIsUp = diffPct >= 0;
                        trmChange = `${trmIsUp ? '+' : ''}${diffPct.toFixed(2)}%`;
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching TRM from datos.gov.co:', e);
        }

        // 2. Fetch ICE Coffee C Futures from Yahoo Finance API (ticker KC=F)
        let iceCoffee = 2.45;
        let iceChange = '+1.20%';
        let iceIsUp = true;

        try {
            const yahooRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/KC=F?interval=1d&range=2d', {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                next: { revalidate: 900 } // cache for 15 min
            });
            if (yahooRes.ok) {
                const yData = await yahooRes.json();
                const meta = yData?.chart?.result?.[0]?.meta;
                if (meta) {
                    const currentPrice = meta.regularMarketPrice;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    if (currentPrice) {
                        iceCoffee = (currentPrice / 100); // KC=F is quoted in cents per lb
                        if (previousClose) {
                            const diffPct = ((currentPrice - previousClose) / previousClose) * 100;
                            iceIsUp = diffPct >= 0;
                            iceChange = `${iceIsUp ? '+' : ''}${diffPct.toFixed(2)}%`;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching ICE Coffee from Yahoo Finance:', e);
        }

        // 3. Calculate Carga FNC (125kg pergamino seco, factor rendimiento 94)
        // Real FNC methodology:
        //   - 1 carga = 125 kg pergamino seco
        //   - Factor 94: 94 kg pergamino → 70 kg excelso (1 saco export)
        //   - Excelso per carga: (125 / 94) * 70 = 93.085 kg = 205.24 lbs
        //   - Colombian differential (prima calidad): ~$0.15 USD/lb
        //   - Carga COP = lbs_excelso × (ICE_C_USD/lb + diferencial) × TRM
        const lbsExcelsoPerCarga = (125 / 94) * 70 / 0.453592; // ~205.24 lbs
        const colombianDifferential = 0.15; // USD/lb prima café colombiano
        const cargaCalculated = Math.round(lbsExcelsoPerCarga * (iceCoffee + colombianDifferential) * trm);
        const formattedCarga = `$${cargaCalculated.toLocaleString('es-CO')}`;

        return NextResponse.json({
            success: true,
            updatedAt: new Date().toISOString(),
            iceCoffee: {
                label: 'ICE C',
                price: iceCoffee.toFixed(2),
                formatted: `$${iceCoffee.toFixed(2)}`,
                unit: 'USD/lb',
                change: iceChange,
                isUp: iceIsUp
            },
            cargaFnc: {
                label: 'CARGA FNC',
                value: formattedCarga,
                unit: 'COP',
                change: iceChange,
                isUp: iceIsUp
            },
            trm: {
                label: 'TRM',
                value: `$${trm.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                unit: 'COP',
                change: trmChange,
                isUp: trmIsUp
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch live market data'
        }, { status: 500 });
    }
}
