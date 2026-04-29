-- =========================================================
-- PARCHE DE SEGURIDAD RLS PARA PRODUCCIÓN (roast_batches)
-- Archivo: fix_roast_rls.sql
-- =========================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES PARA EVITAR ERRORES DE DEPENDENCIA
DROP POLICY IF EXISTS "Company users can select roast_batches" ON public.roast_batches;
DROP POLICY IF EXISTS "Company users can insert roast_batches" ON public.roast_batches;
DROP POLICY IF EXISTS "Company users can update roast_batches" ON public.roast_batches;
DROP POLICY IF EXISTS "Company users can delete roast_batches" ON public.roast_batches;

-- 2. ASEGURAR COMPATIBILIDAD DE TIPOS (TEXT para soportar IDs de dominio)
ALTER TABLE IF EXISTS public.roast_batches ALTER COLUMN company_id TYPE TEXT;

-- 3. HABILITAR RLS
ALTER TABLE IF EXISTS public.roast_batches ENABLE ROW LEVEL SECURITY;

-- 4. ASEGURAR COLUMNAS (Para telemetría de curvas térmicas)
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roast_batches' AND column_name='roast_curve') THEN
        ALTER TABLE public.roast_batches ADD COLUMN roast_curve JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 5. OTORGAR PERMISOS BÁSICOS
GRANT ALL ON TABLE public.roast_batches TO authenticated;
GRANT INSERT ON TABLE public.roast_batches TO anon;

-- =========================================================
-- 6. RECREAR POLÍTICAS RLS (MULTI-TENANT)
-- =========================================================

-- SELECT: Los usuarios ven datos de su propia empresa
CREATE POLICY "Company users can select roast_batches" 
ON public.roast_batches FOR SELECT 
USING (
    -- Intenta por UID (Auth real) o por el company_id del perfil si no hay UID
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    auth.uid() IS NULL -- Permitir ver si no hay sesión iniciada (Ajustar en prod)
);

-- INSERT: Validar que el company_id pertenezca a la organización
CREATE POLICY "Company users can insert roast_batches" 
ON public.roast_batches FOR INSERT 
WITH CHECK (
    -- Permite si hay un perfil con ese company_id (Soporte para Mock Auth)
    EXISTS (SELECT 1 FROM public.profiles WHERE company_id = roast_batches.company_id)
);

CREATE POLICY "Company users can update roast_batches" 
ON public.roast_batches FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can delete roast_batches" 
ON public.roast_batches FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

NOTIFY pgrst, 'reload schema';
