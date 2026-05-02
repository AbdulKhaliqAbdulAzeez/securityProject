import re

with open('app/globals.css', 'r') as f:
    css = f.read()

# Replace .site-frame
site_frame_pattern = r'\.site-frame\s*\{\s*min-height:\s*100vh;\s*\}'
site_frame_new = """.site-frame {
  height: 100vh;
  display: flex;
  flex-direction: column;
}"""
css = re.sub(site_frame_pattern, site_frame_new, css)

# Replace .site-header, .site-footer
header_footer_pattern = r'\.site-header,\s*\.site-footer\s*\{\s*width:[^}]+margin:[^}]+\}'
header_footer_new = """.site-header,
.site-footer {
  width: 100%;
  padding: 1rem 2rem;
  margin: 0;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}"""
css = re.sub(header_footer_pattern, header_footer_new, css)

# Modify .site-footer
css = css.replace('.site-footer {\n  color: var(--muted);\n}', '.site-footer {\n  color: var(--muted);\n  border-top: 1px solid var(--border);\n  border-bottom: none;\n  font-size: 0.85rem;\n  padding: 0.75rem 2rem;\n}')

# Fix .site-header specific padding
header_specific = r'\.site-header\s*\{\s*display:\s*flex;[^}]+padding:[^}]+\}'
header_specific_new = """.site-header {
  display: flex;
  justify-content: space-between;
  gap: 1.25rem;
  align-items: center;
  padding: 1rem 2rem;
}"""
css = re.sub(header_specific, header_specific_new, css)

# Replace .workflow-page
workflow_page_pattern = r'\.workflow-page\s*\{\s*width:[^}]+margin:[^}]+padding:[^}]+\}'
workflow_page_new = """.workflow-page {
  flex: 1;
  width: 100%;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 420px 1fr;
  height: 100%;
  overflow: hidden;
}

.workflow-pane-left {
  padding: 2rem;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  background: rgba(10, 10, 10, 0.4);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.workflow-pane-right {
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}"""
css = re.sub(workflow_page_pattern, workflow_page_new, css)


# Remove .workflow-layout grid template since we split the panes
workflow_layout_pattern = r'\.workflow-layout\s*\{\s*grid-template-columns:[^}]+\}'
css = re.sub(workflow_layout_pattern, '', css)

with open('app/globals.css', 'w') as f:
    f.write(css)

