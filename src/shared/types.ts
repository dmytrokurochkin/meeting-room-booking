export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type Room = {
  id: string;
  name: string;
  floor: number;
  capacity: number;
};
