-- =========================================================
-- PARCHE DE SEGURIDAD RLS PARA RETAIL - AXIS COFFEE PRO
-- Archivo: fix_retail_rls.sql
-- Instrucciones: Ejecuta este script en el SQL Editor de Supabase
-- =========================================================

-- 1. HABILITAR RLS EN LAS TABLAS DE RETAIL Y VENTAS
ALTER TABLE IF EXISTS public.retail_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales_records ENABLE ROW LEVEL SECURITY;

-- 2. OTORGAR PERMISOS BÁSICOS AL ROL AUTHENTICATED
GRANT ALL ON TABLE public.retail_inventory TO authenticated;
GRANT ALL ON TABLE public.sales_records TO authenticated;

-- (Opcional) Revocar acceso al rol anon si quieres que sea completamente privado
-- REVOKE ALL ON TABLE public.retail_inventory FROM anon;
-- REVOKE ALL ON TABLE public.sales_records FROM anon;

-- =========================================================
-- 3. POLÍTICAS RLS PARA RETAIL_INVENTORY (MULTI-TENANT por company_id)
-- =========================================================
DROP POLICY IF EXISTS "Company users can select retail_inventory" ON public.retail_inventory;
CREATE POLICY "Company users can select retail_inventory" 
ON public.retail_inventory FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Company users can insert retail_inventory" ON public.retail_inventory;
CREATE POLICY "Company users can insert retail_inventory" 
ON public.retail_inventory FOR INSERT 
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Company users can update retail_inventory" ON public.retail_inventory;
CREATE POLICY "Company users can update retail_inventory" 
ON public.retail_inventory FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Company users can delete retail_inventory" ON public.retail_inventory;
CREATE POLICY "Company users can delete retail_inventory" 
ON public.retail_inventory FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));


-- =========================================================
-- 4. POLÍTICAS RLS PARA SALES_RECORDS (MULTI-TENANT por company_id)
-- =========================================================
DROP POLICY IF EXISTS "Company users can select sales_records" ON public.sales_records;
CREATE POLICY "Company users can select sales_records" 
ON public.sales_records FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Company users can insert sales_records" ON public.sales_records;
CREATE POLICY "Company users can insert sales_records" 
ON public.sales_records FOR INSERT 
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Company users can update sales_records" ON public.sales_records;
CREATE POLICY "Company users can update sales_records" 
ON public.sales_records FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Company users can delete sales_records" ON public.sales_records;
CREATE POLICY "Company users can delete sales_records" 
ON public.sales_records FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 5. RECARGAR ESQUEMA PARA APLICAR CAMBIOS
NOTIFY pgrst, 'reload schema';
