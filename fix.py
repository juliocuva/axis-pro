import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    val = match.group(1)
    if val in ['[7px]', '[8px]', '[9px]', '[10px]', '[11px]', '[12px]', 'xs']:
        return 'text-[9px]'
    if val in ['sm', 'base', 'lg']:
        return 'text-sm'
    if val in ['xl', '2xl', '3xl', '4xl', '5xl']:
        return 'text-2xl'
    if val in ['6xl', '7xl', '8xl', '9xl']:
        return 'text-6xl'
    return match.group(0)

pattern = r'(?<=[\s"\'`])text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[\d+px\])(?=[ \s"\'`])'
new_content = re.sub(pattern, replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done properly replacing sizes')
