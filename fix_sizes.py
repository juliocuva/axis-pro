import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Scale down hero text from 6xl to 3xl
content = content.replace('text-6xl', 'text-3xl')

# 2. Fix the tasting notes size
content = re.sub(
    r'text-2xl text-\[#1A1A1A\] leading-relaxed uppercase max-w-\[85%\] mx-auto font-black',
    'text-sm text-gray-700 leading-relaxed uppercase max-w-[85%] mx-auto font-normal',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Sizes adjusted")
