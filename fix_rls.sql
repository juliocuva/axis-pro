-- =========================================================
-- PARCHE DE SEGURIDAD RLS - AXIS COFFEE PRO
-- Archivo: fix_rls.sql
-- Instrucciones: Ejecuta este script en el SQL Editor de Supabase
-- =========================================================

-- 1. ELIMINAR POLÍTICAS PERMISIVAS ANTERIORES (si existen)
DROP POLICY IF EXISTS "Allow All" ON public.profiles;

-- 2. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_purchase_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sca_cupping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_exports ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. POLÍTICAS PARA LA TABLA PROFILES
-- =========================================================

-- Permitir a los usuarios insertar su propio perfil en el registro (Auth)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Permitir a los usuarios ver su propio perfil y el de otros en su misma empresa
CREATE POLICY "Users can view own and company profiles" 
ON public.profiles FOR SELECT 
USING (
  id = auth.uid() OR 
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Permitir a los usuarios actualizar solo su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

-- =========================================================
-- 4. POLÍTICAS PARA TABLAS DE NEGOCIO (MULTI-TENANT)
-- Aislamiento de datos: Los usuarios solo pueden ver/editar 
-- los datos que pertenezcan al 'company_id' de su perfil.
-- =========================================================

-- COFFEE PURCHASE INVENTORY
CREATE POLICY "Company users can select inventory" 
ON public.coffee_purchase_inventory FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can insert inventory" 
ON public.coffee_purchase_inventory FOR INSERT 
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can update inventory" 
ON public.coffee_purchase_inventory FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can delete inventory" 
ON public.coffee_purchase_inventory FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- PHYSICAL ANALYSIS
CREATE POLICY "Company users can select physical_analysis" 
ON public.physical_analysis FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can insert physical_analysis" 
ON public.physical_analysis FOR INSERT 
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can update physical_analysis" 
ON public.physical_analysis FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can delete physical_analysis" 
ON public.physical_analysis FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- SCA CUPPING
CREATE POLICY "Company users can select sca_cupping" 
ON public.sca_cupping FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can insert sca_cupping" 
ON public.sca_cupping FOR INSERT 
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can update sca_cupping" 
ON public.sca_cupping FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can delete sca_cupping" 
ON public.sca_cupping FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- GREEN EXPORTS
CREATE POLICY "Company users can select green_exports" 
ON public.green_exports FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can insert green_exports" 
ON public.green_exports FOR INSERT 
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can update green_exports" 
ON public.green_exports FOR UPDATE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Company users can delete green_exports" 
ON public.green_exports FOR DELETE 
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 5. RECARGAR ESQUEMA PARA APLICAR CAMBIOS
NOTIFY pgrst, 'reload schema';
