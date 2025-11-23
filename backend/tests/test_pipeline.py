"""Tests for the feature engineering pipeline."""

from datetime import datetime
from unittest.mock import MagicMock

import pandas as pd
import pytest

from database.client import SupabaseClient
from database.models import PipelineConfig
from feature_engineering.pipeline import FeatureEngineeringPipeline


class TestFeatureEngineeringPipeline:
    """Tests for the FeatureEngineeringPipeline class."""

    @pytest.fixture
    def mock_supabase_client(
        self, pipeline_config: PipelineConfig, sample_raw_data: pd.DataFrame
    ) -> MagicMock:
        """Create a mock Supabase client for testing."""
        mock_client = MagicMock(spec=SupabaseClient)
        mock_client.config = pipeline_config
        mock_client.query_raw_data_paginated.return_value = sample_raw_data
        mock_client.store_training_data.return_value = len(sample_raw_data)
        mock_client.get_latest_training_data_timestamp.return_value = None
        mock_client.clear_training_data.return_value = 0
        return mock_client

    def test_pipeline_initialization(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test pipeline initializes correctly."""
        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        assert pipeline.config == pipeline_config
        assert pipeline.feature_engineer.moving_average_window == 7

    def test_run_queries_raw_data(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test pipeline queries raw data from Supabase."""
        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        pipeline.run()

        mock_supabase_client.query_raw_data_paginated.assert_called_once()

    def test_run_stores_training_data(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test pipeline stores transformed data to training table."""
        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        pipeline.run()

        mock_supabase_client.store_training_data.assert_called_once()

    def test_run_returns_statistics(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
        sample_raw_data: pd.DataFrame,
    ) -> None:
        """Test pipeline returns correct statistics."""
        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        stats = pipeline.run()

        assert "raw_records" in stats
        assert "transformed_records" in stats
        assert "stored_records" in stats
        assert stats["raw_records"] == len(sample_raw_data)

    def test_run_with_date_filters(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test pipeline passes date filters to query."""
        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        start_date = datetime(2024, 1, 1)
        end_date = datetime(2024, 1, 31)

        pipeline.run(start_date=start_date, end_date=end_date)

        mock_supabase_client.query_raw_data_paginated.assert_called_once_with(
            start_date, end_date, None
        )

    def test_run_incremental_mode(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test incremental mode uses latest timestamp as start date."""
        latest_timestamp = datetime(2024, 1, 15)
        mock_supabase_client.get_latest_training_data_timestamp.return_value = latest_timestamp

        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        pipeline.run(incremental=True)

        mock_supabase_client.get_latest_training_data_timestamp.assert_called_once()
        mock_supabase_client.query_raw_data_paginated.assert_called_once_with(
            latest_timestamp, None, None
        )

    def test_run_empty_data_returns_zero_stats(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test pipeline handles empty data gracefully."""
        mock_supabase_client.query_raw_data_paginated.return_value = pd.DataFrame()

        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        stats = pipeline.run()

        assert stats["raw_records"] == 0
        assert stats["transformed_records"] == 0
        assert stats["stored_records"] == 0

    def test_full_refresh_clears_data(
        self,
        mock_supabase_client: MagicMock,
        pipeline_config: PipelineConfig,
    ) -> None:
        """Test full refresh clears existing training data."""
        pipeline = FeatureEngineeringPipeline(
            supabase_client=mock_supabase_client,
            config=pipeline_config,
        )

        pipeline.run_full_refresh()

        mock_supabase_client.clear_training_data.assert_called_once()


class TestValidation:
    """Tests for data validation."""

    @pytest.fixture
    def pipeline(
        self, mock_supabase_client: MagicMock, pipeline_config: PipelineConfig
    ) -> FeatureEngineeringPipeline:
        """Create a pipeline instance for testing."""
        mock_client = MagicMock(spec=SupabaseClient)
        mock_client.config = pipeline_config
        return FeatureEngineeringPipeline(
            supabase_client=mock_client,
            config=pipeline_config,
        )

    @pytest.fixture
    def mock_supabase_client(self, pipeline_config: PipelineConfig) -> MagicMock:
        """Create a mock Supabase client."""
        mock_client = MagicMock(spec=SupabaseClient)
        mock_client.config = pipeline_config
        return mock_client

    def test_validate_valid_data(
        self, pipeline: FeatureEngineeringPipeline, sample_raw_data: pd.DataFrame
    ) -> None:
        """Test validation passes for valid data."""
        errors = pipeline.validate_raw_data(sample_raw_data)
        assert len(errors) == 0

    def test_validate_missing_columns(self, pipeline: FeatureEngineeringPipeline) -> None:
        """Test validation catches missing columns."""
        df = pd.DataFrame({"id": [1, 2], "timestamp": ["2024-01-01", "2024-01-02"]})

        errors = pipeline.validate_raw_data(df)

        assert len(errors) > 0
        assert any("Missing required columns" in e for e in errors)

    def test_validate_null_timestamps(
        self, pipeline: FeatureEngineeringPipeline, raw_data_with_nulls: pd.DataFrame
    ) -> None:
        """Test validation catches null timestamps."""
        errors = pipeline.validate_raw_data(raw_data_with_nulls)

        assert any("null values in 'timestamp'" in e for e in errors)

    def test_validate_invalid_humidity(
        self, pipeline: FeatureEngineeringPipeline, raw_data_with_nulls: pd.DataFrame
    ) -> None:
        """Test validation catches invalid humidity values."""
        errors = pipeline.validate_raw_data(raw_data_with_nulls)

        assert any("invalid humidity" in e for e in errors)

    def test_validate_negative_wind_speed(
        self, pipeline: FeatureEngineeringPipeline, raw_data_with_nulls: pd.DataFrame
    ) -> None:
        """Test validation catches negative wind speed."""
        errors = pipeline.validate_raw_data(raw_data_with_nulls)

        assert any("negative wind speed" in e for e in errors)


class TestStatistics:
    """Tests for feature statistics calculation."""

    @pytest.fixture
    def pipeline(self, pipeline_config: PipelineConfig) -> FeatureEngineeringPipeline:
        """Create a pipeline instance for testing."""
        mock_client = MagicMock(spec=SupabaseClient)
        mock_client.config = pipeline_config
        return FeatureEngineeringPipeline(
            supabase_client=mock_client,
            config=pipeline_config,
        )

    def test_get_feature_statistics(
        self, pipeline: FeatureEngineeringPipeline, sample_raw_data_small: pd.DataFrame
    ) -> None:
        """Test feature statistics are calculated correctly."""
        stats = pipeline.get_feature_statistics(sample_raw_data_small)

        assert "temperature" in stats
        assert "min" in stats["temperature"]
        assert "max" in stats["temperature"]
        assert "mean" in stats["temperature"]
        assert "std" in stats["temperature"]
        assert "null_count" in stats["temperature"]

    def test_statistics_values_reasonable(
        self, pipeline: FeatureEngineeringPipeline, sample_raw_data_small: pd.DataFrame
    ) -> None:
        """Test statistics values are within expected ranges."""
        stats = pipeline.get_feature_statistics(sample_raw_data_small)

        temp_stats = stats["temperature"]
        assert temp_stats["min"] <= temp_stats["mean"] <= temp_stats["max"]
        assert temp_stats["std"] >= 0
        assert temp_stats["null_count"] == 0
