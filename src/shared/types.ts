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
  isFreeNow?: boolean;
};

export type BookingSlot = {
  id: string;
  roomId: string;
  title: string;
  startAt: string;
  endAt: string;
  authorName: string;
  isMine: boolean;
  seriesId: string | null;
};

export type MyBookingItem = {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  startAt: string;
  endAt: string;
  seriesId: string | null;
};
