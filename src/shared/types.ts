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

export type BookingSlot = {
  id: string;
  roomId: string;
  title: string;
  startAt: string;
  endAt: string;
  authorName: string;
  isMine: boolean;
};
