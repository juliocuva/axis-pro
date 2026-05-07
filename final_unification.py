import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Unify all font weights to exactly 3: font-normal, font-medium, font-black
content = content.replace('font-bold', 'font-medium')
content = content.replace('font-semibold', 'font-medium')

# 2. Unify all text sizes to exactly 4: text-[9px], text-sm, text-2xl, text-3xl
content = content.replace('text-xs', 'text-[9px]')
content = content.replace('text-base', 'text-sm')
content = content.replace('text-lg', 'text-sm')
content = content.replace('text-xl', 'text-2xl')
content = content.replace('text-4xl', 'text-3xl')
content = content.replace('text-5xl', 'text-3xl')
content = content.replace('text-6xl', 'text-3xl')

# 3. Unify colors to Official Green (#006056) and Official Black (#1A1A1A)
content = content.replace('text-gray-900', 'text-[#1A1A1A]')
content = content.replace('text-gray-800', 'text-[#1A1A1A]')
content = content.replace('text-gray-700', 'text-[#1A1A1A]/80')
content = content.replace('text-gray-600', 'text-[#1A1A1A]/60')
content = content.replace('text-gray-500', 'text-[#1A1A1A]/50')
content = content.replace('text-gray-400', 'text-[#1A1A1A]/40')
content = content.replace('text-black', 'text-[#1A1A1A]')

# 4. Standardize inline Recharts styles
content = content.replace('fontSize: 11', 'fontSize: 9')
content = content.replace('fontSize: 10', 'fontSize: 9')
content = content.replace('fontWeight: 700', 'fontWeight: 500')
content = content.replace('fontWeight: "700"', 'fontWeight: "500"')
content = content.replace("fontWeight: '700'", "fontWeight: '500'")
content = content.replace('fill: "#666"', 'fill: "#1A1A1A"')
content = content.replace('fill: "#555"', 'fill: "#1A1A1A"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Document unified to 4 sizes, 3 weights, and 2 official colors.')
