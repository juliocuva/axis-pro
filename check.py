import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

sizes = set(re.findall(r'(?<=[\s\"\'\`])text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[\d+px\])(?=[ \s\"\'\`])', c))
weights = set(re.findall(r'\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b', c))

print('Sizes:', sizes)
print('Weights:', weights)
