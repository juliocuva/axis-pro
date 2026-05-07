
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Update scale to 2.5 (safer than 3)
content = content.replace('scale: 3,', 'scale: 2.5,')

# 2. Refactor download to use Blob instead of DataURL (more efficient)
# This replaces lines 111-117 (approx)
old_download_block = r"const imgData = canvas\.toDataURL\('image/jpeg', 0\.95\);\s+// Descargar como imagen JPG\s+const link = document\.createElement\('a'\);\s+link\.href = imgData;\s+link\.download = `\${fileName}\.jpg`;\s+link\.click\();"

new_download_block = """const imgData = canvas.toDataURL('image/jpeg', 0.90);
            
            // Descargar como imagen JPG usando Blob para mayor eficiencia
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${fileName}.jpg`;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
            }, 'image/jpeg', 0.90);"""

# Use a more flexible regex for the download block replacement
pattern = re.escape("const imgData = canvas.toDataURL('image/jpeg', 0.95);") + r".*?link\.click\(\);"
content = re.sub(pattern, new_download_block, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Optimized download process with Blobs and adjusted scale")
