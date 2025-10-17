import sys
import json
import argparse
import pandas as pd
from pypdf import PdfReader
import re

def extract_template_variables(pdf_path):
    """Extract placeholder variables from PDF template"""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    
    # Find all variables in format <<variable_name>>
    pattern = r'<<(\w+)>>'
    variables = re.findall(pattern, text)
    return list(set(variables))

def extract_csv_headers(csv_path):
    """Extract column headers from CSV file"""
    df = pd.read_csv(csv_path, nrows=0)  # Only read headers
    return df.columns.tolist()

def analyze_files(template_path, csv_path):
    """Analyze files and return variables and headers"""
    try:
        print("Extracting template variables...", file=sys.stderr)
        template_vars = extract_template_variables(template_path)
        
        print("Extracting CSV headers...", file=sys.stderr)
        csv_headers = extract_csv_headers(csv_path)
        
        result = {
            'success': True,
            'template_variables': template_vars,
            'csv_headers': csv_headers
        }
        
        print(json.dumps(result))
        return 0
        
    except Exception as e:
        print(f"Error occurred: {str(e)}", file=sys.stderr)
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--template', required=True)
    parser.add_argument('--csv', required=True)
    
    args = parser.parse_args()
    
    sys.exit(analyze_files(args.template, args.csv))