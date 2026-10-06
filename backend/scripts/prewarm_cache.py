"""Download and cache every completed race of a season into the FastF1 disk cache.

Run during the Docker build so the deployed image ships with a warm cache and
the first visitor to a race doesn't wait 30-60s on FastF1's live data fetch.

    python scripts/prewarm_cache.py --year 2025
    python scripts/prewarm_cache.py --year 2025 --rounds 1 2 3 --allow-partial

Loads sessions exactly the way FastF1Gateway does (race, default session.load()
arguments) so the cache entries are the ones the API later reads.
"""
import argparse
import gc
import logging
import os
import sys
import time

import fastf1
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from frameworks_drivers.fastf1_gateway.cache import enable_disk_cache  # noqa: E402

logger = logging.getLogger("prewarm")

RETRY_DELAYS_SECONDS = (0, 20, 60)


def completed_rounds(year: int) -> list[int]:
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    now = pd.Timestamp.now(tz="UTC")
    rounds = []
    for _, event in schedule.iterrows():
        session_date = event["Session5DateUtc"]
        if pd.notna(session_date) and pd.Timestamp(session_date, tz="UTC") < now:
            rounds.append(int(event["RoundNumber"]))
    return rounds


def warm_round(year: int, race_round: int) -> None:
    session = fastf1.get_session(year, race_round, "R")
    session.load()
    del session
    gc.collect()


def warm_with_retries(year: int, race_round: int) -> bool:
    for attempt, delay in enumerate(RETRY_DELAYS_SECONDS, start=1):
        if delay:
            logger.info("Round %s: retrying in %ss (attempt %s)", race_round, delay, attempt)
            time.sleep(delay)
        try:
            warm_round(year, race_round)
            return True
        except Exception as exc:
            logger.warning("Round %s attempt %s failed: %s", race_round, attempt, exc)
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument("--rounds", type=int, nargs="*", help="only these rounds (default: all completed)")
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="exit 0 even if some rounds failed; they will load on demand at runtime",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    enable_disk_cache()

    rounds = args.rounds or completed_rounds(args.year)
    logger.info("Pre-warming %s: %d rounds %s", args.year, len(rounds), rounds)

    failed = []
    for index, race_round in enumerate(rounds, start=1):
        started = time.time()
        ok = warm_with_retries(args.year, race_round)
        logger.info(
            "[%d/%d] round %s %s in %.0fs",
            index, len(rounds), race_round, "cached" if ok else "FAILED", time.time() - started,
        )
        if not ok:
            failed.append(race_round)

    if failed:
        logger.error("Failed rounds: %s", failed)
        return 0 if args.allow_partial else 1
    logger.info("All %d rounds cached", len(rounds))
    return 0


if __name__ == "__main__":
    sys.exit(main())
