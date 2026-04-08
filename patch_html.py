import re

with open('index.html', 'r') as f:
    html = f.read()

images = ['abstract_nebula.png', 'neural_geometric.png', 'dark_fluid.png']
hues = [0, 180, 60, 220, 50, 120, 300, 280]

def replacer(match):
    replacer.count += 1
    idx = replacer.count - 1
    if idx >= len(hues): return match.group(0) # For non-session cards just in case
    
    img = images[idx % len(images)]
    hue = hues[idx]
    
    # Prepend the style attribute into the div
    original_tag = match.group(1)
    new_tag = original_tag.replace('class="', f'style="--card-bg-img: url(\'assets/thumbnails/{img}\'); --card-hue: {hue}deg;" class="')
    return new_tag

replacer.count = 0

# Match <div class="dash-card...">
new_html = re.sub(r'(<div[^>]*class="dash-card[^>]*>)', replacer, html)

with open('index.html', 'w') as f:
    f.write(new_html)
