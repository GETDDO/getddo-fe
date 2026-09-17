import { createBrowserRouter } from 'react-router-dom';

import { adminRoutes } from './admin-routes';
import { userRoutes } from './user-routes';

export const router = createBrowserRouter([...userRoutes, ...adminRoutes]);
