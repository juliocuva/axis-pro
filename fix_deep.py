import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Unify inline Recharts styles
content = content.replace('fontSize: 11', 'fontSize: 9')
content = content.replace('fontSize: 10', 'fontSize: 9')
content = content.replace("fontWeight: '700'", "fontWeight: '500'")
content = content.replace('fontWeight: "700"', 'fontWeight: "500"')

# 2. Fix stray colors to match our #1A1A1A / #006056 system
content = content.replace('text-black', 'text-[#1A1A1A]')
content = content.replace('fill: "#666"', 'fill: "#1A1A1A"')
content = content.replace('fill: "#555"', 'fill: "#1A1A1A"')

# 3. Ensure no font-bold exists
content = content.replace('font-bold', 'font-medium')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Deep unification complete.')
