"""
Lightweight worker bootstrap for VPS deployments.
This is a placeholder service entrypoint until Redis-backed workers are introduced.
"""

from time import sleep


if __name__ == "__main__":
    print("SaaS worker bootstrap running. Replace with Redis-backed workers for VPS production.")
    try:
        while True:
            sleep(30)
    except KeyboardInterrupt:
        print("Worker stopped.")
