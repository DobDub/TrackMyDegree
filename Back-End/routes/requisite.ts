import HTTP from "@Util/HTTPCodes";
import express, { Request, Response } from "express";
import requisiteController from "@controllers/requisiteController/requisiteController";
import RequisiteTypes from "@controllers/requisiteController/requisite_types"

const router = express.Router();

router.post('/create', async (req: Request, res: Response) => {
    const { id, code1, code2, type } = req.body as {
        id: string;
        code1: string;
        code2: string;
        type: RequisiteTypes.RequisiteType;
      };
    ;
  
    try {
      // Validate input
      if (!id || !code1 || !code2 || !type ) {

        res.status(HTTP.BAD_REQUEST).json({
          error: 'Invalid input. Please provide id, code1, and code2 as a string.',
        });
        return;
      }
  
      // Call the service function
      const newRequisite = await requisiteController.createRequisite(id, code1, code2, type);
  
      // Send success response
      res.status(HTTP.CREATED).json({
        message: 'Requisite created successfully.',
        requisite: newRequisite,
      });
    } catch (error) {
      // Handle errors from the service
      if (error instanceof Error && error.message === 'Requisite with this id already exists.') {
        res.status(HTTP.FORBIDDEN).json({ error: error.message });
      } else {
        const errMsg = 'Internal server error in /requisite/create';
        console.error(errMsg, error);
        res.status(HTTP.SERVER_ERR).json({ error: errMsg });
      }
    }
  });
  

  router.get('/read', async (req: Request, res: Response) => {
    const { id } = req.body;
  
    try {
      // Validate input
      if (!id || typeof id !== 'string') {
        res.status(HTTP.BAD_REQUEST).json({
          error: 'Invalid input. Please provide id as a string.',
        });
        return;
      }
  
      // Call the service function
      const newRequisite = await requisiteController.readRequisite(id);
  
      // Send success response
      res.status(HTTP.OK).json({
        message: 'Requisite read successfully.',
        requisite: newRequisite,
      });
    } catch (error) {
      // Handle errors from the service
      if (error instanceof Error && error.message === 'Requisite with this id does not exist.') {
        res.status(HTTP.FORBIDDEN).json({ error: error.message });
      } else {
        const errMsg = 'Internal server error in /requisite/read';
        console.error(errMsg, error);
        res.status(HTTP.SERVER_ERR).json({ error: errMsg });
      }
    }
  });

  router.put('/update', async (req: Request, res: Response) => {
    const { id, code1, code2, type } = req.body as {
        id: string;
        code1: string;
        code2: string;
        type: RequisiteTypes.RequisiteType;
      };
  
    try {
      // Validate input
      if (!id || !code1 || !code2 || !type) {

        res.status(HTTP.BAD_REQUEST).json({
          error: 'Invalid input.',
        });
        return;
      }
  
      // Call the service function
      const updatedRequisite = await requisiteController.updateRequisite(id, code1, code2, type);
  
      // Send success response
      res.status(HTTP.OK).json({
        message: 'Requisite updated successfully.',
        requisite: updatedRequisite,
      });
    } catch (error) {
      // Handle errors from the service
      if (error instanceof Error && error.message === 'Requisite with this id does not exist.') {
        res.status(HTTP.FORBIDDEN).json({ error: error.message });
      } else {
        const errMsg = 'Internal server error in /requisite/update';
        console.error(errMsg, error);
        res.status(HTTP.SERVER_ERR).json({ error: errMsg });
      }
    }
  });

  router.post('/delete', async (req: Request, res: Response) => {
    const { id } = req.body;
  
    try {
      // Validate input
      if (!id || typeof id !== 'string') {
        res.status(HTTP.BAD_REQUEST).json({
          error: 'Invalid input. Please provide id as a string.',
        });
        return;
      }
  
      // Call the service function
        await requisiteController.deleteRequisite(id);
  
      // Send success response
      res.status(HTTP.OK).json({
        message: 'Requisite deleted successfully.'
      });
    } catch (error) {
      // Handle errors from the service
      if (error instanceof Error && error.message === 'Requisite with this id does not exist.') {
        res.status(HTTP.FORBIDDEN).json({ error: error.message });
      } else {
        const errMsg = 'Internal server error in /requisite/delete';
        console.error(errMsg, error);
        res.status(HTTP.SERVER_ERR).json({ error: errMsg });
      }
    }
  });
  
  export default router;