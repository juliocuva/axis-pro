
import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove opacity classes from text elements
# Common patterns: opacity-30, opacity-40, opacity-50, opacity-60, opacity-70, opacity-80
# Also text-[#1A1A1A]/60 etc.

content = re.sub(r'opacity-\d+', '', content)
content = re.sub(r'text-\[#1A1A1A\]/\d+', 'text-[#1A1A1A]', content)

# Clean up extra spaces in className attributes
content = re.sub(r'className=" +', 'className="', content)
content = re.sub(r' +"', '"', content)
content = re.sub(r'  +', ' ', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(content)

print("Opacities removed and text darkened")
