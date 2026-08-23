import os
import re

files = [
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\page.tsx',
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\analytics\page.tsx',
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\coupons\page.tsx',
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\inventory\page.tsx',
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\orders\page.tsx',
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\payments\page.tsx',
  r'D:\Program Work\Project in Vibe Coding\FastShopBD\frontend\src\app\admin\products\page.tsx'
]

mappings = {
    'bg-white': 'dark:bg-ink-900',
    'bg-ink-50': 'dark:bg-ink-950',
    'bg-ink-100': 'dark:bg-ink-850',
    'border-ink-100': 'dark:border-ink-800',
    'border-ink-200': 'dark:border-ink-800',
    'text-ink-900': 'dark:text-ink-50',
    'text-ink-800': 'dark:text-ink-100',
    'text-ink-700': 'dark:text-ink-200',
    'text-ink-600': 'dark:text-ink-300',
    'text-ink-500': 'dark:text-ink-400',
    'hover:bg-ink-50': 'dark:hover:bg-ink-800',
    'hover:bg-ink-100': 'dark:hover:bg-ink-800',
    'shadow-xs': 'dark:shadow-none',
    'hover:text-ink-900': 'dark:hover:text-ink-50'
}

for filepath in files:
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    def replace_class(match):
        classes_str = match.group(2)
        classes = classes_str.split()
        new_classes = []
        for cls in classes:
            new_classes.append(cls)
            if cls in mappings:
                dark_cls = mappings[cls]
                if dark_cls not in classes:
                    new_classes.append(dark_cls)
            # handle bg-ink-50/50 etc
            if cls.startswith('bg-ink-50/') and 'dark:bg-ink-950/' not in classes_str:
                new_classes.append(cls.replace('bg-ink-50/', 'dark:bg-ink-950/'))
            if cls.startswith('hover:bg-ink-50/') and 'dark:hover:bg-ink-800/' not in classes_str:
                new_classes.append(cls.replace('hover:bg-ink-50/', 'dark:hover:bg-ink-800/'))
                
        # Tab exceptions:
        if 'bg-white' in classes and 'text-ink-900' in classes and 'shadow-xs' in classes:
             # we change 'dark:bg-ink-900' to 'dark:bg-ink-800'
             if 'dark:bg-ink-900' in new_classes:
                 new_classes.remove('dark:bg-ink-900')
             if 'dark:bg-ink-800' not in new_classes:
                 new_classes.append('dark:bg-ink-800')

        # Input exception:
        tag_name = match.group(1).strip()
        if tag_name in ['input', 'select', 'textarea']:
             if 'bg-white' in classes:
                 if 'dark:bg-ink-900' in new_classes:
                     new_classes.remove('dark:bg-ink-900')
                 if 'dark:bg-ink-850' not in new_classes:
                     new_classes.append('dark:bg-ink-850')
                 if 'dark:text-ink-100' not in new_classes:
                     new_classes.append('dark:text-ink-100')
                 if 'dark:border-ink-700' not in new_classes:
                     new_classes.append('dark:border-ink-700')

        # avoid duplicates
        seen = set()
        final_classes = []
        for c in new_classes:
            if c not in seen:
                final_classes.append(c)
                seen.add(c)
                
        return f'{match.group(1)}className="{ " ".join(final_classes) }"'

    # Regex to find className attributes
    # Match both standard components and Next.js elements. 
    # Example: <div className="bg-white"> or <input type="text" className="bg-white">
    # Group 1: anything before className="
    # Group 2: the class string
    # We must match className="..." or className={`...`} carefully
    # But since JSX might have templates like className={`px-3 ${cond ? 'bg-white' : ''}`},
    # regex might not cover everything. Let's do a simpler approach: finding 'bg-white' and appending its dark counterpart right after it, if not already there!

    new_content = content
    
    # 1. Inputs and Selects: replace bg-white
    new_content = re.sub(r'(<(?:input|select|textarea)[^>]*?className="[^"]*?)\bbg-white\b(?![^"]*dark:bg-ink)', r'\1bg-white dark:bg-ink-850 dark:text-ink-100 dark:border-ink-700', new_content)
    
    # 2. Tabs: `bg-white text-ink-900 shadow-xs`
    # Replace in JS templates too
    new_content = re.sub(r"\bbg-white text-ink-900 shadow-xs\b", "bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none", new_content)

    # 3. Apply mappings
    for cls, dark_cls in mappings.items():
        # Negative lookahead to ensure we don't duplicate
        # Also ensure we don't match something inside already processed strings.
        # e.g., 'bg-white' -> 'bg-white dark:bg-ink-900'
        # But skip if dark:bg-ink is already there right after or somewhere nearby.
        # It's simpler to just replace all classes if they don't have dark_cls
        pattern = r'\b' + cls + r'\b(?!\/)(?!\s+' + dark_cls.replace(':', r'\:') + r')'
        # we can just use re.sub with a function
        
        def replacer(m):
            # check if the match is inside a className string
            return f'{m.group(0)} {dark_cls}'
            
        # Instead of global replace which might hit imports, only replace inside strings (single, double, backtick)
        # Actually, tailwind classes in these files only appear in classNames.
        
    def class_string_replacer(match):
        # match is the content of quotes or backticks in className
        cls_str = match.group(2)
        
        # Tabs exception
        cls_str = cls_str.replace("bg-white text-ink-900 shadow-xs", "bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none")
        
        for cls, dark_cls in mappings.items():
            # if cls is bg-white and we are in an input/select, this was handled above or we can handle it here
            pattern = r'\b' + re.escape(cls) + r'\b(?!\/)'
            # find all occurrences
            # add dark_cls if not exists
            if dark_cls not in cls_str:
                cls_str = re.sub(pattern, lambda m: f"{m.group(0)} {dark_cls}", cls_str)
                
        # Handle bg-ink-50/50
        cls_str = re.sub(r'\bbg-ink-50/(\d+)\b(?!\s+dark:bg-ink-950)', r'bg-ink-50/\1 dark:bg-ink-950/\1', cls_str)
        cls_str = re.sub(r'\bhover:bg-ink-50/(\d+)\b(?!\s+dark:hover:bg-ink-800)', r'hover:bg-ink-50/\1 dark:hover:bg-ink-800/\1', cls_str)

        return f'{match.group(1)}{cls_str}{match.group(3)}'

    # Match className="...", className={'...'}, className={`...`}
    # Actually simpler: match className="<content>"
    new_content = re.sub(r'(className=")([^"]*)(")', class_string_replacer, new_content)
    new_content = re.sub(r"(className=\{'[^']*')([^']*)('})", class_string_replacer, new_content)
    
    # For backticks, it's multiline or has ${...}
    # We can split by lines or just apply to the whole backtick string if we are careful
    def backtick_replacer(match):
        cls_str = match.group(2)
        cls_str = cls_str.replace("bg-white text-ink-900 shadow-xs", "bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none")
        for cls, dark_cls in mappings.items():
            pattern = r'\b' + re.escape(cls) + r'\b(?!\/)'
            # add dark_cls if not exists
            if dark_cls not in cls_str:
                cls_str = re.sub(pattern, lambda m: f"{m.group(0)} {dark_cls}", cls_str)
        cls_str = re.sub(r'\bbg-ink-50/(\d+)\b(?!\s+dark:bg-ink-950)', r'bg-ink-50/\1 dark:bg-ink-950/\1', cls_str)
        cls_str = re.sub(r'\bhover:bg-ink-50/(\d+)\b(?!\s+dark:hover:bg-ink-800)', r'hover:bg-ink-50/\1 dark:hover:bg-ink-800/\1', cls_str)
        return f'{match.group(1)}{cls_str}{match.group(3)}'
        
    new_content = re.sub(r'(className=\{`)(.*?)(`\})', backtick_replacer, new_content, flags=re.DOTALL)

    # Input/Select/Textarea specific replacements
    # If they still have bg-white dark:bg-ink-900, replace with dark:bg-ink-850 dark:text-ink-100 dark:border-ink-700
    # A bit hacky but works: find <input ... className="... bg-white dark:bg-ink-900 ..." ...>
    
    # We can just write a quick pass for inputs
    def fix_inputs(match):
        tag = match.group(0)
        if 'bg-white' in tag:
            tag = tag.replace('dark:bg-ink-900', 'dark:bg-ink-850 dark:text-ink-100 dark:border-ink-700')
        return tag
        
    new_content = re.sub(r'<(?:input|select|textarea)[^>]*>', fix_inputs, new_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated: {filepath}")

