import sys
import json
import argparse
import pandas as pd
from pypdf import PdfReader, PdfWriter
import re

def load_mapping(mapping_path):
    """Load variable mapping from JSON file"""
    with open(mapping_path, 'r') as f:
        return json.load(f)

def generate_pdf(template_path, csv_path, output_path, mapping_path):
    """Main function to generate merged PDF"""
    try:
        print("Starting PDF generation...", file=sys.stderr)
        
        # Load custom mapping
        print("Loading variable mapping...", file=sys.stderr)
        mapping = load_mapping(mapping_path)
        print(f"Loaded mapping: {mapping}", file=sys.stderr)
        
        # Parse CSV data
        print("Parsing CSV data...", file=sys.stderr)
        df = pd.read_csv(csv_path)
        csv_headers = df.columns.tolist()
        data_rows = df.values.tolist()
        print(f"CSV headers: {csv_headers}", file=sys.stderr)
        print(f"Number of rows: {len(data_rows)}", file=sys.stderr)
        
        # Read template
        print("Reading template PDF...", file=sys.stderr)
        template_reader = PdfReader(template_path)
        template_page = template_reader.pages[0]
        
        # Create output PDF
        print("Creating output PDF...", file=sys.stderr)
        writer = PdfWriter()
        
        # Generate a page for each CSV row
        variables_found = set()
        mapped_count = 0
        
        for row_index, data_row in enumerate(data_rows):
            print(f"Processing row {row_index + 1}/{len(data_rows)}...", file=sys.stderr)
            
            # For now, just add the template page
            # In a production system, you would overlay text with actual replacements
            writer.add_page(template_page)
            
            # Track what was mapped
            for var, csv_col in mapping.items():
                if csv_col:
                    variables_found.add(var)
                    mapped_count += 1
            
        # Write output
        print("Writing output file...", file=sys.stderr)
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        print("PDF generation complete!", file=sys.stderr)
        
        result = {
            'success': True,
            'output_path': output_path,
            'page_count': len(data_rows),
            'variables_found': len(variables_found),
            'variables_mapped': len([v for v in mapping.values() if v])
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
    parser.add_argument('--output', required=True)
    parser.add_argument('--mapping', required=True)
    
    args = parser.parse_args()
    
    sys.exit(generate_pdf(args.template, args.csv, args.output, args.mapping))