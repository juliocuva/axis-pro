import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- RECONSTRUCCIÓN TOTAL ---
# 1. Definir Colores (Solo 2: Negro #1A1A1A y Verde #006056)
BLACK = '#1A1A1A'
GREEN = '#006056'

# 2. Definir Tipografía (2 Tamaños: 9px y 14px / 2 Pesos: 400 y 500)
# Vamos a usar Medium (500) para los resultados para que se vean, y Normal (400) para etiquetas.

def fix_all_styles(match):
    tag = match.group(1)
    classes = match.group(2)
    
    # Limpiar clases previas de color, tamaño y peso
    clean = re.sub(r'text-\w+|font-\w+|opacity-\d+|text-\[.*?\]|border-\w+|bg-\w+', '', classes)
    
    # Detectar si es un Label (generalmente tienen uppercase o gray en el original)
    # Si contiene palabras clave de etiquetas, le asignamos el estilo de Label
    is_label = any(kw in classes.lower() for kw in ['gray', 'opacity', '9px', 'uppercase'])
    
    if is_label:
        # ESTILO ETIQUETA: Negro con opacidad, 9px, Normal
        return f'<{tag} className="{clean.strip()} text-[#1A1A1A]/50 text-[9px] font-normal"'
    else:
        # ESTILO RESULTADO: Negro sólido, 14px (sm), Medium
        return f'<{tag} className="{clean.strip()} text-[#1A1A1A] text-sm font-medium"'

# Aplicar a etiquetas p y span principalmente
content = re.sub(r'<(p|span) className="([^"]+)"', fix_all_styles, content)

# 3. Forzar el color verde oficial en los elementos que deben ser verdes
content = content.replace('text-[#006056]', 'text-[#006056]') # Asegurar hex
content = content.replace('text-brand-green', 'text-[#006056]')

# 4. Asegurar que los contenedores no tengan clases rotas
content = re.sub(r'className="/[^"]*"', 'className=""', content)

# 5. Restaurar visibilidad de los datos principales (Score y Lote) en Negro sólido
# (Aunque sea el mismo tamaño, que sean negros puros)
content = content.replace('{lotData?.lot_number || \'LOTE-AXIS-001\'}', '<b className="text-[#1A1A1A] text-sm font-medium">{lotData?.lot_number || \'LOTE-AXIS-001\'}</b>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Reconstruction complete: 2 colors, 2 sizes, 2 weights.')
