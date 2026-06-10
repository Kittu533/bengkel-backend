const express = require("express");
const mechanicController = require("../controllers/mechanicController");
const { ROLES } = require("../config/auth");
const { authMiddleware, roleMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN, ROLES.MECHANIC]));

router.get("/tasks", mechanicController.listTasks);
router.get("/tasks/:id", mechanicController.taskDetail);
router.patch("/tasks/:id/status", mechanicController.updateStatus);
router.post("/tasks/:id/notes", mechanicController.addNote);
router.post("/tasks/:id/photos", mechanicController.addPhoto);
router.post("/tasks/:id/checklist", mechanicController.addChecklist);

module.exports = router;
