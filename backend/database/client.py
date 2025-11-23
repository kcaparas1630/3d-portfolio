"""Supabase client for database operations."""

import logging
from datetime import datetime
from typing import Any

import pandas as pd
from supabase import Client, create_client

from database.models import PipelineConfig

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Client for Supabase database operations.

    Handles querying raw data and storing engineered features.
    """

    def __init__(self, url: str, key: str, config: PipelineConfig | None = None) -> None:
        """Initialize the Supabase client.

        Args:
            url: Supabase project URL
            key: Supabase service role key or anon key
            config: Pipeline configuration options
        """
        self._client: Client = create_client(url, key)
        self._config = config or PipelineConfig()
        logger.info("Supabase client initialized successfully")

    @property
    def client(self) -> Client:
        """Get the underlying Supabase client."""
        return self._client

    @property
    def config(self) -> PipelineConfig:
        """Get the pipeline configuration."""
        return self._config

    def query_raw_data(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        location: str | None = None,
        limit: int | None = None,
    ) -> pd.DataFrame:
        """Query raw data from Supabase.

        Args:
            start_date: Filter for records after this date
            end_date: Filter for records before this date
            location: Filter by location identifier
            limit: Maximum number of records to return

        Returns:
            DataFrame containing raw data records
        """
        logger.info(
            "Querying raw data",
            extra={
                "start_date": start_date,
                "end_date": end_date,
                "location": location,
                "limit": limit,
            },
        )

        query = self._client.table(self._config.raw_data_table).select("*")

        if start_date:
            query = query.gte("timestamp", start_date.isoformat())

        if end_date:
            query = query.lte("timestamp", end_date.isoformat())

        if location:
            query = query.eq("location", location)

        query = query.order("timestamp", desc=False)

        if limit:
            query = query.limit(limit)

        response = query.execute()

        if not response.data:
            logger.warning("No raw data found for the given query parameters")
            return pd.DataFrame()

        df = pd.DataFrame(response.data)

        # Convert timestamp column to datetime
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])

        logger.info(f"Retrieved {len(df)} raw data records")
        return df

    def query_raw_data_paginated(
        self,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        location: str | None = None,
    ) -> pd.DataFrame:
        """Query all raw data using pagination.

        Handles large datasets by fetching data in batches.

        Args:
            start_date: Filter for records after this date
            end_date: Filter for records before this date
            location: Filter by location identifier

        Returns:
            DataFrame containing all raw data records
        """
        all_data: list[dict[str, Any]] = []
        offset = 0

        while True:
            query = self._client.table(self._config.raw_data_table).select("*")

            if start_date:
                query = query.gte("timestamp", start_date.isoformat())

            if end_date:
                query = query.lte("timestamp", end_date.isoformat())

            if location:
                query = query.eq("location", location)

            query = query.order("timestamp", desc=False)
            query = query.range(offset, offset + self._config.batch_size - 1)

            response = query.execute()

            if not response.data:
                break

            all_data.extend(response.data)
            offset += self._config.batch_size

            logger.debug(f"Fetched batch of {len(response.data)} records (total: {len(all_data)})")

            if len(response.data) < self._config.batch_size:
                break

        if not all_data:
            logger.warning("No raw data found for the given query parameters")
            return pd.DataFrame()

        df = pd.DataFrame(all_data)

        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])

        logger.info(f"Retrieved {len(df)} total raw data records via pagination")
        return df

    def store_training_data(self, df: pd.DataFrame) -> int:
        """Store engineered features in the training_data table.

        Args:
            df: DataFrame containing training data records

        Returns:
            Number of records successfully inserted
        """
        if df.empty:
            logger.warning("No data to store - DataFrame is empty")
            return 0

        logger.info(f"Storing {len(df)} training data records")

        # Convert DataFrame to list of dictionaries
        records = df.to_dict(orient="records")

        # Convert datetime objects to ISO format strings for Supabase
        for record in records:
            if "timestamp" in record and isinstance(record["timestamp"], pd.Timestamp):
                record["timestamp"] = record["timestamp"].isoformat()

        # Insert in batches
        total_inserted = 0
        for i in range(0, len(records), self._config.batch_size):
            batch = records[i : i + self._config.batch_size]
            response = self._client.table(self._config.training_data_table).upsert(batch).execute()  # type: ignore[arg-type]

            if response.data:
                total_inserted += len(response.data)
                logger.debug(
                    f"Inserted batch of {len(response.data)} records "
                    f"(total: {total_inserted}/{len(records)})"
                )

        logger.info(f"Successfully stored {total_inserted} training data records")
        return total_inserted

    def get_latest_training_data_timestamp(self) -> datetime | None:
        """Get the timestamp of the most recent training data record.

        Returns:
            Timestamp of the latest record, or None if no records exist
        """
        response = (
            self._client.table(self._config.training_data_table)
            .select("timestamp")
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )

        if response.data:
            return pd.to_datetime(response.data[0]["timestamp"]).to_pydatetime()  # type: ignore[no-any-return]

        return None

    def clear_training_data(self) -> int:
        """Clear all records from the training_data table.

        Use with caution - this deletes all training data.

        Returns:
            Number of records deleted
        """
        logger.warning("Clearing all training data - this operation is destructive")

        # Delete all records (Supabase requires a filter, so we use a condition that matches all)
        response = (
            self._client.table(self._config.training_data_table)
            .delete()
            .neq("id", -1)  # Match all records (id is never -1)
            .execute()
        )

        deleted_count = len(response.data) if response.data else 0
        logger.info(f"Deleted {deleted_count} training data records")
        return deleted_count


_client_instance: SupabaseClient | None = None


def get_supabase_client(
    url: str | None = None, key: str | None = None, config: PipelineConfig | None = None
) -> SupabaseClient:
    """Get or create the Supabase client singleton.

    Args:
        url: Supabase project URL (required on first call)
        key: Supabase API key (required on first call)
        config: Pipeline configuration options

    Returns:
        SupabaseClient instance

    Raises:
        ValueError: If URL and key are not provided on first call
    """
    global _client_instance

    if _client_instance is None:
        if url is None or key is None:
            raise ValueError("Supabase URL and key must be provided when initializing the client")
        _client_instance = SupabaseClient(url, key, config)

    return _client_instance
