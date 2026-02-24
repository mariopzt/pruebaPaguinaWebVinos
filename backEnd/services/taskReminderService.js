const Task = require('../models/Task');
const Notification = require('../models/Notification');

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
const REMINDER_HOUR = Number(process.env.TASK_REMINDER_HOUR || 9); // 09:00 por defecto
let intervalRef = null;

const toDateKeyLocal = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const runTaskRemindersCheck = async () => {
  const now = new Date();
  // Enviar recordatorios solo desde la hora configurada en adelante.
  if (now.getHours() < REMINDER_HOUR) return;

  const todayKey = toDateKeyLocal();

  const dueTasks = await Task.find({
    dateValue: todayKey,
    status: { $nin: ['completed', 'completada'] },
    $or: [
      { reminderForDate: { $exists: false } },
      { reminderForDate: null },
      { reminderForDate: { $ne: todayKey } },
    ],
  })
    .select('_id user title date dateValue reminderForDate')
    .lean();

  if (!dueTasks.length) return;

  const notifications = dueTasks
    .filter((task) => !!task.user)
    .map((task) => ({
      user: task.user,
      createdBy: task.user,
      type: 'recordatorio-tarea',
      icon: 'FiBell',
      title: 'Recordatorio de nota',
      message: `Hoy tienes pendiente la nota **"${task.title}"**`,
      actions: ['Ver tareas'],
      unread: true,
      metadata: {
        taskId: task._id,
        dateValue: task.dateValue || todayKey,
        kind: 'task_due_today',
      },
      createdAt: now,
    }));

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }

  await Task.updateMany(
    { _id: { $in: dueTasks.map((t) => t._id) } },
    { $set: { reminderForDate: todayKey, reminderSentAt: now } }
  );
};

const startTaskReminderScheduler = () => {
  if (intervalRef) return;

  // Primera pasada al iniciar servidor
  runTaskRemindersCheck().catch((error) => {
    console.error('[TaskReminder] Error en chequeo inicial:', error.message);
  });

  intervalRef = setInterval(() => {
    runTaskRemindersCheck().catch((error) => {
      console.error('[TaskReminder] Error en chequeo programado:', error.message);
    });
  }, CHECK_INTERVAL_MS);

  console.log(`[TaskReminder] Scheduler iniciado (cada 15 minutos, envío desde las ${String(REMINDER_HOUR).padStart(2, '0')}:00)`);
};

module.exports = {
  startTaskReminderScheduler,
  runTaskRemindersCheck,
};
