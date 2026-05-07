import re

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\modules\supply\components\analysis\LotCertificate.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. First, we revert the damage from the previous script.
# We will restore a clear 2-tier system without over-injecting classes into containers.

# Strip the over-injected classes from common div/span containers
# We'll look for text-sm font-medium that was added to divs and headers
content = re.sub(r'<(div|span|h1|h2|h3|h4|header|section|img|svg|polyline|path|rect|circle|ResponsiveContainer|LineChart|Line|CartesianGrid|XAxis|YAxis|BarChart|Bar|Cell|RadarChart|Radar|PolarGrid|PolarAngleAxis|PolarRadiusAxis|Tooltip|QRCodeSVG)[^>]*className="[^"]*text-sm font-medium[^"]*"', lambda m: m.group(0).replace(' text-sm font-medium', ''), content)

# 2. Re-implement the 2x2 system CLEANLY
# Allowed Sizes: text-[9px], text-sm
# Allowed Weights: font-normal, font-bold (using bold instead of medium for better visibility)

# Define a function to fix a specific tag's classes
def fix_tag_typography(match):
    tag = match.group(1)
    classes = match.group(2)
    
    # Skip non-text elements that shouldn't have typography classes
    if tag.lower() in ['div', 'span', 'section', 'svg', 'img', 'responsivecontainer', 'linechart', 'barchart', 'radarchart']:
        # Only keep text classes if they were originally intended (labels or values)
        # But for safety, let's remove them from containers to allow inheritance or specific child styling
        return f'<{tag} className="{classes.replace("text-sm", "").replace("text-[9px]", "").replace("font-medium", "").replace("font-normal", "").replace("font-black", "").replace("font-bold", "").strip()}"'
    
    # For text elements (p, h1, h2, h3, h4, span used as text)
    if 'text-[9px]' in classes:
        # It's a LABEL
        clean = re.sub(r'font-\w+|text-\w+|text-\[.*?\]', '', classes)
        return f'<{tag} className="{clean.strip()} text-[9px] font-normal"'
    else:
        # It's a VALUE
        clean = re.sub(r'font-\w+|text-\w+|text-\[.*?\]', '', classes)
        return f'<{tag} className="{clean.strip()} text-sm font-bold"'

# Applying the fix only to elements that likely contain text
content = re.sub(r'<(p|h\d|span) className="([^"]+)"', fix_tag_typography, content)

# 3. Restore the Big Scores/IDs hierarchy just enough to be visible
# If it's a Lot ID or Score, use font-black
content = content.replace('{lotData?.lot_number || \'LOTE-AXIS-001\'}', '<span className="text-2xl font-black">{lotData?.lot_number || \'LOTE-AXIS-001\'}</span>')
content = content.replace('{scaData?.total_score ? Number(scaData.total_score).toFixed(2) : \'83.00\'}', '<span className="text-2xl font-black">{scaData?.total_score ? Number(scaData.total_score).toFixed(2) : \'83.00\'}</span>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Restored clarity and visibility.')
