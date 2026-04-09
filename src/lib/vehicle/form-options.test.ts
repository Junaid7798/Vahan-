import { describe, expect, it } from "vitest";
import { getCityOptions, getMakeOptions, getModelOptions, getVariantOptions, isVehicleStatus } from "@/lib/vehicle/form-options";

describe("vehicle form options", () => {
  it("returns make options with model keywords", () => {
    const makes = getMakeOptions();
    expect(makes.find((item) => item.value === "Honda")?.keywords).toContain("City");
    expect(makes.find((item) => item.value === "Honda")?.keywords).toContain("VX");
  });

  it("returns dependent model and variant suggestions", () => {
    expect(getModelOptions("Honda").map((item) => item.value)).toContain("City");
    expect(getVariantOptions("Honda", "City").map((item) => item.value)).toContain("VX");
    expect(getVariantOptions("Unknown", "City")).toEqual([]);
  });

  it("returns city suggestions and validates listing statuses", () => {
    expect(getCityOptions().map((item) => item.value)).toContain("Pune");
    expect(isVehicleStatus("published")).toBe(true);
    expect(isVehicleStatus("reviewed")).toBe(false);
  });
});
