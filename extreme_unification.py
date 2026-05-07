import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Map ALL results (values) to a single size and weight
# Currently results are a mix of text-sm, text-2xl, and different weights.
# We will make ALL data results text-sm font-medium, EXCEPT the hero scores.

# First, unify the "Hero" numbers (the big ones at the top and the specific cards)
# We want them to be text-2xl font-black (let's demote 3xl to 2xl to simplify further)
content = content.replace('text-3xl', 'text-2xl')

# Now we only have: text-[9px], text-sm, text-2xl.
# Let's ensure ALL data values use text-sm font-medium.
# We will search for common patterns where variables are rendered.

def unify_data_elements(match):
    full_tag = match.group(0)
    # If it's a label (9px), keep it normal
    if 'text-[9px]' in full_tag:
        return re.sub(r'font-\w+', 'font-normal', full_tag)
    # If it's a value (sm or 2xl), enforce weight
    if 'text-sm' in full_tag:
        return re.sub(r'font-\w+', 'font-medium', full_tag)
    if 'text-2xl' in full_tag:
        return re.sub(r'font-\w+', 'font-black', full_tag)
    return full_tag

content = re.sub(r'className="[^"]+"', unify_data_elements, content)

# 2. Cleanup any remaining inconsistencies in the Recharts/SVG elements
content = content.replace('fontSize: 11', 'fontSize: 9')
content = content.replace('fontSize: 10', 'fontSize: 9')
content = content.replace('fontWeight: 700', 'fontWeight: 400')
content = content.replace('fontWeight: 500', 'fontWeight: 400')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Strict unification: 3 sizes (9px, sm, 2xl) and 3 weights (normal, medium, black).')
