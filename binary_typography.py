import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ENFORCE 2 SIZES ONLY: text-[9px] (labels) and text-sm (everything else)
# We will eliminate text-2xl and text-3xl to collapse the hierarchy into 2 tiers.
content = content.replace('text-2xl', 'text-sm')
content = content.replace('text-3xl', 'text-sm')
content = content.replace('text-xl', 'text-sm')

# 2. ENFORCE 2 WEIGHTS ONLY: font-normal (labels) and font-medium (data)
# We eliminate font-black and font-bold to collapse into a binary system.
content = content.replace('font-black', 'font-medium')
content = content.replace('font-bold', 'font-medium')

# 3. GLOBAL CLASS REWRITING: Strict mapping
def binary_typography(match):
    classes = match.group(1)
    # If it has the label size, it MUST have normal weight
    if 'text-[9px]' in classes:
        # Remove any other weights/sizes and set to 9px normal
        new_classes = re.sub(r'font-\w+', '', classes)
        return f'className="{new_classes.strip()} font-normal"'
    # Otherwise, it MUST be sm medium
    else:
        new_classes = re.sub(r'font-\w+', '', classes)
        # Ensure it has text-sm (if it doesn't have a size, we add it)
        if 'text-' not in new_classes:
            new_classes += ' text-sm'
        else:
            new_classes = re.sub(r'text-\w+|text-\[.*?\]', 'text-sm', new_classes)
        return f'className="{new_classes.strip()} font-medium"'

content = re.sub(r'className="([^"]+)"', binary_typography, content)

# 4. FIX SVG/Recharts inline attributes (matching the 2-tier system)
content = content.replace('fontSize: 9', 'fontSize: 9')
content = content.replace('fontSize: 11', 'fontSize: 9')
content = content.replace('fontWeight: 500', 'fontWeight: 400')
content = content.replace('fontWeight: 700', 'fontWeight: 400')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Binary System Implemented: Exactly 2 sizes (9px/sm) and 2 weights (normal/medium).')
