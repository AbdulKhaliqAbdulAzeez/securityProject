import re

with open('tests/app/home-page.test.tsx', 'r') as f:
    content = f.read()

# Fix 1: Waiting on validation -> Terraform validation
content = content.replace(
    'expect(screen.getByText(/Waiting on validation/i)).toBeInTheDocument();',
    'expect(screen.getByText(/Terraform validation/i)).toBeInTheDocument();'
)

# Fix 2: successful workflow
success_pattern = r'expect\(screen\.getByLabelText\(/Generated Terraform output/i\)\)\.toHaveTextContent\(\s*/resource "aws_s3_bucket" "demo" \\\{\\\}/i,\s*\);\s*expect\(screen\.getAllByText\(/Terraform validation passed\\./i\)\.length\)\.toBeGreaterThan\(0\);\s*expect\(\s*screen\.getAllByText\(/Checkov security scan passed with no blocking findings\\./i\)\s*\.length,\s*\)\.toBeGreaterThan\(0\);\s*expect\(screen\.getByText\(/Success!/i\)\)\.toBeInTheDocument\(\);'

success_replacement = """expect(screen.getByLabelText(/Generated Terraform output/i)).toHaveTextContent(
      /resource "aws_s3_bucket" "demo" \\{\\}/i,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Validation Logs/i }));
    expect(screen.getAllByText(/Terraform validation passed\\./i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Success!/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Security Findings/i }));
    expect(
      screen.getAllByText(/Checkov security scan passed with no blocking findings\\./i)
        .length,
    ).toBeGreaterThan(0);"""

content = re.sub(success_pattern, success_replacement, content)

# Fix 3: Validation failures
validation_fail_pattern = r'expect\(screen\.getByText\(/Fallback Terraform returned/i\)\)\.toBeInTheDocument\(\);\s*expect\(\s*screen\.getAllByText\(/Terraform validation failed\\\. Review the command logs below\\\./i\)\s*\.length,\s*\)\.toBeGreaterThan\(0\);\s*expect\(screen\.getByText\(/Terraform CLI not found on PATH\\\./i\)\)\.toBeInTheDocument\(\);\s*expect\(screen\.getByText\(\/\^Failed\$\/i\)\)\.toBeInTheDocument\(\);'

validation_fail_replace = """fireEvent.click(screen.getByRole("tab", { name: /Validation Logs/i }));
    expect(screen.getByText(/Fallback Terraform returned/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Terraform validation failed\\. Review the command logs below\\./i)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Terraform CLI not found on PATH\\./i)).toBeInTheDocument();"""

content = re.sub(validation_fail_pattern, validation_fail_replace, content)

# Fix 4: specific Checkov findings
checkov_find_pattern = r'expect\(screen\.getByText\(/Checkov reported 1 blocking finding/i\)\)\.toBeInTheDocument\(\);\s*expect\(screen\.getByText\(/CKV_AWS_20:/i\)\)\.toBeInTheDocument\(\);\s*expect\(screen\.getByText\(/aws_s3_bucket\\\.demo/i\)\)\.toBeInTheDocument\(\);'

checkov_find_replace = """fireEvent.click(screen.getByRole("tab", { name: /Security Findings/i }));
    expect(screen.getByText(/Checkov reported 1 blocking finding/i)).toBeInTheDocument();
    expect(screen.getByText(/CKV_AWS_20:/i)).toBeInTheDocument();
    expect(screen.getByText(/aws_s3_bucket\\.demo/i)).toBeInTheDocument();"""

content = re.sub(checkov_find_pattern, checkov_find_replace, content)

# Fix 5: missing Checkov setup
checkov_missing_pattern = r'expect\(screen\.getByText\(/Checkov setup required/i\)\)\.toBeInTheDocument\(\);\s*expect\(screen\.getAllByText\(/Checkov CLI not found on PATH/i\)\.length\)\.toBeGreaterThan\(0\);'

checkov_missing_replace = """fireEvent.click(screen.getByRole("tab", { name: /Security Findings/i }));
    expect(screen.getByText(/Checkov setup required/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Checkov CLI not found on PATH/i).length).toBeGreaterThan(0);"""

content = re.sub(checkov_missing_pattern, checkov_missing_replace, content)

# Fix 6: backend transport error
backend_error_pattern = r'expect\(screen\.getByText\(\/\^Backend request failed\$\/i\)\)\.toBeInTheDocument\(\);'
backend_error_replace = """fireEvent.click(screen.getByRole("tab", { name: /Validation Logs/i }));
    expect(screen.getByText(/^Backend request failed$/i)).toBeInTheDocument();"""

content = re.sub(backend_error_pattern, backend_error_replace, content)

with open('tests/app/home-page.test.tsx', 'w') as f:
    f.write(content)

