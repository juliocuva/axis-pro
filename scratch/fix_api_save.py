
import os

file_path = r'c:\FullStackDeveloper\axis-oil\axis_pro\src\app\api\pdf\save\route.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """        // Save file
        const filePath = path.join(impDir, `${fileName}.jpg`);
        fs.writeFileSync(filePath, base64Data, 'base64');"""

new_code = """        // Sanitize fileName to avoid invalid characters or directory traversal
        const sanitizedFileName = fileName.replace(/[\\\\/:*?"<>|]/g, '_');

        // Save file
        const filePath = path.join(impDir, `${sanitizedFileName}.jpg`);
        fs.writeFileSync(filePath, base64Data, 'base64');"""

if old_code in content:
    new_content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully sanitized fileName in API route")
else:
    # Try with different indentation or just regex
    import re
    pattern = re.escape("const filePath = path.join(impDir, `${fileName}.jpg`);")
    replacement = "const sanitizedFileName = fileName.replace(/[\\\\/:*?\"<>|]/g, '_');\n        const filePath = path.join(impDir, `${sanitizedFileName}.jpg`);"
    if re.search(pattern, content):
        new_content = re.sub(pattern, replacement, content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully sanitized fileName in API route using regex")
    else:
        print("Could not find the target code block")
