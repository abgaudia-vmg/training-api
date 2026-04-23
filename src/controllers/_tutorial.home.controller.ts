import { Request, Response } from 'express';
import { BaseHttpController, controller, httpGet } from 'inversify-express-utils';

// decorator to define the base path for the controller
// ROOT ROUTE
@controller('/')
export class HomeController extends BaseHttpController {

    // add different methods to the controller
    // SUB ROUTE
    @httpGet('/')
    public getHome(req: Request, res: Response): void {
        res.json({message:'Hello Worlddasdasds'});
    }
}