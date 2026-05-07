
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\shared\components\ui\ExportReportButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Update windowWidth to 1200 to trigger 'md' and 'lg' media queries
# But keep element width at 750 for the A4 proportion
content = content.replace('windowWidth: 750,', 'windowWidth: 1200,')

# 2. Add a fix for flex layout in onclone
onclone_old = 'onclone: (clonedDoc) => {'
onclone_new = """onclone: (clonedDoc, element) => {
                    // Force the element to stay at 750px regardless of windowWidth
                    element.style.width = '750px';
                    element.style.minWidth = '750px';
                    element.style.maxWidth = '750px';
                    
                    // Fix for flex-row issues in html2canvas
                    const flexContainers = element.querySelectorAll('.flex');
                    flexContainers.forEach((container: any) => {
                        if (container.classList.contains('md:flex-row') || container.classList.contains('lg:flex-row')) {
                            container.style.flexDirection = 'row';
                        }
                    });"""

content = content.replace(onclone_old, onclone_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Forced desktop layout for export capture")
