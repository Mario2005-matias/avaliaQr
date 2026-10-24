import { useState } from "react";

interface StarsInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarsInput({ value, onChange, disabled = false }: StarsInputProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-5xl transition-colors ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${
            star <= (hover || value) ? "text-yellow-400" : "text-gray-300"
          }`}
          aria-label={`${star} estrelas`}
        >
          ★
        </button>
      ))}
    </div>
  );
}