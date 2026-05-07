
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Add more desktop forcing for grids
onclone_fix_old = r"container\.style\.flexDirection = 'row';\s+\}\s+\);"
onclone_fix_new = """container.style.flexDirection = 'row';
                        }
                    });
                    
                    const gridContainers = element.querySelectorAll('.grid');
                    gridContainers.forEach((grid: any) => {
                        if (grid.classList.contains('lg:grid-cols-4')) {
                            grid.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
                        }
                        if (grid.classList.contains('md:grid-cols-2')) {
                            grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
                        }
                        if (grid.classList.contains('grid-cols-3')) {
                            grid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
                        }
                    });"""

content = re.sub(onclone_fix_old, onclone_fix_new, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added more grid desktop forcing to ExportReportButton")
