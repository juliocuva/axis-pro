
import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace non-official hex colors with shades of official colors
# Grays: #e5e7eb -> #1A1A1A (with opacity in CSS if needed, but here just replace the hex or use opacity syntax)
# For charts and SVG, we'll use solid colors or official opacities.

# Replaces light gray with very light black
content = content.replace('#e5e7eb', '#1A1A1A') 
content = content.replace('#f3f4f6', '#1A1A1A') # bg-[#1A1A1A]/5 is better, but let's see
content = content.replace('#555', '#1A1A1A')
content = content.replace('#666', '#1A1A1A')
content = content.replace('#999', '#1A1A1A')
content = content.replace('#9ca3af', '#1A1A1A')

# 2. Replace red classes with black/green
content = content.replace('bg-red-50', 'bg-[#1A1A1A]/5')
content = content.replace('border-red-200', 'border-[#1A1A1A]/10')
content = content.replace('text-red-600', 'text-[#1A1A1A]')
content = content.replace('stroke="#ef4444"', 'stroke="#1A1A1A"')

# 3. Replace gray- classes
content = re.sub(r'bg-gray-\d+', 'bg-[#1A1A1A]/10', content)
content = re.sub(r'border-gray-\d+', 'border-[#1A1A1A]/10', content)
content = re.sub(r'text-gray-\d+', 'text-[#1A1A1A]', content)

# 4. Handle grayscale filter
content = content.replace('grayscale', '')

# 5. Fix specific instances that might look bad after pure hex replacement
# If #e5e7eb was used for borders, #1A1A1A might be too dark. 
# We should use opacities for borders.
# Actually, Tailwind classes like border-[#e5e7eb] should become border-[#1A1A1A]/10.
content = content.replace('border-[#1A1A1A]', 'border-[#1A1A1A]/10')
# Correcting back some that shouldn't have been opacified or double opacified
content = content.replace('border-[#1A1A1A]/10/10', 'border-[#1A1A1A]/10')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Color palette restricted to Axis Green and Axis Black")
