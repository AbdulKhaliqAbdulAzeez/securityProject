import re

with open('/home/kepler/Documents/Spring2026/IS219/securityProject/app/globals.css', 'r') as f:
    css = f.read()

# Replace :root variables
root_vars = """:root {
  --background: #0A0A0A;
  --panel: rgba(18, 18, 18, 0.6);
  --panel-strong: rgba(26, 26, 26, 0.8);
  --ink: #F7F7F8;
  --muted: #A0A0A0;
  --accent: #00E5FF;
  --accent-soft: rgba(0, 229, 255, 0.12);
  --border: rgba(255, 255, 255, 0.08);
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --success: #10B981;
  --success-soft: rgba(16, 185, 129, 0.12);
  --warning: #E11D48;
  --warning-soft: rgba(225, 29, 72, 0.12);
  --idle: #737373;
  --idle-soft: rgba(115, 115, 115, 0.12);
  --display-font: "Inter", "Geist", "Outfit", "Roboto", sans-serif;
  --body-font: "Inter", "Geist", "Outfit", "Roboto", sans-serif;
  --mono-font: "JetBrains Mono", "Fira Code", monospace;
}"""
css = re.sub(r':root\s*{[^}]+}', root_vars, css)

# Replace html background
html_bg = """html {
  background:
    radial-gradient(circle at top left, rgba(132, 79, 186, 0.15), transparent 32%),
    radial-gradient(circle at bottom right, rgba(0, 229, 255, 0.1), transparent 36%),
    var(--background);
}"""
css = re.sub(r'html\s*{[^}]+}', html_bg, css)

# Replace body background
body_bg = """body {
  margin: 0;
  color: var(--ink);
  font-family: var(--body-font);
  background:
    linear-gradient(180deg, rgba(10, 10, 10, 0.8), rgba(18, 18, 18, 0.95)),
    url("/workflow-grid.svg");
  background-size: cover, 720px 720px;
}"""
css = re.sub(r'body\s*{[^}]+}', body_bg, css)

# Replace specific component colors
css = css.replace('color: #f8f4eb;', 'color: #0A0A0A;')
css = css.replace('background: rgba(255, 255, 255, 0.5);', 'background: rgba(255, 255, 255, 0.05);')
css = css.replace('background: rgba(255, 255, 255, 0.6);', 'background: rgba(255, 255, 255, 0.06);')
css = css.replace('background: rgba(255, 255, 255, 0.76);', 'background: rgba(255, 255, 255, 0.08);')
css = css.replace('background: rgba(255, 255, 255, 0.56);', 'background: rgba(255, 255, 255, 0.05);')
css = css.replace('background: rgba(255, 255, 255, 0.54);', 'background: rgba(255, 255, 255, 0.05);')
css = css.replace('border-color: rgba(32, 28, 22, 0.09);', 'border-color: rgba(255, 255, 255, 0.09);')
css = css.replace('border: 1px solid rgba(32, 28, 22, 0.14);', 'border: 1px solid rgba(255, 255, 255, 0.14);')
css = css.replace('border-color: rgba(32, 28, 22, 0.1);', 'border-color: rgba(255, 255, 255, 0.1);')
css = css.replace('border: 1px solid rgba(31, 29, 26, 0.08);', 'border: 1px solid rgba(255, 255, 255, 0.08);')

css = css.replace('color: #f6efe5;', 'color: #0A0A0A;')

# Status chips
css = css.replace('background: rgba(191, 126, 55, 0.12);', 'background: rgba(16, 185, 129, 0.12);')
css = css.replace('color: #8a4d15;', 'color: var(--success);')
css = css.replace('border-color: rgba(138, 77, 21, 0.18);', 'border-color: rgba(16, 185, 129, 0.18);')
css = css.replace('color: #f7f2ea;', 'color: var(--ink);')

# Font replacements for pre
css = css.replace('font-family: var(--display-font);', 'font-family: var(--display-font);\\n  font-weight: 600;\\n  letter-spacing: -0.02em;')
css = re.sub(r'(\.code-panel pre.*?)font-size:', r'\1font-family: var(--mono-font);\n  font-size:', css, flags=re.DOTALL)
css = re.sub(r'(\.feedback-card__log.*?)font-size:', r'\1font-family: var(--mono-font);\n  font-size:', css, flags=re.DOTALL)


with open('/home/kepler/Documents/Spring2026/IS219/securityProject/app/globals.css', 'w') as f:
    f.write(css)

