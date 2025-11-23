"""Feature engineering pipeline for orchestrating the complete data transformation workflow."""

import logging
from datetime import datetime

import pandas as pd

from database.client import SupabaseClient
from database.models import PipelineConfig
from feature_engineering.transformations import FeatureEngineer

logger = logging.getLogger(__name__)


class FeatureEngineeringPipeline:
    """Orchestrates the complete feature engineering workflow.

    This pipeline:
    1. Queries raw data from Supabase
    2. Engineers features using FeatureEngineer
    3. Stores training-ready data back to Supabase

    Supports both full and incremental processing modes.
    """

    def __init__(
        self,
        supabase_client: SupabaseClient,
        config: PipelineConfig | None = None,
    ) -> None:
        """Initialize the pipeline.

        Args:
            supabase_client: Configured Supabase client
            config: Pipeline configuration options
        """
        self._client = supabase_client
        self._config = config or PipelineConfig()
        self._feature_engineer = FeatureEngineer(
            moving_average_window=self._config.moving_average_window
        )

        logger.info(
            f"FeatureEngineeringPipeline initialized with config: "
            f"raw_table={self._config.raw_data_table}, "
            f"training_table={self._config.training_data_table}, "
            f"moving_avg_window={self._config.moving_average_window}"
        )

    @property
    def config(self) -> PipelineConfig:
        """Get the pipeline configuration."""
        return self._config

    @property
    def feature_engineer(self) -> FeatureEngineer:
        """Get the feature engineer instance."""
        return self._feature_engineer

    def run(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        location: str | None = None,
        incremental: bool = False,
    ) -> dict[str, int]:
        """Run the complete feature engineering pipeline.

        Args:
            start_date: Process data from this date
            end_date: Process data until this date
            location: Filter by location
            incremental: If True, only process data newer than the latest training record

        Returns:
            Dictionary with pipeline statistics:
                - raw_records: Number of raw records queried
                - transformed_records: Number of records after transformation
                - stored_records: Number of records successfully stored
        """
        logger.info(
            f"Starting pipeline run (incremental={incremental}, "
            f"start_date={start_date}, end_date={end_date}, location={location})"
        )

        # Determine start date for incremental mode
        if incremental:
            latest_timestamp = self._client.get_latest_training_data_timestamp()
            if latest_timestamp:
                logger.info(f"Incremental mode: processing records after {latest_timestamp}")
                start_date = latest_timestamp
            else:
                logger.info("No existing training data - running full processing")

        # Step 1: Query raw data
        raw_df = self._query_raw_data(start_date, end_date, location)
        if raw_df.empty:
            logger.warning("No raw data found - pipeline completed with no changes")
            return {"raw_records": 0, "transformed_records": 0, "stored_records": 0}

        # Step 2: Engineer features
        transformed_df = self._transform_data(raw_df)

        # Step 3: Store training data
        stored_count = self._store_training_data(transformed_df)

        stats = {
            "raw_records": len(raw_df),
            "transformed_records": len(transformed_df),
            "stored_records": stored_count,
        }

        logger.info(f"Pipeline completed successfully: {stats}")
        return stats

    def run_full_refresh(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        location: str | None = None,
    ) -> dict[str, int]:
        """Run a full refresh of the training data.

        Clears all existing training data and reprocesses from scratch.

        Args:
            start_date: Process data from this date
            end_date: Process data until this date
            location: Filter by location

        Returns:
            Dictionary with pipeline statistics
        """
        logger.warning("Starting full refresh - clearing existing training data")

        # Clear existing training data
        deleted_count = self._client.clear_training_data()
        logger.info(f"Deleted {deleted_count} existing training records")

        # Run the pipeline
        return self.run(start_date, end_date, location, incremental=False)

    def _query_raw_data(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        location: str | None = None,
    ) -> pd.DataFrame:
        """Query raw data from Supabase with pagination.

        Args:
            start_date: Filter for records after this date
            end_date: Filter for records before this date
            location: Filter by location

        Returns:
            DataFrame containing raw data
        """
        logger.info("Querying raw data from Supabase")
        return self._client.query_raw_data_paginated(start_date, end_date, location)

    def _transform_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering transformations.

        Args:
            df: Raw data DataFrame

        Returns:
            DataFrame with engineered features
        """
        logger.info("Applying feature engineering transformations")

        # Apply all transformations
        transformed = self._feature_engineer.transform(df)

        # Select only training-relevant columns
        training_df = self._feature_engineer.select_training_columns(transformed)

        return training_df

    def _store_training_data(self, df: pd.DataFrame) -> int:
        """Store transformed data to the training_data table.

        Args:
            df: DataFrame with training-ready features

        Returns:
            Number of records stored
        """
        logger.info("Storing training data to Supabase")
        return self._client.store_training_data(df)

    def validate_raw_data(self, df: pd.DataFrame) -> list[str]:
        """Validate raw data before processing.

        Checks for required columns and data quality issues.

        Args:
            df: Raw data DataFrame

        Returns:
            List of validation error messages (empty if valid)
        """
        errors: list[str] = []

        # Required columns
        required_columns = [
            "id",
            "timestamp",
            "temperature",
            "humidity",
            "pressure",
            "wind_speed",
            "precipitation",
            "weather_category",
        ]

        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            errors.append(f"Missing required columns: {missing_columns}")

        # Check for null values in critical columns
        if "timestamp" in df.columns and df["timestamp"].isna().any():
            errors.append("Found null values in 'timestamp' column")

        # Check for valid ranges
        if "humidity" in df.columns:
            invalid_humidity = (df["humidity"] < 0) | (df["humidity"] > 100)
            if invalid_humidity.any():
                count = invalid_humidity.sum()
                errors.append(f"Found {count} records with invalid humidity values (outside 0-100)")

        if "wind_speed" in df.columns:
            invalid_wind = df["wind_speed"] < 0
            if invalid_wind.any():
                count = invalid_wind.sum()
                errors.append(f"Found {count} records with negative wind speed")

        if "precipitation" in df.columns:
            invalid_precip = df["precipitation"] < 0
            if invalid_precip.any():
                count = invalid_precip.sum()
                errors.append(f"Found {count} records with negative precipitation")

        return errors

    def get_feature_statistics(self, df: pd.DataFrame) -> dict[str, dict[str, float]]:
        """Calculate statistics for all numeric features.

        Args:
            df: DataFrame with features

        Returns:
            Dictionary of column names to statistics (min, max, mean, std)
        """
        stats: dict[str, dict[str, float]] = {}

        numeric_columns = df.select_dtypes(include=["number"]).columns

        for col in numeric_columns:
            stats[col] = {
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": float(df[col].mean()),
                "std": float(df[col].std()),
                "null_count": int(df[col].isna().sum()),
            }

        return stats
