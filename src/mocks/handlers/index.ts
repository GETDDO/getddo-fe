import { abuseHandlers } from './abuse';
import { adminEventHandlers } from './adminEvent';
import { attendanceHandlers } from './attendance';
import { auditHandlers } from './audit';
import { bannerHandlers } from './banner';
import { drawResultHandlers } from './drawResult';
import { entryHandlers } from './entry';
import { eventHandlers } from './event';
import { gameHandlers } from './game';
import { missionHandlers } from './mission';
import { notificationHandlers } from './notification';
import { ticketHandlers } from './ticket';
import { virtualUserHandlers } from './virtualUsers';

export const handlers = [
    ...abuseHandlers,
    ...adminEventHandlers,
    ...attendanceHandlers,
    ...auditHandlers,
    ...bannerHandlers,
    ...drawResultHandlers,
    ...entryHandlers,
    ...eventHandlers,
    ...gameHandlers,
    ...missionHandlers,
    ...notificationHandlers,
    ...ticketHandlers,
    ...virtualUserHandlers,
];
