
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Update element styles
element_style_old = r"element\.style\.width = '816px';\s+element\.style\.maxWidth = 'none';\s+element\.style\.minWidth = '816px';"
element_style_new = "element.style.width = '750px';\n            element.style.maxWidth = '750px';\n            element.style.minWidth = '750px';\n            element.style.marginLeft = '0';\n            element.style.marginRight = '0';"

content = re.sub(element_style_old, element_style_new, content)

# 2. Update parent styles
parent_style_old = r"if \(parent\) \{\s+parent\.style\.overflow = 'visible';\s+parent\.style\.maxWidth = 'none';\s+parent\.style\.width = 'auto';\s+\}"
parent_style_new = "if (parent) {\n                parent.style.display = 'block';\n                parent.style.overflow = 'visible';\n                parent.style.maxWidth = 'none';\n                parent.style.width = 'auto';\n                parent.style.padding = '0';\n                parent.style.margin = '0';\n            }"

content = re.sub(parent_style_old, parent_style_new, content)

# 3. Update html2canvas options
h2c_options_old = r"windowWidth: 816,\s+x: 0,\s+y: 0,\s+scrollX: 0,\s+scrollY: 0,"
h2c_options_new = "windowWidth: 750,\n                x: 0,\n                y: 0,\n                scrollX: -window.scrollX,\n                scrollY: -window.scrollY,"

content = re.sub(h2c_options_old, h2c_options_new, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed ExportReportButton capture styles")
