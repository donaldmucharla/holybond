export type ProfileStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Profile = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ProfileStatus;

  fullName: string;
  gender: "Male" | "Female";
  dob: string;

  denomination: string;
  motherTongue: string;

  country: string;
  state: string;
  city: string;

  education: string;
  profession: string;

  aboutMe: string;
  partnerPreference: string;

  photos: string[];
};

export type Account = {
  id: string;
  email: string;
  password: string; // demo only
  role: "USER" | "ADMIN";
  profileId: string;
  createdAt: string;
};
