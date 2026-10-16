import { createBrowserRouter } from 'react-router-dom';

import { adminRoutes } from './adminRoutes';
import { userRoutes } from './userRoutes';

export const router = createBrowserRouter([...userRoutes, ...adminRoutes]);
