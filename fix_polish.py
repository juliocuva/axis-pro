import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace font-medium with font-normal globally to truly hit the 3 standard weights
content = content.replace('font-medium', 'font-normal')

# Fix the specific paragraph that looks too heavy
content = content.replace('text-sm text-gray-700 leading-relaxed font-bold', 'text-sm text-gray-700 leading-relaxed font-normal')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied final polish")
