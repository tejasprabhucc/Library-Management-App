export interface IMemberBase {
  name: string;
  age: number;
  phoneNumber: string;
  email: string;
  address: string;
  password: string;
  role: "user" | "admin";
  refreshToken?: string;
}
export interface IMember extends IMemberBase {
  id: number;
}
