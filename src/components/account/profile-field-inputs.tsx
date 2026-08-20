import {
  REQUIRED_PROFILE_FIELDS,
  type RequiredProfileKey,
} from "@/lib/auth/types";

export const profileInputClass =
  "rounded-xl border border-border bg-surface-elevated px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent";

export function ProfileFieldInputs({
  values,
  onChange,
  fields = REQUIRED_PROFILE_FIELDS,
}: {
  values: Record<RequiredProfileKey, string>;
  onChange: (key: RequiredProfileKey, value: string) => void;
  fields?: readonly (typeof REQUIRED_PROFILE_FIELDS)[number][];
}) {
  return (
    <>
      {fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted-foreground">
            {field.label}
          </span>
          <input
            type="text"
            value={values[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
            required
            maxLength={field.max}
            placeholder={field.placeholder}
            className={profileInputClass}
          />
        </label>
      ))}
    </>
  );
}
