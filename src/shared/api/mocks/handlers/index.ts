import { attendanceHandlers } from './attendance';
import { bannerHandlers } from './banner';
import { drawHandlers } from './draw';
import { entryHandlers } from './entry';
import { eventHandlers } from './event';
import { gameHandlers } from './game';
import { missionHandlers } from './mission';
import { notificationHandlers } from './notification';
import { ticketHandlers } from './ticket';

export const handlers = [
    ...attendanceHandlers,
    ...bannerHandlers,
    ...drawHandlers,
    ...entryHandlers,
    ...eventHandlers,
    ...gameHandlers,
    ...missionHandlers,
    ...notificationHandlers,
    ...ticketHandlers,
];
