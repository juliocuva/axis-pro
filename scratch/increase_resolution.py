
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Increase scale to 3
content = content.replace('scale: 2,', 'scale: 3,')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully increased export scale to 3")
