import { useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@/components/ui";

export interface FieldDefinition<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "select";
  options?: { label: string; value: string }[]; // Only for select
  dataType?: "string" | "number"; // For value casting
}

interface DynamicFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  fields: FieldDefinition<T>[];
  arrangement?: "vertical" | "horizontal";
  className?: string;
}

export function DynamicFormFields<T extends FieldValues>({
  control,
  fields,
  arrangement = "vertical",
  className,
}: DynamicFormFieldsProps<T>) {
  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<string, boolean>
  >({});

  const togglePasswordVisibility = (fieldName: string) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <div
      className={`w-full gap-4 ${
        arrangement === "horizontal" ? "flex" : "flex flex-col"
      } ${className}`}
    >
      {fields.map((field) => (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: controllerField }) => {
            const dataType = field.dataType ?? "string";
            const isPasswordField = field.type === "password";
            const isPasswordVisible = passwordVisibility[field.name] ?? false;
            const inputType = isPasswordField
              ? isPasswordVisible
                ? "text"
                : "password"
              : field.type || "text";

            const handleChange = (value: string) => {
              if (dataType === "number") {
                const num = Number(value);
                controllerField.onChange(isNaN(num) ? undefined : num);
              } else {
                controllerField.onChange(value);
              }
            };

            return (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {field.type === "select" && field.options ? (
                    <Select
                      value={controllerField.value?.toString() ?? undefined}
                      onValueChange={handleChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={field.placeholder || "Select"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="relative">
                      <Input
                        type={inputType}
                        placeholder={field.placeholder}
                        value={controllerField.value ?? ""}
                        onChange={(e) => handleChange(e.target.value)}
                        name={controllerField.name}
                        onBlur={controllerField.onBlur}
                        ref={controllerField.ref}
                        className={isPasswordField ? "pr-10" : ""}
                      />
                      {isPasswordField && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility(field.name)}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ))}
    </div>
  );
}
