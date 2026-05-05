import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export function SmartFillDropdown({ fieldId, onSelect }: { fieldId: string, onSelect: (val: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/engine-suggest/${fieldId}`);
        const result = await res.json();
        if (result.success) setSuggestions(result.data);
      } catch {}
    };
    if (show) fetchSuggestions();
  }, [show, fieldId]);

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-2 p-1 text-gray-400 hover:text-indigo-600"
      >
        <ChevronDown size={16} />
      </button>
      {show && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {suggestions.map((s, i) => (
            <div 
              key={i}
              onClick={() => { onSelect(s); setShow(false); }}
              className="px-3 py-2 cursor-pointer hover:bg-indigo-50 text-xs"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
