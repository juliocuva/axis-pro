import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Eliminate the 4th weight (font-bold) by collapsing it into font-medium
# This ensures exactly 3 weights: font-normal, font-medium, font-black
content = content.replace('font-bold', 'font-medium')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Collapsed rogue font-bold to font-medium")
