"""Pytest configuration and fixtures for the feature engineering pipeline tests."""

from datetime import datetime, timedelta

import pandas as pd
import pytest

from database.models import PipelineConfig, WeatherCategory


@pytest.fixture
def sample_raw_data() -> pd.DataFrame:
    """Create sample raw data for testing.

    Returns:
        DataFrame with sample raw data records
    """
    base_date = datetime(2024, 1, 1, 0, 0, 0)

    # Generate 14 days of hourly data
    records = []
    for day in range(14):
        for hour in range(24):
            timestamp = base_date + timedelta(days=day, hours=hour)

            # Create varied weather data
            records.append(
                {
                    "id": day * 24 + hour + 1,
                    "timestamp": timestamp,
                    "temperature": 10.0 + 5.0 * (day % 7) + (hour / 24.0) * 3.0,
                    "humidity": 60.0 + 10.0 * ((hour % 6) / 6.0),
                    "pressure": 1013.25 + (day % 3) * 2.0,
                    "wind_speed": 5.0 + 2.0 * ((hour % 8) / 8.0),
                    "precipitation": 0.0 if hour % 4 != 0 else 2.5,
                    "weather_category": list(WeatherCategory)[day % len(WeatherCategory)].value,
                    "location": "test-location",
                }
            )

    return pd.DataFrame(records)


@pytest.fixture
def sample_raw_data_small() -> pd.DataFrame:
    """Create a small sample of raw data for testing.

    Returns:
        DataFrame with 10 sample records
    """
    base_date = datetime(2024, 1, 1, 0, 0, 0)

    records = []
    weather_categories = [cat.value for cat in WeatherCategory]

    for i in range(10):
        timestamp = base_date + timedelta(hours=i)
        records.append(
            {
                "id": i + 1,
                "timestamp": timestamp,
                "temperature": 15.0 + i * 0.5,
                "humidity": 50.0 + i * 2.0,
                "pressure": 1010.0 + i * 0.5,
                "wind_speed": 3.0 + i * 0.3,
                "precipitation": 0.0 if i % 3 != 0 else 1.5,
                "weather_category": weather_categories[i % len(weather_categories)],
                "location": "test-location",
            }
        )

    return pd.DataFrame(records)


@pytest.fixture
def pipeline_config() -> PipelineConfig:
    """Create a test pipeline configuration.

    Returns:
        PipelineConfig with test settings
    """
    return PipelineConfig(
        raw_data_table="test_raw_data",
        training_data_table="test_training_data",
        moving_average_window=7,
        batch_size=100,
    )


@pytest.fixture
def empty_dataframe() -> pd.DataFrame:
    """Create an empty DataFrame for testing edge cases.

    Returns:
        Empty DataFrame with no columns
    """
    return pd.DataFrame()


@pytest.fixture
def raw_data_with_nulls() -> pd.DataFrame:
    """Create raw data with null values for testing validation.

    Returns:
        DataFrame with some null values
    """
    base_date = datetime(2024, 1, 1, 0, 0, 0)

    return pd.DataFrame(
        [
            {
                "id": 1,
                "timestamp": base_date,
                "temperature": 15.0,
                "humidity": 50.0,
                "pressure": 1010.0,
                "wind_speed": 3.0,
                "precipitation": 0.0,
                "weather_category": "clear",
            },
            {
                "id": 2,
                "timestamp": None,  # Null timestamp
                "temperature": 16.0,
                "humidity": 55.0,
                "pressure": 1012.0,
                "wind_speed": 4.0,
                "precipitation": 1.0,
                "weather_category": "cloudy",
            },
            {
                "id": 3,
                "timestamp": base_date + timedelta(hours=2),
                "temperature": 17.0,
                "humidity": -5.0,  # Invalid humidity
                "pressure": 1011.0,
                "wind_speed": -2.0,  # Invalid wind speed
                "precipitation": 0.5,
                "weather_category": "rainy",
            },
        ]
    )
