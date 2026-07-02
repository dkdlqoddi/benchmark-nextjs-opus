import { describe, expect, it } from "vitest";
import { habitSchema } from "@/lib/habit-schema";
import { loginSchema, signupSchema } from "@/lib/auth-schema";
import { HABIT_COLORS } from "@/lib/colors";
import { EVERY_DAY } from "@/lib/target-days";

const PRESET = HABIT_COLORS[0];

describe("habitSchema", () => {
  const valid = [
    { name: "Read", description: "", color: PRESET, targetDays: EVERY_DAY },
    {
      name: "A".repeat(50),
      description: "x".repeat(200),
      color: HABIT_COLORS[3],
      targetDays: 1,
    },
    {
      name: "Run",
      description: "Daily run",
      color: HABIT_COLORS[5],
      targetDays: 62,
    },
  ];

  const invalid = [
    { name: "", description: "", color: PRESET, targetDays: EVERY_DAY }, // name required
    {
      name: "A".repeat(51),
      description: "",
      color: PRESET,
      targetDays: EVERY_DAY,
    }, // name too long
    {
      name: "Ok",
      description: "x".repeat(201),
      color: PRESET,
      targetDays: EVERY_DAY,
    }, // description too long
    { name: "Ok", description: "", color: "#000000", targetDays: EVERY_DAY }, // color not a preset
    { name: "Ok", description: "", color: PRESET, targetDays: 0 }, // below range
    { name: "Ok", description: "", color: PRESET, targetDays: 128 }, // above range
    { name: "Ok", description: "", color: PRESET, targetDays: 1.5 }, // not an integer
  ];

  it.each(valid)("accepts valid input #%#", (input) => {
    expect(habitSchema.safeParse(input).success).toBe(true);
  });

  it.each(invalid)("rejects invalid input #%#", (input) => {
    expect(habitSchema.safeParse(input).success).toBe(false);
  });
});

describe("loginSchema", () => {
  const valid = [
    { email: "a@b.com", password: "x" },
    { email: "user.name+tag@example.co", password: "correct horse" },
    { email: "MixedCase@Example.IO", password: "1" },
  ];

  const invalid = [
    { email: "notanemail", password: "x" }, // malformed email
    { email: "a@b.com", password: "" }, // empty password
    { email: "", password: "x" }, // empty email
    { email: "missing@tld", password: "x" }, // no domain suffix
  ];

  it.each(valid)("accepts valid input #%#", (input) => {
    expect(loginSchema.safeParse(input).success).toBe(true);
  });

  it.each(invalid)("rejects invalid input #%#", (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = [
    { email: "a@b.com", password: "password123" },
    { email: "x@y.io", password: "12345678" }, // exactly 8 chars
    { email: "foo@bar.com", password: "a longer passphrase" },
  ];

  const invalid = [
    { email: "a@b.com", password: "short" }, // < 8 chars
    { email: "a@b.com", password: "1234567" }, // 7 chars, one short
    { email: "bad", password: "password123" }, // malformed email
    { email: "", password: "password123" }, // empty email
  ];

  it.each(valid)("accepts valid input #%#", (input) => {
    expect(signupSchema.safeParse(input).success).toBe(true);
  });

  it.each(invalid)("rejects invalid input #%#", (input) => {
    expect(signupSchema.safeParse(input).success).toBe(false);
  });
});
