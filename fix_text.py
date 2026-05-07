import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix text-center alignment on the notes container
content = content.replace(
    '<div className="pb-4 border-b border-gray-200 w-full text-center">',
    '<div className="pb-4 border-b border-gray-200 w-full text-left">'
)

# Remove the 'lowercase' and 'mx-auto' centerings, letting it flow naturally to the left
content = content.replace(
    'text-sm text-gray-700 leading-relaxed lowercase max-w-[85%] mx-auto font-normal',
    'text-sm text-gray-700 leading-relaxed font-normal'
)

# Also fix the main title of that section if it was centered
content = content.replace(
    '<div className="flex flex-col items-center mb-6 text-center">',
    '<div className="flex flex-col items-start mb-6 text-left">'
)

# Fix the Roast profile paragraph if it was centered (it wasn't, but let's ensure left alignment)
# "espacio en blanco" logic

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Text layout refined")
