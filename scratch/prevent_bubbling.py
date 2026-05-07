
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update handleDownload signature and add preventDefault/stopPropagation
content = content.replace('const handleDownload = async () => {', 'const handleDownload = async (e: React.MouseEvent) => {\n        e.preventDefault();\n        e.stopPropagation();')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added event prevention to handleDownload")
