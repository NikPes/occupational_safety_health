import os, json
from datetime import datetime, timedelta
from threading import Thread
import time


class ConsoleLogger:
    def __init__(self):
        self.log_dir = os.path.join(os.path.dirname(__file__), '../../console_logs')
        os.makedirs(self.log_dir, exist_ok=True)
        self.cleanup_thread = Thread(target=self.cleanup_old_logs, daemon=True)
        self.cleanup_thread.start()

    def get_log_file(self, user_id):
        today = datetime.now().strftime('%Y-%m-%d')
        return os.path.join(self.log_dir, f'{user_id}_{today}.log')

    def log_message(self, user_id, message):
        log_file = self.get_log_file(user_id)
        timestamp = datetime.now().isoformat()

        try:
            messages = []
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    messages = json.load(f)

            messages.append({
                'timestamp': timestamp,
                'message': message,
                'user_id': user_id
            })

            with open(log_file, 'w') as f:
                json.dump(messages[-144:], f)

        except Exception as e:
            print(f"Error logging console message: {e}")

    def cleanup_old_logs(self):
        while True:
            try:
                now = datetime.now()
                for filename in os.listdir(self.log_dir):
                    if filename.endswith('.log'):
                        file_date_str = filename.split('_')[1].split('.')[0]
                        try:
                            file_date = datetime.strptime(file_date_str, '%Y-%m-%d')
                            if (now - file_date).days > 1:
                                os.remove(os.path.join(self.log_dir, filename))
                        except ValueError:
                            continue
            except Exception as e:
                print(f"Error cleaning up logs: {e}")

            time.sleep(3600)


# Единый экземпляр логгера для всего приложения
console_logger = ConsoleLogger()