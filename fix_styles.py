import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Strip ALL existing font-weight classes
content = re.sub(r'\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b', '', content)

# 2. Strip ALL tracking classes
content = re.sub(r'\btracking-[^\s"\']+', '', content)

# 3. Clean up spaces
content = re.sub(r' +', ' ', content)
content = content.replace('className=" ', 'className="').replace(' "', '"')

# 4. Inject smart weights based on text size
def inject_weight(match):
    class_str = match.group(1).strip()
    
    if 'text-[9px]' in class_str:
        return f'className="{class_str} font-medium"'
    elif 'text-sm' in class_str:
        return f'className="{class_str} font-bold"'
    elif 'text-2xl' in class_str or 'text-6xl' in class_str:
        return f'className="{class_str} font-black"'
    
    return f'className="{class_str}"'

content = re.sub(r'className="([^"]+)"', inject_weight, content)

# 5. One final space cleanup just in case
content = re.sub(r' +', ' ', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Smart styling applied: tracking removed, weights mapped to sizes.")
