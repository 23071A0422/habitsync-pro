import { Habit, User } from '../types';

class NotificationService {
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  sendReminder(habit: Habit) {
    if (Notification.permission === "granted") {
      new Notification("HabitSync Reminder", {
        body: `Don't forget to complete your habit: ${habit.title}!`,
        icon: "/vite.svg"
      });
    }
  }

  // Simulated Gmail Notification
  sendEmailNotification(user: User, pendingHabitsCount: number) {
    console.log(`%c[Gmail API] Sending reminder to ${user.email}...`, "color: #ea4335; font-weight: bold;");
    console.log(`Subject: 🚀 Don't lose your streak, ${user.username}!`);
    console.log(`Body: You still have ${pendingHabitsCount} habits to complete today.`);
    return true;
  }
}

export const notifications = new NotificationService();