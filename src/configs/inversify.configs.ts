import { Container } from 'inversify';

import { AuthController } from '../controllers/auth.controller';
import { HomeController } from '../controllers/home.controller';
import { TodoController } from '../controllers/todo.controller';
import { UserController } from '../controllers/user.controller';
import { AdminAccessOnlyMiddleware } from '../middleware/admin-access-only.middleware';
import { AuthenticationMiddleware } from '../middleware/authentication.middleware';
import { AuthGatewayService } from '../services/auth-gateway-service';
import { AuthService } from '../services/auth-service';
import { TodoGatewayService } from '../services/todo-gateway-service';
import { TodoService } from '../services/todo-service';
import { UserGatewayService } from '../services/user-gateway-service';
import { UserService } from '../services/user-service';

const containerInversify = new Container();


//middlewares
containerInversify.bind<AuthenticationMiddleware>(AuthenticationMiddleware).toSelf();
containerInversify.bind<AdminAccessOnlyMiddleware>(AdminAccessOnlyMiddleware).toSelf();

// controllers
containerInversify.bind<HomeController>(HomeController).toSelf();
containerInversify.bind<UserController>(UserController).toSelf();
containerInversify.bind<TodoController>(TodoController).toSelf();
containerInversify.bind<AuthController>(AuthController).toSelf();


// gateway services
containerInversify.bind<UserGatewayService>(UserGatewayService).toSelf();
containerInversify.bind<TodoGatewayService>(TodoGatewayService).toSelf();
containerInversify.bind<AuthGatewayService>(AuthGatewayService).toSelf();

//services
containerInversify.bind<UserService>(UserService).toSelf();
containerInversify.bind<AuthService>(AuthService).toSelf();
containerInversify.bind<TodoService>(TodoService).toSelf();

export default containerInversify;