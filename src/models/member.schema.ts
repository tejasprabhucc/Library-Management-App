import { z } from "zod";

export const MemberBaseSchema = z.object({
  name: z
    .string({ message: "Name must be a string." })
    .min(3, { message: "Name must be at least 3 characters long." }),
  age: z
    .number({ message: "Age must be a number." })
    .int()
    .min(5, { message: "Member must be at least 5 years old." })
    .max(100, { message: "Member cannot live that long." }),
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits long." })
    .max(12, { message: "Phone number cannot be longer than 12 digits." }),
  email: z
    .string({ message: "Email must be a string." })
    .email({ message: "Invalid email address." }),
  address: z.string().min(5, {
    message: "Address is too short, must be at least 5 characters long.",
  }),
  password: z
    .string({ message: "Password must be a string." })
    .min(8, { message: "Password must be at least 8 characters long." }),
  role: z.enum(["user", "admin"]).optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const MemberSchema = MemberBaseSchema.extend({
  id: z.number().int().min(1),
});

export type IMemberBase = z.infer<typeof MemberBaseSchema>;
export type IMember = z.infer<typeof MemberSchema>;
