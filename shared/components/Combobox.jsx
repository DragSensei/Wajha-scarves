import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export default function Combobox({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select or create category...',
  allowCreate = true,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.id !== undefined ? opt.id : opt.value) === String(value));
  const selectedLabel = selectedOption ? (selectedOption.name || selectedOption.label || '') : (typeof value === 'string' && isNaN(Number(value)) ? value : '');

  const displayValue = isOpen ? query : selectedLabel;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchFilter = (isOpen ? query : '').toLowerCase();
  const filteredOptions = options.filter((opt) => {
    const text = (opt.name || opt.label || '').toLowerCase();
    return text.includes(searchFilter);
  });

  const exactMatch = options.some(
    (opt) => (opt.name || opt.label || '').toLowerCase() === query.trim().toLowerCase()
  );

  const handleSelectOption = (opt) => {
    const selectedVal = opt.id !== undefined ? opt.id : opt.value;
    setQuery(opt.name || opt.label || '');
    onChange(selectedVal, false);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onChange(trimmed, true);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange('', false);
            }
          }}
          onFocus={() => {
            setQuery(selectedLabel);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full border border-surface-container p-2.5 text-on-background focus:outline-hidden focus:border-primary pr-8 bg-white font-sans text-xs"
        />
        <button
          type="button"
          onClick={() => {
            if (!isOpen) setQuery(selectedLabel);
            setIsOpen(!isOpen);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-background p-1 cursor-pointer"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-surface-container shadow-lg rounded-xs text-xs font-sans">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const optVal = String(opt.id !== undefined ? opt.id : opt.value);
              const isSelected = String(value) === optVal;
              return (
                <div
                  key={optVal}
                  onClick={() => handleSelectOption(opt)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-surface-container/40 ${
                    isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-on-background'
                  }`}
                >
                  <span>
                    {opt.parent_name ? (
                      <span className="text-outline text-[11px] font-normal mr-1.5">
                        {opt.parent_name} ›
                      </span>
                    ) : null}
                    {opt.name || opt.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-outline text-[11px]">No existing categories match.</div>
          )}

          {allowCreate && query.trim() && !exactMatch && (
            <div
              onClick={handleCreateNew}
              className="px-3 py-2.5 border-t border-surface-container/60 bg-surface-container/20 hover:bg-primary hover:text-white text-primary font-medium cursor-pointer flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create new category: <strong>"{query.trim()}"</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
