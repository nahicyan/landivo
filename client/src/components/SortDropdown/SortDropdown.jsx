import React from "react";

const SortDropdown = ({ sortBy, setSortBy, sortOrder, setSortOrder }) => {
  const sortOptions = [
    { value: 'askingPrice', label: 'Price' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'sqft', label: 'Square Feet' },
    { value: 'acre', label: 'Acreage' },
    { value: 'title', label: 'Title' }
  ];

  return (
    <div className="flex gap-2 items-center">
      <select 
        value={sortBy} 
        onChange={(e) => setSortBy(e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">Sort By</option>
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {sortBy && (
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="asc">Low to High</option>
          <option value="desc">High to Low</option>
        </select>
      )}
    </div>
  );
};

export default SortDropdown;