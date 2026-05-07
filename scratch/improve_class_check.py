
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Use a more robust check for classes in onclone
onclone_flex_fix_old = r"if \(container\.classList\.contains\('md:flex-row'\) \|\| container\.classList\.contains\('lg:flex-row'\)\) \{"
onclone_flex_fix_new = "if (container.className.includes('md:flex-row') || container.className.includes('lg:flex-row')) {"

content = re.sub(onclone_flex_fix_old, onclone_flex_fix_new, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Improved class check in ExportReportButton onclone")
