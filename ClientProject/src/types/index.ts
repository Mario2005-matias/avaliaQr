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
  is_expired: boolean;
};

export type TechnicianRating = {
  stars: number;
  comment: string | null;
  created_at: string;
  school_name: string;
};

export type TechnicianRatingsResponse = {
  average_rating: number;
  total: number;
  ratings: TechnicianRating[];
};

export type AdminTechnician = {
  id: number;
  name: string;
  email: string;
  photo_url: string | null;
  active: boolean;
};

export type AdminSchool = School & {
  active: boolean;
};

export type AdminRating = {
  id: number;
  stars: number;
  comment: string | null;
  created_at: string;
  invalidated_at: string | null;
  invalidation_reason: string | null;
  invalidated_by: string | null;
  technician: Pick<User, "id" | "name">;
  school_name: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};