import React, { useState, useEffect, useRef } from 'react';

const SearchableSelection = ({ 
  label, 
  options = [], 
  value, 
  onChange, 
  name, 
  placeholder = "Select or type...",
  creatable = true,
  multiple = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('wp-dropdown-open-active');
    } else {
      document.body.classList.remove('wp-dropdown-open-active');
    }
    return () => document.body.classList.remove('wp-dropdown-open-active');
  }, [isOpen]);

  const handleSelect = (val) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      let nextValues;
      if (currentValues.includes(val)) {
        nextValues = currentValues.filter(v => v !== val);
      } else {
        nextValues = [...currentValues, val];
      }
      onChange({ target: { name, value: nextValues } });
    } else {
      onChange({ target: { name, value: val } });
      setIsOpen(false);
    }
    setSearchTerm("");
  };

  const handleRemove = (e, val) => {
    e.stopPropagation();
    const currentValues = Array.isArray(value) ? value : [];
    onChange({ target: { name, value: currentValues.filter(v => v !== val) } });
  };

  const isSelected = (val) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(val);
    }
    return value === val;
  };

  return (
    <div 
      className={`wp-form-group ${isOpen ? 'dropdown-active' : ''}`} 
      ref={dropdownRef} 
      style={{ position: 'relative', zIndex: isOpen ? 3000 : 1 }}
    >
      <label>{label}</label>
      <div 
        className={`wp-custom-select-trigger ${isOpen ? 'active' : ''} ${multiple ? 'multi' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="wp-trigger-content">
          {multiple && Array.isArray(value) && value.length > 0 ? (
            <div className="wp-multi-tags">
              {value.map(v => (
                <span key={v} className="wp-inner-tag">
                  {v}
                  <i className="material-symbols-rounded" onClick={(e) => handleRemove(e, v)}>close</i>
                </span>
              ))}
            </div>
          ) : (
            <span className={(!multiple && value) || (multiple && value?.length > 0) ? "" : "placeholder"}>
              {(!multiple ? value : "") || placeholder}
            </span>
          )}
        </div>
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
                  const val = searchTerm.trim();
                  if (val) handleSelect(val);
                }
              }}
            />
          </div>
          <div className="wp-dropdown-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div 
                  key={i} 
                  className={`wp-dropdown-item ${isSelected(opt) ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                  {isSelected(opt) && <span className="material-symbols-rounded">check</span>}
                </div>
              ))
            ) : (
              creatable && searchTerm && (
                <div className="wp-dropdown-create" onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(searchTerm.trim());
                }}>
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
