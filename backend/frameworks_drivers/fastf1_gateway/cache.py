import os

import fastf1


def enable_disk_cache() -> None:
    cache_dir = os.path.join(os.path.dirname(__file__), "..", "..", "cache")
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
