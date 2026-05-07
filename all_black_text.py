import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Force ALL text colors to Black (#1A1A1A)
# 1. Replace hex color green in Tailwind classes
content = content.replace('text-[#006056]', 'text-[#1A1A1A]')

# 2. Replace inline styles for text color
content = content.replace("color: '#006056'", "color: '#1A1A1A'")
content = content.replace('color: "#006056"', 'color: "#1A1A1A"')

# 3. Handle any other stray colors (red alerts, etc) to be Black
content = content.replace('text-red-600', 'text-[#1A1A1A]')
content = content.replace('text-white', 'text-[#1A1A1A]') # Careful here, but for buttons etc it might be needed if they are black on white now

# 4. Final check on SVG strokes for text-like elements
content = content.replace('stroke="#006056"', 'stroke="#1A1A1A"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Everything unified to pure Black text.')
