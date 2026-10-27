import { Input, Select, Textarea } from "@/components/ui/form";
import type { QuestionKind, QuestionOption } from "@/features/interview/types";
import { cn } from "@/lib/utils";

export const MULTI_SEPARATOR = "|";

interface FieldControlProps {
  id: string;
  kind: QuestionKind;
  options?: QuestionOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  describedBy?: string;
  invalid?: boolean;
}

export function FieldControl({
  id,
  kind,
  options,
  placeholder,
  value,
  onChange,
  describedBy,
  invalid,
}: FieldControlProps) {
  if (kind === "long_text") {
    return (
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      />
    );
  }

  if (kind === "single_choice" && options) {
    return (
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-labelledby={`${id}-label`}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                checked
                  ? "border-primary bg-primary/[0.04] font-medium"
                  : "border-border bg-card hover:border-input",
              )}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-primary"
                aria-describedby={describedBy}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    );
  }

  if (kind === "multi_choice" && options) {
    const selected = new Set(value ? value.split(MULTI_SEPARATOR) : []);
    return (
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-labelledby={`${id}-label`}>
        {options.map((option) => {
          const checked = selected.has(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                checked
                  ? "border-primary bg-primary/[0.04] font-medium"
                  : "border-border bg-card hover:border-input",
              )}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={checked}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(option.value);
                  else next.delete(option.value);
                  onChange(Array.from(next).join(MULTI_SEPARATOR));
                }}
                className="h-4 w-4 accent-primary"
                aria-describedby={describedBy}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    );
  }

  if (kind === "date") {
    return (
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        max="2100-12-31"
      />
    );
  }

  if (kind === "number") {
    return (
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      />
    );
  }

  if (kind === "single_choice" && !options) {
    return (
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select one</option>
      </Select>
    );
  }

  return (
    <Input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      autoComplete="off"
    />
  );
}
