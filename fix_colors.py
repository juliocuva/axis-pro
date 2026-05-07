import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Unified Color Palette:
# BLACK = #1A1A1A
# GREEN = #006056

# 1. Standardize all text to Black (#1A1A1A) with halftone/opacities for hierarchy
content = content.replace('text-gray-900', 'text-[#1A1A1A]')
content = content.replace('text-gray-800', 'text-[#1A1A1A]')
content = content.replace('text-gray-700', 'text-[#1A1A1A]/80')
content = content.replace('text-gray-600', 'text-[#1A1A1A]/60')
content = content.replace('text-gray-500', 'text-[#1A1A1A]/50')
content = content.replace('text-gray-400', 'text-[#1A1A1A]/40')

# 2. Standardize borders to Black halftones
content = content.replace('border-gray-200', 'border-[#1A1A1A]/10')
content = content.replace('border-gray-100', 'border-[#1A1A1A]/5')
content = content.replace('border-[#e5e7eb]', 'border-[#1A1A1A]/10')

# 3. Standardize backgrounds to Black halftones
content = content.replace('bg-[#f9fafb]', 'bg-[#1A1A1A]/[0.02]')
content = content.replace('bg-gray-100', 'bg-[#1A1A1A]/5')
content = content.replace('bg-gray-50', 'bg-[#1A1A1A]/[0.02]')

# 4. Standardize all stray greens to the official #006056
# Let's ensure no other hex colors are lurking un-standardized
# For example, if there is a random #059669 (emerald-600) or similar
content = content.replace('#10b981', '#006056')
content = content.replace('#059669', '#006056')
content = content.replace('#34d399', '#006056')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Colors unified to #1A1A1A and #006056")
