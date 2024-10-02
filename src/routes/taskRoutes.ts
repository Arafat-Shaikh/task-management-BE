import { Request, Response, Router } from "express";
import prisma from "../lib/prisma";
import { taskSchema } from "../service/types";
import { isAuthenticated } from "../service/middleware";

const router = Router();

router.post("/", isAuthenticated, async (req: Request, res: Response) => {
  const { success, error } = taskSchema.safeParse(req.body);
  const id = req.userId;

  if (!success) {
    console.log(error.message);
    return res.status(403).json({ message: "Invalid input" });
  }

  let date = new Date(req.body.dueDate.toString());

  try {
    const task = await prisma.task.create({
      data: {
        userId: id,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        dueDate: date,
      },
    });
    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Please try again, Something went wrong" });
  }
});

router.put("/:id", isAuthenticated, async (req: Request, res: Response) => {
  const { id } = req.params;
  let reqTask = req.body;

  if (reqTask.id) {
    delete reqTask.id;
  }

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id: id.toString(),
      },
      data: reqTask,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "could not found the task" });
  }
});

router.delete("/:id", isAuthenticated, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({
      where: {
        id,
      },
    });

    res.status(200).json({ message: "Successfully delete the task" });
  } catch (error) {
    res
      .status(404)
      .json({ message: "Task is not found or could not be deleted" });
  }
});

router.get("/", isAuthenticated, async (req, res) => {
  const id = req.userId;
  console.log(req.query);
  let queryObj: any = { OR: [] }; // Initialize OR as an empty array

  // Always include the userId in the final query
  const finalQueryObj: any = {
    userId: id, // Ensure userId is always included
  };

  // Check for status in the query and add to the OR condition
  if (req.query.status) {
    queryObj.OR.push({ status: req.query.status });
  }

  // Check for priority in the query and add to the OR condition
  if (req.query.priority) {
    queryObj.OR.push({ priority: req.query.priority });
  }

  // Check for date range in the query
  if (req.query.startDate && req.query.endDate) {
    const startDate = new Date(req.query.startDate.toString());
    const endDate = new Date(req.query.endDate.toString());

    const utcStartDate = new Date(startDate.getTime() - 5.5 * 60 * 60 * 1000);
    const utcEndDate = new Date(endDate.getTime() - 5.5 * 60 * 60 * 1000);

    queryObj.OR.push({
      dueDate: {
        gte: utcStartDate, // Compare just dates
        lte: utcEndDate, // Compare just dates
      },
    });
  }

  // If there are any OR conditions, merge them with userId
  if (queryObj.OR.length > 0) {
    finalQueryObj.OR = queryObj.OR;
  }

  const tasks = await prisma.task.findMany({
    where: finalQueryObj,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
    },
  });

  res.status(200).json(tasks);
});

export default router;
