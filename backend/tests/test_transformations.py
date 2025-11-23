"""Tests for feature engineering transformations."""

import pandas as pd

from database.models import WeatherCategory
from feature_engineering.transformations import FeatureEngineer


class TestFeatureEngineer:
    """Tests for the FeatureEngineer class."""

    def test_init_default_window(self) -> None:
        """Test default moving average window is 7 days."""
        engineer = FeatureEngineer()
        assert engineer.moving_average_window == 7

    def test_init_custom_window(self) -> None:
        """Test custom moving average window."""
        engineer = FeatureEngineer(moving_average_window=14)
        assert engineer.moving_average_window == 14

    def test_transform_empty_dataframe(self, empty_dataframe: pd.DataFrame) -> None:
        """Test transform handles empty DataFrame gracefully."""
        engineer = FeatureEngineer()
        result = engineer.transform(empty_dataframe)
        assert result.empty

    def test_transform_adds_raw_data_id(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test that raw_data_id is created from id column."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        assert "raw_data_id" in result.columns
        assert result["raw_data_id"].tolist() == sample_raw_data_small["id"].tolist()


class TestTemporalFeatures:
    """Tests for temporal feature extraction."""

    def test_hour_of_day_extraction(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test hour_of_day is correctly extracted from timestamp."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        assert "hour_of_day" in result.columns
        # First record is at midnight (hour 0)
        assert result["hour_of_day"].iloc[0] == 0
        # Check all hours are in valid range
        assert (result["hour_of_day"] >= 0).all()
        assert (result["hour_of_day"] <= 23).all()

    def test_day_of_week_extraction(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test day_of_week is correctly extracted (0=Monday)."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        assert "day_of_week" in result.columns
        # Check all days are in valid range
        assert (result["day_of_week"] >= 0).all()
        assert (result["day_of_week"] <= 6).all()

    def test_month_extraction(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test month is correctly extracted."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        assert "month" in result.columns
        # All sample data is in January
        assert (result["month"] == 1).all()

    def test_is_weekend_flag(self, sample_raw_data: pd.DataFrame) -> None:
        """Test is_weekend boolean flag is set correctly."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data)

        assert "is_weekend" in result.columns
        # Saturday (5) and Sunday (6) should be weekend
        weekend_mask = result["day_of_week"].isin([5, 6])
        assert (result.loc[weekend_mask, "is_weekend"]).all()
        assert not (result.loc[~weekend_mask, "is_weekend"]).any()


class TestMovingAverages:
    """Tests for moving average calculations."""

    def test_temperature_moving_average(self, sample_raw_data: pd.DataFrame) -> None:
        """Test 7-day moving average is calculated for temperature."""
        engineer = FeatureEngineer(moving_average_window=7)
        result = engineer.transform(sample_raw_data)

        assert "temperature_7d_avg" in result.columns
        # Moving average should not be null (min_periods=1)
        assert not result["temperature_7d_avg"].isna().any()

    def test_all_moving_averages_created(self, sample_raw_data: pd.DataFrame) -> None:
        """Test all expected moving average columns are created."""
        engineer = FeatureEngineer(moving_average_window=7)
        result = engineer.transform(sample_raw_data)

        expected_cols = [
            "temperature_7d_avg",
            "humidity_7d_avg",
            "pressure_7d_avg",
            "wind_speed_7d_avg",
            "precipitation_7d_avg",
        ]

        for col in expected_cols:
            assert col in result.columns, f"Missing column: {col}"

    def test_custom_moving_average_window(self, sample_raw_data: pd.DataFrame) -> None:
        """Test custom moving average window creates correctly named columns."""
        engineer = FeatureEngineer(moving_average_window=14)
        result = engineer.transform(sample_raw_data)

        assert "temperature_14d_avg" in result.columns
        assert "humidity_14d_avg" in result.columns

    def test_moving_average_values(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test moving average values are reasonable."""
        engineer = FeatureEngineer(moving_average_window=3)
        result = engineer.transform(sample_raw_data_small)

        # First value should equal the first temperature (only 1 value in window)
        assert result["temperature_3d_avg"].iloc[0] == result["temperature"].iloc[0]

        # Moving average should be between min and max of the column
        assert result["temperature_3d_avg"].min() >= result["temperature"].min()
        assert result["temperature_3d_avg"].max() <= result["temperature"].max()


class TestOneHotEncoding:
    """Tests for one-hot encoding of weather categories."""

    def test_all_weather_columns_created(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test all weather category columns are created."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        expected_cols = [
            "weather_clear",
            "weather_cloudy",
            "weather_rainy",
            "weather_snowy",
            "weather_stormy",
            "weather_foggy",
            "weather_windy",
        ]

        for col in expected_cols:
            assert col in result.columns, f"Missing column: {col}"

    def test_one_hot_encoding_values(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test one-hot encoding produces boolean values."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        weather_cols = [f"weather_{cat.value}" for cat in WeatherCategory]

        for col in weather_cols:
            # Check all values are boolean
            assert result[col].dtype == bool

    def test_exactly_one_category_true_per_row(self, sample_raw_data: pd.DataFrame) -> None:
        """Test each row has exactly one weather category as True."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data)

        weather_cols = [f"weather_{cat.value}" for cat in WeatherCategory]
        weather_sum = result[weather_cols].sum(axis=1)

        # Each row should have exactly one True value
        assert (weather_sum == 1).all()


class TestDerivedFeatures:
    """Tests for derived feature calculations."""

    def test_feels_like_temperature_created(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test feels_like_temperature column is created."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        assert "feels_like_temperature" in result.columns
        assert not result["feels_like_temperature"].isna().any()

    def test_dew_point_created(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test dew_point column is created."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data_small)

        assert "dew_point" in result.columns
        assert not result["dew_point"].isna().any()

    def test_dew_point_less_than_temperature(self, sample_raw_data: pd.DataFrame) -> None:
        """Test dew point is always less than or equal to temperature."""
        engineer = FeatureEngineer()
        result = engineer.transform(sample_raw_data)

        # Dew point should be <= temperature
        assert (result["dew_point"] <= result["temperature"] + 0.1).all()


class TestSelectTrainingColumns:
    """Tests for selecting training columns."""

    def test_select_training_columns(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test that select_training_columns returns expected columns."""
        engineer = FeatureEngineer()
        transformed = engineer.transform(sample_raw_data_small)
        result = engineer.select_training_columns(transformed)

        # Should have core columns
        assert "raw_data_id" in result.columns
        assert "timestamp" in result.columns
        assert "temperature" in result.columns
        assert "hour_of_day" in result.columns

    def test_original_weather_category_excluded(self, sample_raw_data_small: pd.DataFrame) -> None:
        """Test original weather_category column is not in training data."""
        engineer = FeatureEngineer()
        transformed = engineer.transform(sample_raw_data_small)
        result = engineer.select_training_columns(transformed)

        # Original categorical column should be replaced by one-hot
        assert "weather_category" not in result.columns
