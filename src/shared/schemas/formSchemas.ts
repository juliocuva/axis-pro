import { z } from 'zod';

export const purchaseSchema = z.object({
    farmerName: z.string().min(2, "El nombre del productor es requerido"),
    farmName: z.string().min(2, "El nombre de la finca es requerido"),
    lotNumber: z.string().min(1, "El número de lote es requerido"),
    altitude: z.preprocess((a) => Number(a), z.number().positive("La altitud debe ser un número positivo")),
    country: z.string().min(2, "El país es requerido"),
    region: z.string().min(2, "La región es requerida"),
    municipality: z.string().optional(),
    variety: z.string().min(2, "La variedad es requerida"),
    process: z.string().min(2, "El proceso es requerido"),
    purchaseWeight: z.preprocess((a) => Number(a), z.number().positive("El peso debe ser mayor a 0")),
    purchaseValue: z.preprocess((a) => Number(a), z.number().min(0, "El valor de compra no puede ser negativo")),
    purchaseDate: z.string().min(10, "La fecha de compra es inválida"),
    harvestDate: z.string().min(10, "La fecha de cosecha es inválida"),
    destination: z.string().optional(),
    exportCertificate: z.preprocess((a) => Boolean(a), z.boolean().optional()),
    latitude: z.preprocess((a) => (a === "" || a === undefined || a === null) ? undefined : Number(a), z.number().optional()),
    longitude: z.preprocess((a) => (a === "" || a === undefined || a === null) ? undefined : Number(a), z.number().optional()),
    coffeeType: z.string().min(2, "El tipo de café es requerido"),
    area_ha: z.preprocess((a) => (a === "" || a === undefined || a === null) ? undefined : Number(a), z.number().positive("El área debe ser positiva").optional()),
    // processData is loosely checked or omitted from primary form validation if it's dynamic
    processData: z.any().optional(),
    sicaId: z.string().optional(),
    companyId: z.string().optional(),
});

export type PurchaseSchemaType = z.infer<typeof purchaseSchema>;
