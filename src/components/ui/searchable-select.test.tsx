import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "@/components/ui/searchable-select";

const options = [
  { label: "Honda", value: "Honda" },
  { label: "Hyundai", value: "Hyundai" },
];

describe("SearchableSelect", () => {
  it("opens the picker and selects a suggested option", async () => {
    const onValueChange = vi.fn();

    render(
      <SearchableSelect
        emptyLabel="No results"
        label="Make"
        options={options}
        placeholder="Pick a make"
        searchPlaceholder="Search make"
        value=""
        onValueChange={onValueChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /pick a make/i }));
    fireEvent.click(screen.getByRole("button", { name: /honda/i }));

    expect(onValueChange).toHaveBeenCalledWith("Honda");
  });

  it("supports a custom value when enabled", async () => {
    const onValueChange = vi.fn();

    render(
      <SearchableSelect
        allowCustomValue
        emptyLabel="No results"
        label="City"
        options={options}
        placeholder="Pick a city"
        searchPlaceholder="Search city"
        value=""
        onValueChange={onValueChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /pick a city/i }));
    fireEvent.change(screen.getByPlaceholderText(/search city/i), { target: { value: "Aurangabad" } });
    fireEvent.click(screen.getByRole("button", { name: /use "aurangabad"/i }));

    expect(onValueChange).toHaveBeenCalledWith("Aurangabad");
  });
});
