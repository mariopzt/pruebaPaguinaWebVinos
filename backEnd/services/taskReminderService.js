const Task = require('../models/Task');
const Notification = require('../models/Notification');

const REMINDER_HOUR = Number(process.env.TASK_REMINDER_HOUR || 9); // 09:00 por defecto
let timeoutRef = null;

const toDateKeyLocal = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const runTaskRemindersCheck = async () => {
  const now = new Date();
  const todayKey = toDateKeyLocal(now);

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

  if (!dueTasks.length) return 0;

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

  return notifications.length;
};

const getNextRunDate = (fromDate = new Date()) => {
  const next = new Date(fromDate);
  next.setSeconds(0, 0);
  next.setHours(REMINDER_HOUR, 0, 0, 0);

  if (fromDate >= next) {
    next.setDate(next.getDate() + 1);
  }

  return next;
};

const scheduleNextRun = () => {
  const now = new Date();
  const nextRun = getNextRunDate(now);
  const delayMs = Math.max(1000, nextRun.getTime() - now.getTime());

  timeoutRef = setTimeout(async () => {
    try {
      const sent = await runTaskRemindersCheck();
      console.log(`[TaskReminder] Recordatorios enviados: ${sent}`);
    } catch (error) {
      console.error('[TaskReminder] Error en ejecución diaria:', error.message);
    } finally {
      scheduleNextRun();
    }
  }, delayMs);

  console.log(`[TaskReminder] Próxima ejecución: ${nextRun.toLocaleString()}`);
};

const startTaskReminderScheduler = () => {
  if (timeoutRef) return;

  const now = new Date();

  // Si el servidor arranca después de la hora configurada,
  // intentamos un envío inmediato de "catch-up" para hoy.
  if (now.getHours() >= REMINDER_HOUR) {
    runTaskRemindersCheck()
      .then((sent) => {
        if (sent > 0) {
          console.log(`[TaskReminder] Catch-up al iniciar: ${sent} recordatorios`);
        }
      })
      .catch((error) => {
        console.error('[TaskReminder] Error en catch-up inicial:', error.message);
      });
  }

  scheduleNextRun();
  console.log(`[TaskReminder] Scheduler iniciado (diario a las ${String(REMINDER_HOUR).padStart(2, '0')}:00)`);
};

module.exports = {
  startTaskReminderScheduler,
  runTaskRemindersCheck,
};

