
import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix solid black backgrounds that should be opacified
# Matches bg-[#1A1A1A] but NOT bg-[#1A1A1A]/...
content = re.sub(r'bg-\[#1A1A1A\](?![/\]])', 'bg-[#1A1A1A]/5', content)

# Ensure borders have opacity so they are not solid black lines
content = re.sub(r'border-\[#1A1A1A\](?![/\]])', 'border-[#1A1A1A]/10', content)

# Check for any lingering gray/red/etc
content = content.replace('bg-brand-green', 'bg-[#006056]')
content = content.replace('bg-brand-green-bright', 'bg-[#006056]')
content = content.replace('border-brand-green/30', 'border-[#006056]/30')

# Roast curve grid line should be light
content = content.replace('stroke="#1A1A1A" vertical={false}', 'stroke="#1A1A1A" strokeOpacity={0.1} vertical={false}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Colors refined")
