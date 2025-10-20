// components/MailMerge/Instructions.jsx
import React from "react";

export default function Instructions() {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
        <li>
          Click <b>Create Template</b> to upload and save a DOCX template with
          Mail Merge fields.
        </li>
        <li>
          <b>Select a saved template</b> from the dropdown.
        </li>
        <li>
          Upload a <b>CSV</b> or <b>Excel</b> file with matching column headers.
        </li>
        <li>
          Click <b>Continue to Mapping</b> to map variables to columns.
        </li>
        <li>
          Use <b>Advanced Options</b> to specify Excel sheet/encoding and
          performance knobs.
        </li>
        <li>
          Generate your merged <b>PDF</b> when mappings look right.
        </li>
      </ul>
    </div>
  );
}