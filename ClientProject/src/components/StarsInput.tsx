import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface StarsInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarsInput({ value, onChange, disabled = false }: StarsInputProps) {
  const [hover, setHover] = useState(0);
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();

  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          whileHover={disabled || reduceMotion ? undefined : { scale: 1.12, rotate: -4 }}
          whileTap={disabled || reduceMotion ? undefined : { scale: 0.88, rotate: 5 }}
          animate={{ scale: star === value ? 1.08 : 1 }}
          className={`rounded-lg text-5xl transition-colors duration-200 sm:text-6xl ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${
            star <= (hover || value) ? "text-amber-400" : "text-gray-300 dark:text-slate-600"
          }`}
          aria-label={t("common.stars", { count: star })}
          aria-pressed={value === star}
        >
          ★
        </motion.button>
      ))}
    </div>
  );
}