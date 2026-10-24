export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "technician";
};

export type School = {
  id: number;
  name: string;
};

export type Session = {
  id: number;
  school_name: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  ratings_count: number;
  average_rating: number;
};