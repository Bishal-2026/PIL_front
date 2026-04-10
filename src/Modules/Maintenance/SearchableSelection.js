import React, { useState, useEffect, useRef } from 'react';

const SearchableSelection = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  name, 
  placeholder = "Select or type...",
  creatable = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreate = () => {
    if (searchTerm.trim()) {
      handleSelect(searchTerm.trim());
    }
  };

  return (
    <div className="wp-form-group" ref={dropdownRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <div 
        className={`wp-custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "" : "placeholder"}>
          {value || placeholder}
        </span>
        <span className="material-symbols-rounded">expand_more</span>
      </div>

      {isOpen && (
        <div className="wp-custom-dropdown-panel wp-fade-in">
          <div className="wp-dropdown-search">
            <span className="material-symbols-rounded">search</span>
            <input 
              autoFocus
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && creatable && searchTerm && filteredOptions.length === 0) {
                  handleCreate();
                }
              }}
            />
          </div>
          <div className="wp-dropdown-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div 
                  key={i} 
                  className={`wp-dropdown-item ${value === opt ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                  {value === opt && <span className="material-symbols-rounded">check</span>}
                </div>
              ))
            ) : (
              creatable && searchTerm && (
                <div className="wp-dropdown-create" onClick={handleCreate}>
                  <span className="material-symbols-rounded">add</span>
                  Add "<strong>{searchTerm}</strong>"
                </div>
              )
            )}
            {!searchTerm && filteredOptions.length === 0 && (
              <div className="wp-dropdown-empty">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelection;
