
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add type="button"
content = content.replace('<button', '<button\n            type="button"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added type='button' to ExportReportButton")
