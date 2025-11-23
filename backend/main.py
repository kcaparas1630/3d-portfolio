"""Main entry point for the AI Feature Engineering Pipeline.

This module provides the CLI interface for running the feature engineering
pipeline that:
1. Queries raw data from Supabase
2. Engineers necessary features (hour_of_day, day_of_week, 7-day moving averages, one-hot encoding)
3. Stores engineered features in the training_data table
"""

import argparse
import logging
import sys
from datetime import datetime

from config import configure_logging, get_settings
from database.client import SupabaseClient
from database.models import PipelineConfig
from feature_engineering.pipeline import FeatureEngineeringPipeline

logger = logging.getLogger(__name__)


def parse_date(date_str: str | None) -> datetime | None:
    """Parse date string to datetime object.

    Args:
        date_str: Date string in YYYY-MM-DD format or None

    Returns:
        Parsed datetime or None
    """
    if date_str is None:
        return None

    try:
        return datetime.fromisoformat(date_str)
    except ValueError:
        logger.error(f"Invalid date format: {date_str}. Expected YYYY-MM-DD")
        sys.exit(1)


def create_pipeline() -> FeatureEngineeringPipeline:
    """Create and configure the feature engineering pipeline.

    Returns:
        Configured FeatureEngineeringPipeline instance
    """
    settings = get_settings()

    # Create pipeline configuration
    config = PipelineConfig(
        raw_data_table=settings.raw_data_table,
        training_data_table=settings.training_data_table,
        moving_average_window=settings.moving_average_window,
        batch_size=settings.batch_size,
    )

    # Initialize Supabase client
    client = SupabaseClient(
        url=settings.supabase_url,
        key=settings.supabase_key,
        config=config,
    )

    # Create pipeline
    return FeatureEngineeringPipeline(supabase_client=client, config=config)


def run_pipeline(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    location: str | None = None,
    incremental: bool = False,
    full_refresh: bool = False,
) -> dict[str, int]:
    """Run the feature engineering pipeline.

    Args:
        start_date: Process data from this date
        end_date: Process data until this date
        location: Filter by location
        incremental: If True, only process new data
        full_refresh: If True, clear and reprocess all data

    Returns:
        Dictionary with pipeline statistics
    """
    pipeline = create_pipeline()

    if full_refresh:
        logger.info("Running full refresh mode")
        return pipeline.run_full_refresh(start_date, end_date, location)

    return pipeline.run(start_date, end_date, location, incremental)


def main() -> None:
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        description="AI Feature Engineering Pipeline - Transform raw data into features",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run incremental processing (only new data)
  python main.py --incremental

  # Process data for a specific date range
  python main.py --start-date 2024-01-01 --end-date 2024-06-30

  # Full refresh (clear and reprocess all data)
  python main.py --full-refresh

  # Process data for a specific location
  python main.py --location "new-york" --incremental
        """,
    )

    parser.add_argument(
        "--start-date",
        type=str,
        help="Start date for processing (YYYY-MM-DD format)",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        help="End date for processing (YYYY-MM-DD format)",
    )
    parser.add_argument(
        "--location",
        type=str,
        help="Filter by location identifier",
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Only process data newer than the latest training record",
    )
    parser.add_argument(
        "--full-refresh",
        action="store_true",
        help="Clear all training data and reprocess from scratch",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default="INFO",
        help="Set the logging level (default: INFO)",
    )

    args = parser.parse_args()

    # Configure logging
    log_level = getattr(logging, args.log_level.upper())
    configure_logging(log_level)

    logger.info("=" * 60)
    logger.info("AI Feature Engineering Pipeline")
    logger.info("=" * 60)

    # Validate arguments
    if args.incremental and args.full_refresh:
        logger.error("Cannot use both --incremental and --full-refresh")
        sys.exit(1)

    # Parse dates
    start_date = parse_date(args.start_date)
    end_date = parse_date(args.end_date)

    # Log configuration
    logger.info(f"Start date: {start_date or 'Not specified'}")
    logger.info(f"End date: {end_date or 'Not specified'}")
    logger.info(f"Location: {args.location or 'All locations'}")
    if args.full_refresh:
        mode = "Full Refresh"
    elif args.incremental:
        mode = "Incremental"
    else:
        mode = "Standard"
    logger.info(f"Mode: {mode}")

    try:
        # Run pipeline
        stats = run_pipeline(
            start_date=start_date,
            end_date=end_date,
            location=args.location,
            incremental=args.incremental,
            full_refresh=args.full_refresh,
        )

        # Print results
        logger.info("=" * 60)
        logger.info("Pipeline Results")
        logger.info("=" * 60)
        logger.info(f"Raw records processed: {stats['raw_records']}")
        logger.info(f"Transformed records: {stats['transformed_records']}")
        logger.info(f"Records stored: {stats['stored_records']}")
        logger.info("Pipeline completed successfully")

    except KeyboardInterrupt:
        logger.warning("Pipeline interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.exception(f"Pipeline failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
