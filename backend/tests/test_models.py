"""Tests for data models."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from database.models import (
    PipelineConfig,
    RawDataRecord,
    TrainingDataRecord,
    WeatherCategory,
)


class TestWeatherCategory:
    """Tests for WeatherCategory enum."""

    def test_all_categories_exist(self) -> None:
        """Test all expected weather categories exist."""
        expected = ["clear", "cloudy", "rainy", "snowy", "stormy", "foggy", "windy"]

        for category in expected:
            assert hasattr(WeatherCategory, category.upper())
            assert WeatherCategory[category.upper()].value == category

    def test_category_count(self) -> None:
        """Test correct number of categories."""
        assert len(WeatherCategory) == 7


class TestRawDataRecord:
    """Tests for RawDataRecord model."""

    def test_valid_record(self) -> None:
        """Test creating a valid raw data record."""
        record = RawDataRecord(
            id=1,
            timestamp=datetime(2024, 1, 1, 12, 0, 0),
            temperature=20.5,
            humidity=65.0,
            pressure=1013.25,
            wind_speed=5.5,
            precipitation=0.0,
            weather_category=WeatherCategory.CLEAR,
        )

        assert record.id == 1
        assert record.temperature == 20.5
        assert record.weather_category == WeatherCategory.CLEAR

    def test_humidity_validation(self) -> None:
        """Test humidity validation (0-100 range)."""
        # Valid humidity
        record = RawDataRecord(
            id=1,
            timestamp=datetime.now(),
            temperature=20.0,
            humidity=50.0,
            pressure=1013.0,
            wind_speed=5.0,
            precipitation=0.0,
            weather_category=WeatherCategory.CLEAR,
        )
        assert record.humidity == 50.0

        # Invalid humidity (> 100)
        with pytest.raises(ValidationError):
            RawDataRecord(
                id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=150.0,
                pressure=1013.0,
                wind_speed=5.0,
                precipitation=0.0,
                weather_category=WeatherCategory.CLEAR,
            )

        # Invalid humidity (< 0)
        with pytest.raises(ValidationError):
            RawDataRecord(
                id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=-10.0,
                pressure=1013.0,
                wind_speed=5.0,
                precipitation=0.0,
                weather_category=WeatherCategory.CLEAR,
            )

    def test_wind_speed_non_negative(self) -> None:
        """Test wind speed must be non-negative."""
        with pytest.raises(ValidationError):
            RawDataRecord(
                id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=50.0,
                pressure=1013.0,
                wind_speed=-5.0,
                precipitation=0.0,
                weather_category=WeatherCategory.CLEAR,
            )

    def test_precipitation_non_negative(self) -> None:
        """Test precipitation must be non-negative."""
        with pytest.raises(ValidationError):
            RawDataRecord(
                id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=50.0,
                pressure=1013.0,
                wind_speed=5.0,
                precipitation=-1.0,
                weather_category=WeatherCategory.CLEAR,
            )

    def test_optional_location(self) -> None:
        """Test location is optional."""
        record = RawDataRecord(
            id=1,
            timestamp=datetime.now(),
            temperature=20.0,
            humidity=50.0,
            pressure=1013.0,
            wind_speed=5.0,
            precipitation=0.0,
            weather_category=WeatherCategory.CLEAR,
        )
        assert record.location is None

        record_with_location = RawDataRecord(
            id=2,
            timestamp=datetime.now(),
            temperature=20.0,
            humidity=50.0,
            pressure=1013.0,
            wind_speed=5.0,
            precipitation=0.0,
            weather_category=WeatherCategory.CLEAR,
            location="new-york",
        )
        assert record_with_location.location == "new-york"


class TestTrainingDataRecord:
    """Tests for TrainingDataRecord model."""

    def test_valid_training_record(self) -> None:
        """Test creating a valid training data record."""
        record = TrainingDataRecord(
            id=1,
            raw_data_id=1,
            timestamp=datetime(2024, 1, 1, 12, 0, 0),
            temperature=20.5,
            humidity=65.0,
            pressure=1013.25,
            wind_speed=5.5,
            precipitation=0.0,
            hour_of_day=12,
            day_of_week=0,
            month=1,
            is_weekend=False,
            weather_clear=True,
        )

        assert record.hour_of_day == 12
        assert record.is_weekend is False
        assert record.weather_clear is True

    def test_hour_of_day_validation(self) -> None:
        """Test hour_of_day must be 0-23."""
        with pytest.raises(ValidationError):
            TrainingDataRecord(
                id=1,
                raw_data_id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=50.0,
                pressure=1013.0,
                wind_speed=5.0,
                precipitation=0.0,
                hour_of_day=25,  # Invalid
                day_of_week=0,
                month=1,
                is_weekend=False,
            )

    def test_day_of_week_validation(self) -> None:
        """Test day_of_week must be 0-6."""
        with pytest.raises(ValidationError):
            TrainingDataRecord(
                id=1,
                raw_data_id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=50.0,
                pressure=1013.0,
                wind_speed=5.0,
                precipitation=0.0,
                hour_of_day=12,
                day_of_week=7,  # Invalid
                month=1,
                is_weekend=False,
            )

    def test_month_validation(self) -> None:
        """Test month must be 1-12."""
        with pytest.raises(ValidationError):
            TrainingDataRecord(
                id=1,
                raw_data_id=1,
                timestamp=datetime.now(),
                temperature=20.0,
                humidity=50.0,
                pressure=1013.0,
                wind_speed=5.0,
                precipitation=0.0,
                hour_of_day=12,
                day_of_week=0,
                month=13,  # Invalid
                is_weekend=False,
            )

    def test_optional_moving_averages(self) -> None:
        """Test moving averages are optional."""
        record = TrainingDataRecord(
            id=1,
            raw_data_id=1,
            timestamp=datetime.now(),
            temperature=20.0,
            humidity=50.0,
            pressure=1013.0,
            wind_speed=5.0,
            precipitation=0.0,
            hour_of_day=12,
            day_of_week=0,
            month=1,
            is_weekend=False,
        )

        assert record.temperature_7d_avg is None
        assert record.humidity_7d_avg is None

    def test_weather_one_hot_defaults(self) -> None:
        """Test weather one-hot columns default to False."""
        record = TrainingDataRecord(
            id=1,
            raw_data_id=1,
            timestamp=datetime.now(),
            temperature=20.0,
            humidity=50.0,
            pressure=1013.0,
            wind_speed=5.0,
            precipitation=0.0,
            hour_of_day=12,
            day_of_week=0,
            month=1,
            is_weekend=False,
        )

        assert record.weather_clear is False
        assert record.weather_cloudy is False
        assert record.weather_rainy is False


class TestPipelineConfig:
    """Tests for PipelineConfig model."""

    def test_default_values(self) -> None:
        """Test default configuration values."""
        config = PipelineConfig()

        assert config.raw_data_table == "raw_data"
        assert config.training_data_table == "training_data"
        assert config.moving_average_window == 7
        assert config.batch_size == 1000

    def test_custom_values(self) -> None:
        """Test custom configuration values."""
        config = PipelineConfig(
            raw_data_table="custom_raw",
            training_data_table="custom_training",
            moving_average_window=14,
            batch_size=500,
        )

        assert config.raw_data_table == "custom_raw"
        assert config.training_data_table == "custom_training"
        assert config.moving_average_window == 14
        assert config.batch_size == 500

    def test_moving_average_window_validation(self) -> None:
        """Test moving_average_window must be >= 1."""
        with pytest.raises(ValidationError):
            PipelineConfig(moving_average_window=0)

    def test_batch_size_validation(self) -> None:
        """Test batch_size must be >= 1."""
        with pytest.raises(ValidationError):
            PipelineConfig(batch_size=0)
