import { z } from "zod";

const StrongPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

const EmailSchema = z.email("Enter a valid email address.");

export const LoginSchema = z.object({
  email: EmailSchema,
  password: StrongPasswordSchema,
});

export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: "At least 10 characters",
    test: (v: string) => v.length >= 10,
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (v: string) => /[A-Z]/.test(v),
  },
  { id: "number", label: "One number", test: (v: string) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "One special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

export const SELF_SERVICE_ROLES = [
  "public_user",
  "athlete",
  "team_coach",
  "league_admin",
  "federation_admin",
] as const;

export const SCOPED_SELF_SERVICE_ROLES = [
  "team_coach",
  "league_admin",
  "federation_admin",
] as const;

export const SignUpSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    email: EmailSchema,
    password: StrongPasswordSchema,
    confirmPassword: z.string(),
    requestedRole: z.enum(SELF_SERVICE_ROLES).default("public_user"),
    requestedScopeId: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z
  .object({
    password: StrongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
