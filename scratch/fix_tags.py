
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Target line:   </div> {/* Cierra el area de impresion lot-certificate-area */}
# We want to insert another </div> before it.

for i, line in enumerate(lines):
    if 'Cierra el area de impresion lot-certificate-area' in line:
        lines.insert(i, '      </div>\n')
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed tag balance")
